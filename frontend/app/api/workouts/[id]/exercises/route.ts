import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const workoutId = params.id;

        const rows = await pool.query(
            `SELECT
                wle.id,
                wle.workout_log_id,
                wle.exercise_name,
                wle.sets,
                wle.reps,
                wle.weight_kg,
                wle.notes,
                wl.logged_at
             FROM workout_log_exercises wle
             JOIN workout_logs wl ON wl.id = wle.workout_log_id
             WHERE wl.workout_id = $1 AND wl.user_id = $2
             ORDER BY wl.logged_at DESC`,
            [workoutId, session.user.id]
        );

        return NextResponse.json({ exercises: rows.rows });
    } catch (error) {
        console.error("GET /api/workouts/[id]/exercises error:", error);
        return NextResponse.json({ error: "Failed to load workout exercises" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();

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

        const workoutRes = await client.query(
            `SELECT id
             FROM workouts
             WHERE id = $1 AND user_id = $2
             LIMIT 1`,
            [workoutId, session.user.id]
        );

        if (workoutRes.rowCount === 0) {
            return NextResponse.json({ error: "Workout not found" }, { status: 404 });
        }

        await client.query("BEGIN");

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

        const workoutLog = await client.query(
            `INSERT INTO workout_logs
                (user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, notes, logged_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING id, logged_at`,
            [
                session.user.id,
                workoutId,
                exerciseId,
                sets,
                reps,
                weightKg,
                notes,
            ]
        );

        const insertExercise = await client.query(
            `INSERT INTO workout_log_exercises
                (workout_log_id, exercise_name, sets, reps, weight_kg, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                workoutLog.rows[0].id,
                exerciseName,
                sets,
                reps,
                weightKg,
                notes,
            ]
        );

        await client.query("COMMIT");

        return NextResponse.json({
            exercise: {
                ...insertExercise.rows[0],
                logged_at: workoutLog.rows[0].logged_at,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("POST /api/workouts/[id]/exercises error:", error);
        return NextResponse.json({ error: "Failed to add exercise" }, { status: 500 });
    } finally {
        client.release();
    }
}
