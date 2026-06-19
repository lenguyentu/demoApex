-- Cập nhật get_research_workload_stats():
-- 1. Include Admin có record trong hh_assignment_offset
-- 2. Thêm joined_at và is_next để biết ai nhận CV tiếp theo
-- 3. Sort theo effective_score ASC, created_at ASC (tie-break)

DROP FUNCTION IF EXISTS public.get_research_workload_stats();

CREATE OR REPLACE FUNCTION public.get_research_workload_stats()
RETURNS TABLE (
  hh_id           uuid,
  hh_name         text,
  hh_role         text,
  raw_count       bigint,
  join_offset     bigint,
  effective_score bigint,
  this_week       bigint,
  total_pct       numeric,
  joined_at       timestamptz,
  is_next         boolean
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_week_start date;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE)::date;
  RETURN QUERY
  WITH cumulative AS (
    SELECT p.owner_id, COUNT(*) AS cnt
    FROM public.processes p
    JOIN public.users creator ON creator.id = p.created_by_id
    WHERE creator.role = 'Researcher'
    GROUP BY p.owner_id
  ),
  this_week AS (
    SELECT p.owner_id, COUNT(*) AS cnt
    FROM public.processes p
    JOIN public.users creator ON creator.id = p.created_by_id
    WHERE creator.role = 'Researcher' AND p.created_at >= v_week_start
    GROUP BY p.owner_id
  ),
  pool AS (
    SELECT u.id, u.created_at,
      COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0) AS eff
    FROM public.users u
    LEFT JOIN cumulative c ON c.owner_id = u.id
    LEFT JOIN public.hh_assignment_offset o ON o.user_id = u.id
    WHERE (
      u.role IN ('Headhunter', 'HH Lead')
      OR (u.role = 'Admin' AND o.user_id IS NOT NULL)
    )
    AND u.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.hh_day_off d
      WHERE d.user_id = u.id AND d.day_off = CURRENT_DATE
        AND (
          d.half_day IS NULL
          OR (d.half_day = 'morning'   AND EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') < 12)
          OR (d.half_day = 'afternoon' AND EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') >= 12)
        )
    )
  ),
  next_person AS (
    SELECT id FROM pool ORDER BY eff ASC, created_at ASC LIMIT 1
  ),
  grand AS (SELECT SUM(eff) AS total FROM pool)
  SELECT
    u.id,
    u.full_name,
    u.role::text,
    COALESCE(c.cnt, 0),
    COALESCE(o.join_offset, 0),
    COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0),
    COALESCE(tw.cnt, 0),
    ROUND((COALESCE(c.cnt,0) + COALESCE(o.join_offset,0)) * 100.0
      / NULLIF((SELECT total FROM grand), 0), 1),
    u.created_at,
    (u.id = (SELECT id FROM next_person))
  FROM public.users u
  LEFT JOIN cumulative c ON c.owner_id = u.id
  LEFT JOIN public.hh_assignment_offset o ON o.user_id = u.id
  LEFT JOIN this_week tw ON tw.owner_id = u.id
  WHERE (
    u.role IN ('Headhunter', 'HH Lead')
    OR (u.role = 'Admin' AND o.user_id IS NOT NULL)
  )
  AND u.is_active = true
  ORDER BY
    COALESCE(c.cnt,0) + COALESCE(o.join_offset,0) ASC,
    u.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_research_workload_stats() TO authenticated;
