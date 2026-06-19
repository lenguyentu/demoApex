-- Function: count_processes
-- Count total processes with the same filters as search_processes
-- UPDATED: Added is_research_view and synced logic with search_processes

DROP FUNCTION IF EXISTS public.count_processes;

CREATE OR REPLACE FUNCTION public.count_processes(
  search_term TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  client_filter UUID DEFAULT NULL,
  job_id_filter UUID DEFAULT NULL,
  owner_id_filter UUID DEFAULT NULL,
  owner_role_filter TEXT DEFAULT NULL,
  my_team_hr_id UUID DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  is_research_view BOOLEAN DEFAULT FALSE
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_role TEXT;
  v_count BIGINT;
BEGIN
  -- Lấy role của user hiện tại và ép kiểu TEXT để tránh lỗi Enum
  SELECT role::TEXT INTO v_current_user_role FROM public.users usr WHERE usr.id = auth.uid();

  SELECT COUNT(*) INTO v_count
  FROM public.processes p
  LEFT JOIN public.candidates c ON c.id = p.candidate_id
  LEFT JOIN public.jobs j ON j.id = p.job_id
  LEFT JOIN public.users u ON u.id = p.owner_id
  LEFT JOIN public.users creator ON creator.id = p.created_by_id
  WHERE 
    (search_term IS NULL OR search_term = '' OR 
      c.name ILIKE '%' || search_term || '%' OR 
      c.email ILIKE '%' || search_term || '%' OR
      u.full_name ILIKE '%' || search_term || '%')
    -- LOGIC ĐỒNG BỘ VỚI SEARCH_PROCESSES:
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
    AND (
      v_current_user_role IN ('Admin', 'BD', 'Community Manager')
      OR p.owner_id = auth.uid()
      OR u.assigned_hr_id = auth.uid()
      OR p.created_by_id = auth.uid()
    );

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_processes TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_processes TO anon;
