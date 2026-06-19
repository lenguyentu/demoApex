DECLARE
    -- Khai báo các biến để làm giàu dữ liệu
    v_client_name TEXT;
    v_updater_name TEXT;
    
    -- Biến để lặp qua danh sách tất cả user
    all_user RECORD;
    
    -- Biến để đếm số thông báo đã gửi
    notification_count INTEGER := 0;
    
BEGIN
    -- 1. KIỂM TRA ĐIỀU KIỆN (Check conditions)
    -- Chỉ thực hiện nếu phase thay đổi sang 'Cancelled'
    IF OLD.phase = NEW.phase THEN
        RETURN NEW; -- Không có thay đổi phase
    END IF;
    
    -- Kiểm tra xem phase mới có phải là 'Cancelled' không
    IF NEW.phase != 'Cancelled' THEN
        RETURN NEW; -- Không phải chuyển sang Cancelled
    END IF;

    -- 2. LÀM GIÀU DỮ LIỆU (Enrich data)
    -- Lấy thông tin client
    SELECT client_name INTO v_client_name FROM public.clients WHERE id = NEW.client_id;
    
    -- Lấy thông tin người cập nhật
    SELECT full_name INTO v_updater_name FROM public.users WHERE id = auth.uid();
    
    IF v_updater_name IS NULL THEN
        SELECT email INTO v_updater_name FROM auth.users WHERE id = auth.uid();
    END IF;

    ------------------------------------------------------------------------------------
    -- 3. TẠO THÔNG BÁO CHO TẤT CẢ USER (TRỪ CLIENT) (Create Notifications for All Users except Client)
    ------------------------------------------------------------------------------------

    -- Gửi thông báo đến TẤT CẢ người dùng trong hệ thống (trừ role Client)
    BEGIN
        -- Lặp qua từng user trong hệ thống (loại trừ role Client)
        FOR all_user IN 
            SELECT id, full_name, email FROM public.users
            WHERE role != 'Client'::public.user_role_enum
        LOOP
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
                    all_user.id, -- ID của user đang được lặp
                    format('Job đã đóng: %s', NEW.position_title),
                    format(
                        'Job "%s" tại %s đã được đóng.',
                        NEW.position_title,
                        COALESCE(v_client_name, 'Unknown Client')
                    ),
                    'job_phase_cancelled', -- Type riêng khi job phase chuyển sang Cancelled
                    'job',
                    NEW.id,
                    auth.uid()
                );
                
                notification_count := notification_count + 1;
                
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to create notification for job phase cancelled for user %s. Error: %', all_user.id, SQLERRM;
            END;
        END LOOP;
        
        -- Log số lượng thông báo đã gửi
        RAISE NOTICE 'Sent % notifications to all users for job phase cancelled', notification_count;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to send notifications to users for job phase cancelled. Error: %', SQLERRM;
    END;

    -- Luôn trả về NEW để trigger hoàn thành hợp lệ
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log lỗi tổng quát nhưng không làm fail transaction
        RAISE NOTICE 'General error in notify_job_phase_cancelled function: %', SQLERRM;
        RETURN NEW;
END;