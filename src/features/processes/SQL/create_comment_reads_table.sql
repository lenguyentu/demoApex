-- Migration: Create process_comment_reads table for multi-user read tracking
-- This replaces the simple is_read boolean approach

-- 1. Create the new table
CREATE TABLE IF NOT EXISTS public.process_comment_reads (
  comment_id UUID NOT NULL REFERENCES public.process_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_comment_reads_user ON public.process_comment_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reads_comment ON public.process_comment_reads(comment_id);


-- Grant permissions
GRANT ALL ON public.process_comment_reads TO authenticated;
