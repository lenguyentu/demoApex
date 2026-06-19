
-- ============================================================
-- get_pipeline_stage_detail  (v3 - carry-over + r_job_id)
-- Activity-based: UV dat stage TRONG tuan dang xem
-- Job scope: tat ca job tung duoc giao cho HH <= tuan dang xem
-- r_job_id: de frontend merge carry-over job vao danh sach
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_pipeline_stage_detail(
  p_assignee_id UUID,
  p_week_start  DATE
)
RETURNS TABLE (
  r_process_id          UUID,
  r_job_id              UUID,
  r_candidate_name      TEXT,
  r_stage               TEXT,
  r_stage_reached_at    TIMESTAMPTZ,
  r_cv_submitted_at     TIMESTAMPTZ,
  r_interview_at        TIMESTAMPTZ,
  r_offer_at            TIMESTAMPTZ,
  r_onboard_at          TIMESTAMPTZ,
  r_assigned_week_start DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_end DATE := p_week_start + INTERVAL '7 days';
BEGIN
  RETURN QUERY
  WITH
  assigned_jobs AS (
    SELECT
      jfa.job_id,
      MAX(jfa.week_start) AS latest_assigned_week
    FROM public.job_focus_assignments jfa
    WHERE jfa.assignee_id = p_assignee_id
      AND jfa.week_start  <= p_week_start
    GROUP BY jfa.job_id
  ),
  focus_processes AS (
    SELECT DISTINCT
      p.id                    AS process_id,
      p.job_id                AS job_id,
      c.name                  AS candidate_name,
      aj.latest_assigned_week AS assigned_week
    FROM assigned_jobs aj
    JOIN public.processes p
      ON  p.job_id   = aj.job_id
      AND p.owner_id = p_assignee_id
    JOIN public.candidates c ON c.id = p.candidate_id
  ),
  all_history AS (
    SELECT ph.process_id, ph.status::TEXT AS status, ph.created_at
    FROM public.process_history ph
    WHERE ph.process_id IN (SELECT process_id FROM focus_processes)
  ),
  stage_dates AS (
    SELECT
      process_id,
      MIN(created_at) FILTER (WHERE status = 'CV_SUBMITTED_TO_CLIENT') AS cv_submitted_at,
      MIN(created_at) FILTER (WHERE status IN (
        'INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST',
        'INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND',
        'INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL',
        'INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH',
        'TEST_ASSIGNED','TEST_COMPLETED',
        'REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED'
      )) AS interview_at,
      MIN(created_at) FILTER (WHERE status IN (
        'OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE'
      )) AS offer_at,
      MIN(created_at) FILTER (WHERE status IN (
        'PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'
      )) AS onboard_at
    FROM all_history
    GROUP BY process_id
  ),
  weekly_stage AS (
    SELECT
      sd.process_id,
      CASE
        WHEN sd.onboard_at      >= p_week_start AND sd.onboard_at      < v_week_end THEN 'onboard'
        WHEN sd.offer_at        >= p_week_start AND sd.offer_at        < v_week_end THEN 'offer'
        WHEN sd.interview_at    >= p_week_start AND sd.interview_at    < v_week_end THEN 'interview'
        WHEN sd.cv_submitted_at >= p_week_start AND sd.cv_submitted_at < v_week_end THEN 'cv_client'
        ELSE NULL
      END AS stage,
      CASE
        WHEN sd.onboard_at      >= p_week_start AND sd.onboard_at      < v_week_end THEN sd.onboard_at
        WHEN sd.offer_at        >= p_week_start AND sd.offer_at        < v_week_end THEN sd.offer_at
        WHEN sd.interview_at    >= p_week_start AND sd.interview_at    < v_week_end THEN sd.interview_at
        WHEN sd.cv_submitted_at >= p_week_start AND sd.cv_submitted_at < v_week_end THEN sd.cv_submitted_at
        ELSE NULL
      END AS stage_reached_at,
      sd.cv_submitted_at, sd.interview_at, sd.offer_at, sd.onboard_at
    FROM stage_dates sd
  )
  SELECT
    fp.process_id        AS r_process_id,
    fp.job_id            AS r_job_id,
    fp.candidate_name    AS r_candidate_name,
    ws.stage             AS r_stage,
    ws.stage_reached_at  AS r_stage_reached_at,
    ws.cv_submitted_at   AS r_cv_submitted_at,
    ws.interview_at      AS r_interview_at,
    ws.offer_at          AS r_offer_at,
    ws.onboard_at        AS r_onboard_at,
    fp.assigned_week     AS r_assigned_week_start
  FROM focus_processes fp
  JOIN weekly_stage ws ON ws.process_id = fp.process_id
  WHERE ws.stage IS NOT NULL
  ORDER BY ws.stage_reached_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pipeline_stage_detail(UUID, DATE) TO authenticated;


-- ============================================================
-- get_job_focus_pipeline_stats  (v2 - activity-based, carry-over scope)
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
DECLARE
  v_week_end DATE := p_week_start + INTERVAL '7 days';
BEGIN
  RETURN QUERY
  WITH
  assigned_jobs AS (
    SELECT DISTINCT job_id
    FROM public.job_focus_assignments
    WHERE assignee_id = p_assignee_id
      AND week_start  <= p_week_start
  ),
  focus_processes AS (
    SELECT p.id AS process_id, p.job_id
    FROM assigned_jobs aj
    JOIN public.processes p
      ON  p.job_id   = aj.job_id
      AND p.owner_id = p_assignee_id
    WHERE p.process_status NOT IN (
      'REJECTED_BY_CLIENT','CANDIDATE_WITHDREW',
      'PROCESS_CANCELLED','REJECT_BY_ADMIN',
      'PASSED_PROBATION','FAILED_PROBATION'
    )
  ),
  all_history AS (
    SELECT ph.process_id, ph.status::TEXT AS status, ph.created_at
    FROM public.process_history ph
    WHERE ph.process_id IN (SELECT process_id FROM focus_processes)
  ),
  stage_dates AS (
    SELECT
      process_id,
      MIN(created_at) FILTER (WHERE status = 'CV_SUBMITTED_TO_CLIENT') AS cv_at,
      MIN(created_at) FILTER (WHERE status IN (
        'INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST',
        'INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND',
        'INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL',
        'INTERVIEW_SCHEDULED_4TH','INTERVIEW_COMPLETED_4TH',
        'TEST_ASSIGNED','TEST_COMPLETED',
        'REFERENCE_CHECK_IN_PROGRESS','REFERENCE_CHECK_COMPLETED'
      )) AS interview_at,
      MIN(created_at) FILTER (WHERE status IN (
        'OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE'
      )) AS offer_at,
      MIN(created_at) FILTER (WHERE status IN (
        'PLACEMENT_CONFIRMED','ONBOARDING','GUARANTEE_PERIOD'
      )) AS onboard_at
    FROM all_history
    GROUP BY process_id
  ),
  process_stage AS (
    SELECT
      fp.job_id, fp.process_id,
      CASE
        WHEN sd.onboard_at   >= p_week_start AND sd.onboard_at   < v_week_end THEN 4
        WHEN sd.offer_at     >= p_week_start AND sd.offer_at     < v_week_end THEN 3
        WHEN sd.interview_at >= p_week_start AND sd.interview_at < v_week_end THEN 2
        WHEN sd.cv_at        >= p_week_start AND sd.cv_at        < v_week_end THEN 1
        ELSE 0
      END AS stage
    FROM focus_processes fp
    LEFT JOIN stage_dates sd ON sd.process_id = fp.process_id
  )
  SELECT
    aj.job_id AS r_job_id,
    COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 1) AS r_cv_client,
    COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 2) AS r_interview,
    COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 3) AS r_offer,
    COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 4) AS r_onboard,
    CASE
      WHEN COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 1) > 0
      THEN ROUND(
        COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 2)::NUMERIC
        / COUNT(DISTINCT ps.process_id) FILTER (WHERE ps.stage >= 1)::NUMERIC * 100
      )::INTEGER
      ELSE 0
    END AS r_conversion_rate
  FROM assigned_jobs aj
  LEFT JOIN process_stage ps ON ps.job_id = aj.job_id
  GROUP BY aj.job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_focus_pipeline_stats(UUID, DATE) TO authenticated;
