CREATE OR REPLACE FUNCTION get_hr_rank_by_ref_count(
    p_start_date timestamp with time zone DEFAULT NULL,
    p_end_date timestamp with time zone DEFAULT NULL,
    p_limit int DEFAULT 5
)
RETURNS TABLE (
    hr_id uuid,
    hr_name text,
    hr_email text,
    ref_count bigint
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hr.id as hr_id,
        hr.full_name as hr_name,
        hr.email as hr_email,
        count(u.id) as ref_count
    FROM users hr
    JOIN users u ON hr.id = u.assigned_hr_id
    WHERE (p_start_date IS NULL OR u.created_at >= p_start_date)
      AND (p_end_date IS NULL OR u.created_at <= p_end_date)
    GROUP BY hr.id, hr.full_name
    ORDER BY ref_count DESC, hr_name ASC
    LIMIT p_limit;
END;
$$;
