-- Fix: rebuild_kpi_snapshots dùng lương đúng theo từng kỳ
-- Thay vì luôn lấy is_current = true, join với lương có hiệu lực tại thời điểm period_start

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
  -- Lương có hiệu lực tại thời điểm period_start:
  -- Lấy record có effective_from <= period_start, ưu tiên effective_from mới nhất
  salary_at_month AS (
    SELECT DISTINCT ON (ru.user_id, mp.period_start)
      ru.user_id,
      mp.period_start,
      esh.base_salary
    FROM role_users ru
    JOIN month_periods mp ON true
    JOIN public.employee_salary_history esh
      ON esh.user_id = ru.user_id
     AND esh.effective_from <= mp.period_start
    ORDER BY ru.user_id, mp.period_start, esh.effective_from DESC
  ),
  salary_at_quarter AS (
    SELECT DISTINCT ON (ru.user_id, qp.period_start)
      ru.user_id,
      qp.period_start,
      esh.base_salary
    FROM role_users ru
    JOIN quarter_periods qp ON true
    JOIN public.employee_salary_history esh
      ON esh.user_id = ru.user_id
     AND esh.effective_from <= qp.period_start
    ORDER BY ru.user_id, qp.period_start, esh.effective_from DESC
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
      COALESCE(sm.base_salary, 0) AS base_salary,
      ap.multiplier,
      ap.id AS source_policy_id
    FROM role_users ru
    JOIN month_periods mp ON true
    LEFT JOIN salary_at_month sm
      ON sm.user_id = ru.user_id AND sm.period_start = mp.period_start
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
      COALESCE(sq.base_salary, 0) AS base_salary,
      ap.multiplier,
      ap.id AS source_policy_id
    FROM role_users ru
    JOIN quarter_periods qp ON true
    LEFT JOIN salary_at_quarter sq
      ON sq.user_id = ru.user_id AND sq.period_start = qp.period_start
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

-- Chạy lại rebuild cho năm hiện tại
SELECT public.rebuild_kpi_snapshots(
  make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 1),
  make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 12, 31),
  true
);
