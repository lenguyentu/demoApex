-- Migration: Add note column to sales table
-- Date: 2026-05-05
-- Purpose: Allow flexible notes for sales records (e.g., tracking intern's HH lead)

-- Add note column to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS note TEXT;

-- Add comment
COMMENT ON COLUMN sales.note IS 'Ghi chú linh hoạt cho công nợ (ví dụ: Intern - HH Lead, thông tin đặc biệt, etc.)';

-- Create index for text search if needed in future
CREATE INDEX IF NOT EXISTS idx_sales_note_search ON sales USING gin(to_tsvector('english', note));
