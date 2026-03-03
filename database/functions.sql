CREATE OR REPLACE FUNCTION match_exercises(
  query_embedding vector(384),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  muscle_group text,
  difficulty text,
  distance float
)
LANGUAGE sql STABLE
AS $$
  SELECT id, name, description, muscle_group, difficulty,
         embedding <=> query_embedding AS distance
  FROM exercises
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
