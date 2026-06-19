-- =====================================================
-- Migration: Job Phase History Tracking
-- Date: 2026-05-04
-- Description: 
--   - Tạo bảng job_phase_history để log lịch sử thay đổi phase
--   - Trigger tự động log khi phase thay đổi
--   - RLS chỉ cho phép SELECT (read-only), không cho INSERT/UPDATE/DELETE từ client
--   - Chỉ internal staff mới xem được history
-- =====================================================

-- 1. Tạo bảng job_phase_history
CREATE TABLE IF NOT EXISTS public.job_phase_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  phase job_phase_enum,
  phase_memo text,
  changed_by_id uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_job_phase_history_job 
    FOREIGN KEY (job_id) 
    REFERENCES public.jobs(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_job_phase_history_changed_by 
    FOREIGN KEY (changed_by_id) 
    REFERENCES public.users(id)
    ON DELETE SET NULL
);

-- 2. Tạo indexes để tối ưu query
CREATE INDEX IF NOT EXISTS idx_job_phase_history_job_id 
  ON public.job_phase_history(job_id);

CREATE INDEX IF NOT EXISTS idx_job_phase_history_changed_at 
  ON public.job_phase_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_phase_history_phase 
  ON public.job_phase_history(phase);

-- 3. Comment cho documentation
COMMENT ON TABLE public.job_phase_history IS 
  'Lịch sử thay đổi phase của job. Tự động log bởi trigger, read-only từ client.';

COMMENT ON COLUMN public.job_phase_history.job_id IS 
  'ID của job bị thay đổi phase';

COMMENT ON COLUMN public.job_phase_history.phase IS 
  'Phase mới sau khi thay đổi';

COMMENT ON COLUMN public.job_phase_history.phase_memo IS 
  'Ghi chú khi thay đổi phase (snapshot từ jobs.phase_memo)';

COMMENT ON COLUMN public.job_phase_history.changed_by_id IS 
  'User thực hiện thay đổi (từ jobs.updated_by_id)';

COMMENT ON COLUMN public.job_phase_history.changed_at IS 
  'Thời điểm thay đổi';

-- 4. Tạo trigger function để tự động log phase changes
CREATE OR REPLACE FUNCTION public.log_job_phase_change()
RETURNS TRIGGER 
SECURITY DEFINER -- Chạy với quyền của owner (postgres), bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log initial phase khi tạo job mới
  IF (TG_OP = 'INSERT' AND NEW.phase IS NOT NULL) THEN
    INSERT INTO public.job_phase_history (
      job_id, 
      phase, 
      phase_memo, 
      changed_by_id,
      changed_at
    )
    VALUES (
      NEW.id, 
      NEW.phase, 
      NEW.phase_memo, 
      NEW.created_by_id, -- Dùng created_by_id cho lần đầu
      NEW.created_at
    );
  END IF;
  
  -- Log khi phase thay đổi
  IF (TG_OP = 'UPDATE' AND OLD.phase IS DISTINCT FROM NEW.phase) THEN
    INSERT INTO public.job_phase_history (
      job_id, 
      phase, 
      phase_memo, 
      changed_by_id,
      changed_at
    )
    VALUES (
      NEW.id, 
      NEW.phase, 
      NEW.phase_memo, 
      NEW.updated_by_id,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Gắn trigger vào jobs table
DROP TRIGGER IF EXISTS trigger_log_job_phase_change ON public.jobs;

CREATE TRIGGER trigger_log_job_phase_change
  AFTER INSERT OR UPDATE ON public.jobs -- ← Thêm INSERT
  FOR EACH ROW
  EXECUTE FUNCTION public.log_job_phase_change();

-- 6. Enable RLS
ALTER TABLE public.job_phase_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policy: Chỉ internal staff mới xem được history
-- Pattern giống job_internal_data
DROP POLICY IF EXISTS "Internal staff can view job phase history" ON public.job_phase_history;

CREATE POLICY "Internal staff can view job phase history"
  ON public.job_phase_history
  FOR SELECT
  TO authenticated
  USING (
    get_current_app_user_role() = ANY (ARRAY[
      'BD'::user_role_enum,
      'BD Lead'::user_role_enum,
      'HR'::user_role_enum,
      'Admin'::user_role_enum,
      'Manager'::user_role_enum,
      'Headhunter'::user_role_enum,
      'HH Lead'::user_role_enum,
      'Community Manager'::user_role_enum
    ])
  );

-- 8. KHÔNG TẠO policy cho INSERT/UPDATE/DELETE
-- → Client không thể trực tiếp thêm/sửa/xóa history
-- → Chỉ trigger mới có quyền INSERT (vì SECURITY DEFINER)

-- 9. Tạo RPC function để query history của 1 job
CREATE OR REPLACE FUNCTION public.get_job_phase_history(p_job_id uuid)
RETURNS TABLE (
  id uuid,
  job_id uuid,
  phase job_phase_enum,
  phase_memo text,
  changed_by_id uuid,
  changed_by_name text,
  changed_by_email text,
  changed_at timestamp with time zone
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check permission: chỉ internal staff
  IF get_current_app_user_role() NOT IN (
    'BD', 'BD Lead', 'HR', 'Admin', 'Manager', 
    'Headhunter', 'HH Lead', 'Community Manager'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only internal staff can view job phase history';
  END IF;

  RETURN QUERY
  SELECT 
    jph.id,
    jph.job_id,
    jph.phase,
    jph.phase_memo,
    jph.changed_by_id,
    u.full_name as changed_by_name,
    u.email as changed_by_email,
    jph.changed_at
  FROM public.job_phase_history jph
  LEFT JOIN public.users u ON u.id = jph.changed_by_id
  WHERE jph.job_id = p_job_id
  ORDER BY jph.changed_at DESC;
END;
$$;

-- 10. Grant execute permission cho authenticated users
GRANT EXECUTE ON FUNCTION public.get_job_phase_history(uuid) TO authenticated;

-- 11. Comment cho RPC function
COMMENT ON FUNCTION public.get_job_phase_history(uuid) IS 
  'Lấy lịch sử thay đổi phase của job. Chỉ internal staff mới gọi được.';

-- =====================================================
-- TESTING (Optional - comment out khi chạy production)
-- =====================================================

-- Test 1: Tạo 1 job mới → trigger sẽ tự động log initial phase
-- INSERT INTO jobs (client_id, position_title, phase, phase_memo, created_by_id, updated_by_id)
-- VALUES ('some-client-id', 'Test Job', 'Open', 'Initial phase', 'some-user-id', 'some-user-id');

-- Test 2: Update phase → trigger sẽ tự động log phase mới
-- UPDATE jobs 
-- SET phase = 'Sourcing', phase_memo = 'Bắt đầu tìm ứng viên', updated_by_id = 'some-user-id'
-- WHERE position_title = 'Test Job';

-- Test 3: Query history
-- SELECT * FROM get_job_phase_history('job-id-here');

-- Test 4: Verify RLS - user thường không thể INSERT trực tiếp
-- INSERT INTO job_phase_history (job_id, phase) VALUES ('job-id', 'Open'); 
-- → Should fail with RLS error

-- =====================================================
-- ROLLBACK (nếu cần)
-- =====================================================

-- DROP TRIGGER IF EXISTS trigger_log_job_phase_change ON public.jobs;
-- DROP FUNCTION IF EXISTS public.log_job_phase_change();
-- DROP FUNCTION IF EXISTS public.get_job_phase_history(uuid);
-- DROP TABLE IF EXISTS public.job_phase_history CASCADE;
