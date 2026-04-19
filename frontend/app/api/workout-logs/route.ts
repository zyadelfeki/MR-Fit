import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// POST /api/workout-logs — insert a workout set log
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const {
            workout_id,
            exercise_id,
            exercise_name,
            sets_completed,
            reps_completed,
            weight_kg,
            notes,
        } = await req.json();

        const normalizedExerciseName = typeof exercise_name === "string" ? exercise_name.trim() : "";
        const normalizedExerciseId = typeof exercise_id === "string" ? exercise_id.trim() : "";

        if ((!normalizedExerciseId && !normalizedExerciseName) || sets_completed == null || reps_completed == null) {
            return NextResponse.json(
                { error: "exercise_id or exercise_name, sets_completed, and reps_completed are required" },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            let resolvedExerciseId = normalizedExerciseId || null;

            if (!resolvedExerciseId) {
                const existingExercise = await client.query(
                    `SELECT id
                     FROM exercises
                     WHERE LOWER(name) = LOWER($1)
                     LIMIT 1`,
                    [normalizedExerciseName]
                );

                resolvedExerciseId = existingExercise.rows[0]?.id ?? null;

                if (!resolvedExerciseId) {
                    const createdExercise = await client.query(
                        `INSERT INTO exercises (name, muscle_group, difficulty)
                         VALUES ($1, $2, $3)
                         RETURNING id`,
                        [normalizedExerciseName, "general", "beginner"]
                    );
                    resolvedExerciseId = createdExercise.rows[0].id as string;
                }
            }

            const res = await client.query(
                `INSERT INTO workout_logs
                 (user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [
                    session.user.id,
                    workout_id || null,
                    resolvedExerciseId,
                    Number(sets_completed),
                    Number(reps_completed),
                    weight_kg != null ? Number(weight_kg) : null,
                    notes || null,
                ]
            );

            await client.query("COMMIT");
            return NextResponse.json({ success: true, id: res.rows[0].id, exercise_id: resolvedExerciseId });
        } catch (err: any) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (err: any) {
        console.error("POST /api/workout-logs error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
