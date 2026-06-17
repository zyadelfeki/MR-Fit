import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withDb } from "@/lib/db";

// GET /api/workouts — list all workouts for the current user
export async function GET() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const rows = await withDb(async (client) => {
            const res = await client.query(
                `SELECT id, title, source, duration_min, scheduled_at, created_at
                 FROM workouts
                 WHERE user_id = $1
                 ORDER BY scheduled_at DESC NULLS LAST, created_at DESC`,
                [userId]
            );
            return res.rows;
        });

        return NextResponse.json({ workouts: rows });
    } catch (err: any) {
        console.error("GET /api/workouts error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/workouts — create a new workout
export async function POST(req: Request) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, scheduled_at, duration_min, source, exercises } = await req.json();

        if (!title) {
            return NextResponse.json({ error: "title is required" }, { status: 400 });
        }

        const workoutId = await withDb(async (client) => {
            await client.query("BEGIN");
            try {
                const res = await client.query(
                    `INSERT INTO workouts (user_id, title, scheduled_at, duration_min, source)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                    [
                        userId,
                        title,
                        scheduled_at ? new Date(scheduled_at).toISOString() : null,
                        duration_min ? Number(duration_min) : null,
                        source === "ai" || source === "trainer" || source === "user" ? source : "user",
                    ]
                );
                const wId = res.rows[0].id;

                if (Array.isArray(exercises)) {
                    for (let index = 0; index < exercises.length; index += 1) {
                        const item = exercises[index];
                        const exerciseName = item.name?.trim();
                        if (!exerciseName) continue;

                        const existingExercise = await client.query(
                            `SELECT id FROM exercises WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                            [exerciseName]
                        );
                        let exerciseId = existingExercise.rows[0]?.id;

                        if (!exerciseId) {
                            const newExercise = await client.query(
                                    `INSERT INTO exercises (name, muscle_group, difficulty)
                                     VALUES ($1, $2, $3)
                                     RETURNING id`,
                                    [exerciseName, "general", "beginner"]
                            );
                            exerciseId = newExercise.rows[0].id;
                        }

                        await client.query(
                            `INSERT INTO workout_exercises
                                (workout_id, exercise_id, sets_target, reps_target, weight_kg, order_index)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [
                                wId,
                                exerciseId,
                                Math.max(1, Number(item.sets ?? 3)),
                                Math.max(1, Number(item.reps ?? 10)),
                                item.weight_kg == null ? null : Number(item.weight_kg),
                                index,
                            ]
                        );
                    }
                }
                await client.query("COMMIT");
                return wId;
            } catch (dbErr) {
                await client.query("ROLLBACK");
                throw dbErr;
            }
        });

        return NextResponse.json({ success: true, id: workoutId });
    } catch (err: any) {
        console.error("POST /api/workouts error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
