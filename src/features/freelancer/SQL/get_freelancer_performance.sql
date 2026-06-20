CREATE OR REPLACE FUNCTION get_freelancer_performance(
    p_start_date timestamp with time zone DEFAULT NULL,
    p_end_date timestamp with time zone DEFAULT NULL,
    p_search_term text DEFAULT '',
    p_limit int DEFAULT 15,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    phone text,
    status text,
    cv_to_tdc bigint,
    cv_to_client bigint,
    interviews bigint,
    offers bigint,
    onboarding bigint,
    rejected bigint,
    conversion_rate numeric,
    total_count bigint
) LANGUAGE plpgsql AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    WITH filtered_processes AS (
        -- Chỉ lấy các process trong khoảng thời gian yêu cầu để xử lý tiếp
        SELECT fp.id, fp.owner_id, fp.process_status::text as current_status
        FROM processes fp
        WHERE (p_start_date IS NULL OR fp.created_at >= p_start_date)
          AND (p_end_date IS NULL OR fp.created_at <= p_end_date)
    ),
    history_flags AS (
        -- GIN: Quét lịch sử 1 lần duy nhất để lấy tất cả các mốc mấu chốt
        SELECT 
            ph.process_id,
            bool_or(ph.status::text IN (
                'CV_SUBMITTED_TO_CLIENT', 'INTERVIEW_SCHEDULED_1ST', 'INTERVIEW_COMPLETED_1ST',
                'INTERVIEW_SCHEDULED_2ND', 'INTERVIEW_COMPLETED_2ND', 'INTERVIEW_SCHEDULED_FINAL', 
                'INTERVIEW_COMPLETED_FINAL', 'TEST_ASSIGNED', 'TEST_COMPLETED',
                'REFERENCE_CHECK_IN_PROGRESS', 'REFERENCE_CHECK_COMPLETED', 'OFFER_EXTENDED', 
                'OFFER_ACCEPTED_BY_CANDIDATE', 'OFFER_DECLINED_BY_CANDIDATE', 'PLACEMENT_CONFIRMED', 
                'ONBOARDING', 'GUARANTEE_PERIOD', 'PAYMENT_RECEIVED'
            )) as was_to_client,
            bool_or(ph.status::text IN (
                'INTERVIEW_SCHEDULED_1ST', 'INTERVIEW_COMPLETED_1ST', 'INTERVIEW_SCHEDULED_2ND', 
                'INTERVIEW_COMPLETED_2ND', 'INTERVIEW_SCHEDULED_FINAL', 'INTERVIEW_COMPLETED_FINAL',
                'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE', 'OFFER_DECLINED_BY_CANDIDATE',
                'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD', 'PAYMENT_RECEIVED'
            )) as was_interviewed,
            bool_or(ph.status::text IN (
                'OFFER_EXTENDED', 'OFFER_ACCEPTED_BY_CANDIDATE', 'OFFER_DECLINED_BY_CANDIDATE',
                'PLACEMENT_CONFIRMED', 'ONBOARDING', 'GUARANTEE_PERIOD', 'PAYMENT_RECEIVED'
            )) as was_offered,
            bool_or(ph.status::text IN (
                'ONBOARDING', 'PLACEMENT_CONFIRMED', 'GUARANTEE_PERIOD', 'PAYMENT_RECEIVED'
            )) as was_onboarded
        FROM process_history ph
        WHERE ph.process_id IN (SELECT id FROM filtered_processes)
        GROUP BY ph.process_id
    ),
    process_counts AS (
        -- Tổng hợp số lượng theo owner_id bằng cách JOIN với history_flags
        SELECT 
            fp.owner_id,
            count(*) as cv_to_tdc,
            count(*) FILTER (WHERE fp.current_status = 'REJECTED_BY_CLIENT' OR hf.was_to_client) as cv_to_client,
            count(*) FILTER (WHERE hf.was_interviewed) as interviews,
            count(*) FILTER (WHERE hf.was_offered) as offers,
            count(*) FILTER (WHERE hf.was_onboarded) as onboarding,
            count(*) FILTER (WHERE 
                fp.current_status ILIKE '%REJECT%' OR 
                fp.current_status ILIKE '%WITHDREW%' OR 
                fp.current_status ILIKE '%CANCELLED%'
            ) as rejected
        FROM filtered_processes fp
        LEFT JOIN history_flags hf ON fp.id = hf.process_id
        GROUP BY fp.owner_id
    ),
    results AS (
        -- Kết hợp thông tin User, Profile và Performance data
        SELECT 
            u.id,
            u.full_name as name,
            u.email,
            pr.phone,
            u.status::text as status,
            COALESCE(pc.cv_to_tdc, 0) as cv_to_tdc,
            COALESCE(pc.cv_to_client, 0) as cv_to_client,
            COALESCE(pc.interviews, 0) as interviews,
            COALESCE(pc.offers, 0) as offers,
            COALESCE(pc.onboarding, 0) as onboarding,
            COALESCE(pc.rejected, 0) as rejected,
            CASE 
                WHEN COALESCE(pc.cv_to_tdc, 0) > 0 
                THEN ROUND((COALESCE(pc.onboarding, 0)::numeric / pc.cv_to_tdc * 100), 1)
                ELSE 0 
            END as conversion_rate
        FROM users u
        LEFT JOIN profiles pr ON u.id = pr.id
        LEFT JOIN process_counts pc ON u.id = pc.owner_id
        WHERE u.role = 'Freelancer'
          AND (p_search_term = '' OR 
               u.full_name ILIKE '%' || p_search_term || '%' OR 
               u.email ILIKE '%' || p_search_term || '%' OR 
               pr.phone ILIKE '%' || p_search_term || '%')
    )
    -- Trả về dữ liệu kèm theo tổng số dòng để hỗ trợ phân trang
    SELECT *, count(*) OVER() as total_count
    FROM results
    ORDER BY cv_to_tdc DESC, name ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
