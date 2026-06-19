CREATE OR REPLACE FUNCTION match_candidates_top_k(
  job_uuid UUID,
  match_count INT DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  applied_position TEXT,
  cv_link TEXT,
  has_cv BOOLEAN,   -- thêm cột này
  address TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  job_embedding vector(1024);
BEGIN
  SELECT embedding INTO job_embedding 
  FROM jobs WHERE jobs.id = job_uuid;
  
  IF job_embedding IS NULL THEN RETURN; END IF;
  
  RETURN QUERY
  SELECT 
    dc.id,
    dc.name,
    dc.email,
    dc.phone,
    dc.applied_position,
    -- Trả NULL nếu là base64, giữ nguyên nếu là URL thật
    CASE WHEN dc.cv_link LIKE 'data:%' THEN NULL ELSE dc.cv_link END AS cv_link,
    -- Cột riêng để frontend biết có CV hay không
    (dc.cv_link IS NOT NULL) AS has_cv,
    dc.address,
    (1 - (dc.embedding <=> job_embedding)) AS similarity
  FROM database_candidates dc
  WHERE dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> job_embedding ASC
  LIMIT match_count;
END;
$$;
