-- Fix: allow base_salary_at_calc = 0 (was > 0, blocking users with no salary set)
-- Also fix salary_current CTE to use is_current = true filter

BEGIN;

-- Drop old constraint and re-add with >= 0
ALTER TABLE public.kpi_target_snapshots
DROP CONSTRAINT IF EXISTS kpi_target_snapshots_positive_amounts_check;

ALTER TABLE public.kpi_target_snapshots
ADD CONSTRAINT kpi_target_snapshots_positive_amounts_check CHECK (
  base_salary_at_calc >= 0
  AND multiplier_at_calc > 0
  AND target_amount >= 0
);

-- Re-create rebuild function with fixed salary_current CTE (is_current = true)
CREATE OR REPLACE FUNCTION public.rebuild_kpi_snapshots(
  p_from_date date,
  p_to_date date,
  p_overwrite boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
AS $func$
BEGIN
  IF p_from_date IS NULL OR p_to_date IS NULL THEN
    RAISE EXCEPTION 'p_from_date and p_to_date are required';
  END IF;
  IF p_to_date < p_from_date THEN
    RAISE EXCEPTION 'p_to_date must be >= p_from_date';
  END IF;

  IF p_overwrite THEN
    DELETE FROM public.kpi_target_snapshots
    WHERE period_start >= date_trunc('month', p_from_date)::date
      AND period_start <= p_to_date;
  END IF;

  WITH role_users AS (
    SELECT id AS user_id, kpi_role
    FROM public.users
    WHERE kpi_role IN ('BD', 'Headhunter', 'Admin')
  ),
  salary_current AS (
    SELECT DISTINCT ON (esh.user_id)
      esh.user_id,
      esh.base_salary
    FROM public.employee_salary_history esh
    WHERE esh.is_current = true
    ORDER BY esh.user_id, esh.effective_from DESC
  ),
  month_periods AS (
    SELECT
      gs::date AS period_start,
      (gs + INTERVAL '1 month - 1 day')::date AS period_end
    FROM generate_series(
      date_trunc('month', p_from_date)::date,
      date_trunc('month', p_to_date)::date,
      INTERVAL '1 month'
    ) gs
  ),
  quarter_periods AS (
    SELECT
      gs::date AS period_start,
      (gs + INTERVAL '3 month - 1 day')::date AS period_end
    FROM generate_series(
      date_trunc('quarter', p_from_date)::date,
      date_trunc('quarter', p_to_date)::date,
      INTERVAL '3 month'
    ) gs
  ),
  policy_by_period AS (
    SELECT DISTINCT ON (kp.role_key, kp.period_type, mp.period_start)
      kp.id,
      kp.role_key,
      kp.period_type,
      kp.multiplier,
      mp.period_start
    FROM public.kpi_policies kp
    JOIN month_periods mp ON kp.period_type = 'month'
    WHERE kp.is_active = true
      AND kp.effective_from <= mp.period_start
      AND (kp.effective_to IS NULL OR kp.effective_to >= mp.period_start)
    ORDER BY kp.role_key, kp.period_type, mp.period_start, kp.effective_from DESC
  ),
  policy_by_quarter_period AS (
    SELECT DISTINCT ON (kp.role_key, kp.period_type, qp.period_start)
      kp.id,
      kp.role_key,
      kp.period_type,
      kp.multiplier,
      qp.period_start
    FROM public.kpi_policies kp
    JOIN quarter_periods qp ON kp.period_type = 'quarter'
    WHERE kp.is_active = true
      AND kp.effective_from <= qp.period_start
      AND (kp.effective_to IS NULL OR kp.effective_to >= qp.period_start)
    ORDER BY kp.role_key, kp.period_type, qp.period_start, kp.effective_from DESC
  ),
  monthly_rows AS (
    SELECT
      ru.user_id,
      ru.kpi_role AS role_key,
      'month'::text AS period_type,
      mp.period_start,
      mp.period_end,
      sc.base_salary,
      ap.multiplier,
      ap.id AS source_policy_id
    FROM role_users ru
    JOIN salary_current sc ON sc.user_id = ru.user_id
    JOIN month_periods mp ON true
    JOIN policy_by_period ap
      ON ap.role_key = ru.kpi_role
     AND ap.period_type = 'month'
     AND ap.period_start = mp.period_start
    WHERE mp.period_start >= date_trunc('month', p_from_date)::date
      AND mp.period_start <= p_to_date
  ),
  quarterly_rows AS (
    SELECT
      ru.user_id,
      ru.kpi_role AS role_key,
      'quarter'::text AS period_type,
      qp.period_start,
      qp.period_end,
      sc.base_salary,
      ap.multiplier,
      ap.id AS source_policy_id
    FROM role_users ru
    JOIN salary_current sc ON sc.user_id = ru.user_id
    JOIN quarter_periods qp ON true
    JOIN policy_by_quarter_period ap
      ON ap.role_key = ru.kpi_role
     AND ap.period_type = 'quarter'
     AND ap.period_start = qp.period_start
    WHERE qp.period_start >= date_trunc('quarter', p_from_date)::date
      AND qp.period_start <= p_to_date
  ),
  all_rows AS (
    SELECT * FROM monthly_rows
    UNION ALL
    SELECT * FROM quarterly_rows
  )
  INSERT INTO public.kpi_target_snapshots (
    user_id,
    role_key,
    period_type,
    period_start,
    period_end,
    base_salary_at_calc,
    multiplier_at_calc,
    target_amount,
    source_policy_id
  )
  SELECT
    user_id,
    role_key,
    period_type,
    period_start,
    period_end,
    base_salary,
    multiplier,
    (base_salary * multiplier) AS target_amount,
    source_policy_id
  FROM all_rows
  ON CONFLICT (user_id, period_type, period_start) DO UPDATE
  SET
    role_key = EXCLUDED.role_key,
    period_end = EXCLUDED.period_end,
    base_salary_at_calc = EXCLUDED.base_salary_at_calc,
    multiplier_at_calc = EXCLUDED.multiplier_at_calc,
    target_amount = EXCLUDED.target_amount,
    source_policy_id = EXCLUDED.source_policy_id,
    updated_at = now(),
    calculated_at = now();
END;
$func$;

-- Re-run rebuild for current year to apply fixes immediately
SELECT public.rebuild_kpi_snapshots(
  make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 1),
  make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 12, 31),
  true
);

COMMIT;
