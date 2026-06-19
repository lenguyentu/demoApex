-- ============================================================
-- Đồng bộ assign_next_headhunter() với get_next_headhunter()
--
-- Bối cảnh: đã deploy get_next có excluded + Admin (o.user_id),
-- nhưng assign vẫn bản 20260508 → preview đúng, gán CV vẫn vào HH bị exclude.
--
-- Giữ RETURNS có assigned_to_discord_id (join profiles) như production hiện tại.
--
-- Xóa mọi bản cũ cùng signature (CREATE OR REPLACE không gỡ overload khác kiểu).
-- ============================================================

DROP FUNCTION IF EXISTS public.assign_next_headhunter(uuid, uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.assign_next_headhunter(
  p_candidate_id       uuid,
  p_job_id             uuid,
  p_application_reason text,
  p_created_by_id      uuid
)
RETURNS TABLE (
  process_id             uuid,
  assigned_to_user_id    uuid,
  assigned_to_name       text,
  assigned_to_discord_id text,
  effective_score        bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hh_id          uuid;
  v_hh_name        text;
  v_hh_discord_id  text;
  v_hh_score       bigint;
  v_new_process_id uuid;
  v_client_id      uuid;
BEGIN
  WITH cumulative AS (
    SELECT p.owner_id, COUNT(*) AS cnt
    FROM public.processes p
    JOIN public.users creator ON creator.id = p.created_by_id
    WHERE creator.role = 'Researcher'
    GROUP BY p.owner_id
  )
  SELECT u.id, u.full_name, p.discord_id,
    COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0)
  INTO v_hh_id, v_hh_name, v_hh_discord_id, v_hh_score
  FROM public.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN cumulative c ON c.owner_id = u.id
  LEFT JOIN public.hh_assignment_offset o ON o.user_id = u.id
  WHERE (u.role IN ('Headhunter', 'HH Lead') OR (u.role = 'Admin' AND o.user_id IS NOT NULL))
    AND u.is_active = true
    AND NOT COALESCE(o.excluded, false)
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

  IF v_hh_id IS NULL THEN
    RAISE EXCEPTION 'NO_HEADHUNTER_AVAILABLE'
      USING HINT = 'Không tìm thấy Headhunter đang active.';
  END IF;

  SELECT client_id INTO v_client_id FROM public.jobs WHERE id = p_job_id;

  INSERT INTO public.processes (
    candidate_id, job_id, client_id,
    process_status, application_reason,
    owner_id, created_by_id
  )
  VALUES (
    p_candidate_id, p_job_id, v_client_id,
    'APPLIED', p_application_reason,
    v_hh_id, p_created_by_id
  )
  RETURNING id INTO v_new_process_id;

  INSERT INTO public.research_assignment_history (
    process_id, assigned_to_user_id, assigned_by_user_id,
    week_start_date, effective_score_at_assignment
  )
  VALUES (
    v_new_process_id, v_hh_id, p_created_by_id,
    date_trunc('week', CURRENT_DATE)::date, v_hh_score
  );

  UPDATE public.hh_assignment_offset o
  SET join_offset = join_offset + 1
  FROM public.users u
  LEFT JOIN (
    SELECT p.owner_id, COUNT(*) AS cnt
    FROM public.processes p
    JOIN public.users creator ON creator.id = p.created_by_id
    WHERE creator.role = 'Researcher'
    GROUP BY p.owner_id
  ) c ON c.owner_id = u.id
  WHERE o.user_id = u.id
    AND (u.role IN ('Headhunter', 'HH Lead') OR (u.role = 'Admin' AND o.user_id IS NOT NULL))
    AND u.is_active = true
    AND NOT COALESCE(o.excluded, false)
    AND u.id != v_hh_id
    AND COALESCE(c.cnt, 0) + COALESCE(o.join_offset, 0) = v_hh_score
    AND EXISTS (
      SELECT 1 FROM public.hh_day_off d
      WHERE d.user_id = u.id AND d.day_off = CURRENT_DATE
        AND (
          d.half_day IS NULL
          OR (d.half_day = 'morning'   AND EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') < 12)
          OR (d.half_day = 'afternoon' AND EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') >= 12)
        )
    );

  RETURN QUERY SELECT v_new_process_id, v_hh_id, v_hh_name, v_hh_discord_id, v_hh_score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_next_headhunter(uuid, uuid, text, uuid) TO authenticated;
