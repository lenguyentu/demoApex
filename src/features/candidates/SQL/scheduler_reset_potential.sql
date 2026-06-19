-- 1. Enable pg_cron (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Tránh tạo job trùng
SELECT cron.unschedule('auto_reset_potential_30_days');

-- 3. Tạo cron job
SELECT cron.schedule(
  'auto_reset_potential_30_days',
  '0 0 * * *',  -- chạy mỗi ngày lúc 00:00 UTC
  $$
  /*
    Business rule:
    A candidate is considered "potential" only within 30 days since creation.
    After 30 days from created_at, is_potential is automatically reset to false.

    Notes:
    - Only update source table (candidates).
    - database_candidates is synced via trigger.
    - Do NOT touch updated_at to avoid fake user activity.
  */
  UPDATE public.candidates
  SET is_potential = false
  WHERE is_potential = true
    AND created_at < NOW() - INTERVAL '30 days';
  $$
);
