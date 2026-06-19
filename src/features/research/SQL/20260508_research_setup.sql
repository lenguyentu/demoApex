-- ============================================================
-- RESEARCH ROLE - FULL SETUP (idempotent - chạy lại được)
-- ============================================================

-- ============================================================
-- BƯỚC 1: hh_assignment_offset
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hh_assignment_offset (
  user_id     uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  join_offset bigint NOT NULL DEFAULT 0,
  created_at  timestamp with time zone DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_hh_join_offset()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_min_score bigint;
BEGIN
  IF NEW.role NOT IN ('Headhunter', 'HH Lead') THEN RETURN NEW; END IF;
  IF NOT NEW.is_active THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.hh_assignment_offset WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  WITH cumulative AS (
    SELECT p.owner_id, COUNT(*) AS cnt
    FROM public.processes p
    JOIN public.users creator ON creator.id = p.created_by_id
    WHERE creator.role = 'Researcher'
    GROUP BY p.owner_id
  )
  SELECT COALESCE(MIN(COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0)), 0)
  INTO v_min_score
  FROM public.users u
  LEFT JOIN cumulative c ON c.owner_id = u.id
  LEFT JOIN public.hh_assignment_offset o ON o.user_id = u.id
  WHERE (u.role IN ('Headhunter', 'HH Lead') OR (u.role = 'Admin' AND EXISTS (SELECT 1 FROM public.hh_assignment_offset ao WHERE ao.user_id = u.id)))
    AND u.is_active = true
    AND u.id != NEW.id;
  INSERT INTO public.hh_assignment_offset (user_id, join_offset)
  VALUES (NEW.id, v_min_score)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_hh_join_offset ON public.users;
CREATE TRIGGER trg_set_hh_join_offset
  AFTER INSERT OR UPDATE OF role, is_active ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_hh_join_offset();

INSERT INTO public.hh_assignment_offset (user_id, join_offset)
SELECT id, 0 FROM public.users
WHERE role IN ('Headhunter', 'HH Lead') AND is_active = true
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
-- BƯỚC 2: hh_day_off
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hh_day_off (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_off    date NOT NULL,
  half_day   text CHECK (half_day IN ('morning', 'afternoon', NULL)),
  reason     text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, day_off)
);

CREATE INDEX IF NOT EXISTS idx_hh_day_off_date ON public.hh_day_off(day_off);
CREATE INDEX IF NOT EXISTS idx_hh_day_off_user ON public.hh_day_off(user_id);

ALTER TABLE public.hh_day_off ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View day off" ON public.hh_day_off;
DROP POLICY IF EXISTS "HH Lead and Admin can manage day off" ON public.hh_day_off;

CREATE POLICY "View day off" ON public.hh_day_off
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "HH Lead and Admin can manage day off" ON public.hh_day_off
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'HH Lead')
  ));


-- ============================================================
-- BƯỚC 3: research_assignment_history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.research_assignment_history (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id                    uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  assigned_to_user_id           uuid NOT NULL REFERENCES public.users(id),
  assigned_by_user_id           uuid NOT NULL REFERENCES public.users(id),
  week_start_date               date NOT NULL,
  effective_score_at_assignment bigint NOT NULL DEFAULT 0,
  assigned_at                   timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rah_week        ON public.research_assignment_history(week_start_date);
CREATE INDEX IF NOT EXISTS idx_rah_assigned_to ON public.research_assignment_history(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_rah_process     ON public.research_assignment_history(process_id);

ALTER TABLE public.research_assignment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View assignment history" ON public.research_assignment_history;
DROP POLICY IF EXISTS "Only SECURITY DEFINER can insert" ON public.research_assignment_history;

CREATE POLICY "View assignment history" ON public.research_assignment_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only SECURITY DEFINER can insert" ON public.research_assignment_history
  FOR INSERT TO authenticated WITH CHECK (false);


-- ============================================================
-- BƯỚC 4: Index
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_processes_research_workload
  ON public.processes(owner_id, created_at)
  INCLUDE (created_by_id);


-- ============================================================
-- BƯỚC 5: assign_next_headhunter()
-- Định nghĩa duy nhất (excluded + discord_id): chạy file
--   20260514_sync_assign_next_headhunter_excluded.sql
-- sau khi chạy script này và các migration research liên quan.
-- ============================================================


-- ============================================================
-- BƯỚC 6: get_next_headhunter()
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_headhunter()
RETURNS TABLE (user_id uuid, user_name text, effective_score bigint)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH cumulative AS (
    SELECT p.owner_id, COUNT(*) AS cnt
    FROM public.processes p
    JOIN public.users creator ON creator.id = p.created_by_id
    WHERE creator.role = 'Researcher'
    GROUP BY p.owner_id
  )
  SELECT u.id, u.full_name,
    COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0)
  FROM public.users u
  LEFT JOIN cumulative c ON c.owner_id = u.id
  LEFT JOIN public.hh_assignment_offset o ON o.user_id = u.id
  WHERE (u.role IN ('Headhunter', 'HH Lead') OR (u.role = 'Admin' AND EXISTS (SELECT 1 FROM public.hh_assignment_offset ao WHERE ao.user_id = u.id)))
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
  ORDER BY COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0) ASC, u.created_at ASC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_headhunter() TO authenticated;


-- ============================================================
-- BƯỚC 7: get_research_workload_stats()
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_research_workload_stats()
RETURNS TABLE (
  hh_id           uuid,
  hh_name         text,
  hh_role         text,
  raw_count       bigint,
  join_offset     bigint,
  effective_score bigint,
  this_week       bigint,
  total_pct       numeric
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
  scores AS (
    SELECT u.id, COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0) AS eff
    FROM public.users u
    LEFT JOIN cumulative c ON c.owner_id = u.id
    LEFT JOIN public.hh_assignment_offset o ON o.user_id = u.id
    WHERE u.role IN ('Headhunter', 'HH Lead') AND u.is_active = true
  ),
  grand AS (SELECT SUM(eff) AS total FROM scores)
  SELECT
    u.id, u.full_name, u.role::text,
    COALESCE(c.cnt, 0),
    COALESCE(o.join_offset, 0),
    COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0),
    COALESCE(tw.cnt, 0),
    ROUND((COALESCE(c.cnt,0) + COALESCE(o.join_offset,0)) * 100.0
      / NULLIF((SELECT total FROM grand), 0), 1)
  FROM public.users u
  LEFT JOIN cumulative c ON c.owner_id = u.id
  LEFT JOIN public.hh_assignment_offset o ON o.user_id = u.id
  LEFT JOIN this_week tw ON tw.owner_id = u.id
  WHERE u.role IN ('Headhunter', 'HH Lead') AND u.is_active = true
  ORDER BY COALESCE(c.cnt,0) + COALESCE(o.join_offset,0) ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_research_workload_stats() TO authenticated;

-- ============================================================
-- VERIFY
-- SELECT * FROM get_next_headhunter();
-- SELECT * FROM get_research_workload_stats();
-- ============================================================

