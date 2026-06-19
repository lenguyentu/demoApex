CREATE OR REPLACE FUNCTION public.notify_freelancer_job_assignment_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- Khai báo URL webhook
    webhook_url TEXT := 'https://n8n.tdconsulting.vn/webhook/d08d31b7-3f01-4227-a0d5-1e5a76ecfbde';
    payload JSONB;
    
    -- Khai báo các biến để làm giàu dữ liệu
    v_client_name TEXT;
    v_updater_name TEXT;
    v_updater_email TEXT;
    
    -- Biến để lặp qua danh sách Freelancer
    freelancer_user RECORD;
    
    -- Biến để lặp qua danh sách Admin
    admin_user RECORD;
    
    -- Biến để đếm số thông báo đã gửi
    notification_count INTEGER := 0;
    
BEGIN
    -- 1. KIỂM TRA ĐIỀU KIỆN (Check conditions)
    -- Chỉ thực hiện nếu assignment_type thay đổi sang 'Freelancer'
    IF OLD.assignment_type = NEW.assignment_type THEN
        RETURN NEW; -- Không có thay đổi assignment_type
    END IF;
    
    -- Kiểm tra xem assignment_type có thay đổi sang 'Freelancer' không
    IF NEW.assignment_type != 'Freelancer' THEN
        RETURN NEW; -- Không phải thay đổi sang Freelancer
    END IF;

    -- 2. LÀM GIÀU DỮ LIỆU (Enrich data)
    -- Lấy thông tin client
    SELECT client_name INTO v_client_name FROM public.clients WHERE id = NEW.client_id;
    
    -- Lấy thông tin người cập nhật
    SELECT full_name, email INTO v_updater_name, v_updater_email FROM public.users WHERE id = auth.uid();
    
    IF v_updater_name IS NULL THEN
        SELECT email INTO v_updater_name FROM auth.users WHERE id = auth.uid();
    END IF;

    ------------------------------------------------------------------------------------
    -- 3. TẠO THÔNG BÁO CHO FREELANCER (Create Notifications for Freelancer)
    ------------------------------------------------------------------------------------

    -- Gửi thông báo đến TẤT CẢ người dùng có vai trò 'Freelancer'
    BEGIN
        -- Lặp qua từng user có vai trò 'Freelancer'
        FOR freelancer_user IN 
            SELECT id, full_name, email FROM public.users 
            WHERE role = 'Freelancer'::public.user_role_enum
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
                    freelancer_user.id, -- ID của Freelancer đang được lặp
                    format('Job mới: %s', NEW.position_title),
                    format(
                        'Vị trí %s tại %s đã được mở. Anh/chị vui lòng giới thiệu ứng viên sớm nhất để nhận hoa hồng. Cảm ơn mọi người!',
                        NEW.position_title,
                        COALESCE(v_client_name, 'Unknown Client')
                    ),
                    'job_assignment_type_changed_to_freelancer', -- Type riêng cho Freelancer khi job chuyển sang Freelancer
                    'job',
                    NEW.id,
                    auth.uid()
                );
                
                notification_count := notification_count + 1;
                
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to create Freelancer notification for job assignment change for user %s. Error: %', freelancer_user.id, SQLERRM;
            END;
        END LOOP;
        
        -- Log số lượng thông báo đã gửi
        RAISE NOTICE 'Sent % notifications to Freelancer users for job assignment change to Freelancer', notification_count;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to send notifications to Freelancer users for job assignment change. Error: %', SQLERRM;
    END;

    ------------------------------------------------------------------------------------
    -- 4. TẠO THÔNG BÁO CHO ADMIN (Create Notifications for Admin)
    ------------------------------------------------------------------------------------

    -- Gửi thông báo đến TẤT CẢ người dùng có vai trò 'Admin'
    BEGIN
        -- Lặp qua từng user có vai trò 'Admin'
        FOR admin_user IN 
            SELECT id, full_name, email FROM public.users 
            WHERE role = 'Admin'::public.user_role_enum
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
                    admin_user.id, -- ID của Admin đang được lặp
                    format('Job assignment type đã thay đổi: %s', NEW.position_title),
                    format(
                        'Job "%s" tại %s đã được thay đổi assignment_type từ %s sang %s bởi %s. Hãy kiểm tra và theo dõi.',
                        NEW.position_title,
                        COALESCE(v_client_name, 'Unknown Client'),
                        OLD.assignment_type,
                        NEW.assignment_type,
                        COALESCE(v_updater_name, 'một người dùng')
                    ),
                    'job_assignment_type_changed_admin', -- Type riêng cho Admin khi job assignment_type thay đổi
                    'job',
                    NEW.id,
                    auth.uid()
                );
                
                notification_count := notification_count + 1;
                
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to create Admin notification for job assignment change for user %s. Error: %', admin_user.id, SQLERRM;
            END;
        END LOOP;
        
        -- Log số lượng thông báo đã gửi
        RAISE NOTICE 'Sent % notifications to Admin users for job assignment change', notification_count;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to send notifications to Admin users for job assignment change. Error: %', SQLERRM;
    END;

    ------------------------------------------------------------------------------------
    -- 5. GỬI WEBHOOK ĐẾN N8N (Send Webhook to N8N)
    ------------------------------------------------------------------------------------

    -- Tạo payload cho webhook
    payload := jsonb_build_object(
        'event_type', 'job_assignment_type_changed',
        'job_id', NEW.id,
        'job_title', NEW.position_title,
        'client_name', COALESCE(v_client_name, 'Unknown Client'),
        'old_assignment_type', OLD.assignment_type,
        'new_assignment_type', NEW.assignment_type,
        'updated_by', COALESCE(v_updater_name, 'Unknown User'),
        'updated_by_email', COALESCE(v_updater_email, ''),
        'updated_at', NEW.updated_at,
        'job_url', format('https://apex.tdconsulting.vn/jobs/%s', NEW.id),
        'notification_count', notification_count,
        'notifications_sent_to', jsonb_build_object(
            'freelancers', 'job_assignment_type_changed_to_freelancer',
            'admins', 'job_assignment_type_changed_admin'
        ),
        'full_job_record', to_jsonb(NEW)
    );

    -- Thực hiện gọi HTTP POST đến webhook
    BEGIN
        PERFORM net.http_post(
            url := webhook_url,
            body := payload,
            headers := '{"Content-Type": "application/json"}'::JSONB,
            timeout_milliseconds := 5000
        );
        
        RAISE NOTICE 'Successfully sent webhook to N8N for job assignment type change to Freelancer notification';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to call n8n webhook for job assignment type change to Freelancer notification, but continuing transaction. Error: %', SQLERRM;
    END;

    -- Luôn trả về NEW để trigger hoàn thành hợp lệ
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log lỗi tổng quát nhưng không làm fail transaction
        RAISE NOTICE 'General error in notify_freelancer_job_assignment_change function: %', SQLERRM;
        RETURN NEW;
END;
$$;
