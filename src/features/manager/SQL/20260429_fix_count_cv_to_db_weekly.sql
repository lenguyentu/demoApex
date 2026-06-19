-- ============================================================
-- FIX: count_cv_to_db_weekly - Timezone issue
-- Date: 2026-04-29
-- Problem: Function returns 0 even when candidates exist in the week
-- Root cause: Timezone conversion issue when comparing dates
-- ============================================================

DROP FUNCTION IF EXISTS public.count_cv_to_db_weekly(UUID, DATE);

CREATE OR REPLACE FUNCTION public.count_cv_to_db_weekly(
  p_assignee_id UUID,
  p_week_start  DATE
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start TIMESTAMPTZ;
  v_week_end TIMESTAMPTZ;
  v_count BIGINT;
BEGIN
  -- Tuần tính theo giờ Việt Nam (UTC+7): [Thứ Bảy 00:00, Thứ Bảy tuần sau 00:00)
  v_week_start := (p_week_start || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_week_end := ((p_week_start + INTERVAL '7 days')::DATE || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';

  -- Đếm TẤT CẢ candidates được tạo bởi user trong tuần
  -- Không cần có process, chỉ cần created_by_id = assignee_id
  SELECT COUNT(*)
  INTO v_count
  FROM public.candidates c
  WHERE c.created_by_id = p_assignee_id
    AND c.created_at >= v_week_start
    AND c.created_at < v_week_end;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_cv_to_db_weekly(UUID, DATE) TO authenticated;

-- ============================================================
-- TEST
-- ============================================================
/*
-- Test với user ID và week start thật
SELECT count_cv_to_db_weekly(
  '16532cb5-0bf0-4974-857e-d86788f4466a',
  '2026-04-27'
); -- Should return 1

-- Verify candidates in week
SELECT 
  id, name, created_by_id,
  created_at,
  created_at >= '2026-04-27'::TIMESTAMPTZ as in_week
FROM candidates
WHERE created_by_id = '16532cb5-0bf0-4974-857e-d86788f4466a'
  AND created_at >= '2026-04-27'::TIMESTAMPTZ
  AND created_at < '2026-05-04'::TIMESTAMPTZ;
*/
