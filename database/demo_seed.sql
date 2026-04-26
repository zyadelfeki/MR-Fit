-- =============================================================
-- MR-Fit Demo Seed Data
-- User: demo@mrfit.app / password: demo123
-- 30-day realistic history: workouts, nutrition, wearable data
-- Compatible with schema_local.sql (local PostgreSQL stack)
--
-- Usage:
--   psql mrfit -f database/demo_seed.sql
-- Cleanup:
--   DELETE FROM users WHERE email = 'demo@mrfit.app';
-- =============================================================

BEGIN;

-- ── User ────────────────────────────────────────────────────────
-- Password is bcrypt hash of 'demo123'
-- To generate a fresh hash: node -e "const b=require('bcrypt');b.hash('demo123',10).then(console.log)"
INSERT INTO users (id, email, password_hash, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'demo@mrfit.app',
  '$2b$10$YK9qKQ7ZTVL0u1yFrAKtHOZ3QoC4J5mX8nPwVeD2sRbI6gLhNu1/m',
  NOW() - INTERVAL '31 days'
)
ON CONFLICT (email) DO NOTHING;

-- ── Profile ─────────────────────────────────────────────────────
INSERT INTO profiles (
  id, user_id, display_name, date_of_birth, gender,
  height_cm, weight_kg, fitness_goal, fitness_level, updated_at
)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Alex Demo',
  '2000-03-15',
  'male',
  180.00,
  78.50,
  'build_muscle',
  'intermediate',
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- ── Workouts ─────────────────────────────────────────────────────
-- 22 sessions over 30 days: PPL split, HIIT, full body, cardio
-- Realistic rest days built in (no consecutive 7-day streaks)

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000000-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Push Day — Chest & Shoulders', 'custom', 62, NOW() - INTERVAL '1 days' + INTERVAL '8 hours', NOW() - INTERVAL '1 days' + INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000001-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pull Day — Back & Biceps', 'custom', 58, NOW() - INTERVAL '2 days' + INTERVAL '6 hours', NOW() - INTERVAL '2 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000002-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Leg Day', 'custom', 70, NOW() - INTERVAL '3 days' + INTERVAL '6 hours', NOW() - INTERVAL '3 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000003-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Push Day — Chest & Triceps', 'custom', 55, NOW() - INTERVAL '5 days' + INTERVAL '8 hours', NOW() - INTERVAL '5 days' + INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000004-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cardio HIIT', 'custom', 35, NOW() - INTERVAL '6 days' + INTERVAL '7 hours', NOW() - INTERVAL '6 days' + INTERVAL '7 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000005-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pull Day — Back & Biceps', 'custom', 60, NOW() - INTERVAL '7 days' + INTERVAL '6 hours', NOW() - INTERVAL '7 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000006-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Leg Day', 'custom', 68, NOW() - INTERVAL '8 days' + INTERVAL '6 hours', NOW() - INTERVAL '8 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000007-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Full Body Strength', 'custom', 75, NOW() - INTERVAL '10 days' + INTERVAL '6 hours', NOW() - INTERVAL '10 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000008-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Morning Run', 'custom', 40, NOW() - INTERVAL '11 days' + INTERVAL '8 hours', NOW() - INTERVAL '11 days' + INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000009-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Push Day — Chest & Shoulders', 'custom', 65, NOW() - INTERVAL '13 days' + INTERVAL '6 hours', NOW() - INTERVAL '13 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c000000a-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pull Day — Deadlifts Focus', 'custom', 72, NOW() - INTERVAL '14 days' + INTERVAL '8 hours', NOW() - INTERVAL '14 days' + INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c000000b-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Leg Day — Squat Focus', 'custom', 70, NOW() - INTERVAL '15 days' + INTERVAL '8 hours', NOW() - INTERVAL '15 days' + INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c000000c-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Upper Body', 'custom', 55, NOW() - INTERVAL '17 days' + INTERVAL '8 hours', NOW() - INTERVAL '17 days' + INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c000000d-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cardio HIIT', 'custom', 30, NOW() - INTERVAL '18 days' + INTERVAL '6 hours', NOW() - INTERVAL '18 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c000000e-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Push Day — Chest & Triceps', 'custom', 60, NOW() - INTERVAL '20 days' + INTERVAL '8 hours', NOW() - INTERVAL '20 days' + INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c000000f-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pull Day — Back & Biceps', 'custom', 57, NOW() - INTERVAL '21 days' + INTERVAL '7 hours', NOW() - INTERVAL '21 days' + INTERVAL '7 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000010-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Leg Day', 'custom', 66, NOW() - INTERVAL '22 days' + INTERVAL '6 hours', NOW() - INTERVAL '22 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000011-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Full Body Strength', 'custom', 74, NOW() - INTERVAL '24 days' + INTERVAL '6 hours', NOW() - INTERVAL '24 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000012-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Morning Run', 'custom', 38, NOW() - INTERVAL '25 days' + INTERVAL '6 hours', NOW() - INTERVAL '25 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000013-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Push Day — Chest & Shoulders', 'custom', 63, NOW() - INTERVAL '27 days' + INTERVAL '6 hours', NOW() - INTERVAL '27 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000014-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pull Day — Back & Biceps', 'custom', 59, NOW() - INTERVAL '28 days' + INTERVAL '6 hours', NOW() - INTERVAL '28 days' + INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

