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

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();

    try {
        const body = (await req.json()) as { template_id?: string };
        const templateId = body.template_id;

        if (!templateId) {
            return NextResponse.json({ error: "template_id is required" }, { status: 400 });
        }

        const templateRes = await client.query(
            `SELECT id, name, exercises
             FROM workout_templates
             WHERE id = $1 AND user_id = $2
             LIMIT 1`,
            [templateId, session.user.id]
        );

        if (templateRes.rowCount === 0) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        const template = templateRes.rows[0] as {
            name: string;
            exercises: TemplateExercise[];
        };

        await client.query("BEGIN");

        const workoutRes = await client.query(
            `INSERT INTO workouts (user_id, title, source, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id`,
            [session.user.id, template.name, "user"]
        );

        const workoutId = workoutRes.rows[0].id as string;

        const templateExercises = Array.isArray(template.exercises) ? template.exercises : [];

        for (const item of templateExercises) {
            const exerciseName = item.name?.trim();
            if (!exerciseName) {
                continue;
            }

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

            const sets = Math.max(1, Number(item.sets ?? 3));
            const reps = Math.max(1, Number(item.reps ?? 10));
            const weight = item.weight_kg == null ? null : Number(item.weight_kg);
            const notes = item.notes?.trim() || null;

            const workoutLog = await client.query(
                `INSERT INTO workout_logs
                    (user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, notes, logged_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                 RETURNING id`,
                [session.user.id, workoutId, exerciseId, sets, reps, weight, notes]
            );

            await client.query(
                `INSERT INTO workout_log_exercises
                    (workout_log_id, exercise_name, sets, reps, weight_kg, notes)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [workoutLog.rows[0].id, exerciseName, sets, reps, weight, notes]
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
