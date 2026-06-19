-- ============================================================
-- 20260518: Researcher Ranking + Job Breakdown
-- Hỗ trợ filter theo khoảng ngày (date_from / date_to).
--
-- Quy ước:
--   - cv_to_db: lọc theo candidates.created_at trong khoảng
--   - Các stage còn lại (approved/interview/offer/onboard):
--       lọc theo lần đầu process đạt stage đó (process_history.created_at)
--       Nếu process đã ở stage hiện tại mà process_history không lưu thì
--       fallback theo processes.created_at.
--
-- 2 functions:
--   - get_researcher_ranking(date_from, date_to)
--   - get_research_job_breakdown(date_from, date_to)
-- Truyền NULL = không filter (toàn bộ thời gian).
-- ============================================================

DROP FUNCTION IF EXISTS public.get_researcher_ranking();
DROP FUNCTION IF EXISTS public.get_researcher_ranking(timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_researcher_ranking(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to   timestamptz DEFAULT NULL
)
RETURNS TABLE (
  researcher_id   uuid,
  researcher_name text,
  cv_to_db        bigint,
  approved        bigint,
  interview       bigint,
  offer           bigint,
  onboard         bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH researchers AS (
    SELECT u.id, u.full_name
    FROM public.users u
    WHERE u.role = 'Researcher' AND u.is_active = true
  ),
  cdd_count AS (
    SELECT c.created_by_id AS rid, COUNT(*) AS cnt
    FROM public.candidates c
    WHERE c.created_by_id IN (SELECT id FROM researchers)
      AND (p_date_from IS NULL OR c.created_at >= p_date_from)
      AND (p_date_to   IS NULL OR c.created_at <= p_date_to)
    GROUP BY c.created_by_id
  ),
  research_processes AS (
    SELECT p.id, p.created_by_id, p.process_status, p.created_at
    FROM public.processes p
    WHERE p.created_by_id IN (SELECT id FROM researchers)
  ),
  -- Mỗi (process_id, status) — dùng created_at từ history nếu có, fallback process.created_at
  process_status_events AS (
    SELECT
      rp.id  AS process_id,
      rp.created_by_id AS rid,
      rp.process_status::text AS status,
      rp.created_at AS event_at
    FROM research_processes rp
    UNION
    SELECT
      ph.process_id,
      rp.created_by_id,
      ph.status::text,
      COALESCE(ph.created_at, rp.created_at)
    FROM public.process_history ph
    JOIN research_processes rp ON rp.id = ph.process_id
    WHERE ph.status IS NOT NULL
  ),
  -- Mỗi process × stage → giữ event sớm nhất; rồi filter theo date range
  first_reached AS (
    SELECT
      rid, process_id, status,
      MIN(event_at) AS first_at
    FROM process_status_events
    GROUP BY rid, process_id, status
  ),
  filtered_events AS (
    SELECT *
    FROM first_reached
    WHERE (p_date_from IS NULL OR first_at >= p_date_from)
      AND (p_date_to   IS NULL OR first_at <= p_date_to)
  ),
  approved_count AS (
    SELECT rid, COUNT(DISTINCT process_id) AS cnt
    FROM filtered_events
    WHERE status IN (
      'CV_SUBMITTED_TO_CLIENT',
      'INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST',
      'INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND',
      'INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL',
      'OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE',
      'ONBOARDING','PLACED','PLACEMENT_CONFIRMED','GUARANTEE_PERIOD','PAYMENT_RECEIVED'
    )
    GROUP BY rid
  ),
  interview_count AS (
    SELECT rid, COUNT(DISTINCT process_id) AS cnt
    FROM filtered_events
    WHERE status IN (
      'INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST',
      'INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND',
      'INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL'
    )
    GROUP BY rid
  ),
  offer_count AS (
    SELECT rid, COUNT(DISTINCT process_id) AS cnt
    FROM filtered_events
    WHERE status IN ('OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE')
    GROUP BY rid
  ),
  onboard_count AS (
    SELECT rid, COUNT(DISTINCT process_id) AS cnt
    FROM filtered_events
    WHERE status IN ('ONBOARDING','PLACED','PLACEMENT_CONFIRMED','GUARANTEE_PERIOD','PAYMENT_RECEIVED')
    GROUP BY rid
  )
  SELECT
    r.id,
    r.full_name,
    COALESCE(cdd.cnt, 0),
    COALESCE(ap.cnt, 0),
    COALESCE(iv.cnt, 0),
    COALESCE(ofc.cnt, 0),
    COALESCE(ob.cnt, 0)
  FROM researchers r
  LEFT JOIN cdd_count       cdd ON cdd.rid = r.id
  LEFT JOIN approved_count  ap  ON ap.rid  = r.id
  LEFT JOIN interview_count iv  ON iv.rid  = r.id
  LEFT JOIN offer_count     ofc ON ofc.rid = r.id
  LEFT JOIN onboard_count   ob  ON ob.rid  = r.id
  ORDER BY COALESCE(cdd.cnt, 0) DESC, r.full_name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_researcher_ranking(timestamptz, timestamptz) TO authenticated;


-- ============================================================
-- 2. get_research_job_breakdown(date_from, date_to)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_research_job_breakdown();
DROP FUNCTION IF EXISTS public.get_research_job_breakdown(timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_research_job_breakdown(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to   timestamptz DEFAULT NULL
)
RETURNS TABLE (
  job_id           uuid,
  job_code         text,
  position_title   text,
  client_id        uuid,
  client_name      text,
  researcher_id    uuid,
  researcher_name  text,
  owner_id         uuid,
  owner_name       text,
  cv_count         bigint,
  approved_count   bigint,
  interview_count  bigint,
  offer_count      bigint,
  onboard_count    bigint,
  last_activity    timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH research_processes AS (
    SELECT
      p.id, p.job_id, p.created_by_id, p.owner_id,
      p.process_status, p.created_at, p.updated_at
    FROM public.processes p
    JOIN public.users creator ON creator.id = p.created_by_id
    WHERE creator.role = 'Researcher'
      -- cv_count tính theo p.created_at trong khoảng
      AND (p_date_from IS NULL OR p.created_at >= p_date_from)
      AND (p_date_to   IS NULL OR p.created_at <= p_date_to)
  ),
  process_status_events AS (
    SELECT rp.id AS process_id, rp.process_status::text AS status, rp.created_at AS event_at
    FROM research_processes rp
    UNION
    SELECT ph.process_id, ph.status::text, COALESCE(ph.created_at, rp.created_at)
    FROM public.process_history ph
    JOIN research_processes rp ON rp.id = ph.process_id
    WHERE ph.status IS NOT NULL
  ),
  first_reached AS (
    SELECT process_id, status, MIN(event_at) AS first_at
    FROM process_status_events
    GROUP BY process_id, status
  ),
  filtered_events AS (
    SELECT process_id, status
    FROM first_reached
    WHERE (p_date_from IS NULL OR first_at >= p_date_from)
      AND (p_date_to   IS NULL OR first_at <= p_date_to)
  ),
  approved_proc AS (
    SELECT DISTINCT process_id FROM filtered_events
    WHERE status IN (
      'CV_SUBMITTED_TO_CLIENT',
      'INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST',
      'INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND',
      'INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL',
      'OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE',
      'ONBOARDING','PLACED','PLACEMENT_CONFIRMED','GUARANTEE_PERIOD','PAYMENT_RECEIVED'
    )
  ),
  interview_proc AS (
    SELECT DISTINCT process_id FROM filtered_events
    WHERE status IN (
      'INTERVIEW_SCHEDULED_1ST','INTERVIEW_COMPLETED_1ST',
      'INTERVIEW_SCHEDULED_2ND','INTERVIEW_COMPLETED_2ND',
      'INTERVIEW_SCHEDULED_FINAL','INTERVIEW_COMPLETED_FINAL'
    )
  ),
  offer_proc AS (
    SELECT DISTINCT process_id FROM filtered_events
    WHERE status IN ('OFFER_EXTENDED','OFFER_ACCEPTED_BY_CANDIDATE')
  ),
  onboard_proc AS (
    SELECT DISTINCT process_id FROM filtered_events
    WHERE status IN ('ONBOARDING','PLACED','PLACEMENT_CONFIRMED','GUARANTEE_PERIOD','PAYMENT_RECEIVED')
  )
  SELECT
    j.id,
    COALESCE(j.job_code, j.job_id, '')::text,
    COALESCE(j.position_title, '')::text,
    j.client_id,
    COALESCE(cl.client_name, '')::text,
    rp.created_by_id,
    COALESCE(ru.full_name, '')::text,
    rp.owner_id,
    COALESCE(hh.full_name, '')::text,
    COUNT(rp.id)::bigint AS cv_count,
    COUNT(rp.id) FILTER (WHERE rp.id IN (SELECT process_id FROM approved_proc))::bigint  AS approved_count,
    COUNT(rp.id) FILTER (WHERE rp.id IN (SELECT process_id FROM interview_proc))::bigint AS interview_count,
    COUNT(rp.id) FILTER (WHERE rp.id IN (SELECT process_id FROM offer_proc))::bigint     AS offer_count,
    COUNT(rp.id) FILTER (WHERE rp.id IN (SELECT process_id FROM onboard_proc))::bigint   AS onboard_count,
    MAX(rp.updated_at)
  FROM research_processes rp
  JOIN public.jobs    j  ON j.id  = rp.job_id
  LEFT JOIN public.clients cl ON cl.id = j.client_id
  LEFT JOIN public.users   ru ON ru.id = rp.created_by_id
  LEFT JOIN public.users   hh ON hh.id = rp.owner_id
  GROUP BY
    j.id, j.job_code, j.job_id, j.position_title, j.client_id, cl.client_name,
    rp.created_by_id, ru.full_name,
    rp.owner_id, hh.full_name
  ORDER BY MAX(rp.updated_at) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_research_job_breakdown(timestamptz, timestamptz) TO authenticated;


-- ============================================================
-- VERIFY
-- SELECT * FROM get_researcher_ranking();
-- SELECT * FROM get_researcher_ranking(now() - interval '7 days', now());
-- SELECT * FROM get_research_job_breakdown(now() - interval '30 days', now()) LIMIT 20;
-- ============================================================
