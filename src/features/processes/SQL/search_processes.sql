-- Function: search_processes
-- Search processes by candidate name/email OR owner name, with filters including My Team
-- UPDATED: Sort by updated_at DESC instead of created_at
-- UPDATED: Added date_from and date_to for flexible date range filtering
-- UPDATED: Allow 'BD' role to view all processes (same as Admin)

DROP FUNCTION IF EXISTS public.search_processes;

CREATE OR REPLACE FUNCTION public.search_processes(
  search_term TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  client_filter UUID DEFAULT NULL,
  job_id_filter UUID DEFAULT NULL,
  owner_id_filter UUID DEFAULT NULL,
  owner_role_filter TEXT DEFAULT NULL,
  my_team_hr_id UUID DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  page_size INT DEFAULT 20,
  cursor_updated_at TIMESTAMPTZ DEFAULT NULL,
  is_research_view BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  candidate_id UUID,
  job_id UUID,
  client_id UUID,
  owner_id UUID,
  created_by_id UUID,
  process_status TEXT,
  application_reason TEXT,
  process_memo TEXT,
  process_note TEXT,
  chance_of_placement TEXT,
  process_end_reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  candidate_name TEXT,
  candidate_email TEXT,
  candidate_cv_link TEXT,
  candidate_phone TEXT,
  job_position_title TEXT,
  job_job_id TEXT,
  client_name TEXT,
  owner_full_name TEXT,
  owner_email TEXT,
  owner_role TEXT,
  client_portal_user_count INT,
  candidate_evaluation_file_path TEXT,
  unread_comment_count BIGINT,
  evaluation_brief TEXT,
  created_by_name TEXT,
  created_by_role TEXT,
  created_by_discord_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_role TEXT;
BEGIN
  SELECT role INTO v_current_user_role FROM public.users usr WHERE usr.id = auth.uid();

  RETURN QUERY
  SELECT 
    p.id,
    p.candidate_id,
    p.job_id,
    p.client_id,
    p.owner_id,
    p.created_by_id,
    p.process_status::TEXT,
    p.application_reason::TEXT,
    p.process_memo::TEXT,
    p.process_note::TEXT,
    p.chance_of_placement::TEXT,
    p.process_end_reason::TEXT,
    p.created_at,
    p.updated_at,
    c.name::TEXT AS candidate_name,
    c.email::TEXT AS candidate_email,
    c.cv_link::TEXT AS candidate_cv_link,
    c.phone::TEXT AS candidate_phone,
    j.position_title::TEXT AS job_position_title,
    j.job_id::TEXT AS job_job_id,
    cl.client_name::TEXT AS client_name,
    u.full_name::TEXT AS owner_full_name,
    u.email::TEXT AS owner_email,
    u.role::TEXT AS owner_role,
    (SELECT COUNT(*) FROM public.users u2 WHERE u2.client_id = p.client_id)::INT AS client_portal_user_count,
    c.evaluation_file_path::TEXT AS candidate_evaluation_file_path,
    (
      SELECT COUNT(*)
      FROM public.process_comments pc
      LEFT JOIN public.process_comment_reads pcr ON pcr.comment_id = pc.id AND pcr.user_id = auth.uid()
      WHERE pc.process_id = p.id 
        AND pc.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
        AND pcr.comment_id IS NULL
    )::BIGINT AS unread_comment_count,
    p.evaluation_brief::TEXT,
    creator.full_name::TEXT AS created_by_name,
    creator.role::TEXT AS created_by_role,
    cp.discord_id::TEXT AS created_by_discord_id
  FROM public.processes p
  LEFT JOIN public.candidates c ON c.id = p.candidate_id
  LEFT JOIN public.jobs j ON j.id = p.job_id
  LEFT JOIN public.clients cl ON cl.id = p.client_id
  LEFT JOIN public.users u ON u.id = p.owner_id
  LEFT JOIN public.users creator ON creator.id = p.created_by_id
  LEFT JOIN public.profiles cp ON cp.id = p.created_by_id
  WHERE 
    (search_term IS NULL OR search_term = '' OR 
      c.name ILIKE '%' || search_term || '%' OR 
      c.email ILIKE '%' || search_term || '%' OR
      u.full_name ILIKE '%' || search_term || '%')
    -- LOGIC CẬP NHẬT:
    AND (
      is_research_view = TRUE 
      OR (status_filter IS NOT NULL AND status_filter <> '' AND p.process_status::TEXT = status_filter)
      OR
      ((status_filter IS NULL OR status_filter = '') AND (
        v_current_user_role IN ('Admin', 'Researcher', 'BD', 'Community Manager') 
        OR p.created_by_id = auth.uid()
        OR (
          p.process_status::TEXT NOT IN ('APPLIED', 'REJECT_BY_ADMIN')
          OR COALESCE(creator.role::TEXT, '') <> 'Researcher'
        )
      ))
    )
    AND (client_filter IS NULL OR p.client_id = client_filter)
    AND (job_id_filter IS NULL OR p.job_id = job_id_filter)
    AND (owner_id_filter IS NULL OR p.owner_id = owner_id_filter)
    AND (owner_role_filter IS NULL OR owner_role_filter = '' OR u.role::TEXT = owner_role_filter)
    AND (my_team_hr_id IS NULL OR u.assigned_hr_id = my_team_hr_id)
    AND (date_from IS NULL OR p.created_at >= date_from)
    AND (date_to IS NULL OR p.created_at <= date_to)
    AND (cursor_updated_at IS NULL OR p.updated_at < cursor_updated_at)
    AND (
      v_current_user_role IN ('Admin', 'BD', 'Community Manager')
      OR p.owner_id = auth.uid()
      OR u.assigned_hr_id = auth.uid()
      OR p.created_by_id = auth.uid()
    )
  ORDER BY p.updated_at DESC
  LIMIT page_size;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_processes TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_processes TO anon;
