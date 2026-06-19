-- ============================================================================
-- Weekly Reports Module - COMPLETE VERSION
-- Date: 2026-04-29
-- Description: Tạo bảng weekly_reports, RPC functions, RLS policies
-- ============================================================================

-- ─── Table: weekly_reports ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  
  -- 1. KPI Funnel - Manual inputs
  approaches_count INT DEFAULT 0,
  target_approaches INT DEFAULT 150,
  target_cv_db INT DEFAULT 25,
  target_cv_client INT DEFAULT 10,
  target_setup_interview INT DEFAULT 3,
  target_interview INT DEFAULT 2,
  target_offer INT DEFAULT 1,
  target_placement INT DEFAULT 0,
  
  -- 3. Candidate Tracker - Editable fields per process
  candidate_tracker JSONB DEFAULT '{}'::JSONB,
  
  -- 4. Sourcing Channel (multi-channel tracking)
  sourcing_channels JSONB DEFAULT '[]'::JSONB,
  sourcing_note TEXT,
  
  -- 5. Issues
  week_note TEXT,
  
  -- 8. Self-review
  self_review_score INT CHECK (self_review_score >= 1 AND self_review_score <= 10),
  self_review_lessons TEXT,
  self_review_support_needed TEXT,
  
  -- Metadata
  submitted_at TIMESTAMPTZ,
  is_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_week 
  ON public.weekly_reports(user_id, week_start DESC);

-- ─── Alter: job_focus_assignments ────────────────────────────────────────────
ALTER TABLE public.job_focus_assignments
  ADD COLUMN IF NOT EXISTS plan_cv_count INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_deadline DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_priority_percent INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_note TEXT DEFAULT NULL;

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- ─── RPC: get_monthly_accumulated_stats ──────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_monthly_accumulated_stats(UUID, DATE);

CREATE OR REPLACE FUNCTION public.get_monthly_accumulated_stats(
  p_user_id UUID,
  p_month_start DATE
)
RETURNS TABLE(
  r_cv_to_db INT,
  r_cv_client INT,
  r_interview INT,
  r_offer INT,
  r_onboard INT,
  r_approaches INT
) LANGUAGE plpgsql AS $$
DECLARE
  v_month_end DATE;
  v_month_start_ts TIMESTAMPTZ;
  v_month_end_ts TIMESTAMPTZ;