INSERT INTO workouts (id, user_id, title, source, duration_min, scheduled_at, created_at)
VALUES ('c0000015-demo-4fit-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Leg Day — Squat Focus', 'custom', 71, NOW() - INTERVAL '29 days' + INTERVAL '8 hours', NOW() - INTERVAL '29 days' + INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

-- ── Workout Logs ─────────────────────────────────────────────────
-- Real exercise names matched against seed.sql catalogue
-- Push: Bench Press, Incline Dumbbell Press, Overhead Press, Lateral Raise, Tricep Pushdown
-- Pull: Pull-Up, Barbell Row, Lat Pulldown, Face Pull, Barbell Curl
-- Legs: Back Squat, Romanian Deadlift, Leg Press, Walking Lunge, Calf Raise
-- Full: Deadlift, Bench Press, Back Squat, Pull-Up, Overhead Press
-- Cardio: Treadmill Run, Jump Rope, Burpees

-- Workout c0000000: Push Day — Chest & Shoulders (1 day ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000000-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000000-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1), 3, 8, 80.0, NOW() - INTERVAL '1 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000001-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000000-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Incline Dumbbell Press' LIMIT 1), 3, 10, 28.0, NOW() - INTERVAL '1 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000002-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000000-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Overhead Press' LIMIT 1), 3, 8, 52.5, NOW() - INTERVAL '1 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000003-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000000-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Lateral Raise' LIMIT 1), 3, 15, 12.0, NOW() - INTERVAL '1 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000004-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000000-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Tricep Pushdown' LIMIT 1), 3, 12, 25.0, NOW() - INTERVAL '1 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;

-- Workout c0000001: Pull Day — Back & Biceps (2 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000005-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Pull-Up' LIMIT 1), 3, 8, NULL, NOW() - INTERVAL '2 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000006-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Row' LIMIT 1), 3, 8, 75.0, NOW() - INTERVAL '2 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000007-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Lat Pulldown' LIMIT 1), 3, 10, 60.0, NOW() - INTERVAL '2 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000008-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Face Pull' LIMIT 1), 3, 15, 20.0, NOW() - INTERVAL '2 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000009-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000001-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Curl' LIMIT 1), 3, 10, 32.5, NOW() - INTERVAL '2 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000002: Leg Day (3 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000000a-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000002-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Back Squat' LIMIT 1), 4, 6, 100.0, NOW() - INTERVAL '3 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000000b-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000002-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Romanian Deadlift' LIMIT 1), 3, 8, 80.0, NOW() - INTERVAL '3 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000000c-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000002-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Leg Press' LIMIT 1), 3, 12, 120.0, NOW() - INTERVAL '3 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000000d-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000002-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Walking Lunge' LIMIT 1), 3, 12, 20.0, NOW() - INTERVAL '3 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000000e-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000002-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Calf Raise' LIMIT 1), 4, 15, 40.0, NOW() - INTERVAL '3 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000003: Push Day — Chest & Triceps (5 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000000f-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000003-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1), 3, 8, 77.5, NOW() - INTERVAL '5 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000010-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000003-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Incline Dumbbell Press' LIMIT 1), 3, 10, 26.0, NOW() - INTERVAL '5 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000011-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000003-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Overhead Press' LIMIT 1), 3, 8, 50.0, NOW() - INTERVAL '5 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000012-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000003-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Tricep Pushdown' LIMIT 1), 3, 12, 22.5, NOW() - INTERVAL '5 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;

