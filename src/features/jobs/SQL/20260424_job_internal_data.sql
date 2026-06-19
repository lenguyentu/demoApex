-- Migration: Tạo bảng job_internal_data để lưu trữ thông tin nhạy cảm
-- Date: 2026-04-24
-- Purpose: Bảo vệ dữ liệu nhạy cảm khỏi freelancer/CTV, chỉ internal staff được xem

-- =====================================================
-- 1. Tạo bảng job_internal_data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_internal_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  
  -- Thông tin nhạy cảm
  original_jd_url TEXT,                    -- Link JD gốc từ client
  internal_notes TEXT,                     -- Ghi chú nội bộ (bao gồm lương thực tế, yêu cầu đặc biệt, etc.)
  client_contact_info JSONB,               -- Thông tin liên hệ client (name, email, phone, position)
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_id UUID REFERENCES auth.users(id),
  updated_by_id UUID REFERENCES auth.users(id),
  
  -- Đảm bảo mỗi job chỉ có 1 bản ghi internal data
  UNIQUE(job_id)
);

-- Index để tăng tốc query theo job_id
CREATE INDEX IF NOT EXISTS idx_job_internal_data_job_id ON public.job_internal_data(job_id);

-- =====================================================
-- 2. Trigger tự động cập nhật updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_job_internal_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_internal_data_updated_at
  BEFORE UPDATE ON public.job_internal_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_internal_data_updated_at();

-- =====================================================
-- 3. Enable Row Level Security
-- =====================================================
ALTER TABLE public.job_internal_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS Policies - CHỈ internal staff được truy cập
-- =====================================================

-- Policy: SELECT - Chỉ internal staff được đọc
CREATE POLICY "Internal staff can view job internal data"
  ON public.job_internal_data
  FOR SELECT
  TO authenticated
  USING (
    get_current_app_user_role() = ANY (
      ARRAY[
        'BD'::user_role_enum,
        'BD Lead'::user_role_enum,
        'HR'::user_role_enum,
        'Admin'::user_role_enum,
        'Manager'::user_role_enum,
        'Headhunter'::user_role_enum,
        'HH Lead'::user_role_enum,
        'Community Manager'::user_role_enum
      ]
    )
  );

-- Policy: INSERT - Chỉ internal staff được tạo
CREATE POLICY "Internal staff can insert job internal data"
  ON public.job_internal_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_app_user_role() = ANY (
      ARRAY[
        'BD'::user_role_enum,
        'BD Lead'::user_role_enum,
        'HR'::user_role_enum,
        'Admin'::user_role_enum,
        'Manager'::user_role_enum,
        'Headhunter'::user_role_enum,
        'HH Lead'::user_role_enum,
        'Community Manager'::user_role_enum
      ]
    )
  );

-- Policy: UPDATE - Chỉ internal staff được cập nhật
CREATE POLICY "Internal staff can update job internal data"
  ON public.job_internal_data
  FOR UPDATE
  TO authenticated
  USING (
    get_current_app_user_role() = ANY (
      ARRAY[
        'BD'::user_role_enum,
        'BD Lead'::user_role_enum,
        'HR'::user_role_enum,
        'Admin'::user_role_enum,
        'Manager'::user_role_enum,
        'Headhunter'::user_role_enum,
        'HH Lead'::user_role_enum,
        'Community Manager'::user_role_enum
      ]
    )
  )
  WITH CHECK (
    get_current_app_user_role() = ANY (
      ARRAY[
        'BD'::user_role_enum,
        'BD Lead'::user_role_enum,
        'HR'::user_role_enum,
        'Admin'::user_role_enum,
        'Manager'::user_role_enum,
        'Headhunter'::user_role_enum,
        'HH Lead'::user_role_enum,
        'Community Manager'::user_role_enum
      ]
    )
  );

-- Policy: DELETE - Chỉ Admin và Manager được xóa
CREATE POLICY "Admin and Manager can delete job internal data"
  ON public.job_internal_data
  FOR DELETE
  TO authenticated
  USING (
    get_current_app_user_role() = ANY (
      ARRAY[
        'Admin'::user_role_enum,
        'Manager'::user_role_enum
      ]
    )
  );

-- =====================================================
-- 5. Grant permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.job_internal_data TO authenticated;
GRANT DELETE ON public.job_internal_data TO authenticated; -- RLS sẽ kiểm soát ai được xóa

-- =====================================================
-- 6. Comments để document
-- =====================================================
COMMENT ON TABLE public.job_internal_data IS 'Lưu trữ thông tin nhạy cảm của job, chỉ internal staff được truy cập. Freelancer và CTV KHÔNG được phép đọc bảng này.';
COMMENT ON COLUMN public.job_internal_data.original_jd_url IS 'Link JD gốc từ client (có thể chứa thông tin nhạy cảm)';
COMMENT ON COLUMN public.job_internal_data.internal_notes IS 'Ghi chú nội bộ về job: lương thực tế, yêu cầu đặc biệt, thông tin nhạy cảm khác (không cho freelancer xem)';
COMMENT ON COLUMN public.job_internal_data.client_contact_info IS 'Thông tin liên hệ client dạng JSONB: {name, email, phone, position} hoặc array of contacts';
