-- MR-Fit Demo Seed Data
-- HOW TO USE: psql "$DATABASE_URL" -f database/demo_seed.sql
-- WARNING: Creates a demo user. Do NOT run on production.
-- To remove: DELETE FROM users WHERE email='demo@mrfit.app';

-- Demo user UUID
-- All inserts reference this ID.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@mrfit.app') THEN

    -- ─── USER ──────────────────────────────────────────────────────────────────
    INSERT INTO users (id, email, password_hash, created_at)
    VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'demo@mrfit.app',
      '$2b$10$demoHashPlaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      NOW() - INTERVAL '35 days'
    );

    -- ─── PROFILE ───────────────────────────────────────────────────────────────
    INSERT INTO profiles (
      user_id, display_name, date_of_birth, gender,
      height_cm, weight_kg, fitness_goal, fitness_level,
      calorie_goal, protein_goal, carb_goal, fat_goal,
      onboarding_completed
    ) VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Alex Demo', '1998-05-14', 'male',
      180, 78.5, 'build_muscle', 'intermediate',
      2400, 180, 240, 65,
      true
    );

  END IF;
END $$;

-- ─── WORKOUTS (last 30 days, realistic gaps) ───────────────────────────────────
INSERT INTO workouts (user_id, title, duration_min, scheduled_at, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Push Day',         65, NOW()-INTERVAL '1 day',  NOW()-INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Pull Day',         55, NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Leg Day',          70, NOW()-INTERVAL '5 days', NOW()-INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Morning Run',      35, NOW()-INTERVAL '6 days', NOW()-INTERVAL '6 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Upper Body',       60, NOW()-INTERVAL '8 days', NOW()-INTERVAL '8 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Cardio HIIT',      40, NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Push Day',         60, NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Core & Abs',       30, NOW()-INTERVAL '13 days',NOW()-INTERVAL '13 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Pull Day',         55, NOW()-INTERVAL '15 days',NOW()-INTERVAL '15 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Leg Day',          75, NOW()-INTERVAL '17 days',NOW()-INTERVAL '17 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Full Body',        60, NOW()-INTERVAL '19 days',NOW()-INTERVAL '19 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Morning Run',      40, NOW()-INTERVAL '20 days',NOW()-INTERVAL '20 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Upper Body',       55, NOW()-INTERVAL '22 days',NOW()-INTERVAL '22 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Cardio HIIT',      35, NOW()-INTERVAL '24 days',NOW()-INTERVAL '24 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Push Day',         65, NOW()-INTERVAL '25 days',NOW()-INTERVAL '25 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Pull Day',         50, NOW()-INTERVAL '27 days',NOW()-INTERVAL '27 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Leg Day',          70, NOW()-INTERVAL '29 days',NOW()-INTERVAL '29 days')
ON CONFLICT DO NOTHING;

