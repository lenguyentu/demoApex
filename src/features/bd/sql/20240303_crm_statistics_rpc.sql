-- RPC to get BD CRM statistics efficiently
-- Supports owner filtering and date range filtering
-- Returns a combined JSON object for all charts and reports

CREATE OR REPLACE FUNCTION get_bd_crm_statistics(
    p_owner_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH filtered_data AS (
        SELECT 
            p.id,
            p.status,
            p.source,
            p.updated_at,
            p.last_contact_date,
            c.id as client_id,
            c.client_name,
            c.client_industry
        FROM bd_processes p
        JOIN clients c ON p.client_id = c.id
        WHERE (p_owner_id IS NULL OR p.owner_id = p_owner_id)
          AND (p_start_date IS NULL OR p.updated_at >= p_start_date)
          AND (p_end_date IS NULL OR p.updated_at <= p_end_date)
    ),
    summary_counts AS (
        SELECT
            COUNT(*) FILTER (WHERE status = 'Research') as cold_lead_count,
            COALESCE(jsonb_agg(client_name) FILTER (WHERE status = 'Research'), '[]'::jsonb) as cold_lead_clients,
            
            COUNT(*) FILTER (WHERE 
                status IN ('Addfriend/Connect', 'Approach', 'Consulting', 'Follow up', 'Demo contract', 'Take care', 'Signing')
                AND last_contact_date IS NULL
            ) as new_client_approaches_count,
            COALESCE(jsonb_agg(client_name) FILTER (WHERE 
                status IN ('Addfriend/Connect', 'Approach', 'Consulting', 'Follow up', 'Demo contract', 'Take care', 'Signing')
                AND last_contact_date IS NULL
            ), '[]'::jsonb) as new_client_approaches_clients,
            
            COUNT(*) FILTER (WHERE 
                status IN ('Addfriend/Connect', 'Approach', 'Consulting', 'Follow up', 'Demo contract', 'Take care', 'Signing')
                AND last_contact_date IS NOT NULL
            ) as former_client_approaches_count,
            COALESCE(jsonb_agg(client_name) FILTER (WHERE 
                status IN ('Addfriend/Connect', 'Approach', 'Consulting', 'Follow up', 'Demo contract', 'Take care', 'Signing')
                AND last_contact_date IS NOT NULL
            ), '[]'::jsonb) as former_client_approaches_clients,
            
            COUNT(*) FILTER (WHERE status = 'Meeting Clear JD') as client_meeting_count,
            COALESCE(jsonb_agg(client_name) FILTER (WHERE status = 'Meeting Clear JD'), '[]'::jsonb) as client_meeting_clients,
            
            COUNT(*) FILTER (WHERE status = 'Signed') as new_contract_count,
            COALESCE(jsonb_agg(client_name) FILTER (WHERE status = 'Signed'), '[]'::jsonb) as new_contract_clients,
            
            COUNT(*) FILTER (WHERE status = 'Hunting') as new_jd_count,
            COALESCE(jsonb_agg(client_name) FILTER (WHERE status = 'Hunting'), '[]'::jsonb) as new_jd_clients
        FROM filtered_data
    ),
    status_dist AS (
        SELECT 
            status, 
            COUNT(*) as count
        FROM filtered_data
        GROUP BY status
    ),
    source_dist AS (
        SELECT 
            CASE 
                WHEN source IS NULL OR source = '' THEN 'Chưa xác định'
                ELSE source 
            END as name, 
            COUNT(*) as value
        FROM filtered_data
        GROUP BY name
        ORDER BY value DESC
    ),
    industry_stats AS (
        SELECT 
            COALESCE(client_industry, 'Other') as name,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'Signed') as signed
        FROM filtered_data
        GROUP BY client_industry
    ),
    top_signed_clients AS (
        SELECT 
            client_id as id,
            client_name as name,
            COALESCE(client_industry, 'Other') as sector,
            COUNT(*) as wins,
            'BD Process' as contact -- Placeholder matching frontend expectation
        FROM filtered_data
        WHERE status = 'Signed'
        GROUP BY client_id, client_name, client_industry
        ORDER BY wins DESC
        LIMIT 5
    ),
    phone_number_count AS (
        -- Count unique clients in filtered_data that have at least one HR contact
        SELECT COUNT(DISTINCT fd.client_id) as count
        FROM filtered_data fd
        JOIN hr_contacts hrc ON fd.client_id = hrc.client_id
    ),
    sales_cycle_calc AS (
        SELECT 
            ROUND(AVG(EXTRACT(DAY FROM (p.updated_at - COALESCE(p.first_contact_date::timestamp with time zone, p.created_at))))) as avg_days
        FROM bd_processes p
        WHERE p.status = 'Signed'
          AND (p_owner_id IS NULL OR p.owner_id = p_owner_id)
          AND (p_start_date IS NULL OR p.updated_at >= p_start_date)
          AND (p_end_date IS NULL OR p.updated_at <= p_end_date)
    )
    SELECT jsonb_build_object(
        'report', (SELECT jsonb_build_object(
            'coldLead', jsonb_build_object('count', cold_lead_count, 'clients', cold_lead_clients),
            'newClientApproaches', jsonb_build_object('count', new_client_approaches_count, 'clients', new_client_approaches_clients),
            'formerClientApproaches', jsonb_build_object('count', former_client_approaches_count, 'clients', former_client_approaches_clients),
            'clientMeeting', jsonb_build_object('count', client_meeting_count, 'clients', client_meeting_clients),
            'newContract', jsonb_build_object('count', new_contract_count, 'clients', new_contract_clients),
            'newJD', jsonb_build_object('count', new_jd_count, 'clients', new_jd_clients)
        ) FROM summary_counts),
        'statusCounts', (
            SELECT jsonb_object_agg(status, count) || jsonb_build_object('Phone Number', (SELECT count FROM phone_number_count))
            FROM status_dist
        ),
        'sourceCounts', (SELECT jsonb_agg(row_to_json(source_dist)) FROM source_dist),
        'dealDomainData', (SELECT jsonb_agg(row_to_json(industry_stats)) FROM industry_stats),
        'loyalCustomers', (SELECT jsonb_agg(row_to_json(top_signed_clients)) FROM top_signed_clients),
        'avgSalesCycle', COALESCE((SELECT avg_days FROM sales_cycle_calc), 0),
        'totalProcesses', (SELECT COUNT(*) FROM filtered_data)
    ) INTO v_result;

    -- Handle case where status_dist is empty
    IF v_result->'statusCounts' IS NULL THEN
         v_result = jsonb_set(v_result, '{statusCounts}', jsonb_build_object('Phone Number', (SELECT count FROM phone_number_count)));
    END IF;

    RETURN v_result;
END;
$$;
