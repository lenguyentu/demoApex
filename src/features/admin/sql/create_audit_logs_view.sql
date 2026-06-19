-- Create View to safely join Audit Logs with Profiles for Display
-- This allows us to show Name/Email without enforcing Foreign Key constraints on the main table
-- (avoiding the 'Risk #1' where missing profile blocks audit log insertion)

CREATE OR REPLACE VIEW public.audit_logs_view AS
SELECT
  l.id,
  l.created_at,
  l.action,
  l.target_table,
  l.target_record_id,
  l.details,
  l.actor_user_id,
  l.target_user_id,
  -- Actor Info (Safe Left Join)
  pa.full_name as actor_name,
  pa.email as actor_email,
  -- Target User Info (Safe Left Join)
  pt.full_name as target_user_name,
  pt.email as target_user_email
FROM public.audit_logs l
LEFT JOIN public.profiles pa ON l.actor_user_id = pa.id
LEFT JOIN public.profiles pt ON l.target_user_id = pt.id;

-- Grant access (if needed for authenticated users, usually admins)
GRANT SELECT ON public.audit_logs_view TO authenticated;
GRANT SELECT ON public.audit_logs_view TO service_role;
