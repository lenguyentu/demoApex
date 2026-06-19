-- ============================================================================
-- TEAM DASHBOARD FUNCTIONS
-- Created: 2026-04-29
-- Purpose: Aggregate team performance data for HH Lead dashboard
-- ============================================================================

-- ============================================================================
-- 1. GET TEAM STATS (Monthly aggregates)
-- p_team_lead_id NULL = Admin xem toàn bộ Headhunter + HH Lead
-- ============================================================================
DROP FUNCTION IF EXISTS get_team_stats(UUID, DATE);

CREATE OR REPLACE FUNCTION get_team_stats(
  p_team_lead_id UUID,
  p_month_start DATE
)
RETURNS TABLE (
  cv_to_client_count INT,
  cv_to_client_target INT,
  interview_count INT,
  interview_target INT,
  offer_count INT,
  offer_target INT,
  onboard_count INT,
  onboard_target INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_start TIMESTAMPTZ;
  v_month_end TIMESTAMPTZ;
  v_team_member_ids UUID[];
  v_team_size INT;
BEGIN
  -- Convert DATE to TIMESTAMPTZ
  v_month_start := p_month_start::TIMESTAMPTZ AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_month_end := (p_month_start + INTERVAL '1 month')::TIMESTAMPTZ AT TIME ZONE 'Asia/Ho_Chi_Minh';

  -- Get team member IDs
  -- NULL p_team_lead_id = Admin xem all (Headhunter + HH Lead active)
  -- Otherwise = HH Lead's team (Headhunters managed by them + themselves)
  SELECT ARRAY_AGG(id)
  INTO v_team_member_ids
  FROM users
  WHERE (
    (p_team_lead_id IS NULL AND role IN ('Headhunter', 'HH Lead'))
    OR
    (p_team_lead_id IS NOT NULL AND (
      (managed_by_id = p_team_lead_id AND role = 'Headhunter')
      OR id = p_team_lead_id
    ))
  )
    AND status = 'approved'
    AND is_active = true;

  -- Get team size
  v_team_size := COALESCE(array_length(v_team_member_ids, 1), 0);

  -- If no team members, return zeros
  IF v_team_size = 0 THEN
    RETURN QUERY
    SELECT 0::INT, 0::INT, 0::INT, 0::INT, 0::INT, 0::INT, 0::INT, 0::INT;
    RETURN;
  END IF;

  -- Count processes by status for the team (cumulative counting)
  -- CV đã onboard thì cũng tính vào CV to Client, Interview, Offer
  RETURN QUERY
  SELECT
    -- CV to Client (cumulative: tất cả từ CV_SUBMITTED trở lên)
    COUNT(*) FILTER (WHERE p.process_status IN (
      'CV_SUBMITTED_TO_CLIENT',
      'INTERVIEW_SCHEDULED_1ST', 'INTERVIEW_SCHEDULED_2ND', 'INTERVIEW_SCHEDULED_FINAL', 'INTERVIEW_SCHEDULED_4TH',
      'INTERVIEW_COMPLETED_1ST', 'INTERVIEW_COMPLETED_2ND', 'INTERVIEW_COMPLETED_FINAL', 'INTERVIEW_COMPLETED_4TH',
      'TEST_ASSIGNED', 'TEST_COMPLETED',
      'REFERENCE_CHECK_IN_PROGRESS', 'REFERENCE_CHECK_COMPLETED',
      'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE',
      'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD'
    ) AND EXISTS (
      SELECT 1 FROM process_history ph
      WHERE ph.process_id = p.id
        AND ph.created_at >= v_month_start
        AND ph.created_at < v_month_end
    ))::INT AS cv_to_client_count,
    (v_team_size * 10)::INT AS cv_to_client_target, -- 10 per member per month
    
    -- Interview (cumulative: tất cả từ interview trở lên)
    COUNT(*) FILTER (WHERE p.process_status IN (
      'INTERVIEW_SCHEDULED_1ST', 'INTERVIEW_SCHEDULED_2ND', 'INTERVIEW_SCHEDULED_FINAL', 'INTERVIEW_SCHEDULED_4TH',
      'INTERVIEW_COMPLETED_1ST', 'INTERVIEW_COMPLETED_2ND', 'INTERVIEW_COMPLETED_FINAL', 'INTERVIEW_COMPLETED_4TH',
      'TEST_ASSIGNED', 'TEST_COMPLETED',
      'REFERENCE_CHECK_IN_PROGRESS', 'REFERENCE_CHECK_COMPLETED',
      'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE',
      'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD'
    ) AND EXISTS (
      SELECT 1 FROM process_history ph
      WHERE ph.process_id = p.id
        AND ph.created_at >= v_month_start
        AND ph.created_at < v_month_end
    ))::INT AS interview_count,
    (v_team_size * 8)::INT AS interview_target, -- 8 per member per month
    
    -- Offer (cumulative: tất cả từ offer trở lên)
    COUNT(*) FILTER (WHERE p.process_status IN (
      'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE',
      'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD'
    ) AND EXISTS (
      SELECT 1 FROM process_history ph
      WHERE ph.process_id = p.id
        AND ph.created_at >= v_month_start
        AND ph.created_at < v_month_end
    ))::INT AS offer_count,
    (v_team_size * 3)::INT AS offer_target, -- 3 per member per month
    
    -- Onboard (chỉ đếm onboard statuses)
    COUNT(*) FILTER (WHERE p.process_status IN (
      'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD'
    ) AND EXISTS (
      SELECT 1 FROM process_history ph
      WHERE ph.process_id = p.id
        AND ph.created_at >= v_month_start
        AND ph.created_at < v_month_end
    ))::INT AS onboard_count,
    (v_team_size * 2)::INT AS onboard_target -- 2 per member per month
  FROM processes p
  WHERE p.owner_id = ANY(v_team_member_ids);
END;
$$;

-- ============================================================================
-- 2. GET TEAM MEMBERS PERFORMANCE
-- Tháng = [p_month_start, p_month_start + 1 month)
-- Jobs count = distinct jobs được giao trong cả tháng
-- ============================================================================
DROP FUNCTION IF EXISTS get_team_members_performance(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_team_members_performance(UUID, DATE);

CREATE OR REPLACE FUNCTION get_team_members_performance(
  p_team_lead_id UUID,
  p_month_start DATE
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  jobs_count INT,
  cv_to_client_month INT,
  interview_month INT,
  offer_month INT,
  kpi_month_percent INT,
  status_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_start TIMESTAMPTZ;
  v_month_end TIMESTAMPTZ;
  v_month_end_date DATE;
BEGIN
  -- Convert DATE to TIMESTAMPTZ
  v_month_start := p_month_start::TIMESTAMPTZ AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_month_end := (p_month_start + INTERVAL '1 month')::TIMESTAMPTZ AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_month_end_date := (p_month_start + INTERVAL '1 month')::DATE;

  RETURN QUERY
  WITH team_members AS (
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.role
    FROM users u
    WHERE (
      -- NULL p_team_lead_id = Admin xem all
      (p_team_lead_id IS NULL AND u.role IN ('Headhunter', 'HH Lead'))
      OR
      -- Specific HH Lead: Headhunters trong team + chính HH Lead
      (p_team_lead_id IS NOT NULL AND (
        (u.managed_by_id = p_team_lead_id AND u.role = 'Headhunter')
        OR u.id = p_team_lead_id
      ))
    )
      AND u.status = 'approved'
      AND u.is_active = true
  ),
  job_counts AS (
    -- Đếm distinct jobs được giao trong cả tháng
    -- (1 job có thể được giao nhiều tuần trong tháng → COUNT DISTINCT)
    SELECT
      jfa.assignee_id,
      COUNT(DISTINCT jfa.job_id) AS jobs_count
    FROM job_focus_assignments jfa
    WHERE jfa.week_start >= p_month_start
      AND jfa.week_start < v_month_end_date
      AND jfa.assignee_id IN (SELECT id FROM team_members)
    GROUP BY jfa.assignee_id
  ),
  monthly_kpi AS (
    SELECT
      p.owner_id,
      COUNT(*) FILTER (WHERE p.process_status IN (
        'CV_SUBMITTED_TO_CLIENT',
        'INTERVIEW_SCHEDULED_1ST', 'INTERVIEW_SCHEDULED_2ND', 'INTERVIEW_SCHEDULED_FINAL', 'INTERVIEW_SCHEDULED_4TH',
        'INTERVIEW_COMPLETED_1ST', 'INTERVIEW_COMPLETED_2ND', 'INTERVIEW_COMPLETED_FINAL', 'INTERVIEW_COMPLETED_4TH',
        'TEST_ASSIGNED', 'TEST_COMPLETED',
        'REFERENCE_CHECK_IN_PROGRESS', 'REFERENCE_CHECK_COMPLETED',
        'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE',
        'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD'
      )) AS cv_to_client,
      COUNT(*) FILTER (WHERE p.process_status IN (
        'INTERVIEW_SCHEDULED_1ST', 'INTERVIEW_SCHEDULED_2ND', 'INTERVIEW_SCHEDULED_FINAL', 'INTERVIEW_SCHEDULED_4TH',
        'INTERVIEW_COMPLETED_1ST', 'INTERVIEW_COMPLETED_2ND', 'INTERVIEW_COMPLETED_FINAL', 'INTERVIEW_COMPLETED_4TH',
        'TEST_ASSIGNED', 'TEST_COMPLETED',
        'REFERENCE_CHECK_IN_PROGRESS', 'REFERENCE_CHECK_COMPLETED',
        'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE',
        'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD'
      )) AS interview,
      COUNT(*) FILTER (WHERE p.process_status IN (
        'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE',
        'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD'
      )) AS offer,
      COUNT(*) FILTER (WHERE p.process_status IN (
        'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD'
      )) AS onboard
    FROM processes p
    WHERE p.owner_id IN (SELECT id FROM team_members)
      -- Đếm processes có activity trong tháng (dùng process_history)
      AND EXISTS (
        SELECT 1 FROM process_history ph
        WHERE ph.process_id = p.id
          AND ph.created_at >= v_month_start
          AND ph.created_at < v_month_end
      )
    GROUP BY p.owner_id
  )
  SELECT
    tm.id AS user_id,
    tm.full_name,
    tm.email,
    tm.role::TEXT,
    COALESCE(jc.jobs_count, 0)::INT AS jobs_count,
    COALESCE(mk.cv_to_client, 0)::INT AS cv_to_client_month,
    COALESCE(mk.interview, 0)::INT AS interview_month,
    COALESCE(mk.offer, 0)::INT AS offer_month,
    -- KPI Month % (based on monthly targets: 10 CV, 8 Interview, 3 Offer, 2 Onboard)
    LEAST(ROUND(
      (COALESCE(mk.cv_to_client, 0) * 10.0 + 
       COALESCE(mk.interview, 0) * 12.5 + 
       COALESCE(mk.offer, 0) * 33.3 +
       COALESCE(mk.onboard, 0) * 50.0) / 4
    ), 200)::INT AS kpi_month_percent,
    -- Status label (based on KPI %)
    CASE
      WHEN LEAST(ROUND(
        (COALESCE(mk.cv_to_client, 0) * 10.0 + 
         COALESCE(mk.interview, 0) * 12.5 + 
         COALESCE(mk.offer, 0) * 33.3 +
         COALESCE(mk.onboard, 0) * 50.0) / 4
      ), 200) >= 80 THEN 'On track'
      WHEN LEAST(ROUND(
        (COALESCE(mk.cv_to_client, 0) * 10.0 + 
         COALESCE(mk.interview, 0) * 12.5 + 
         COALESCE(mk.offer, 0) * 33.3 +
         COALESCE(mk.onboard, 0) * 50.0) / 4
      ), 200) >= 50 THEN 'Good progress'
      ELSE 'Cần review'
    END AS status_label
  FROM team_members tm
  LEFT JOIN job_counts jc ON jc.assignee_id = tm.id
  LEFT JOIN monthly_kpi mk ON mk.owner_id = tm.id
  ORDER BY tm.full_name;
END;
$$;

-- ============================================================================
-- 3. GET TEAM JOBS (Jobs cần chú ý)
-- p_team_lead_id NULL = Admin xem toàn bộ
-- Lấy jobs đang active (có activity trong 30 ngày gần đây)
-- ============================================================================
DROP FUNCTION IF EXISTS get_team_jobs_attention(UUID, INT);

CREATE OR REPLACE FUNCTION get_team_jobs_attention(
  p_team_lead_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  job_id UUID,
  job_title TEXT,
  client_name TEXT,
  client_location TEXT,
  job_rank TEXT,
  pipeline_cv_sent INT,
  pipeline_interview INT,
  pipeline_offer INT,
  pipeline_onboard INT,
  days_since_created INT,
  estimated_revenue BIGINT,
  status_label TEXT,
  status_color TEXT,
  assigned_week TEXT,
  assigned_to_names TEXT,
  latest_process_status TEXT,
  latest_process_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team_member_ids UUID[];
BEGIN
  -- Get team member IDs
  -- NULL p_team_lead_id = Admin xem all
  SELECT ARRAY_AGG(id)
  INTO v_team_member_ids
  FROM users
  WHERE (
    (p_team_lead_id IS NULL AND role IN ('Headhunter', 'HH Lead'))
    OR
    (p_team_lead_id IS NOT NULL AND (
      (managed_by_id = p_team_lead_id AND role = 'Headhunter')
      OR id = p_team_lead_id
    ))
  )
    AND status = 'approved'
    AND is_active = true;

  -- If no team members, return empty
  IF v_team_member_ids IS NULL OR array_length(v_team_member_ids, 1) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH recent_activity_jobs AS (
    -- Jobs có activity trong 30 ngày gần đây VÀ được assign
    SELECT DISTINCT p.job_id AS raj_job_id
    FROM processes p
    INNER JOIN job_focus_assignments jfa ON jfa.job_id = p.job_id
    WHERE p.owner_id = ANY(v_team_member_ids)
      AND jfa.assignee_id = ANY(v_team_member_ids)
      AND p.updated_at >= NOW() - INTERVAL '30 days'
  ),
  recent_assignments AS (
    -- Jobs được assign trong 2 tuần gần đây (dù không có activity)
    SELECT DISTINCT jfa.job_id AS ra_job_id
    FROM job_focus_assignments jfa
    WHERE jfa.assignee_id = ANY(v_team_member_ids)
      AND jfa.week_start >= (CURRENT_DATE - INTERVAL '14 days')::DATE
  ),
  latest_assignments AS (
    -- Lấy assignment gần nhất cho mỗi job
    SELECT DISTINCT ON (jfa.job_id)
      jfa.job_id AS la_job_id,
      jfa.week_start AS la_week_start,
      STRING_AGG(u.full_name, ', ') OVER (PARTITION BY jfa.job_id, jfa.week_start) AS la_assignee_names
    FROM job_focus_assignments jfa
    INNER JOIN users u ON u.id = jfa.assignee_id
    WHERE jfa.assignee_id = ANY(v_team_member_ids)
    ORDER BY jfa.job_id, jfa.week_start DESC
  ),
  latest_process_per_job AS (
    -- Lấy process mới nhất cho mỗi job (để tính milestone)
    SELECT DISTINCT ON (p.job_id)
      p.job_id AS lp_job_id,
      p.process_status::TEXT AS lp_status,
      p.updated_at AS lp_updated_at
    FROM processes p
    WHERE p.job_id IN (
      SELECT raj_job_id FROM recent_activity_jobs
      UNION
      SELECT ra_job_id FROM recent_assignments
      UNION
      SELECT la_job_id FROM latest_assignments
    )
    ORDER BY p.job_id, p.updated_at DESC
  ),
  job_pipeline AS (
    SELECT
      j.id AS jp_job_id,
      COUNT(*) FILTER (WHERE p.process_status = 'CV_SUBMITTED_TO_CLIENT') AS cv_sent,
      COUNT(*) FILTER (WHERE p.process_status IN (
        'INTERVIEW_SCHEDULED_1ST', 'INTERVIEW_SCHEDULED_2ND', 'INTERVIEW_SCHEDULED_FINAL', 'INTERVIEW_SCHEDULED_4TH',
        'INTERVIEW_COMPLETED_1ST', 'INTERVIEW_COMPLETED_2ND', 'INTERVIEW_COMPLETED_FINAL', 'INTERVIEW_COMPLETED_4TH'
      )) AS interview,
      COUNT(*) FILTER (WHERE p.process_status IN ('OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE')) AS offer,
      COUNT(*) FILTER (WHERE p.process_status = 'ONBOARDING') AS onboard
    FROM jobs j
    LEFT JOIN processes p ON p.job_id = j.id
    WHERE j.id IN (SELECT raj_job_id FROM recent_activity_jobs)
       OR j.id IN (SELECT ra_job_id FROM recent_assignments)
       OR j.id IN (SELECT la_job_id FROM latest_assignments)
    GROUP BY j.id
  )
  SELECT
    j.id AS job_id,
    j.position_title AS job_title,
    c.client_name AS client_name,
    c.location AS client_location,
    COALESCE(j.job_rank::TEXT, 'B') AS job_rank,
    COALESCE(jp.cv_sent, 0)::INT AS pipeline_cv_sent,
    COALESCE(jp.interview, 0)::INT AS pipeline_interview,
    COALESCE(jp.offer, 0)::INT AS pipeline_offer,
    COALESCE(jp.onboard, 0)::INT AS pipeline_onboard,
    EXTRACT(DAY FROM NOW() - j.created_at)::INT AS days_since_created,
    COALESCE(
      CASE 
        WHEN j.min_annual_salary IS NULL OR j.min_annual_salary = '' THEN 0
        ELSE j.min_annual_salary::BIGINT
      END, 
      0
    ) AS estimated_revenue,
    -- Status logic (chỉ cảnh báo "Cần BD CV" khi THỰC SỰ chưa có activity gì)
    CASE
      WHEN COALESCE(jp.cv_sent, 0) = 0 
        AND COALESCE(jp.interview, 0) = 0 
        AND COALESCE(jp.offer, 0) = 0 
        AND COALESCE(jp.onboard, 0) = 0 THEN 'Cần BD CV'
      WHEN COALESCE(jp.interview, 0) = 0 AND COALESCE(jp.cv_sent, 0) > 0 THEN 'Kéo Interview'
      WHEN COALESCE(jp.offer, 0) = 0 AND COALESCE(jp.interview, 0) > 0 THEN 'Push Offer'
      WHEN COALESCE(jp.onboard, 0) > 0 THEN 'Onboarded'
      ELSE 'In Progress'
    END AS status_label,
    -- Status color
    CASE
      WHEN COALESCE(jp.cv_sent, 0) = 0 
        AND COALESCE(jp.interview, 0) = 0 
        AND COALESCE(jp.offer, 0) = 0 
        AND COALESCE(jp.onboard, 0) = 0 THEN 'text-red-500'
      WHEN COALESCE(jp.interview, 0) = 0 THEN 'text-orange-500'
      WHEN COALESCE(jp.offer, 0) = 0 THEN 'text-blue-500'
      WHEN COALESCE(jp.onboard, 0) > 0 THEN 'text-green-500'
      ELSE 'text-gray-500'
    END AS status_color,
    -- Assigned week (format: "Tuần 21/04")
    CASE 
      WHEN la.la_week_start IS NOT NULL THEN 'Tuần ' || TO_CHAR(la.la_week_start, 'DD/MM')
      ELSE NULL
    END AS assigned_week,
    -- Assigned to (names)
    la.la_assignee_names AS assigned_to_names,
    -- Latest process info (for milestone calculation)
    lp.lp_status AS latest_process_status,
    lp.lp_updated_at AS latest_process_updated_at
  FROM jobs j
  INNER JOIN job_pipeline jp ON jp.jp_job_id = j.id
  LEFT JOIN clients c ON c.id = j.client_id
  LEFT JOIN latest_assignments la ON la.la_job_id = j.id
  LEFT JOIN latest_process_per_job lp ON lp.lp_job_id = j.id
  ORDER BY
    -- Priority: jobs with no CV first, then by days since created
    CASE WHEN COALESCE(jp.cv_sent, 0) = 0 THEN 0 ELSE 1 END,
    j.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_team_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_members_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_jobs_attention TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION get_team_stats IS 'Get monthly team statistics for HH Lead dashboard';
COMMENT ON FUNCTION get_team_members_performance IS 'Get individual performance metrics for team members';
COMMENT ON FUNCTION get_team_jobs_attention IS 'Get jobs that need attention from the team';