-- ─── NUTRITION LOGS (last 30 days, ~3/day on active days) ──────────────────────
INSERT INTO nutrition_logs (user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at) VALUES
  -- Day 1
  ('00000000-0000-0000-0000-000000000001'::uuid,'Oatmeal',          350, 12, 58, 7,  NOW()-INTERVAL '1 day'+TIME '08:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Chicken Breast',   300, 45, 0,  5,  NOW()-INTERVAL '1 day'+TIME '13:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Protein Shake',    220, 30, 15, 5,  NOW()-INTERVAL '1 day'+TIME '18:00:00'),
  -- Day 2
  ('00000000-0000-0000-0000-000000000001'::uuid,'Greek Yogurt',     150, 17, 10, 3,  NOW()-INTERVAL '2 days'+TIME '08:30:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Salmon',           350, 42, 0,  18, NOW()-INTERVAL '2 days'+TIME '13:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Brown Rice',       220, 5,  45, 2,  NOW()-INTERVAL '2 days'+TIME '13:05:00'),
  -- Day 3
  ('00000000-0000-0000-0000-000000000001'::uuid,'Eggs (3)',         210, 18, 1,  15, NOW()-INTERVAL '3 days'+TIME '09:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Whole Wheat Bread',160, 6,  30, 2,  NOW()-INTERVAL '3 days'+TIME '09:05:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Tuna Steak',       280, 44, 0,  9,  NOW()-INTERVAL '3 days'+TIME '13:00:00'),
  -- Day 4
  ('00000000-0000-0000-0000-000000000001'::uuid,'Banana',           105, 1,  27, 0,  NOW()-INTERVAL '4 days'+TIME '08:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Chicken Breast',   300, 45, 0,  5,  NOW()-INTERVAL '4 days'+TIME '12:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Sweet Potato',     115, 2,  27, 0,  NOW()-INTERVAL '4 days'+TIME '12:05:00'),
  -- Day 5
  ('00000000-0000-0000-0000-000000000001'::uuid,'Oatmeal',          350, 12, 58, 7,  NOW()-INTERVAL '5 days'+TIME '08:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Almonds (30g)',     175, 6,  5,  15, NOW()-INTERVAL '5 days'+TIME '11:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Salmon',           350, 42, 0,  18, NOW()-INTERVAL '5 days'+TIME '13:00:00'),
  -- Day 6
  ('00000000-0000-0000-0000-000000000001'::uuid,'Greek Yogurt',     150, 17, 10, 3,  NOW()-INTERVAL '6 days'+TIME '08:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Cottage Cheese',   200, 28, 6,  5,  NOW()-INTERVAL '6 days'+TIME '10:30:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Chicken Breast',   300, 45, 0,  5,  NOW()-INTERVAL '6 days'+TIME '13:00:00'),
  -- Day 8
  ('00000000-0000-0000-0000-000000000001'::uuid,'Eggs (3)',         210, 18, 1,  15, NOW()-INTERVAL '8 days'+TIME '09:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Broccoli',          55, 4,  11, 1,  NOW()-INTERVAL '8 days'+TIME '13:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Brown Rice',       220, 5,  45, 2,  NOW()-INTERVAL '8 days'+TIME '13:05:00'),
  -- Day 10
  ('00000000-0000-0000-0000-000000000001'::uuid,'Oatmeal',          350, 12, 58, 7,  NOW()-INTERVAL '10 days'+TIME '08:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Protein Shake',    220, 30, 15, 5,  NOW()-INTERVAL '10 days'+TIME '17:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Chicken Breast',   300, 45, 0,  5,  NOW()-INTERVAL '10 days'+TIME '13:00:00'),
  -- Day 12
  ('00000000-0000-0000-0000-000000000001'::uuid,'Banana',           105, 1,  27, 0,  NOW()-INTERVAL '12 days'+TIME '08:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Tuna Steak',       280, 44, 0,  9,  NOW()-INTERVAL '12 days'+TIME '13:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Sweet Potato',     115, 2,  27, 0,  NOW()-INTERVAL '12 days'+TIME '13:05:00'),
  -- Day 15
  ('00000000-0000-0000-0000-000000000001'::uuid,'Greek Yogurt',     150, 17, 10, 3,  NOW()-INTERVAL '15 days'+TIME '08:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Salmon',           350, 42, 0,  18, NOW()-INTERVAL '15 days'+TIME '12:00:00'),
  ('00000000-0000-0000-0000-000000000001'::uuid,'Broccoli',          55, 4,  11, 1,  NOW()-INTERVAL '15 days'+TIME '12:05:00')
ON CONFLICT DO NOTHING;

-- ─── WEIGHT LOGS (30 days, gradual downward trend) ─────────────────────────────
INSERT INTO weight_logs (user_id, weight_kg, logged_at) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 80.2, NOW()-INTERVAL '29 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 80.4, NOW()-INTERVAL '27 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 80.0, NOW()-INTERVAL '25 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 79.8, NOW()-INTERVAL '23 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 80.1, NOW()-INTERVAL '21 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 79.6, NOW()-INTERVAL '19 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 79.4, NOW()-INTERVAL '17 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 79.7, NOW()-INTERVAL '15 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 79.2, NOW()-INTERVAL '13 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 79.0, NOW()-INTERVAL '11 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 79.3, NOW()-INTERVAL '9 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 78.9, NOW()-INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 78.7, NOW()-INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 79.0, NOW()-INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 78.5, NOW()-INTERVAL '1 day')
ON CONFLICT DO NOTHING;
