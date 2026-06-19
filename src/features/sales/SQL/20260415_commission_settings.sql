-- Commission settings per user (persisted, replaces useState)
-- user_id: FK to users table
-- role_key: 'BD' or 'Headhunter' (same user can have both roles)
-- kpi_amount: KPI target (VND)
-- commission_rate: bonus rate above KPI (%)
-- hot_bonus_per_case: fixed bonus per closed case (VND)

BEGIN;

CREATE TABLE IF NOT EXISTS public.commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_key text NOT NULL CHECK (role_key IN ('BD', 'Headhunter')),
  kpi_amount numeric NOT NULL DEFAULT 0 CHECK (kpi_amount >= 0),
  commission_rate numeric NOT NULL DEFAULT 0 CHECK (commission_rate >= 0),
  hot_bonus_per_case numeric NOT NULL DEFAULT 0 CHECK (hot_bonus_per_case >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_commission_settings_user_role UNIQUE (user_id, role_key)
);

CREATE INDEX IF NOT EXISTS idx_commission_settings_user
  ON public.commission_settings (user_id);

DROP TRIGGER IF EXISTS trg_commission_settings_updated_at ON public.commission_settings;
CREATE TRIGGER trg_commission_settings_updated_at
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS: Admin full access, others read-only
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_settings_select" ON public.commission_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "commission_settings_all_admin" ON public.commission_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
  );

COMMIT;
