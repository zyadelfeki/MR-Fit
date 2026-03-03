import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// GET /api/workouts/[id] — fetch workout detail with logged exercises
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
            `SELECT id, title, source, duration_min, scheduled_at, created_at
       FROM workouts
       WHERE id = $1 AND user_id = $2`,
            [id, session.user.id]
        );

        if (workoutRes.rows.length === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const workout = workoutRes.rows[0];

        // Fetch logs for this workout
        const logsRes = await pool.query(
            `SELECT wl.id, wl.sets_completed, wl.reps_completed, wl.weight_kg,
              wl.logged_at, wl.notes, e.name AS exercise_name
       FROM workout_logs wl
       LEFT JOIN exercises e ON wl.exercise_id = e.id
       WHERE wl.workout_id = $1
       ORDER BY wl.logged_at ASC`,
            [id]
        );

        // Fetch all exercises for the log form dropdown
        const exercisesRes = await pool.query(
            `SELECT id, name FROM exercises ORDER BY name ASC`
        );

        return NextResponse.json({
            workout,
            logs: logsRes.rows,
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
