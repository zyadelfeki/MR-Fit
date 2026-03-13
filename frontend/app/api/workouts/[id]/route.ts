import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// GET /api/workouts/[id] — fetch workout detail with planned exercises
export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;

        // Fetch workout and verify ownership
        const workoutRes = await pool.query(
            `SELECT id, title, duration_min, scheduled_at, source
       FROM workouts
       WHERE id = $1 AND user_id = $2`,
            [id, session.user.id]
        );

        if (workoutRes.rows.length === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const workout = workoutRes.rows[0];

        // Fetch planned workout exercises in display order
        const exercisesRes = await pool.query(
            `SELECT we.id as workout_exercise_id, we.exercise_id, we.sets_target, we.reps_target,
              we.order_index, e.name, e.muscle_group, e.difficulty, e.description
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id = $1
       ORDER BY we.order_index ASC`,
            [id]
        );

        return NextResponse.json({
            id: workout.id,
            title: workout.title,
            duration_min: workout.duration_min,
            scheduled_at: workout.scheduled_at,
            source: workout.source,
            exercises: exercisesRes.rows,
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
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;

        await pool.query(
            "DELETE FROM workouts WHERE id = $1 AND user_id = $2",
            [id, session.user.id]
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE /api/workouts/[id] error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
