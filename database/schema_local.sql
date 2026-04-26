-- ============================================================
-- MR-Fit: Local PostgreSQL Schema (no Supabase / RLS)
-- Run with: psql -U postgres -d mrfit -f database/schema_local.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector is optional: only needed for AI semantic search
-- Install from https://github.com/pgvector/pgvector if you want it
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector not available — skipping. AI semantic search will be disabled.';
END $$;

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer_hash text;

-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name         text,
  date_of_birth        date,
  gender               text CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  height_cm            numeric(5,2),
  weight_kg            numeric(5,2),
  fitness_goal         text CHECK (fitness_goal IN ('lose_weight','build_muscle','improve_endurance','maintain','flexibility')),
  fitness_level        text CHECK (fitness_level IN ('beginner','intermediate','advanced')),
  -- Macro / calorie goals
  calorie_goal         integer DEFAULT 2000,
  protein_goal         integer DEFAULT 150,
  carb_goal            integer DEFAULT 250,
  fat_goal             integer DEFAULT 65,
  onboarding_completed boolean DEFAULT false,
  updated_at           timestamptz DEFAULT now()
);

-- Add goal columns if the table already existed without them
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calorie_goal         integer DEFAULT 2000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS protein_goal         integer DEFAULT 150;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS carb_goal            integer DEFAULT 250;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fat_goal             integer DEFAULT 65;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- ============================================================
-- Exercises (embedding column only created if pgvector loaded)
-- ============================================================
CREATE TABLE IF NOT EXISTS exercises (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  description  text,
  muscle_group text,
  equipment    text,
  difficulty   text CHECK (difficulty IN ('beginner','intermediate','advanced'))
);

-- Add embedding column only when vector type exists
DO $$ BEGIN
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS embedding vector(384);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping embedding column — pgvector not installed.';
END $$;

-- ============================================================
-- Workouts
-- ============================================================
CREATE TABLE IF NOT EXISTS workouts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title        text NOT NULL,
  source       text DEFAULT 'custom',
  duration_min integer,
  scheduled_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- Workout exercises (planned sets per workout)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id   uuid REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id  uuid REFERENCES exercises(id),
  sets_target  integer,
  reps_target  integer,
  order_index  integer DEFAULT 0
);

-- ============================================================
-- Workout logs (actual logged sets / reps / weight)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_logs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  workout_id   uuid REFERENCES workouts(id) ON DELETE SET NULL,
  exercise_id  uuid REFERENCES exercises(id),
  sets_completed  integer,
  reps_completed  integer,
  weight_kg    numeric(6,2),
  notes        text,
  logged_at    timestamptz DEFAULT now()
);

-- workout_log_exercises: stores individual exercise entries per log session
CREATE TABLE IF NOT EXISTS workout_log_exercises (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_log_id  uuid REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_name   text NOT NULL,
  sets            integer,
  reps            integer,
  weight_kg       numeric(6,2),
  notes           text,
  logged_at       timestamptz DEFAULT now()
);

-- ============================================================
-- Nutrition logs
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  food_name text NOT NULL,
  calories  integer NOT NULL CHECK (calories > 0),
  protein_g numeric(6,2),
  carbs_g   numeric(6,2),
  fat_g     numeric(6,2),
  logged_at timestamptz DEFAULT now()
);

-- ============================================================
-- Weight logs (for progress chart)
-- ============================================================
CREATE TABLE IF NOT EXISTS weight_logs (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  weight_kg numeric(5,2) NOT NULL,
  logged_at timestamptz DEFAULT now()
);

-- ============================================================
-- Wearable data
-- ============================================================
CREATE TABLE IF NOT EXISTS wearable_data (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  metric      text NOT NULL,
  value       numeric NOT NULL,
  unit        text,
  recorded_at timestamptz DEFAULT now()
);

-- ============================================================
-- Chat history (AI coach)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workout_logs_user      ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout   ON workout_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user          ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user    ON nutrition_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user       ON weight_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user      ON chat_history(user_id, created_at DESC);

-- ivfflat index only if pgvector installed
DO $$ BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_exercises_embedding ON exercises USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping ivfflat index — pgvector not installed.';
END $$;

-- ============================================================
-- pgvector match function (only if vector type exists)
-- ============================================================
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
  RAISE NOTICE 'Skipping match_exercises function — pgvector not installed.';
END $$;
