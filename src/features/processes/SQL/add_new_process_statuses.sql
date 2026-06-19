-- Migration to add new process statuses to process_status_enum
-- Added by Antigravity AI

-- Vòng 4 (Round 4)
ALTER TYPE public.process_status_enum ADD VALUE IF NOT EXISTS 'INTERVIEW_SCHEDULED_4TH' AFTER 'INTERVIEW_COMPLETED_FINAL';
ALTER TYPE public.process_status_enum ADD VALUE IF NOT EXISTS 'INTERVIEW_COMPLETED_4TH' AFTER 'INTERVIEW_SCHEDULED_4TH';

-- Probation statuses
ALTER TYPE public.process_status_enum ADD VALUE IF NOT EXISTS 'FAILED_PROBATION' AFTER 'GUARANTEE_PERIOD';
ALTER TYPE public.process_status_enum ADD VALUE IF NOT EXISTS 'PASSED_PROBATION' AFTER 'FAILED_PROBATION';
-- Thêm status mới vào Enum
ALTER TYPE public.process_status_enum ADD VALUE IF NOT EXISTS 'REVIEW_CV_BY_TDC' AFTER 'APPLIED';

-- Cập nhật comment để đồng bộ tài liệu
COMMENT ON TYPE public.process_status_enum IS 'Process status enum including: APPLIED, REVIEW_CV_BY_TDC, CV_SUBMITTED_TO_CLIENT, INTERVIEW stages (1st, 2nd, Final, 4th), TEST stages, REFERENCE stages, OFFER stages, PLACEMENT_CONFIRMED, ONBOARDING, GUARANTEE_PERIOD, FAILED_PROBATION, PASSED_PROBATION, PROCESS_ON_HOLD, PROCESS_CANCELLED, REJECT_BY_ADMIN, PAYMENT_RECEIVED';
