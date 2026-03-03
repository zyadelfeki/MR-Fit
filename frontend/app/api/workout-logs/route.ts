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
            sets_completed,
            reps_completed,
            weight_kg,
            notes,
        } = await req.json();

        if (!exercise_id || sets_completed == null || reps_completed == null) {
            return NextResponse.json(
                { error: "exercise_id, sets_completed, and reps_completed are required" },
                { status: 400 }
            );
        }

        const res = await pool.query(
            `INSERT INTO workout_logs
         (user_id, workout_id, exercise_id, sets_completed, reps_completed, weight_kg, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
            [
                session.user.id,
                workout_id || null,
                exercise_id,
                Number(sets_completed),
                Number(reps_completed),
                weight_kg != null ? Number(weight_kg) : null,
                notes || null,
            ]
        );

        return NextResponse.json({ success: true, id: res.rows[0].id });
    } catch (err: any) {
        console.error("POST /api/workout-logs error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
