-- Migration: Thêm job_rank và job_level vào bảng jobs
-- Date: 2026-04-24
-- Purpose: Phân loại job theo độ ưu tiên (S, A, B, C, D, F) và level (Intern, Fresher, Junior, etc.)

-- =====================================================
-- 1. Tạo ENUM cho job_rank
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.job_rank_enum AS ENUM ('S', 'A', 'B', 'C', 'D', 'F');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE public.job_rank_enum IS 'Phân loại job theo độ ưu tiên:
S - Dự án VIP của công ty (bill to, process nhanh, HR support)
A - Khách hàng đã kí HĐ, có bill thành công & process 1 vòng
B - Khách hàng đã kí HĐ, có bill thành công & process nhiều hơn 1 vòng
C - Khách hàng mới kí HĐ trong vòng 01 tháng trở lại, chưa có case nào
D - Khách hàng đã kí hợp đồng lâu (hơn 01 tháng), chưa từng có case thành công
F - Khách hàng chưa kí HĐ được, đang chờ CV demo để chốt';

-- =====================================================
-- 2. Tạo ENUM cho job_level
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.job_level_enum AS ENUM (
    'Intern',
    'Fresher',
    'Junior',
    'Middle',
    'Senior',
    'Lead',
    'Manager',
    'Director',
    'C-Level'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE public.job_level_enum IS 'Level/cấp bậc của vị trí tuyển dụng';

-- =====================================================
-- 3. Thêm cột job_rank và job_level vào bảng jobs
-- =====================================================
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS job_rank public.job_rank_enum,
  ADD COLUMN IF NOT EXISTS job_level public.job_level_enum;

-- =====================================================
-- 4. Tạo index để tăng tốc query theo rank và level
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_jobs_job_rank ON public.jobs(job_rank);
CREATE INDEX IF NOT EXISTS idx_jobs_job_level ON public.jobs(job_level);

-- =====================================================
-- 5. Comments để document
-- =====================================================
COMMENT ON COLUMN public.jobs.job_rank IS 'Phân loại job theo độ ưu tiên: S (VIP), A (bill 1 vòng), B (bill nhiều vòng), C (mới kí HĐ), D (kí lâu chưa bill), F (chưa kí HĐ)';
COMMENT ON COLUMN public.jobs.job_level IS 'Cấp bậc của vị trí: Intern, Fresher, Junior, Middle, Senior, Lead, Manager, Director, C-Level';
