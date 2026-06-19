-- 1. Enable pg_cron (Cần chạy bởi Superuser/Admin)
-- Lưu ý: Trên Supabase Dashboard, vào Database -> Extensions -> tìm pg_cron -> Enable
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Tạo Function sinh Notification tự động
CREATE OR REPLACE FUNCTION generate_daily_bd_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    WITH raw_data AS (
        SELECT 
            bp.id as process_id,
            bp.client_id,
            c.client_name,
            bp.owner_id,
            bp.last_contact_date,
            bp.created_at,
            COALESCE(bp.last_contact_date, bp.created_at) as anchor_date
        FROM bd_processes bp
        JOIN clients c ON bp.client_id = c.id
        WHERE bp.status IN ('Research', 'Addfriend/Connect', 'Approach', 'Follow up')
        AND bp.owner_id IS NOT NULL -- Chỉ nhắc nếu có Owner
    ),
    calculated_reminders AS (
        SELECT 
            *,
            (CURRENT_DATE - anchor_date::DATE) as diff_days,
            CASE 
                WHEN (CURRENT_DATE - anchor_date::DATE) <= 7 THEN 7
                WHEN (CURRENT_DATE - anchor_date::DATE) <= 15 THEN 15
                ELSE 30
            END as reminder_type
        FROM raw_data
    ),
    final_calc AS (
        SELECT 
            *,
            (anchor_date::DATE + reminder_type) as due_date
        FROM calculated_reminders
    ),
    targets_to_notify AS (
        SELECT *
        FROM final_calc
        WHERE 
            due_date <= CURRENT_DATE -- Lấy tất cả cái đã đến hạn hoặc quá hạn
            AND
            -- Logic chống Spam: Chỉ gửi notification nếu CHƯA gửi lần nào cho mốc Due Date này
            -- Kiểm tra trong bảng notifications xem đã có noti loại 'bd_reminder' cho process này
            -- được tạo SAU anchor_date hay chưa.
            NOT EXISTS (
                SELECT 1 
                FROM notifications n 
                WHERE n.related_entity_id = final_calc.process_id 
                AND n.type = 'bd_reminder' 
                AND n.created_at::DATE >= final_calc.due_date -- Đã nhắc cho kỳ này rồi thì thôi
            )
    )
    -- Insert vào bảng Notifications
    INSERT INTO notifications (
        id,
        user_id_receiver,
        title,
        message,
        type,
        related_entity_type, 
        related_entity_id,
        read,
        created_at
    )
    SELECT
        gen_random_uuid(),
        owner_id,
        'Lịch chăm sóc khách hàng: ' || client_name,
        'Khách hàng ' || client_name || ' đã đến hạn chăm sóc (Chu kỳ ' || reminder_type || ' ngày). Hãy kiểm tra ngay!',
        'bd_reminder',
        'bd_process',
        process_id,
        false,
        NOW()
    FROM targets_to_notify;

END;
$$;

-- 3. Xóa lịch cũ (Clean up existing jobs with the same name)
-- Thay vì gọi cron.unschedule theo tên (có thể lỗi nếu ko tồn tại), ta query ID và xóa
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'bd_daily_reminders_job';

-- 4. Lên lịch chạy vào 08:00 AM giờ Việt Nam hàng ngày
-- Lưu ý: Server thường chạy giờ UTC. 
-- 08:00 AM VN = 01:00 AM UTC
SELECT cron.schedule(
    'bd_daily_reminders_job', -- Tên job
    '0 1 * * *',              -- Cron expression: Phút 0, Giờ 1 (UTC) mỗi ngày
    $$SELECT generate_daily_bd_reminders()$$
);

-- DEBUG: Comment câu này lại khi chạy thật.
-- Chạy thử ngay lập tức để test:
-- SELECT generate_daily_bd_reminders();
