-- RPC function để count jobs với filter (bao gồm nested filter clients.owner_id)
-- Tạo: 2026-05-04

CREATE OR REPLACE FUNCTION count_jobs_by_filters(
  p_mode TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_assignment_type TEXT DEFAULT NULL,
  p_phase TEXT DEFAULT NULL,
  p_job_rank TEXT DEFAULT NULL,
  p_job_level TEXT DEFAULT NULL,
  p_td_job_category TEXT DEFAULT NULL,
  p_client_owner_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT j.id)
  INTO v_count
  FROM jobs j
  INNER JOIN clients c ON j.client_id = c.id
  WHERE 1=1
    -- Mode filter
    AND (p_mode IS NULL OR (
      CASE 
        WHEN p_mode = 'open' THEN j.phase::TEXT = 'Open'
        ELSE TRUE
      END
    ))
    -- Client filter
    AND (p_client_id IS NULL OR j.client_id = p_client_id)
    -- Assignment type filter (cast enum to text)
    AND (p_assignment_type IS NULL OR j.assignment_type::TEXT = p_assignment_type)
    -- Phase filter (cast enum to text)
    AND (p_phase IS NULL OR j.phase::TEXT = p_phase)
    -- Job rank filter (cast enum to text)
    AND (p_job_rank IS NULL OR j.job_rank::TEXT = p_job_rank)
    -- Job level filter (cast enum to text)
    AND (p_job_level IS NULL OR j.job_level::TEXT = p_job_level)
    -- TD job category filter
    AND (p_td_job_category IS NULL OR j.td_job_category = p_td_job_category)
    -- Client owner (BD) filter
    AND (p_client_owner_id IS NULL OR c.owner_id = p_client_owner_id)
    -- Search filter
    AND (p_search IS NULL OR (
      j.position_title ILIKE '%' || p_search || '%' OR
      j.job_code ILIKE '%' || p_search || '%' OR
      j.job_id ILIKE '%' || p_search || '%'
    ));
  
  RETURN v_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION count_jobs_by_filters TO authenticated;

COMMENT ON FUNCTION count_jobs_by_filters IS 'Count jobs với tất cả filters bao gồm nested client owner filter';
