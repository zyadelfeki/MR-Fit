import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

type SessionLog = {
    exercise_id: string;
    sets_completed: number;
    reps_completed: number;
    weight_kg: number | null;
};

type CompleteWorkoutRequest = {
    workout_id: string;
    logs: SessionLog[];
};

// POST /api/workout-session/complete — save completed session logs
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CompleteWorkoutRequest;
    const { workout_id, logs } = body;

    if (!workout_id || !Array.isArray(logs)) {
        return NextResponse.json(
            { error: "workout_id and logs are required" },
            { status: 400 }
        );
    }

    if (logs.length === 0) {
        return NextResponse.json({ error: "logs cannot be empty" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const item of logs) {
            await client.query(
                `INSERT INTO workout_logs (
          user_id,
          workout_id,
          exercise_id,
          sets_completed,
          reps_completed,
          weight_kg,
          logged_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [
                    session.user.id,
                    workout_id,
                    item.exercise_id,
                    item.sets_completed,
                    item.reps_completed,
                    item.weight_kg,
                ]
            );
        }

        await client.query("COMMIT");
        return NextResponse.json({ success: true, count: logs.length });
    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error("POST /api/workout-session/complete error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
        client.release();
    }
}