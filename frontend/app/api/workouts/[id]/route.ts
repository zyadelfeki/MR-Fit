import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withDb } from "@/lib/db";

// GET /api/workouts/[id] — fetch workout detail with planned exercises
export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;

        // Fetch workout and planned exercises inside withDb
        const result = await withDb(async (client) => {
            // Fetch workout and verify ownership
            const workoutRes = await client.query(
                `SELECT id, title, duration_min, scheduled_at, source
                 FROM workouts
                 WHERE id = $1 AND user_id = $2`,
                [id, userId]
            );

            if (workoutRes.rows.length === 0) {
                return null;
            }

            const workout = workoutRes.rows[0];

            // Fetch planned workout exercises in display order
            const exercisesRes = await client.query(
                `SELECT we.id as workout_exercise_id, we.exercise_id, we.sets_target, we.reps_target,
                        we.order_index, e.name, e.muscle_group, e.difficulty, e.description
                 FROM workout_exercises we
                 JOIN exercises e ON e.id = we.exercise_id
                 WHERE we.workout_id = $1
                 ORDER BY we.order_index ASC`,
                [id]
            );

            return {
                workout,
                exercises: exercisesRes.rows,
            };
        });

        if (!result) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: result.workout.id,
            title: result.workout.title,
            duration_min: result.workout.duration_min,
            scheduled_at: result.workout.scheduled_at,
            source: result.workout.source,
            exercises: result.exercises,
        });
    } catch (err: any) {
        console.error("GET /api/workouts/[id] error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/workouts/[id] — delete a workout
export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;

        await withDb(async (client) => {
            await client.query(
                "DELETE FROM workouts WHERE id = $1 AND user_id = $2",
                [id, userId]
            );
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE /api/workouts/[id] error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