-- Workout c0000004: Cardio HIIT (6 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000013-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000004-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Treadmill Run' LIMIT 1), 1, 1, NULL, NOW() - INTERVAL '6 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000014-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000004-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Jump Rope' LIMIT 1), 3, 1, NULL, NOW() - INTERVAL '6 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000015-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000004-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Burpees' LIMIT 1), 3, 20, NULL, NOW() - INTERVAL '6 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000005: Pull Day — Back & Biceps (7 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000016-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000005-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Pull-Up' LIMIT 1), 3, 9, NULL, NOW() - INTERVAL '7 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000017-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000005-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Row' LIMIT 1), 3, 8, 72.5, NOW() - INTERVAL '7 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000018-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000005-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Lat Pulldown' LIMIT 1), 3, 10, 57.5, NOW() - INTERVAL '7 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000019-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000005-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Curl' LIMIT 1), 3, 10, 30.0, NOW() - INTERVAL '7 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000006: Leg Day (8 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000001a-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000006-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Back Squat' LIMIT 1), 4, 6, 97.5, NOW() - INTERVAL '8 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000001b-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000006-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Romanian Deadlift' LIMIT 1), 3, 8, 77.5, NOW() - INTERVAL '8 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000001c-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000006-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Leg Press' LIMIT 1), 3, 12, 115.0, NOW() - INTERVAL '8 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000001d-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000006-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Calf Raise' LIMIT 1), 4, 15, 37.5, NOW() - INTERVAL '8 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000007: Full Body Strength (10 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000001e-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000007-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Deadlift' LIMIT 1), 3, 5, 120.0, NOW() - INTERVAL '10 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000001f-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000007-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1), 3, 8, 77.5, NOW() - INTERVAL '10 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000020-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000007-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Back Squat' LIMIT 1), 3, 6, 95.0, NOW() - INTERVAL '10 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000021-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000007-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Pull-Up' LIMIT 1), 3, 8, NULL, NOW() - INTERVAL '10 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000022-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000007-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Overhead Press' LIMIT 1), 2, 10, 47.5, NOW() - INTERVAL '10 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000008: Morning Run (11 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000023-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000008-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Treadmill Run' LIMIT 1), 1, 1, NULL, NOW() - INTERVAL '11 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000009: Push Day (13 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000024-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000009-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1), 3, 8, 75.0, NOW() - INTERVAL '13 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000025-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000009-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Overhead Press' LIMIT 1), 3, 8, 47.5, NOW() - INTERVAL '13 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000026-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000009-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Lateral Raise' LIMIT 1), 3, 15, 10.0, NOW() - INTERVAL '13 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000027-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000009-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Tricep Pushdown' LIMIT 1), 3, 12, 20.0, NOW() - INTERVAL '13 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c000000a: Pull Day — Deadlifts Focus (14 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000028-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000a-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Deadlift' LIMIT 1), 4, 5, 115.0, NOW() - INTERVAL '14 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000029-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000a-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Row' LIMIT 1), 3, 8, 70.0, NOW() - INTERVAL '14 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000002a-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000a-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Lat Pulldown' LIMIT 1), 3, 10, 55.0, NOW() - INTERVAL '14 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000002b-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000a-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Curl' LIMIT 1), 3, 10, 27.5, NOW() - INTERVAL '14 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;

-- Workout c000000b: Leg Day — Squat Focus (15 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000002c-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000b-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Back Squat' LIMIT 1), 5, 5, 102.5, NOW() - INTERVAL '15 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000002d-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000b-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Romanian Deadlift' LIMIT 1), 3, 8, 75.0, NOW() - INTERVAL '15 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000002e-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000b-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Walking Lunge' LIMIT 1), 3, 12, 18.0, NOW() - INTERVAL '15 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000002f-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000b-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Calf Raise' LIMIT 1), 4, 15, 35.0, NOW() - INTERVAL '15 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;

-- Workout c000000c: Upper Body (17 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000030-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000c-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1), 3, 8, 72.5, NOW() - INTERVAL '17 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000031-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000c-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Pull-Up' LIMIT 1), 3, 7, NULL, NOW() - INTERVAL '17 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000032-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000c-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Overhead Press' LIMIT 1), 3, 8, 45.0, NOW() - INTERVAL '17 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000033-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000c-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Row' LIMIT 1), 3, 8, 67.5, NOW() - INTERVAL '17 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000034-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000c-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Curl' LIMIT 1), 3, 10, 25.0, NOW() - INTERVAL '17 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;

