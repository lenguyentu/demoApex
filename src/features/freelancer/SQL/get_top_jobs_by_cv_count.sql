CREATE OR REPLACE FUNCTION get_top_jobs_by_cv_count(
    p_start_date timestamp with time zone DEFAULT NULL,
    p_end_date timestamp with time zone DEFAULT NULL,
    p_limit int DEFAULT 5
)
RETURNS TABLE (
    job_id uuid,
    position_title text,
    client_name text,
    cv_count bigint
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id as job_id,
        j.position_title,
        c.client_name,
        count(p.id) as cv_count
    FROM jobs j
    JOIN clients c ON j.client_id = c.id
    JOIN processes p ON j.id = p.job_id
    WHERE (p_start_date IS NULL OR p.created_at >= p_start_date)
      AND (p_end_date IS NULL OR p.created_at <= p_end_date)
    GROUP BY j.id, j.position_title, c.client_name
    HAVING count(p.id) > 0
    ORDER BY cv_count DESC, j.position_title ASC
    LIMIT p_limit;
END;
$$;
