-- Revenue Tracker (section 7) — lưu weekly_reports + export Excel
ALTER TABLE public.weekly_reports
  ADD COLUMN IF NOT EXISTS revenue_tracker JSONB NOT NULL DEFAULT '[]'::JSONB;

COMMENT ON COLUMN public.weekly_reports.revenue_tracker IS
  'Section 7: [{ id, candidate, position, client, salary, rate, bill }]';

-- Bổ sung get_weekly_report_data
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

  SELECT
    COALESCE(SUM(r_cv_client), 0)::INT AS cv_client,
    COALESCE(SUM(r_interview), 0)::INT AS interview,
    COALESCE(SUM(r_interview_scheduled), 0)::INT AS interview_scheduled,
    COALESCE(SUM(r_interview_completed), 0)::INT AS interview_completed,
    COALESCE(SUM(r_offer), 0)::INT AS offer,
    COALESCE(SUM(r_onboard), 0)::INT AS onboard
  INTO v_current_stats
  FROM public.get_weekly_report_pipeline_stats(p_user_id, p_week_start);

  SELECT public.count_cv_to_db_weekly(p_user_id, p_week_start) INTO v_cv_to_db;

  SELECT * INTO v_monthly_stats
  FROM public.get_monthly_accumulated_stats(p_user_id, v_month_start);

  SELECT * INTO v_report
  FROM public.weekly_reports
  WHERE user_id = p_user_id AND week_start = p_week_start;

  SELECT COALESCE(SUM(da.approaches), 0)::INT
  INTO v_approaches_count
  FROM public.daily_approaches da
  WHERE da.user_id = p_user_id
    AND da.date >= p_week_start
    AND da.date < v_week_end;

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
    'revenue_tracker', COALESCE(v_report.revenue_tracker, '[]'::JSONB),
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
