-- v10: Enable pgvector extension and create clinical_embeddings vector table for semantic search

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create clinical_embeddings table
CREATE TABLE IF NOT EXISTS clinical_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  icd_code TEXT,
  content TEXT NOT NULL,
  embedding vector(384), -- Standard 384-dim embedding vector (All-MiniLM-L6-v2 compatible)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create HNSW Vector Index for ultra-fast similarity search
CREATE INDEX IF NOT EXISTS clinical_embeddings_hnsw_idx 
  ON clinical_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- 4. Enable Row-Level Security
ALTER TABLE clinical_embeddings ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Read Policy for Authenticated Users
CREATE POLICY "Allow authenticated read clinical_embeddings" 
  ON clinical_embeddings 
  FOR SELECT 
  USING (true);

-- 6. RPC Function for Cosine Similarity Search
CREATE OR REPLACE FUNCTION match_clinical_embeddings (
  query_embedding vector(384),
  match_threshold float DEFAULT 0.2,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  icd_code TEXT,
  content TEXT,
  similarity float,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    clinical_embeddings.id,
    clinical_embeddings.title,
    clinical_embeddings.category,
    clinical_embeddings.icd_code,
    clinical_embeddings.content,
    1 - (clinical_embeddings.embedding <=> query_embedding) AS similarity,
    clinical_embeddings.metadata
  FROM clinical_embeddings
  WHERE 1 - (clinical_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY clinical_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
