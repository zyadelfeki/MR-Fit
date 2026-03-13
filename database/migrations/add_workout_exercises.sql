CREATE TABLE IF NOT EXISTS workout_log_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC(6,2),
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
