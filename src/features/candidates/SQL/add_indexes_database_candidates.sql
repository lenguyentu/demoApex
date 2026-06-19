-- Enable pg_trgm extension for ILIKE search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for default sorting (Newest first)
CREATE INDEX IF NOT EXISTS idx_database_candidates_created_at 
ON public.database_candidates (created_at DESC);

-- GIN Trigram indexes for fast text search (ILIKE)
CREATE INDEX IF NOT EXISTS idx_database_candidates_name_trgm 
ON public.database_candidates USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_database_candidates_email_trgm 
ON public.database_candidates USING GIN (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_database_candidates_phone_trgm 
ON public.database_candidates USING GIN (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_database_candidates_applied_position_trgm 
ON public.database_candidates USING GIN (applied_position gin_trgm_ops);
