-- ==============================================================================
-- 1. Tạo bảng bd_schedules để lưu lịch nhắc nhở tùy chỉnh (Custom Reminders)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.bd_schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    process_id uuid NOT NULL REFERENCES public.bd_processes(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    scheduled_date timestamptz NOT NULL,
    reminder_type text DEFAULT 'Follow up', -- Custom: Calling, Emailing, Meeting, Follow up, Next Step
    status text DEFAULT 'Pending',         -- Pending, Completed, Cancelled
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Thêm index để tối ưu trụy vấn theo ngày và owner
CREATE INDEX IF NOT EXISTS idx_bd_schedules_date ON public.bd_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bd_schedules_owner ON public.bd_schedules(owner_id);
CREATE INDEX IF NOT EXISTS idx_bd_schedules_process ON public.bd_schedules(process_id);

-- ==============================================================================
-- 1b. Xóa các phiên bản cũ với signature khác (tránh lỗi overloading PGRST203)
-- ==============================================================================

-- Xóa phiên bản cũ có p_reminder_filter kiểu INTEGER
DROP FUNCTION IF EXISTS public.get_bd_schedules(
    uuid, text, int, int, text, integer, date, date
);

DROP FUNCTION IF EXISTS public.get_bd_schedule_stats(
    uuid, text, integer, date, date
);

-- ==============================================================================
-- 2. Cập nhật RPC lấy danh sách lịch (Gộp Rolling + Custom)
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_bd_schedules(
    p_owner_id UUID DEFAULT NULL,
    p_search TEXT DEFAULT '',
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 20,
    p_status_filter TEXT DEFAULT 'all',    -- 'all', 'overdue', 'today', 'upcoming'
    p_reminder_filter TEXT DEFAULT 'all',  -- 'all', '7-day', '15-day', '30-day' HOẶC các type custom: 'Calling', 'Meeting'...
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    process_id UUID,
    client_id UUID,
    client_name TEXT,
    owner_name TEXT,
    bd_process_status TEXT,
    last_contact_date TIMESTAMPTZ,
    reminder_type TEXT, -- Đổi từ INT sang TEXT để chứa cả custom types
    due_date DATE,
    overdue_days INT,
    priority TEXT,
    source TEXT,
    client_industry TEXT,
    total_count BIGINT
) LANGUAGE plpgsql AS $$
DECLARE
    v_offset INT;
BEGIN
    v_offset := (p_page - 1) * p_page_size;

    RETURN QUERY
    WITH automatic_reminders AS (
        -- Lấy Rolling Reminders cho TẤT CẢ các stage cần chăm sóc
        SELECT 
            bp.id as p_id,
            bp.client_id as c_id,
            c.client_name as c_name,
            u.full_name as o_name,
            bp.status::TEXT as p_status,
            bp.last_contact_date as l_date,
            bp.priority as p_priority,
            bp.source as p_source,
            c.client_industry as c_industry,
            COALESCE(bp.last_contact_date, bp.created_at) as anchor_date
        FROM bd_processes bp
        JOIN clients c ON bp.client_id = c.id
        LEFT JOIN users u ON bp.owner_id = u.id
        WHERE bp.status IN ('Research', 'Addfriend/Connect', 'Approach')
        AND (p_owner_id IS NULL OR bp.owner_id = p_owner_id)
        AND (p_search = '' OR c.client_name ILIKE '%' || p_search || '%')
    ),
    calculated_automatic AS (
        SELECT 
            p_id::UUID,
            c_id::UUID,
            c_name::TEXT,
            o_name::TEXT,
            p_status::TEXT,
            l_date::TIMESTAMPTZ,
            p_priority::TEXT,
            p_source::TEXT,
            c_industry::TEXT,
            anchor_date::TIMESTAMPTZ,
            CASE 
                WHEN (CURRENT_DATE - anchor_date::DATE) <= 7 THEN 7
                WHEN (CURRENT_DATE - anchor_date::DATE) <= 15 THEN 15
                ELSE 30
            END::TEXT as calc_reminder_type,
            (anchor_date::DATE + 
                CASE 
                    WHEN (CURRENT_DATE - anchor_date::DATE) <= 7 THEN 7
                    WHEN (CURRENT_DATE - anchor_date::DATE) <= 15 THEN 15
                    ELSE 30
                END
            )::DATE as calc_due_date
        FROM automatic_reminders
    ),
    custom_reminders AS (
        -- Lấy Custom Reminders từ bảng bd_schedules
        SELECT 
            bs.process_id::UUID               as p_id,
            bp.client_id::UUID                as c_id,
            c.client_name::TEXT               as c_name,
            u.full_name::TEXT                 as o_name,
            bp.status::TEXT                   as p_status,
            bp.last_contact_date::TIMESTAMPTZ as l_date,
            bp.priority::TEXT                 as p_priority,
            bp.source::TEXT                   as p_source,
            c.client_industry::TEXT           as c_industry,
            NULL::TIMESTAMPTZ                 as anchor_date,
            bs.reminder_type::TEXT            as calc_reminder_type,
            bs.scheduled_date::DATE           as calc_due_date
        FROM bd_schedules bs
        JOIN bd_processes bp ON bs.process_id = bp.id
        JOIN clients c ON bp.client_id = c.id
        LEFT JOIN users u ON bp.owner_id = u.id
        WHERE bs.status = 'Pending'
        AND bp.status NOT IN ('Take care', 'No current need') -- KHÔNG hiện lịch nếu đã Take care/No need
        AND (p_owner_id IS NULL OR bs.owner_id = p_owner_id)
        AND (p_search = '' OR c.client_name ILIKE '%' || p_search || '%')
    ),
    all_reminders AS (
        SELECT * FROM calculated_automatic
        UNION ALL
        SELECT * FROM custom_reminders
    ),
    final_calc AS (
        SELECT 
            *,
            GREATEST(0, CURRENT_DATE - calc_due_date) as calc_overdue_days
        FROM all_reminders
    ),
    filtered_output AS (
        SELECT *, count(*) OVER() as full_count 
        FROM final_calc
        WHERE 
            -- Filter theo Reminder Type (7/15/30 HOẶC custom types)
            (
                p_reminder_filter = 'all' 
                OR (p_reminder_filter = '7-day' AND calc_reminder_type = '7')
                OR (p_reminder_filter = '15-day' AND calc_reminder_type = '15')
                OR (p_reminder_filter = '30-day' AND calc_reminder_type = '30')
                OR (calc_reminder_type = p_reminder_filter)
            )
            AND
            -- Filter theo Status nhắc nhở (Overdue/Today/Upcoming)
            CASE 
                WHEN p_status_filter = 'overdue' THEN calc_overdue_days > 0
                WHEN p_status_filter = 'today' THEN calc_due_date = CURRENT_DATE
                WHEN p_status_filter = 'upcoming' THEN (calc_due_date > CURRENT_DATE AND calc_due_date <= (CURRENT_DATE + 3) AND calc_overdue_days = 0)
                ELSE TRUE 
            END
            AND
            -- Filter theo Date Range
            (p_date_from IS NULL OR calc_due_date >= p_date_from)
            AND
            (p_date_to IS NULL OR calc_due_date <= p_date_to)
    )
    SELECT 
        p_id, c_id, c_name, o_name, p_status, l_date,
        calc_reminder_type, calc_due_date, calc_overdue_days,
        p_priority, p_source, c_industry, full_count
    FROM filtered_output
    ORDER BY calc_overdue_days DESC, calc_due_date ASC
    LIMIT p_page_size OFFSET v_offset;
END;
$$;

-- ==============================================================================
-- 3. Cập nhật RPC lấy thống kê (Gộp Rolling + Custom)
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_bd_schedule_stats(
    p_owner_id UUID DEFAULT NULL,
    p_search TEXT DEFAULT '',
    p_reminder_filter TEXT DEFAULT 'all',
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    total_schedules BIGINT,
    overdue_count BIGINT,
    today_count BIGINT,
    upcoming_count BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH automatic_reminders AS (
        SELECT 
            bp.id as p_id,
            COALESCE(bp.last_contact_date, bp.created_at) as anchor_date,
            c.client_name
        FROM bd_processes bp
        JOIN clients c ON bp.client_id = c.id
        WHERE bp.status IN ('Research', 'Addfriend/Connect', 'Approach')
        AND (p_owner_id IS NULL OR bp.owner_id = p_owner_id)
        AND (p_search = '' OR c.client_name ILIKE '%' || p_search || '%')
    ),
    calculated_automatic AS (
        SELECT 
            p_id,
            FALSE as is_custom,  -- Đây là rolling, không đếm overdue
            CASE 
                WHEN (CURRENT_DATE - anchor_date::DATE) <= 7 THEN 7
                WHEN (CURRENT_DATE - anchor_date::DATE) <= 15 THEN 15
                ELSE 30
            END::TEXT as calc_reminder_type,
            (anchor_date::DATE + 
                CASE 
                    WHEN (CURRENT_DATE - anchor_date::DATE) <= 7 THEN 7
                    WHEN (CURRENT_DATE - anchor_date::DATE) <= 15 THEN 15
                    ELSE 30
                END
            )::DATE as calc_due_date
        FROM automatic_reminders
    ),
    custom_reminders AS (
        SELECT 
            bs.process_id as p_id,
            TRUE as is_custom,  -- Đây là custom, tính overdue
            bs.reminder_type as calc_reminder_type,
            bs.scheduled_date::DATE as calc_due_date
        FROM bd_schedules bs
        JOIN bd_processes bp ON bs.process_id = bp.id
        JOIN clients c ON bp.client_id = c.id
        WHERE bs.status = 'Pending'
        AND bp.status NOT IN ('Take care', 'No current need')
        AND (p_owner_id IS NULL OR bs.owner_id = p_owner_id)
        AND (p_search = '' OR c.client_name ILIKE '%' || p_search || '%')
    ),
    all_combined AS (
        SELECT * FROM calculated_automatic
        UNION ALL
        SELECT * FROM custom_reminders
    ),
    filtered AS (
        SELECT 
            *,
            (CURRENT_DATE - calc_due_date) as overdue_val
        FROM all_combined
        WHERE 
            (
                p_reminder_filter = 'all' 
                OR (p_reminder_filter = '7-day' AND calc_reminder_type = '7')
                OR (p_reminder_filter = '15-day' AND calc_reminder_type = '15')
                OR (p_reminder_filter = '30-day' AND calc_reminder_type = '30')
                OR (calc_reminder_type = p_reminder_filter)
            )
            AND
            (p_date_from IS NULL OR calc_due_date >= p_date_from)
            AND
            (p_date_to IS NULL OR calc_due_date <= p_date_to)
    )
    SELECT 
        COUNT(*)::BIGINT as total_schedules,
        -- overdue: CHỈ đếm custom reminders đã quá ngày hẹn
        COUNT(*) FILTER (WHERE is_custom = TRUE AND calc_due_date < CURRENT_DATE)::BIGINT as overdue_count,
        -- today: cả rolling + custom đến hạn hôm nay
        COUNT(*) FILTER (WHERE calc_due_date = CURRENT_DATE)::BIGINT as today_count,
        -- upcoming: đến hạn trong 3 ngày tới
        COUNT(*) FILTER (WHERE calc_due_date > CURRENT_DATE AND calc_due_date <= (CURRENT_DATE + 3))::BIGINT as upcoming_count
    FROM filtered;
END;
$$;

-- ==============================================================================
-- 4. Cập nhật Notification Generator
-- ==============================================================================

CREATE OR REPLACE FUNCTION generate_daily_bd_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    WITH rolling AS (
        SELECT 
            bp.id as process_id,
            c.client_name,
            bp.owner_id,
            (COALESCE(bp.last_contact_date, bp.created_at)::DATE + 
                CASE 
                    WHEN (CURRENT_DATE - COALESCE(bp.last_contact_date, bp.created_at)::DATE) <= 7 THEN 7
                    WHEN (CURRENT_DATE - COALESCE(bp.last_contact_date, bp.created_at)::DATE) <= 15 THEN 15
                    ELSE 30
                END
            )::DATE as due_date,
            'rolling' as r_source,
            'Reminder ' || CASE WHEN (CURRENT_DATE - COALESCE(bp.last_contact_date, bp.created_at)::DATE) <= 7 THEN 7 WHEN (CURRENT_DATE - COALESCE(bp.last_contact_date, bp.created_at)::DATE) <= 15 THEN 15 ELSE 30 END || ' ngày' as r_type
        FROM bd_processes bp
        JOIN clients c ON bp.client_id = c.id
        WHERE bp.status IN ('Research', 'Addfriend/Connect', 'Approach')
        AND bp.owner_id IS NOT NULL
    ),
    custom AS (
        SELECT 
            bs.process_id,
            c.client_name,
            bs.owner_id,
            bs.scheduled_date::DATE as due_date,
            'custom' as r_source,
            bs.reminder_type as r_type
        FROM bd_schedules bs
        JOIN bd_processes bp ON bs.process_id = bp.id
        JOIN clients c ON bp.client_id = c.id
        WHERE bs.status = 'Pending'
    ),
    combined AS (
        SELECT * FROM rolling UNION ALL SELECT * FROM custom
    ),
    targets AS (
        SELECT * FROM combined
        WHERE due_date <= CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.related_entity_id = combined.process_id 
            AND n.type = 'bd_reminder' 
            AND n.created_at::DATE >= combined.due_date
        )
    )
    INSERT INTO notifications (user_id_receiver, title, message, type, related_entity_type, related_entity_id, read)
    SELECT 
        owner_id, 
        '🔔 Nhắc nhở: ' || client_name,
        'Bạn có lịch nhắc nhở: ' || r_type || ' cho khách hàng ' || client_name || '.',
        'bd_reminder', 'bd_process', process_id, false
    FROM targets;
END;
$$;