BEGIN
  v_month_end := (p_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_month_start_ts := (p_month_start || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_month_end_ts := (((p_month_start + INTERVAL '1 month')::DATE) || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';
  
  RETURN QUERY
  WITH 
  -- CV to DB accumulated (sum từng tuần)
  cv_to_db_weeks AS (
    SELECT generate_series(
      public.get_week_start(p_month_start),
      public.get_week_start(v_month_end),
      '7 days'::INTERVAL
    )::DATE AS week_start
  ),
  cv_to_db_data AS (
    SELECT COALESCE(SUM(public.count_cv_to_db_weekly(p_user_id, w.week_start)), 0)::INT AS total_cv_to_db
    FROM cv_to_db_weeks w
  ),
  -- Pipeline data: Đếm DISTINCT processes có activity trong TOÀN BỘ tháng
  all_user_processes AS (
    SELECT p.job_id, p.id AS process_id, p.process_status::TEXT AS current_status
    FROM public.processes p
    WHERE p.owner_id = p_user_id
  ),
  monthly_history AS (
    SELECT 
      ap.job_id,
      ap.process_id,
      ph.status::TEXT AS history_status,
      ph.created_at
    FROM all_user_processes ap
    JOIN public.process_history ph ON ph.process_id = ap.process_id
    WHERE ph.created_at >= p_month_start 
      AND ph.created_at < (v_month_end + INTERVAL '1 day')
  ),
  process_achievements AS (
    SELECT 
      ap.job_id,
      ap.process_id,
      ap.current_status,
      -- Đếm DISTINCT process đạt từng stage trong tháng
      (ap.current_status IN ('CV_SUBMITTED_TO_CLIENT','INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH','TEST_ASSIGNED','TEST_COMPLETED','REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED','OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')
       OR EXISTS (SELECT 1 FROM monthly_history mh WHERE mh.process_id = ap.process_id AND mh.history_status IN ('CV_SUBMITTED_TO_CLIENT','INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH','TEST_ASSIGNED','TEST_COMPLETED','REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED','OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'))) AS reached_cv_client,
      (ap.current_status IN ('INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH','TEST_ASSIGNED','TEST_COMPLETED','REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED','OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')
       OR EXISTS (SELECT 1 FROM monthly_history mh WHERE mh.process_id = ap.process_id AND mh.history_status IN ('INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH','TEST_ASSIGNED','TEST_COMPLETED','REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED','OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'))) AS reached_interview,
      (ap.current_status IN ('OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')
       OR EXISTS (SELECT 1 FROM monthly_history mh WHERE mh.process_id = ap.process_id AND mh.history_status IN ('OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'))) AS reached_offer,
      (ap.current_status IN ('PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')
       OR EXISTS (SELECT 1 FROM monthly_history mh WHERE mh.process_id = ap.process_id AND mh.history_status IN ('PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'))) AS reached_onboard,
      -- Check xem có activity trong tháng không
      (EXISTS (SELECT 1 FROM monthly_history mh WHERE mh.process_id = ap.process_id)) AS has_activity
    FROM all_user_processes ap
  ),
  -- Approaches accumulated
  approaches_data AS (
    SELECT COALESCE(SUM(da.approaches), 0)::INT AS total_approaches
    FROM public.daily_approaches da
    WHERE da.user_id = p_user_id
      AND (
        (da.date || ' 17:30:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'
      ) >= v_month_start_ts
      AND (
        (da.date || ' 17:30:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'
      ) < v_month_end_ts
  )
  SELECT
    (SELECT total_cv_to_db FROM cv_to_db_data) AS r_cv_to_db,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_cv_client)::INT AS r_cv_client,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_interview)::INT AS r_interview,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_offer)::INT AS r_offer,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_onboard)::INT AS r_onboard,
    (SELECT total_approaches FROM approaches_data) AS r_approaches
  FROM process_achievements pa;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_monthly_accumulated_stats(UUID, DATE) TO authenticated;

-- ─── RPC: get_weekly_report_data ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_weekly_report_data(UUID, DATE);

CREATE OR REPLACE FUNCTION public.get_weekly_report_data(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_month_start DATE;
  v_week_end DATE;
  v_result JSON;
  v_current_stats RECORD;
  v_monthly_stats RECORD;
  v_report RECORD;
  v_cv_to_db INT;
  v_approaches_count INT;
BEGIN
  v_month_start := DATE_TRUNC('month', p_week_start)::DATE;
  v_week_end := (p_week_start + INTERVAL '7 days')::DATE;
  
  -- 1. Current week pipeline stats
  SELECT
    COALESCE(SUM(r_cv_client), 0)::INT AS cv_client,
    COALESCE(SUM(r_interview), 0)::INT AS interview,
    COALESCE(SUM(r_interview_scheduled), 0)::INT AS interview_scheduled,
    COALESCE(SUM(r_interview_completed), 0)::INT AS interview_completed,
    COALESCE(SUM(r_offer), 0)::INT AS offer,
    COALESCE(SUM(r_onboard), 0)::INT AS onboard
  INTO v_current_stats
  FROM public.get_weekly_report_pipeline_stats(p_user_id, p_week_start);
  
  -- 2. CV to DB count (current week)
  SELECT public.count_cv_to_db_weekly(p_user_id, p_week_start) INTO v_cv_to_db;
  
  -- 3. Monthly accumulated stats
  SELECT * INTO v_monthly_stats
  FROM public.get_monthly_accumulated_stats(p_user_id, v_month_start);
  
  -- 4. Weekly report
  SELECT * INTO v_report
  FROM public.weekly_reports
  WHERE user_id = p_user_id AND week_start = p_week_start;

  -- 5. Auto approaches (sum from daily_approaches in the week)
  SELECT COALESCE(SUM(da.approaches), 0)::INT
  INTO v_approaches_count
  FROM public.daily_approaches da
  WHERE da.user_id = p_user_id
    AND da.date >= p_week_start
    AND da.date < v_week_end;
  
  -- Build JSON response
  v_result := json_build_object(
    'week_start', p_week_start,
    'month_start', v_month_start,
    'current_week', json_build_object(
      'cv_to_db', v_cv_to_db,
      'cv_client', v_current_stats.cv_client,
      'interview', v_current_stats.interview,
      'interview_scheduled', v_current_stats.interview_scheduled,
      'interview_completed', v_current_stats.interview_completed,
      'offer', v_current_stats.offer,
      'onboard', v_current_stats.onboard
    ),
    'monthly_accumulated', json_build_object(
      'cv_to_db', COALESCE(v_monthly_stats.r_cv_to_db, 0),
      'cv_client', COALESCE(v_monthly_stats.r_cv_client, 0),
      'interview', COALESCE(v_monthly_stats.r_interview, 0),
      'offer', COALESCE(v_monthly_stats.r_offer, 0),
      'onboard', COALESCE(v_monthly_stats.r_onboard, 0),
      'approaches', COALESCE(v_monthly_stats.r_approaches, 0)
    ),
    'targets', json_build_object(
      'cv_client', COALESCE(v_report.target_cv_client, 10),
      'interview', COALESCE(v_report.target_interview, 2),
      'offer', COALESCE(v_report.target_offer, 1),
      'placement', COALESCE(v_report.target_placement, 0)
    ),
    'approaches_count', COALESCE(v_approaches_count, 0),
    'candidate_tracker', COALESCE(v_report.candidate_tracker, '{}'::JSONB),
    'week_note', v_report.week_note,
    'sourcing_channels', COALESCE(v_report.sourcing_channels, '[]'::JSONB),
    'sourcing_note', v_report.sourcing_note,
    'self_review_score', v_report.self_review_score,
    'self_review_lessons', v_report.self_review_lessons,
    'self_review_support_needed', v_report.self_review_support_needed,
    'report_exists', (v_report.id IS NOT NULL)
  );
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_report_data(UUID, DATE) TO authenticated;

-- ─── RPC: get_weekly_report_pipeline_stats ───────────────────────────────────
DROP FUNCTION IF EXISTS public.get_weekly_report_pipeline_stats(UUID, DATE);

CREATE OR REPLACE FUNCTION public.get_weekly_report_pipeline_stats(
  p_assignee_id UUID,
  p_week_start  DATE
)
RETURNS TABLE (
  r_job_id UUID,
  r_cv_client BIGINT,
  r_interview BIGINT,
  r_interview_scheduled BIGINT,
  r_interview_completed BIGINT,
  r_offer BIGINT,
  r_onboard BIGINT,
  r_conversion_rate INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_week_end DATE;
  v_week_start_ts TIMESTAMPTZ;
  v_week_end_ts TIMESTAMPTZ;
BEGIN
  v_week_end := p_week_start + INTERVAL '7 days';
  v_week_start_ts := (p_week_start || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_week_end_ts := (v_week_end || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';
  
  RETURN QUERY
  WITH all_user_processes AS (
    SELECT p.job_id, p.id AS process_id, p.process_status::TEXT AS current_status
    FROM public.processes p
    WHERE p.owner_id = p_assignee_id
  ),
  weekly_history AS (
    SELECT 
      ap.job_id,
      ap.process_id,
      ph.status::TEXT AS history_status,
      ph.created_at
    FROM all_user_processes ap
    JOIN public.process_history ph ON ph.process_id = ap.process_id
    WHERE ph.created_at >= v_week_start_ts
      AND ph.created_at < v_week_end_ts
  ),
  process_achievements AS (
    SELECT 
      ap.job_id,
      ap.process_id,
      ap.current_status,
      (ap.current_status IN ('CV_SUBMITTED_TO_CLIENT','INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH','TEST_ASSIGNED','TEST_COMPLETED','REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED','OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')
       OR EXISTS (SELECT 1 FROM weekly_history wh WHERE wh.process_id = ap.process_id AND wh.history_status IN ('CV_SUBMITTED_TO_CLIENT','INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH','TEST_ASSIGNED','TEST_COMPLETED','REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED','OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'))) AS reached_cv_client,
      (ap.current_status IN ('INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH','TEST_ASSIGNED','TEST_COMPLETED','REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED','OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')
       OR EXISTS (SELECT 1 FROM weekly_history wh WHERE wh.process_id = ap.process_id AND wh.history_status IN ('INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL','INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH','TEST_ASSIGNED','TEST_COMPLETED','REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED','OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'))) AS reached_interview,
      (EXISTS (SELECT 1 FROM weekly_history wh WHERE wh.process_id = ap.process_id AND wh.history_status IN ('INTERVIEW_SCHEDULED_1ST','INTERVIEW_SCHEDULED_2ND','INTERVIEW_SCHEDULED_FINAL','INTERVIEW_SCHEDULED_4TH'))) AS reached_scheduled,
      (EXISTS (SELECT 1 FROM weekly_history wh WHERE wh.process_id = ap.process_id AND wh.history_status IN ('INTERVIEW_COMPLETED_1ST','INTERVIEW_COMPLETED_2ND','INTERVIEW_COMPLETED_FINAL','INTERVIEW_COMPLETED_4TH'))) AS reached_completed,
      (ap.current_status IN ('OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')
       OR EXISTS (SELECT 1 FROM weekly_history wh WHERE wh.process_id = ap.process_id AND wh.history_status IN ('OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE','PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'))) AS reached_offer,
      (ap.current_status IN ('PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')
       OR EXISTS (SELECT 1 FROM weekly_history wh WHERE wh.process_id = ap.process_id AND wh.history_status IN ('PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'))) AS reached_onboard,
      (EXISTS (SELECT 1 FROM weekly_history wh WHERE wh.process_id = ap.process_id)) AS has_activity
    FROM all_user_processes ap
  )
  SELECT 
    pa.job_id,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_cv_client) AS r_cv_client,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_interview) AS r_interview,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_scheduled) AS r_interview_scheduled,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_completed) AS r_interview_completed,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_offer) AS r_offer,
    COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_onboard) AS r_onboard,
    CASE 
      WHEN COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_cv_client) > 0
      THEN ROUND(COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_interview)::NUMERIC / COUNT(DISTINCT pa.process_id) FILTER (WHERE pa.has_activity AND pa.reached_cv_client)::NUMERIC * 100)::INTEGER
      ELSE 0 
    END AS r_conversion_rate
  FROM process_achievements pa
  WHERE pa.has_activity
  GROUP BY pa.job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_report_pipeline_stats(UUID, DATE) TO authenticated;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weekly reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Users can insert own weekly reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Users can update own weekly reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Manager can view team weekly reports" ON public.weekly_reports;

