-- ============================================================================
-- Add managed_by_id for org hierarchy (HH/BD shared)
-- Date: 2026-05-06
-- ============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS managed_by_id UUID NULL REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_users_managed_by_id
  ON public.users (managed_by_id);

CREATE INDEX IF NOT EXISTS idx_users_managed_by_role_active
  ON public.users (managed_by_id, role, is_active);

COMMENT ON COLUMN public.users.managed_by_id IS 'Direct manager user id used for HH/BD hierarchy.';
