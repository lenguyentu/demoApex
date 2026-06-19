-- =====================================================
-- pg_cron: Weekly Report email (giờ Việt Nam)
--
-- CHẠY Ở ĐÂU: Supabase Dashboard → SQL Editor → New query → dán file → Run
--
-- TRƯỚC KHI CHẠY:
-- 1. Database → Extensions → bật pg_cron và pg_net (hoặc chạy block Bên dưới)
-- 2. Thay YOUR_SERVICE_ROLE_KEY bằng service_role (Settings → API)
--    Không commit key vào git.
-- 3. Deploy Edge Functions: weekly-report-reminder, weekly-report-digest
-- 4. Edge secrets: RESEND_API_KEY
--
-- Lịch (UTC → VN UTC+7):
--   03:00 UTC T7 = 10:00 VN → nhắc HH
--   05:00 UTC T7 = 12:00 VN → Excel + mail admin
-- =====================================================

-- ─── Bước 1: Extensions (bỏ qua nếu đã bật trên Dashboard) ───
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── Bước 2: Gỡ job cũ (chạy lại lần 2 thì bật block này) ───
-- SELECT cron.unschedule('weekly_report_reminder_sat');
-- SELECT cron.unschedule('weekly_report_digest_sat');

-- ─── Bước 3: Đặt lịch ───
-- ⚠️ Thay YOUR_SERVICE_ROLE_KEY trước khi Run

SELECT cron.schedule(
  'weekly_report_reminder_sat',
  '0 3 * * 6',
  $$
  SELECT net.http_post(
    url := 'https://dqnjtkbxtscjikalkajq.supabase.co/functions/v1/weekly-report-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'apikey', 'YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'weekly_report_digest_sat',
  '0 5 * * 6',
  $$
  SELECT net.http_post(
    url := 'https://dqnjtkbxtscjikalkajq.supabase.co/functions/v1/weekly-report-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'apikey', 'YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ─── Bước 4: Kiểm tra đã tạo job chưa ───
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('weekly_report_reminder_sat', 'weekly_report_digest_sat');
