-- ============================================================
-- Research Role Permissions (idempotent - chạy lại được)
-- DB enum name: 'Researcher'
-- ============================================================

-- 0. Thêm permission code mới (bỏ qua nếu đã có)
INSERT INTO public.app_permissions (code, description) VALUES
  ('view_research_queue', 'Xem Research Queue')
ON CONFLICT (code) DO NOTHING;

-- 1. Researcher
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('Researcher', 'view_research_queue'),
  ('Researcher', 'view_candidates'),
  ('Researcher', 'create_candidate'),
  ('Researcher', 'view_jobs'),
  ('Researcher', 'view_dashboard')
ON CONFLICT (role, permission_code) DO NOTHING;

-- 2. Headhunter
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('Headhunter', 'view_research_queue')
ON CONFLICT (role, permission_code) DO NOTHING;

-- 3. HH Lead
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('HH Lead', 'view_research_queue')
ON CONFLICT (role, permission_code) DO NOTHING;

-- 4. Admin
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('Admin', 'view_research_queue')
ON CONFLICT (role, permission_code) DO NOTHING;

-- Verify
SELECT role, permission_code
FROM public.role_permissions
WHERE permission_code = 'view_research_queue'
ORDER BY role;
