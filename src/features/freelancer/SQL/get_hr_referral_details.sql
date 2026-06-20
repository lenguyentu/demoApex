CREATE OR REPLACE FUNCTION get_hr_referral_details(
    p_hr_id uuid,
    p_start_date timestamp with time zone DEFAULT NULL,
    p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    email text,
    role text,
    status text,
    created_at timestamp with time zone
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.role::text,
        u.status::text,
        u.created_at
    FROM users u
    WHERE u.assigned_hr_id = p_hr_id
      AND (p_start_date IS NULL OR u.created_at >= p_start_date)
      AND (p_end_date IS NULL OR u.created_at <= p_end_date)
    ORDER BY u.created_at DESC;
END;
$$;
