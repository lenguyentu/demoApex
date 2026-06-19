-- =====================================================
-- Weekly Report schedule (VN timezone)
-- Tuần: Thứ 7 (week_start) → Thứ 6
-- Chốt chỉ số tự động: 00:00 Thứ 7 (= week_start + 7 ngày, 00:00 Asia/Ho_Chi_Minh)
-- Hạn nộp báo cáo: 12:00 Thứ 7 (= week_start + 7 ngày, 12:00 Asia/Ho_Chi_Minh)
-- =====================================================

COMMENT ON FUNCTION public.get_weekly_report_pipeline_stats IS
  'Pipeline stats tuần T7→T6. Khung thời gian: week_start 00:00 VN đến (week_start+7) 00:00 VN (chốt sau 24h Thứ 6).';

COMMENT ON FUNCTION public.get_weekly_report_data IS
  'Weekly Report data. Chỉ số tuần chốt 00:00 Thứ 7; HH nộp báo cáo trước 12:00 Thứ 7 (logic UI).';

COMMENT ON FUNCTION public.count_cv_to_db_weekly IS
  'Đếm CV to DB trong tuần T7→T6, chốt 00:00 Thứ 7 (week_start+7 00:00 VN).';

-- Helper: timestamp chốt chỉ số & hạn nộp báo cáo (dùng cron/edge sau này)
CREATE OR REPLACE FUNCTION public.get_weekly_report_schedule_ts(p_week_start DATE)
RETURNS JSON
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT json_build_object(
    'week_start', p_week_start,
    'metrics_cutoff_at', ((p_week_start + 7)::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh',
    'report_deadline_at', ((p_week_start + 7)::TEXT || ' 12:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_report_schedule_ts(DATE) TO authenticated;

COMMENT ON FUNCTION public.get_weekly_report_schedule_ts IS
  'Trả về mốc chốt chỉ số (00:00 T7) và hạn nộp báo cáo (12:00 T7) theo week_start.';