-- Workout c000000d: Cardio HIIT (18 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000035-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000d-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Jump Rope' LIMIT 1), 4, 1, NULL, NOW() - INTERVAL '18 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000036-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000d-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Burpees' LIMIT 1), 3, 15, NULL, NOW() - INTERVAL '18 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;

-- Workout c000000e: Push Day (20 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000037-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000e-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1), 3, 8, 70.0, NOW() - INTERVAL '20 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000038-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000e-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Overhead Press' LIMIT 1), 3, 8, 42.5, NOW() - INTERVAL '20 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000039-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000e-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Tricep Pushdown' LIMIT 1), 3, 12, 17.5, NOW() - INTERVAL '20 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;

-- Workout c000000f: Pull Day (21 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000003a-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000f-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Pull-Up' LIMIT 1), 3, 6, NULL, NOW() - INTERVAL '21 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000003b-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000f-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Row' LIMIT 1), 3, 8, 65.0, NOW() - INTERVAL '21 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000003c-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c000000f-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Lat Pulldown' LIMIT 1), 3, 10, 52.5, NOW() - INTERVAL '21 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000010: Leg Day (22 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000003d-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000010-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Back Squat' LIMIT 1), 4, 6, 92.5, NOW() - INTERVAL '22 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000003e-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000010-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Romanian Deadlift' LIMIT 1), 3, 8, 72.5, NOW() - INTERVAL '22 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000003f-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000010-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Leg Press' LIMIT 1), 3, 12, 110.0, NOW() - INTERVAL '22 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000040-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000010-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Calf Raise' LIMIT 1), 4, 15, 32.5, NOW() - INTERVAL '22 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000011: Full Body Strength (24 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000041-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000011-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Deadlift' LIMIT 1), 3, 5, 110.0, NOW() - INTERVAL '24 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000042-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000011-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1), 3, 8, 70.0, NOW() - INTERVAL '24 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000043-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000011-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Back Squat' LIMIT 1), 3, 6, 90.0, NOW() - INTERVAL '24 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000044-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000011-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Pull-Up' LIMIT 1), 3, 6, NULL, NOW() - INTERVAL '24 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000012: Morning Run (25 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000045-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000012-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Treadmill Run' LIMIT 1), 1, 1, NULL, NOW() - INTERVAL '25 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000013: Push Day (27 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000046-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000013-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1), 3, 8, 67.5, NOW() - INTERVAL '27 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000047-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000013-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Overhead Press' LIMIT 1), 3, 8, 40.0, NOW() - INTERVAL '27 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000048-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000013-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Lateral Raise' LIMIT 1), 3, 15, 8.0, NOW() - INTERVAL '27 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000014: Pull Day (28 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d0000049-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000014-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Pull-Up' LIMIT 1), 3, 5, NULL, NOW() - INTERVAL '28 days' + INTERVAL '6 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000004a-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000014-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Row' LIMIT 1), 3, 8, 62.5, NOW() - INTERVAL '28 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000004b-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000014-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Barbell Curl' LIMIT 1), 3, 10, 22.5, NOW() - INTERVAL '28 days' + INTERVAL '7 hours') ON CONFLICT DO NOTHING;

-- Workout c0000015: Leg Day — Squat Focus (29 days ago)
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000004c-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000015-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Back Squat' LIMIT 1), 4, 6, 87.5, NOW() - INTERVAL '29 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000004d-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000015-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Romanian Deadlift' LIMIT 1), 3, 8, 70.0, NOW() - INTERVAL '29 days' + INTERVAL '8 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000004e-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000015-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Leg Press' LIMIT 1), 3, 12, 105.0, NOW() - INTERVAL '29 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;
INSERT INTO workout_logs (id, user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, logged_at) VALUES ('d000004f-demo-4log-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c0000015-demo-4fit-0000-ef1234567890', (SELECT id FROM exercises WHERE name = 'Calf Raise' LIMIT 1), 4, 15, 30.0, NOW() - INTERVAL '29 days' + INTERVAL '9 hours') ON CONFLICT DO NOTHING;

-- ── Nutrition Logs ───────────────────────────────────────────────
-- Real foods with accurate macros. 3 meals + occasional snack.
-- Pattern: Oatmeal breakfast / Chicken + Rice lunch / Protein dinner / snack
-- Skips ~12% of days for realism

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000000-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oatmeal (80g dry)', 300, 10, 54, 6, '2026-04-26 07:12:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000001-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Breast (200g)', 330, 62, 0, 7, '2026-04-26 13:05:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000002-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Brown Rice (150g cooked)', 165, 4, 34, 1, '2026-04-26 13:05:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000003-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Salmon Fillet (180g)', 350, 40, 0, 20, '2026-04-26 19:30:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000004-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Eggs x3 scrambled', 210, 18, 2, 14, '2026-04-25 07:30:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000005-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Breast (200g)', 325, 62, 0, 7, '2026-04-25 13:15:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000006-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Greek Yogurt (200g)', 130, 17, 10, 0, '2026-04-25 16:10:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000007-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Salmon Fillet (180g)', 350, 40, 0, 20, '2026-04-25 19:20:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000008-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oatmeal (80g dry)', 295, 10, 54, 6, '2026-04-24 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000009-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Canned Tuna (150g)', 180, 36, 0, 4, '2026-04-24 13:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000000a-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Brown Rice (150g cooked)', 165, 4, 34, 1, '2026-04-24 13:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000000b-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beef Mince 90% lean (150g)', 240, 28, 0, 14, '2026-04-24 19:45:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000000c-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sweet Potato (200g)', 180, 4, 41, 0, '2026-04-24 19:45:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000000d-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Eggs x3 scrambled', 215, 18, 2, 14, '2026-04-23 07:20:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000000e-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Breast (200g)', 320, 62, 0, 7, '2026-04-23 13:30:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000000f-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Almonds (25g)', 145, 5, 5, 13, '2026-04-23 16:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000010-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lentil Soup (300ml)', 180, 13, 28, 2, '2026-04-23 19:15:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000011-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oatmeal (80g dry)', 305, 10, 54, 6, '2026-04-22 07:05:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000012-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Whey Protein Shake', 160, 32, 5, 2, '2026-04-22 13:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000013-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Salmon Fillet (180g)', 345, 40, 0, 20, '2026-04-22 19:30:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000014-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sweet Potato (200g)', 175, 4, 41, 0, '2026-04-22 19:30:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000015-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Eggs x3 scrambled', 210, 18, 2, 14, '2026-04-21 07:40:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000016-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Breast (200g)', 330, 62, 0, 7, '2026-04-21 13:10:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000017-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Brown Rice (150g cooked)', 165, 4, 34, 1, '2026-04-21 13:10:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000018-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Greek Yogurt (200g)', 130, 17, 10, 0, '2026-04-21 16:20:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000019-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beef Mince 90% lean (150g)', 245, 28, 0, 14, '2026-04-21 19:50:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000001a-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oatmeal (80g dry)', 298, 10, 54, 6, '2026-04-20 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000001b-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Canned Tuna (150g)', 175, 36, 0, 4, '2026-04-20 13:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000001c-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cottage Cheese (200g)', 160, 24, 8, 4, '2026-04-20 19:20:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000001d-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Eggs x3 scrambled', 208, 18, 2, 14, '2026-04-19 07:15:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000001e-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Breast (200g)', 335, 62, 0, 7, '2026-04-19 13:20:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000001f-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sweet Potato (200g)', 182, 4, 41, 0, '2026-04-19 13:20:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000020-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mixed Nuts (30g)', 180, 5, 6, 16, '2026-04-19 16:30:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000021-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Salmon Fillet (180g)', 352, 40, 0, 20, '2026-04-19 19:40:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000022-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oatmeal (80g dry)', 302, 10, 54, 6, '2026-04-17 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000023-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Whey Protein Shake', 162, 32, 5, 2, '2026-04-17 13:30:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000024-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beef Mince 90% lean (150g)', 238, 28, 0, 14, '2026-04-17 19:15:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000025-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Eggs x3 scrambled', 212, 18, 2, 14, '2026-04-16 07:30:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000026-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Breast (200g)', 328, 62, 0, 7, '2026-04-16 13:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000027-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lentil Soup (300ml)', 183, 13, 28, 2, '2026-04-16 19:30:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000028-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oatmeal (80g dry)', 300, 10, 54, 6, '2026-04-15 07:10:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000029-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Canned Tuna (150g)', 178, 36, 0, 4, '2026-04-15 13:10:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000002a-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Greek Yogurt (200g)', 132, 17, 10, 0, '2026-04-15 16:15:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000002b-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Salmon Fillet (180g)', 348, 40, 0, 20, '2026-04-15 19:45:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000002c-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Eggs x3 scrambled', 206, 18, 2, 14, '2026-04-14 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000002d-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Breast (200g)', 332, 62, 0, 7, '2026-04-14 13:25:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000002e-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Brown Rice (150g cooked)', 162, 4, 34, 1, '2026-04-14 13:25:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e000002f-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beef Mince 90% lean (150g)', 242, 28, 0, 14, '2026-04-14 19:10:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000030-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oatmeal (80g dry)', 297, 10, 54, 6, '2026-04-12 07:05:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000031-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Whey Protein Shake', 158, 32, 5, 2, '2026-04-12 13:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000032-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Salmon Fillet (180g)', 355, 40, 0, 20, '2026-04-12 19:40:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000033-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Eggs x3 scrambled', 213, 18, 2, 14, '2026-04-11 07:25:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000034-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chicken Breast (200g)', 326, 62, 0, 7, '2026-04-11 13:15:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000035-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Almonds (25g)', 148, 5, 5, 13, '2026-04-11 16:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000036-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lentil Soup (300ml)', 177, 13, 28, 2, '2026-04-11 19:20:00+00') ON CONFLICT DO NOTHING;

INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000037-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oatmeal (80g dry)', 303, 10, 54, 6, '2026-04-09 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000038-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Canned Tuna (150g)', 182, 36, 0, 4, '2026-04-09 13:05:00+00') ON CONFLICT DO NOTHING;
INSERT INTO nutrition_logs (id, user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES ('e0000039-demo-4nut-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cottage Cheese (200g)', 157, 24, 8, 4, '2026-04-09 19:30:00+00') ON CONFLICT DO NOTHING;

-- ── Wearable Data — Weight Trend ─────────────────────────────────
-- 22 entries over 30 days: 80.2 kg → 78.5 kg with realistic daily variance
-- Weigh-ins skipped on some days (morning only, before eating)

INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000000-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 78.5, 'kg', '2026-04-26 06:55:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000001-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 78.7, 'kg', '2026-04-25 07:02:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000002-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 78.6, 'kg', '2026-04-24 07:10:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000003-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 78.9, 'kg', '2026-04-23 06:58:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000004-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.1, 'kg', '2026-04-21 07:05:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000005-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.0, 'kg', '2026-04-20 07:12:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000006-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.3, 'kg', '2026-04-19 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000007-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.2, 'kg', '2026-04-18 07:08:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000008-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.5, 'kg', '2026-04-16 07:03:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000009-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.4, 'kg', '2026-04-15 06:55:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f000000a-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.6, 'kg', '2026-04-14 07:10:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f000000b-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.8, 'kg', '2026-04-12 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f000000c-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.7, 'kg', '2026-04-11 07:15:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f000000d-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 80.0, 'kg', '2026-04-09 06:50:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f000000e-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 80.1, 'kg', '2026-04-08 07:05:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f000000f-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 79.9, 'kg', '2026-04-07 07:02:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000010-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 80.2, 'kg', '2026-04-05 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000011-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 80.3, 'kg', '2026-04-04 06:58:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000012-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 80.1, 'kg', '2026-04-03 07:10:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000013-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 80.4, 'kg', '2026-04-01 07:05:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000014-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 80.5, 'kg', '2026-03-30 07:00:00+00') ON CONFLICT DO NOTHING;
INSERT INTO wearable_data (id, user_id, metric, value, unit, recorded_at) VALUES ('f0000015-demo-4wgt-0000-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weight_kg', 80.2, 'kg', '2026-03-28 06:55:00+00') ON CONFLICT DO NOTHING;

COMMIT;

-- ── Done ──────────────────────────────────────────────────────────
-- Demo account loaded:
--   Email:    demo@mrfit.app
--   Password: demo123
--
-- NOTE: The bcrypt hash above was generated independently.
-- If login fails, regenerate it with:
--   node -e "require('bcrypt').hash('demo123',10).then(console.log)"
-- Then UPDATE users SET password_hash='<new_hash>' WHERE email='demo@mrfit.app';
