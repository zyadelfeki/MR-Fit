-- =============================================================================
-- MR-Fit – Supabase PostgreSQL Schema
-- Apply with: psql "$SUPABASE_DB_URL" -f database/schema.sql
-- =============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- =============================================================================
-- Utility: keep updated_at current on every row change
-- =============================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Table: users
-- Mirrors auth.users; stores application-level user data.
-- =============================================================================
create table if not exists users (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  updated_at  timestamptz not null    default now(),

  auth_id     uuid        not null unique,   -- foreign key to auth.users.id
  email       text        not null unique,
  role        text        not null default 'user'
                          check (role in ('user', 'trainer', 'admin'))
);

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- =============================================================================
-- Table: profiles
-- Extended fitness profile for each user.
-- =============================================================================
create table if not exists profiles (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),
  updated_at      timestamptz not null    default now(),

  user_id         uuid        not null unique references users (id) on delete cascade,
  display_name    text,
  avatar_url      text,
  date_of_birth   date,
  gender          text        check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm       numeric(5, 2),
  weight_kg       numeric(5, 2),
  fitness_goal    text        check (fitness_goal in ('lose_weight', 'build_muscle', 'improve_endurance', 'maintain', 'flexibility')),
  fitness_level   text        check (fitness_level in ('beginner', 'intermediate', 'advanced'))
);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- =============================================================================
-- Table: exercises
-- Master catalogue of individual exercises.
-- =============================================================================
create table if not exists exercises (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),
  updated_at      timestamptz not null    default now(),

  name            text        not null unique,
  description     text,
  muscle_group    text        not null,
  equipment       text,
  difficulty      text        check (difficulty in ('beginner', 'intermediate', 'advanced')),
  video_url       text,
  embedding       vector(1536)             -- OpenAI text-embedding-3-small dimension
);

create trigger trg_exercises_updated_at
  before update on exercises
  for each row execute function set_updated_at();

create index if not exists idx_exercises_embedding
  on exercises using hnsw (embedding vector_cosine_ops);

-- =============================================================================
-- Table: workouts
-- A workout plan, either AI-generated or created by a trainer.
-- =============================================================================
create table if not exists workouts (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),
  updated_at      timestamptz not null    default now(),

  user_id         uuid        not null references users (id) on delete cascade,
  title           text        not null,
  description     text,
  scheduled_at    timestamptz,
  duration_min    integer,
  source          text        not null default 'ai'
                              check (source in ('ai', 'trainer', 'user'))
);

create trigger trg_workouts_updated_at
  before update on workouts
  for each row execute function set_updated_at();

create index if not exists idx_workouts_user_id on workouts (user_id);

-- =============================================================================
-- Table: workout_logs
-- Records each set/rep performed during a completed workout session.
-- =============================================================================
create table if not exists workout_logs (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),
  updated_at      timestamptz not null    default now(),

  workout_id      uuid        not null references workouts (id) on delete cascade,
  exercise_id     uuid        not null references exercises (id),
  user_id         uuid        not null references users (id) on delete cascade,
  sets_completed  integer     not null default 0,
  reps_completed  integer     not null default 0,
  weight_kg       numeric(6, 2),
  duration_sec    integer,
  notes           text,
  logged_at       timestamptz not null default now()
);

create trigger trg_workout_logs_updated_at
  before update on workout_logs
  for each row execute function set_updated_at();

create index if not exists idx_workout_logs_user_id    on workout_logs (user_id);
create index if not exists idx_workout_logs_workout_id on workout_logs (workout_id);

-- =============================================================================
-- Table: wearable_data
-- Time-series health metrics synced from wearable devices.
-- =============================================================================
create table if not exists wearable_data (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),
  updated_at      timestamptz not null    default now(),

  user_id         uuid        not null references users (id) on delete cascade,
  source          text        not null,   -- e.g. 'apple_health', 'garmin', 'fitbit'
  metric          text        not null,   -- e.g. 'heart_rate', 'steps', 'sleep_hours', 'calories_burned'
  value           numeric     not null,
  unit            text        not null,   -- e.g. 'bpm', 'count', 'hours', 'kcal'
  recorded_at     timestamptz not null
);

