import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

type TemplateExercise = {
  name: string;
  sets?: number;
  reps?: number;
  weight_kg?: number | null;
  notes?: string;
};

async function ensureTemplateTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await pool.connect();

  try {
    await ensureTemplateTable();
    const body = (await req.json()) as { template_id?: string };
    const templateId = body.template_id;

    if (!templateId) return NextResponse.json({ error: "template_id is required" }, { status: 400 });

    const templateRes = await client.query(
      `SELECT id, name, exercises
         FROM workout_templates
        WHERE id = $1 AND user_id = $2
        LIMIT 1`,
      [templateId, session.user.id]
    );

    if (templateRes.rowCount === 0) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const template = templateRes.rows[0] as { name: string; exercises: TemplateExercise[] };

    await client.query("BEGIN");

    const workoutRes = await client.query(
      `INSERT INTO workouts (user_id, title, source, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [session.user.id, template.name, "user"]
    );

    const workoutId = workoutRes.rows[0].id as string;
    const templateExercises = Array.isArray(template.exercises) ? template.exercises : [];

    for (let index = 0; index < templateExercises.length; index += 1) {
      const item = templateExercises[index];
      const exerciseName = item.name?.trim();
      if (!exerciseName) continue;

      const existingExercise = await client.query(
        `SELECT id FROM exercises WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [exerciseName]
      );

      let exerciseId = existingExercise.rows[0]?.id as string | undefined;

      if (!exerciseId) {
        const newExercise = await client.query(
          `INSERT INTO exercises (name, muscle_group, difficulty)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [exerciseName, "general", "beginner"]
        );
        exerciseId = newExercise.rows[0].id as string;
      }

      await client.query(
        `INSERT INTO workout_exercises
            (workout_id, exercise_id, sets_target, reps_target, weight_kg, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          workoutId,
          exerciseId,
          Math.max(1, Number(item.sets ?? 3)),
          Math.max(1, Number(item.reps ?? 10)),
          item.weight_kg == null ? null : Number(item.weight_kg),
          index,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ workout_id: workoutId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/workout-templates/start error:", error);
    return NextResponse.json({ error: "Failed to start workout from template" }, { status: 500 });
  } finally {
    client.release();
  }
}
