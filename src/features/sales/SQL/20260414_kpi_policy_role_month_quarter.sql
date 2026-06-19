-- KPI policy redesign for Sales dashboard
-- Scope phase 1: BD, Headhunter, Admin
-- Formula defaults:
--   month   = base_salary * 3
--   quarter = base_salary * 9
-- You can change multipliers later by calling public.set_kpi_policy_for_roles(...)

BEGIN;

-- 0) Add KPI role on users (separate from auth role)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS kpi_role text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_kpi_role_check'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_kpi_role_check
    CHECK (kpi_role IN ('BD', 'Headhunter', 'Admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_kpi_role
ON public.users (kpi_role);

-- 1) KPI policies: keep core fields relational, optional params in jsonb
CREATE TABLE IF NOT EXISTS public.kpi_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL,
  period_type text NOT NULL,
  base_metric text NOT NULL DEFAULT 'salary',
  multiplier numeric NOT NULL,
  rule_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kpi_policies_role_key_check CHECK (role_key IN ('BD', 'Headhunter', 'Admin')),
  CONSTRAINT kpi_policies_period_type_check CHECK (period_type IN ('month', 'quarter')),
  CONSTRAINT kpi_policies_base_metric_check CHECK (base_metric = 'salary'),
  CONSTRAINT kpi_policies_multiplier_check CHECK (multiplier > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_policies_role_period_effective
ON public.kpi_policies (role_key, period_type, effective_from);

CREATE INDEX IF NOT EXISTS idx_kpi_policies_active_period
ON public.kpi_policies (is_active, period_type, role_key, effective_from, effective_to);

-- Prevent >1 active policy for the same role/period
CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_policies_one_active_per_role_period
ON public.kpi_policies (role_key, period_type)
WHERE is_active = true;

-- 2) Employee salary history
CREATE TABLE IF NOT EXISTS public.employee_salary_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  base_salary numeric NOT NULL,
  effective_from date NOT NULL,
  effective_to date NULL,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_salary_history_base_salary_check CHECK (base_salary > 0),
  CONSTRAINT employee_salary_history_valid_range_check CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_employee_salary_history_user
ON public.employee_salary_history (user_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_employee_salary_history_current
ON public.employee_salary_history (user_id, is_current)
WHERE is_current = true;

-- 3) KPI snapshot per user and period
CREATE TABLE IF NOT EXISTS public.kpi_target_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_key text NOT NULL,
  period_type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_salary_at_calc numeric NOT NULL,
  multiplier_at_calc numeric NOT NULL,
  target_amount numeric NOT NULL,
  source_policy_id uuid NULL REFERENCES public.kpi_policies(id) ON DELETE SET NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kpi_target_snapshots_role_key_check CHECK (role_key IN ('BD', 'Headhunter', 'Admin')),
  CONSTRAINT kpi_target_snapshots_period_type_check CHECK (period_type IN ('month', 'quarter')),
  CONSTRAINT kpi_target_snapshots_valid_range_check CHECK (period_end >= period_start),
  CONSTRAINT kpi_target_snapshots_positive_amounts_check CHECK (
    base_salary_at_calc >= 0
    AND multiplier_at_calc > 0
    AND target_amount >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_target_snapshots_user_period
ON public.kpi_target_snapshots (user_id, period_type, period_start);

CREATE INDEX IF NOT EXISTS idx_kpi_target_snapshots_period
ON public.kpi_target_snapshots (period_type, period_start, role_key);

-- 3.1) KPI setup presets (for quick selection in UI)
CREATE TABLE IF NOT EXISTS public.kpi_policy_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_code text NOT NULL UNIQUE,
  preset_name text NOT NULL,
  month_multiplier numeric NOT NULL,
  quarter_multiplier numeric NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kpi_policy_presets_month_multiplier_check CHECK (month_multiplier > 0),
  CONSTRAINT kpi_policy_presets_quarter_multiplier_check CHECK (quarter_multiplier > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_policy_presets_one_default
ON public.kpi_policy_presets (is_default)
WHERE is_default = true;

-- 4) Trigger for updated_at
DROP TRIGGER IF EXISTS trg_kpi_policies_updated_at ON public.kpi_policies;
CREATE TRIGGER trg_kpi_policies_updated_at
BEFORE UPDATE ON public.kpi_policies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_employee_salary_history_updated_at ON public.employee_salary_history;
CREATE TRIGGER trg_employee_salary_history_updated_at
BEFORE UPDATE ON public.employee_salary_history
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_kpi_target_snapshots_updated_at ON public.kpi_target_snapshots;
CREATE TRIGGER trg_kpi_target_snapshots_updated_at
BEFORE UPDATE ON public.kpi_target_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_kpi_policy_presets_updated_at ON public.kpi_policy_presets;
CREATE TRIGGER trg_kpi_policy_presets_updated_at
BEFORE UPDATE ON public.kpi_policy_presets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4.1) Function: upsert active policies for selected roles with effective date
CREATE OR REPLACE FUNCTION public.set_kpi_policy_for_roles(
  p_roles text[],
  p_effective_from date,
  p_month_multiplier numeric,
  p_quarter_multiplier numeric,
  p_rule_params jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_role text;
BEGIN
  IF p_effective_from IS NULL THEN
    RAISE EXCEPTION 'p_effective_from is required';
  END IF;
  IF p_month_multiplier <= 0 OR p_quarter_multiplier <= 0 THEN
    RAISE EXCEPTION 'multipliers must be > 0';
  END IF;

  FOREACH v_role IN ARRAY p_roles LOOP
    IF v_role NOT IN ('BD', 'Headhunter', 'Admin') THEN
      RAISE EXCEPTION 'unsupported role: %', v_role;
    END IF;

    -- Ensure only one active policy per role/period before upsert.
    -- Deactivate every currently active row for this role (except same effective_from,
    -- which may be re-used by ON CONFLICT upsert below).
    UPDATE public.kpi_policies
    SET is_active = false, updated_at = now()
    WHERE role_key = v_role
      AND period_type IN ('month', 'quarter')
      AND is_active = true
      AND effective_from <> p_effective_from;

    INSERT INTO public.kpi_policies (
      role_key, period_type, base_metric, multiplier, rule_params, effective_from, is_active
    )
    VALUES
      (v_role, 'month', 'salary', p_month_multiplier, p_rule_params, p_effective_from, true),
      (v_role, 'quarter', 'salary', p_quarter_multiplier, p_rule_params, p_effective_from, true)
    ON CONFLICT (role_key, period_type, effective_from) DO UPDATE
    SET
      multiplier = EXCLUDED.multiplier,
      rule_params = EXCLUDED.rule_params,
      is_active = true,
      updated_at = now();
  END LOOP;
END;
$$;

-- 5) Seed preset + default policies (idempotent)
INSERT INTO public.kpi_policy_presets (
  preset_code, preset_name, month_multiplier, quarter_multiplier, is_default, is_active
)
VALUES
  ('STD_X3_X9', 'Standard x3/x9', 3, 9, true, true)