CREATE POLICY "Users can view own weekly reports"
  ON public.weekly_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reports"
  ON public.weekly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reports"
  ON public.weekly_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Manager can view team weekly reports"
  ON public.weekly_reports FOR SELECT
  USING (
    get_current_app_user_role() = ANY (ARRAY['Admin'::user_role_enum, 'Manager'::user_role_enum])
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = weekly_reports.user_id
        AND users.managed_by_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.weekly_reports IS 'Báo cáo tuần của Headhunter';
COMMENT ON COLUMN public.weekly_reports.candidate_tracker IS 'Dữ liệu editable cho Section 3: { "process_id": { "next_step": "", "deadline": "", "risk_note": "" } }';
COMMENT ON COLUMN public.weekly_reports.sourcing_channels IS 'Multi-channel tracking: [{ "name": "Facebook", "followers_start": 1000, "followers_end": 1050, "cv_received": 20, "posts_count": 5, "note": "" }]';
COMMENT ON FUNCTION public.get_monthly_accumulated_stats IS 'Lấy tổng lũy kế từ đầu tháng (COUNT DISTINCT processes)';
COMMENT ON FUNCTION public.get_weekly_report_data IS 'Lấy toàn bộ data cho Weekly Report page';
COMMENT ON FUNCTION public.get_weekly_report_pipeline_stats IS 'Lấy pipeline stats cho Weekly Report (activity-based, tách interview scheduled/completed)';

-- Force reload schema
NOTIFY pgrst, 'reload schema';
