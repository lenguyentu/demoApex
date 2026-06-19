-- ==============================================================================
-- 1. Cập nhật bảng bd_processes (Bảng chính)
-- ==============================================================================

-- Bổ sung các cột mới phục vụ nghiệp vụ BD CRM
ALTER TABLE public.bd_processes
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Bình thường',
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS potential_job_title text,
ADD COLUMN IF NOT EXISTS potential_job_link text;

-- Thêm comment (Optional)
COMMENT ON COLUMN public.bd_processes.priority IS 'Mức độ ưu tiên: Bình thường, Ưu tiên';
COMMENT ON COLUMN public.bd_processes.source IS 'Nguồn lead: Thread, Itviec, Referral, etc.';
COMMENT ON COLUMN public.bd_processes.potential_job_title IS 'Tên vị trí công việc (Job) đang trao đổi với khách hàng';

-- Thêm Index tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_bd_processes_priority ON public.bd_processes(priority);
CREATE INDEX IF NOT EXISTS idx_bd_processes_source ON public.bd_processes(source);
CREATE INDEX IF NOT EXISTS idx_bd_processes_status ON public.bd_processes(status);
CREATE INDEX IF NOT EXISTS idx_bd_processes_owner_id ON public.bd_processes(owner_id);
CREATE INDEX IF NOT EXISTS idx_bd_processes_potential_job_title ON public.bd_processes(potential_job_title);


-- ==============================================================================
-- 2. Cập nhật/Tạo bảng bd_process_history (Bảng lịch sử)
-- ==============================================================================

-- Nếu bảng chưa tồn tại, tạo mới đúng cấu trúc chuẩn:
CREATE TABLE IF NOT EXISTS public.bd_process_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bd_process_id uuid NOT NULL,
  phase public.bd_phase_enum NULL,
  status public.bd_status_enum NULL,
  memo text NULL,
  changed_by_id uuid NULL,
  change_date timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT bd_process_history_pkey PRIMARY KEY (id),
  CONSTRAINT fk_bd_process FOREIGN KEY (bd_process_id) REFERENCES public.bd_processes (id) ON DELETE CASCADE,
  CONSTRAINT fk_changed_by FOREIGN KEY (changed_by_id) REFERENCES public.users (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Tạo index cho khóa ngoại
CREATE INDEX IF NOT EXISTS idx_bd_process_history_process_id ON public.bd_process_history USING btree (bd_process_id) TABLESPACE pg_default;


-- ==============================================================================
-- 3. Trigger Tự động cập nhật last_contact_date
-- ==============================================================================

-- Hàm trigger function
CREATE OR REPLACE FUNCTION update_bd_process_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.bd_processes
    SET last_contact_date = NEW.change_date,
        updated_at = NOW()
    WHERE id = NEW.bd_process_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger vào bảng history
DROP TRIGGER IF EXISTS trigger_update_last_contact ON public.bd_process_history;
CREATE TRIGGER trigger_update_last_contact
AFTER INSERT ON public.bd_process_history
FOR EACH ROW
EXECUTE FUNCTION update_bd_process_last_contact();