ON CONFLICT (preset_code) DO UPDATE
SET
  month_multiplier = EXCLUDED.month_multiplier,
  quarter_multiplier = EXCLUDED.quarter_multiplier,
  is_default = EXCLUDED.is_default,
  is_active = EXCLUDED.is_active,
  updated_at = now();

SELECT public.set_kpi_policy_for_roles(
  ARRAY['BD', 'Headhunter', 'Admin'],
  DATE '2026-01-01',
  3,
  9,
  jsonb_build_object('preset_code', 'STD_X3_X9')
);

-- 6) Bootstrap kpi_role from current role when possible
UPDATE public.users
SET kpi_role = CASE
  WHEN role::text = 'BD' THEN 'BD'
  WHEN role::text = 'Headhunter' THEN 'Headhunter'
  WHEN role::text = 'Admin' THEN 'Admin'
  ELSE NULL
END
WHERE kpi_role IS NULL;

COMMIT;

-- Post-run manual step:
-- Update users using Admin account for BD/HH work:
--   UPDATE public.users SET kpi_role = 'BD' WHERE id = '<user-id>';
--   UPDATE public.users SET kpi_role = 'Headhunter' WHERE id = '<user-id>';
--
-- Future change example (x4/x12 from 2026-07-01):
--   INSERT INTO public.kpi_policy_presets (preset_code, preset_name, month_multiplier, quarter_multiplier, is_default, is_active)
--   VALUES ('STD_X4_X12', 'Standard x4/x12', 4, 12, false, true)
--   ON CONFLICT (preset_code) DO UPDATE
--   SET month_multiplier = EXCLUDED.month_multiplier, quarter_multiplier = EXCLUDED.quarter_multiplier, updated_at = now();
--
--   SELECT public.set_kpi_policy_for_roles(
--     ARRAY['BD', 'Headhunter', 'Admin'],
--     DATE '2026-07-01',
--     4,
--     12,
--     jsonb_build_object('preset_code', 'STD_X4_X12')
--   );
