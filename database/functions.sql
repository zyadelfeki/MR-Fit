-- pgvector match function — only created if vector extension is available
DO $$ BEGIN
  EXECUTE $func$
    CREATE OR REPLACE FUNCTION match_exercises(
      query_embedding vector(384),
      match_count int DEFAULT 5
    )
    RETURNS TABLE (
      id uuid, name text, description text,
      muscle_group text, difficulty text, distance float
    )
    LANGUAGE sql STABLE AS $inner$
      SELECT id, name, description, muscle_group, difficulty,
             embedding <=> query_embedding AS distance
      FROM exercises
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> query_embedding
      LIMIT match_count;
    $inner$;
  $func$;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping match_exercises — pgvector not installed. AI semantic search disabled.';
END $$;
