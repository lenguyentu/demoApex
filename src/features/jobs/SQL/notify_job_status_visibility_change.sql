CREATE OR REPLACE FUNCTION public.notify_job_status_visibility_change()
RETURNS trigger AS $$
DECLARE
    -- Khai báo các biến để làm giàu dữ liệu
    v_client_name TEXT;
    v_updater_name TEXT;
    
    -- Biến để lặp qua danh sách tất cả user
    all_user RECORD;
    
    -- Biến để đếm số thông báo đã gửi
    notification_count INTEGER := 0;
    
    -- Biến cờ xác định trạng thái
    is_job_closed BOOLEAN := FALSE;
    is_job_opened BOOLEAN := FALSE;
    
    -- Dữ liệu thông báo
    notify_type TEXT;
    notify_title TEXT;
    notify_message TEXT;
    
BEGIN
    -- 1. KIỂM TRA ĐIỀU KIỆN (Check conditions)
    -- Nếu không có sự thay đổi nào về phase hoặc assignment_type thì bỏ qua luôn
    IF OLD.phase = NEW.phase AND OLD.assignment_type = NEW.assignment_type THEN
        RETURN NEW; 
    END IF;

    -- XÁC ĐỊNH TRẠNG THÁI "ĐÓNG"
    -- 1.1 Đóng do đổi Phase (từ Open sang bất kỳ cái nào khác: Closed, Cancelled, Filled...)
    IF OLD.phase = 'Open' AND NEW.phase != 'Open' THEN
        is_job_closed := TRUE;
    -- 1.2 Đóng do thu hẹp phạm vi (Phase vẫn Open nhưng đổi Assignment từ Freelancer sang Headhunt/CTV)
    ELSIF OLD.phase = 'Open' AND NEW.phase = 'Open' AND OLD.assignment_type = 'Freelancer' AND NEW.assignment_type != 'Freelancer' THEN
        is_job_closed := TRUE;
    END IF;

    -- XÁC ĐỊNH TRẠNG THÁI "MỞ"
    -- 2.1 Mở do đổi Phase (từ trạng thái khác sang Open)
    IF OLD.phase != 'Open' AND NEW.phase = 'Open' THEN
        is_job_opened := TRUE;
    -- 2.2 Mở do mở rộng phạm vi (Phase vẫn Open nhưng đổi Assignment từ nội bộ sang Freelancer)
    ELSIF OLD.phase = 'Open' AND NEW.phase = 'Open' AND OLD.assignment_type != 'Freelancer' AND NEW.assignment_type = 'Freelancer' THEN
        is_job_opened := TRUE;
    END IF;

    -- Nếu không rơi vào 2 trường hợp Đóng/Mở thì kết thúc trigger
    IF NOT is_job_closed AND NOT is_job_opened THEN
        RETURN NEW;
    END IF;

    -- 2. LÀM GIÀU DỮ LIỆU (Enrich data)
    -- Lấy thông tin client
    SELECT client_name INTO v_client_name FROM public.clients WHERE id = NEW.client_id;
    
    -- Lấy thông tin người cập nhật
    SELECT full_name INTO v_updater_name FROM public.users WHERE id = auth.uid();
    IF v_updater_name IS NULL THEN
        SELECT email INTO v_updater_name FROM auth.users WHERE id = auth.uid();
    END IF;

    -- 3. SET MESSAGE THEO TRẠNG THÁI
    IF is_job_closed THEN
        notify_type := 'job_phase_closed';
        notify_title := format('Job đã đóng: %s', NEW.position_title);
        notify_message := format(
            'Job "%s" tại %s đã được đóng.',
            NEW.position_title,
            COALESCE(v_client_name, 'Unknown Client')
        );
    ELSE
        notify_type := 'job_phase_opened';
        notify_title := format('Job mới/mở lại: %s', NEW.position_title);
        notify_message := format(
            'Job "%s" tại %s hiện đang mở.',
            NEW.position_title,
            COALESCE(v_client_name, 'Unknown Client')
        );
    END IF;

    ------------------------------------------------------------------------------------
    -- 4. TẠO THÔNG BÁO CHO TẤT CẢ USER (TRỪ CLIENT)
    ------------------------------------------------------------------------------------
    BEGIN
        -- Lặp qua từng user trong hệ thống (loại trừ role Client)
        FOR all_user IN 
            SELECT id, full_name, email, role FROM public.users
            WHERE role != 'Client'::public.user_role_enum
        LOOP
            -- Bỏ qua Freelancer nếu job không dành cho họ
            IF all_user.role::text = 'Freelancer' THEN
                -- Job mở nhưng không phải loại Freelancer
                IF is_job_opened AND NEW.assignment_type != 'Freelancer' THEN
                    CONTINUE;
                END IF;
                -- Job đóng nhưng trước đó không phải loại Freelancer
                IF is_job_closed AND OLD.assignment_type != 'Freelancer' THEN
                    CONTINUE;
                END IF;
            END IF;

            BEGIN
                INSERT INTO public.notifications (
                    user_id_receiver,
                    title,
                    message,
                    type,
                    related_entity_type,
                    related_entity_id,
                    created_by_id
                )
                VALUES (
                    all_user.id, 
                    notify_title,
                    notify_message,
                    notify_type,
                    'job',
                    NEW.id,
                    auth.uid()
                );
                
                notification_count := notification_count + 1;
                
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to create notification for job status change for user %s. Error: %', all_user.id, SQLERRM;
            END;
        END LOOP;
        
        -- Log số lượng thông báo đã gửi
        RAISE NOTICE 'Sent % notifications to all users for job status change', notification_count;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to send notifications to users for job status change. Error: %', SQLERRM;
    END;

    -- Luôn trả về NEW để trigger hoàn thành hợp lệ
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log lỗi tổng quát nhưng không làm fail transaction
        RAISE NOTICE 'General error in notify_job_status_visibility_change function: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đảm bảo xóa trigger cũ nếu tồn tại (tùy chọn)
DROP TRIGGER IF EXISTS trigger_notify_job_status_visibility_change ON public.jobs;

-- Tạo trigger để lắng nghe các thay đổi trên bảng jobs
CREATE TRIGGER trigger_notify_job_status_visibility_change
AFTER UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.notify_job_status_visibility_change();
