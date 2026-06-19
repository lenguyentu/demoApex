-- ============================================================
-- Job Focus Management - All Functions
-- Tất cả RPC functions cho Job Focus feature
-- ============================================================

-- ============================================================
-- 1. get_job_focus_pipeline_stats
-- Đếm pipeline stats theo trạng thái HIỆN TẠI của processes
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_job_focus_pipeline_stats(
  p_assignee_id UUID,
  p_week_start  DATE
)
RETURNS TABLE (
  r_job_id          UUID,
  r_cv_client       BIGINT,
  r_interview       BIGINT,
  r_offer           BIGINT,
  r_onboard         BIGINT,
  r_conversion_rate INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Lấy TẤT CẢ processes của jobs được giao (không filter theo tuần)
  current_processes AS (
    SELECT
      jfa.job_id,
      p.id AS process_id,
      p.process_status::TEXT AS status
    FROM public.job_focus_assignments jfa
    JOIN public.processes p
      ON  p.job_id   = jfa.job_id
      AND p.owner_id = jfa.assignee_id
    WHERE jfa.assignee_id = p_assignee_id
      AND jfa.week_start  = p_week_start
      -- Chỉ đếm processes ACTIVE (chưa kết thúc)
      AND p.process_status NOT IN (
        'REJECTED_BY_CLIENT',
        'CANDIDATE_WITHDREW', 
        'PROCESS_CANCELLED',
        'REJECT_BY_ADMIN',
        'PASSED_PROBATION',
        'FAILED_PROBATION'
      )
  ),

  process_stage AS (
    SELECT
      job_id,
      process_id,
      CASE
        WHEN status IN ('PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD')           THEN 4
        WHEN status IN ('OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE')                  THEN 3
        WHEN status IN (
          'INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST',
          'INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND',
          'INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL',
          'INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH',
          'TEST_ASSIGNED','TEST_COMPLETED',
          'REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED'
        )                                                                                 THEN 2
        WHEN status = 'CV_SUBMITTED_TO_CLIENT'                                            THEN 1
        ELSE 0
      END AS stage
    FROM current_processes
  )

  SELECT
    jfa.job_id                                                                AS r_job_id,
    COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 1)               AS r_cv_client,
    COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 2)               AS r_interview,
    COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 3)               AS r_offer,
    COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 4)               AS r_onboard,
    CASE
      WHEN COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 1) > 0
      THEN ROUND(
        COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 2)::NUMERIC
        / COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 1)::NUMERIC
        * 100
      )::INTEGER
      ELSE 0
    END                                                                       AS r_conversion_rate

  FROM public.job_focus_assignments jfa
  LEFT JOIN process_stage ps ON ps.job_id = jfa.job_id
  WHERE jfa.assignee_id = p_assignee_id
    AND jfa.week_start  = p_week_start
  GROUP BY jfa.job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_focus_pipeline_stats(UUID, DATE) TO authenticated;


-- ============================================================
-- 2. count_cv_to_db_weekly
-- Đếm số candidates được tạo trong tuần (CV to DB metric)
-- Đếm TẤT CẢ candidates do user tạo, không cần có process
-- ============================================================

CREATE OR REPLACE FUNCTION public.count_cv_to_db_weekly(
  p_assignee_id UUID,
  p_week_start  DATE
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_end TIMESTAMPTZ;
  v_count BIGINT;
BEGIN
  v_week_end := (p_week_start + INTERVAL '7 days')::TIMESTAMPTZ;

  -- Đếm TẤT CẢ candidates được tạo bởi user trong tuần
  -- Không cần có process, chỉ cần created_by_id = assignee_id
  SELECT COUNT(*)
  INTO v_count
  FROM public.candidates c
  WHERE c.created_by_id = p_assignee_id
    AND c.created_at >= p_week_start::TIMESTAMPTZ
    AND c.created_at <  v_week_end;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_cv_to_db_weekly(UUID, DATE) TO authenticated;