create trigger trg_wearable_data_updated_at
  before update on wearable_data
  for each row execute function set_updated_at();

create index if not exists idx_wearable_data_user_recorded
  on wearable_data (user_id, recorded_at desc);

-- =============================================================================
-- Row-Level Security
-- =============================================================================
alter table users          enable row level security;
alter table profiles       enable row level security;
alter table exercises      enable row level security;
alter table workouts       enable row level security;
alter table workout_logs   enable row level security;
alter table wearable_data  enable row level security;

-- Users: read/write own row only
create policy "users_select_own" on users
  for select using (auth.uid() = auth_id);

create policy "users_update_own" on users
  for update using (auth.uid() = auth_id);

-- Profiles: read/write own profile only
create policy "profiles_select_own" on profiles
  for select using (user_id = (select id from users where auth_id = auth.uid()));

create policy "profiles_insert_own" on profiles
  for insert with check (user_id = (select id from users where auth_id = auth.uid()));

create policy "profiles_update_own" on profiles
  for update using (user_id = (select id from users where auth_id = auth.uid()));

-- Exercises: readable by all authenticated users
create policy "exercises_select_authenticated" on exercises
  for select using (auth.role() = 'authenticated');

-- Workouts: read/write own workouts only
create policy "workouts_select_own" on workouts
  for select using (user_id = (select id from users where auth_id = auth.uid()));

create policy "workouts_insert_own" on workouts
  for insert with check (user_id = (select id from users where auth_id = auth.uid()));

create policy "workouts_update_own" on workouts
  for update using (user_id = (select id from users where auth_id = auth.uid()));

create policy "workouts_delete_own" on workouts
  for delete using (user_id = (select id from users where auth_id = auth.uid()));

-- Workout logs: read/write own logs only
create policy "workout_logs_select_own" on workout_logs
  for select using (user_id = (select id from users where auth_id = auth.uid()));

create policy "workout_logs_insert_own" on workout_logs
  for insert with check (user_id = (select id from users where auth_id = auth.uid()));

create policy "workout_logs_update_own" on workout_logs
  for update using (user_id = (select id from users where auth_id = auth.uid()));

-- Wearable data: read/write own data only
create policy "wearable_data_select_own" on wearable_data
  for select using (user_id = (select id from users where auth_id = auth.uid()));

create policy "wearable_data_insert_own" on wearable_data
  for insert with check (user_id = (select id from users where auth_id = auth.uid()));

create policy "wearable_data_update_own" on wearable_data
  for update using (user_id = (select id from users where auth_id = auth.uid()));

-- =============================================================================
-- Table: workout_exercises
-- Links exercises to workouts with sets/reps/order
-- =============================================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  workout_id     UUID        NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id    UUID        NOT NULL REFERENCES exercises(id),
  sets_target    INTEGER     NOT NULL DEFAULT 3,
  reps_target    INTEGER     NOT NULL DEFAULT 10,
  weight_kg      NUMERIC(6,2),
  order_index    INTEGER     NOT NULL DEFAULT 0
);

CREATE TRIGGER trg_workout_exercises_updated_at
  BEFORE UPDATE ON workout_exercises
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id
  ON workout_exercises(workout_id);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_exercises_select_own" ON workout_exercises
  FOR SELECT USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  );

CREATE POLICY "workout_exercises_insert_own" ON workout_exercises
  FOR INSERT WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  );

-- =============================================================================
-- Table: nutrition_logs
-- User dietary logs and macros
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein_g NUMERIC,
    carbs_g NUMERIC,
    fat_g NUMERIC,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id ON public.nutrition_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_logged_at ON public.nutrition_logs(logged_at);

ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_logs_select_own" ON public.nutrition_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "nutrition_logs_insert_own" ON public.nutrition_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrition_logs_update_own" ON public.nutrition_logs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "nutrition_logs_delete_own" ON public.nutrition_logs
  FOR DELETE USING (user_id = auth.uid());

