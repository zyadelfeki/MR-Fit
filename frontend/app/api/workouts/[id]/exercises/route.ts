import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withDb } from "@/lib/db";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const workoutId = params.id;

    const rows = await withDb(async (client) => {
      const res = await client.query(
        `SELECT
            wl.id,
            wl.id AS workout_log_id,
            e.name AS exercise_name,
            wl.sets_completed AS sets,
            wl.reps_completed AS reps,
            wl.weight_kg,
            wl.notes,
            wl.logged_at
         FROM workout_logs wl
         JOIN exercises e ON e.id = wl.exercise_id
         WHERE wl.workout_id = $1 AND wl.user_id = $2
         ORDER BY wl.logged_at DESC`,
        [workoutId, session.user.id]
      );
      return res.rows;
    });

    return NextResponse.json({ exercises: rows });
  } catch (error) {
    console.error("GET /api/workouts/[id]/exercises error:", error);
    return NextResponse.json({ error: "Failed to load workout exercises" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const workoutId = params.id;
    const body = (await req.json()) as {
      exercise_name?: string;
      sets?: number;
      reps?: number;
      weight_kg?: number | null;
      notes?: string;
    };

    const exerciseName = body.exercise_name?.trim();
    const sets = Number(body.sets ?? 0);
    const reps = Number(body.reps ?? 0);
    const weightKg = body.weight_kg == null ? null : Number(body.weight_kg);
    const notes = body.notes?.trim() || null;

    if (!exerciseName || sets <= 0 || reps <= 0) {
      return NextResponse.json({ error: "exercise_name, sets, and reps are required" }, { status: 400 });
    }

    const result = await withDb(async (client) => {
      const workoutRes = await client.query(
        `SELECT id FROM workouts WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [workoutId, session.user.id]
      );

      if (workoutRes.rowCount === 0) {
        return { errorStatus: 404, error: "Workout not found" };
      }

      await client.query("BEGIN");
      try {
        const existingExercise = await client.query(
          `SELECT id FROM exercises WHERE LOWER(name) = LOWER($1) LIMIT 1`,
          [exerciseName]
        );

        let exerciseId = existingExercise.rows[0]?.id as string | undefined;

        if (!exerciseId) {
          const createdExercise = await client.query(
            `INSERT INTO exercises (name, muscle_group, difficulty)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [exerciseName, "general", "beginner"]
          );
          exerciseId = createdExercise.rows[0].id as string;
        }

        const inserted = await client.query(
          `INSERT INTO workout_logs
              (user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, notes, logged_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING id, logged_at`,
          [session.user.id, workoutId, exerciseId, sets, reps, weightKg, notes]
        );

        await client.query("COMMIT");
        return {
          success: true,
          exercise: {
            id: inserted.rows[0].id,
            workout_log_id: inserted.rows[0].id,
            exercise_name: exerciseName,
            sets,
            reps,
            weight_kg: weightKg,
            notes,
            logged_at: inserted.rows[0].logged_at,
          }
        };
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.errorStatus });
    }

    return NextResponse.json({ exercise: result.exercise });
  } catch (error) {
    console.error("POST /api/workouts/[id]/exercises error:", error);
    return NextResponse.json({ error: "Failed to add exercise" }, { status: 500 });
  }
}
