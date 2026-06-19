-- =====================================================
-- RPC: Gom dữ liệu Weekly Report cả team (cho email 12:00 T7)
-- Layout export: 8 sections / headhunter (template Excel)
-- =====================================================

-- Candidates: active processes trong tuần + merge tracker JSON
CREATE OR REPLACE FUNCTION public.get_weekly_report_candidates_export(
  p_user_id UUID,
  p_week_start DATE,
  p_tracker JSONB DEFAULT '{}'::JSONB
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH week_bounds AS (
    SELECT
      p_week_start AS week_start,
      (p_week_start + 7)::DATE AS week_end
  ),
  active_stages AS (
    SELECT unnest(ARRAY[
      'CV_SUBMITTED_TO_CLIENT',
      'INTERVIEW_SCHEDULED_1ST', 'INTERVIEW_COMPLETED_1ST',
      'INTERVIEW_SCHEDULED_2ND', 'INTERVIEW_COMPLETED_2ND',
      'INTERVIEW_SCHEDULED_FINAL', 'INTERVIEW_COMPLETED_FINAL',
      'INTERVIEW_SCHEDULED_4TH', 'INTERVIEW_COMPLETED_4TH',
      'TEST_ASSIGNED', 'TEST_COMPLETED',
      'REFERENCE_CHECK_IN_PROGRESS', 'REFERENCE_CHECK_COMPLETED',
      'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE',
      'ONBOARDING', 'GUARANTEE_PERIOD'
    ]::TEXT[]) AS stage
  ),
  proc_rows AS (
    SELECT DISTINCT ON (p.id)
      p.id AS process_id,
      c.name AS candidate_name,
      j.position_title,
      cl.client_name,
      p.process_status::TEXT AS stage,
      COALESCE(p_tracker -> p.id::TEXT, '{}'::JSONB) AS tracker_entry
    FROM public.processes p
    JOIN public.candidates c ON c.id = p.candidate_id
    JOIN public.jobs j ON j.id = p.job_id
    LEFT JOIN public.clients cl ON cl.id = j.client_id
    CROSS JOIN week_bounds wb
    WHERE p.owner_id = p_user_id
      AND (
        (p_tracker ? p.id::TEXT)
        OR (
          p.process_status::TEXT IN (SELECT stage FROM active_stages)
          AND (
            ((p.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE >= wb.week_start
              AND (p.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE < wb.week_end)
            OR ((COALESCE(p.updated_at, p.created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE >= wb.week_start
              AND (COALESCE(p.updated_at, p.created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE < wb.week_end)
          )
        )
      )
    ORDER BY p.id, c.name
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'process_id', process_id,
        'candidate_name', candidate_name,
        'position', position_title,
        'client', client_name,
        'stage', stage,
        'next_step', tracker_entry->>'next_step',
        'deadline', tracker_entry->>'deadline',
        'risk_note', tracker_entry->>'risk_note'
      )
      ORDER BY candidate_name
    ),
    '[]'::JSON
  )
  FROM proc_rows;
$$;

-- Pipeline: ưu tiên job focus tuần hiện tại; không có thì stats theo job
CREATE OR REPLACE FUNCTION public.get_weekly_report_job_pipeline_export(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH jf AS (
    SELECT
      jfd.job_id,
      jfd.position_title AS job_title,
      jfd.client_name,
      jfd.phase AS status,
      jfd.note
    FROM public.job_focus_with_details jfd
    WHERE jfd.assignee_id = p_user_id
      AND jfd.week_start = p_week_start
  ),
  jf_stats AS (
    SELECT
      jf.job_title,
      jf.client_name,
      COALESCE(ps.r_cv_client, 0) AS cv_client,
      COALESCE(ps.r_interview, 0) AS interview,
      COALESCE(ps.r_interview_scheduled, 0) AS interview_scheduled,
      COALESCE(ps.r_interview_completed, 0) AS interview_completed,
      COALESCE(ps.r_offer, 0) AS offer,
      COALESCE(ps.r_onboard, 0) AS onboard,
      jf.status,
      jf.note
    FROM jf
    LEFT JOIN public.get_weekly_report_pipeline_stats(p_user_id, p_week_start) ps
      ON ps.r_job_id = jf.job_id
  ),
  stats_only AS (
    SELECT
      j.position_title AS job_title,
      cl.client_name,
      ps.r_cv_client AS cv_client,
      ps.r_interview AS interview,
      ps.r_interview_scheduled AS interview_scheduled,
      ps.r_interview_completed AS interview_completed,
      ps.r_offer AS offer,
      ps.r_onboard AS onboard,
      j.phase AS status,
      NULL::TEXT AS note
    FROM public.get_weekly_report_pipeline_stats(p_user_id, p_week_start) ps
    JOIN public.jobs j ON j.id = ps.r_job_id
    LEFT JOIN public.clients cl ON cl.id = j.client_id
    WHERE NOT EXISTS (SELECT 1 FROM jf)
  ),
  combined AS (
    SELECT * FROM jf_stats
    UNION ALL
    SELECT * FROM stats_only
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'job_title', job_title,
        'client_name', client_name,
        'cv_client', cv_client,
        'interview', interview,
        'interview_scheduled', interview_scheduled,
        'interview_completed', interview_completed,
        'offer', offer,
        'onboard', onboard,
        'status', status,
        'note', note
      )
      ORDER BY job_title
    ),
    '[]'::JSON
  )
  FROM combined;
$$;

-- Kế hoạch tuần sau (job_focus week_start + 7)
CREATE OR REPLACE FUNCTION public.get_weekly_report_next_plan_export(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'job_title', jfd.position_title,
        'client_name', jfd.client_name,
        'goal', jfd.plan_cv_count,
        'measure', 'CV tuần',
        'deadline', jfd.plan_deadline,
        'priority', jfd.plan_priority_percent,
        'note', COALESCE(jfd.plan_note, jfd.note)
      )
      ORDER BY jfd.position_title
    ),
    '[]'::JSON
  )
  FROM public.job_focus_with_details jfd
  WHERE jfd.assignee_id = p_user_id
    AND jfd.week_start = (p_week_start + 7);
$$;

DROP FUNCTION IF EXISTS public._build_weekly_export_member_row(UUID, TEXT, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, public.weekly_reports, JSON, DATE);

CREATE OR REPLACE FUNCTION public._build_weekly_export_member_row(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_discord_id TEXT,
  p_report_exists BOOLEAN,
  p_updated_at TIMESTAMPTZ,
  p_submitted_at TIMESTAMPTZ,
  p_wr public.weekly_reports,
  p_report_data JSON,
  p_week_start DATE
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'user_id', p_user_id,
    'full_name', p_full_name,
    'email', p_email,
    'discord_id', p_discord_id,
    'report_exists', p_report_exists,
    'updated_at', p_updated_at,
    'submitted_at', p_submitted_at,
    'kpi', json_build_object(
      'approaches', COALESCE(p_wr.approaches_count, (p_report_data->>'approaches_count')::INT, 0),
      'cv_to_db', COALESCE((p_report_data->'current_week'->>'cv_to_db')::INT, 0),
      'cv_to_client', COALESCE((p_report_data->'current_week'->>'cv_client')::INT, 0),
      'setup_interview', COALESCE((p_report_data->'current_week'->>'interview_scheduled')::INT, 0),
      'actual_interview', COALESCE((p_report_data->'current_week'->>'interview_completed')::INT, 0),
      'offer', COALESCE((p_report_data->'current_week'->>'offer')::INT, 0),
      'placement', COALESCE((p_report_data->'current_week'->>'onboard')::INT, 0)
    ),
    'targets', json_build_object(
      'approaches', COALESCE(p_wr.target_approaches, 150),
      'cv_db', COALESCE(p_wr.target_cv_db, 25),
      'cv_client', COALESCE(p_wr.target_cv_client, 10),
      'setup_interview', COALESCE(p_wr.target_setup_interview, 3),
      'interview', COALESCE(p_wr.target_interview, 2),
      'offer', COALESCE(p_wr.target_offer, 1),
      'placement', COALESCE(p_wr.target_placement, 0)
    ),
    'monthly', COALESCE(
      p_report_data->'monthly_accumulated',
      (
        SELECT json_build_object(
          'approaches', COALESCE(ms.r_approaches, 0),
          'cv_to_db', COALESCE(ms.r_cv_to_db, 0),
          'cv_client', COALESCE(ms.r_cv_client, 0),
          'interview', COALESCE(ms.r_interview, 0),
          'offer', COALESCE(ms.r_offer, 0),
          'onboard', COALESCE(ms.r_onboard, 0)
        )
        FROM public.get_monthly_accumulated_stats(
          p_user_id,
          DATE_TRUNC('month', p_week_start)::DATE
        ) ms
        LIMIT 1
      ),
      '{}'::JSON
    ),
    'pipeline', public.get_weekly_report_job_pipeline_export(p_user_id, p_week_start),
    'candidates', public.get_weekly_report_candidates_export(
      p_user_id,
      p_week_start,
      COALESCE(p_wr.candidate_tracker, (p_report_data->'candidate_tracker')::JSONB, '{}'::JSONB)
    ),
    'next_week_plan', public.get_weekly_report_next_plan_export(p_user_id, p_week_start),
    'candidate_tracker', COALESCE(p_wr.candidate_tracker, (p_report_data->'candidate_tracker')::JSONB, '{}'::JSONB),
    'sourcing_channels', COALESCE(p_wr.sourcing_channels, (p_report_data->'sourcing_channels')::JSONB, '[]'::JSONB),
    'sourcing_note', COALESCE(p_wr.sourcing_note, p_report_data->>'sourcing_note'),
    'week_note', COALESCE(p_wr.week_note, p_report_data->>'week_note'),
    'self_review_score', COALESCE(p_wr.self_review_score, (p_report_data->>'self_review_score')::INT),
    'self_review_lessons', COALESCE(p_wr.self_review_lessons, p_report_data->>'self_review_lessons'),
    'self_review_support_needed', COALESCE(p_wr.self_review_support_needed, p_report_data->>'self_review_support_needed'),
    'revenues', COALESCE(
      p_wr.revenue_tracker,
      (p_report_data->'revenue_tracker')::JSONB,
      '[]'::JSONB
    )
  );
$$;

DROP FUNCTION IF EXISTS public.get_team_weekly_reports_export(DATE, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_team_weekly_reports_export(DATE);

CREATE OR REPLACE FUNCTION public.get_team_weekly_reports_export(
  p_week_start DATE DEFAULT NULL,
  p_only_saved_reports BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_week_end_label DATE;
  v_result JSON;
  v_members JSON;
  v_metrics_cutoff TIMESTAMPTZ;
  v_generated_at TIMESTAMPTZ;
BEGIN
  v_generated_at := NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh';

  IF p_week_start IS NOT NULL THEN
    v_week_start := p_week_start;
  ELSIF p_only_saved_reports THEN
    SELECT MAX(wr.week_start) INTO v_week_start FROM public.weekly_reports wr;
    IF v_week_start IS NULL THEN
      RAISE EXCEPTION 'Chưa có weekly_reports nào trong hệ thống';
    END IF;
  ELSE
    v_week_start := public.get_week_start(
      ((NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE - 1)
    );
  END IF;

  v_week_end := v_week_start + 7;
  v_week_end_label := v_week_start + 6;
  v_metrics_cutoff := ((v_week_end)::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';

  IF p_only_saved_reports THEN
    SELECT COALESCE(json_agg(member_row ORDER BY member_row->>'full_name'), '[]'::JSON)
    INTO v_members
    FROM (
      SELECT public._build_weekly_export_member_row(
        u.id, u.full_name, u.email, p.discord_id,
        TRUE, wr.updated_at, wr.submitted_at,
        wr, wr_data.report_data,
        v_week_start
      ) AS member_row
      FROM public.weekly_reports wr
      JOIN public.users u ON u.id = wr.user_id
      LEFT JOIN public.profiles p ON p.id = u.id
      LEFT JOIN LATERAL (
        SELECT public.get_weekly_report_data(u.id, v_week_start) AS report_data
      ) wr_data ON TRUE
      WHERE wr.week_start = v_week_start
    ) sub;
  ELSE
    SELECT COALESCE(json_agg(member_row ORDER BY member_row->>'full_name'), '[]'::JSON)
    INTO v_members
    FROM (
      SELECT public._build_weekly_export_member_row(
        u.id, u.full_name, u.email, p.discord_id,
        COALESCE((wr_data.report_data->>'report_exists')::BOOLEAN, FALSE),
        wr.updated_at, wr.submitted_at,
        wr, wr_data.report_data,
        v_week_start
      ) AS member_row
      FROM public.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      LEFT JOIN LATERAL (
        SELECT public.get_weekly_report_data(u.id, v_week_start) AS report_data
      ) wr_data ON TRUE
      LEFT JOIN public.weekly_reports wr
        ON wr.user_id = u.id AND wr.week_start = v_week_start
      WHERE u.is_active = TRUE
        AND u.status = 'approved'
        AND u.role IN ('Headhunter', 'HH Lead')
    ) sub;
  END IF;

  v_result := json_build_object(
    'week_start', v_week_start,
    'week_end', v_week_end,
    'week_range_label',
      to_char(v_week_start, 'DD/MM') || ' (T7) – ' || to_char(v_week_end_label, 'DD/MM') || ' (T6)',
    'metrics_cutoff_at', v_metrics_cutoff,
    'generated_at', v_generated_at,
    'only_saved_reports', p_only_saved_reports,
    'member_count', json_array_length(v_members),
    'members', v_members
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_weekly_reports_export(DATE, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_weekly_report_candidates_export(UUID, DATE, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_weekly_report_job_pipeline_export(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_weekly_report_next_plan_export(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public._build_weekly_export_member_row(UUID, TEXT, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, public.weekly_reports, JSON, DATE) TO service_role;

COMMENT ON FUNCTION public.get_team_weekly_reports_export IS
  'Export team weekly report JSON — đủ 8 sections/template mỗi HH.';
