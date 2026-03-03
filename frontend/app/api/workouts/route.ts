import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// GET /api/workouts — list all workouts for the current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const res = await pool.query(
            `SELECT id, title, source, duration_min, scheduled_at, created_at
       FROM workouts
       WHERE user_id = $1
       ORDER BY scheduled_at DESC NULLS LAST, created_at DESC`,
            [session.user.id]
        );

        return NextResponse.json({ workouts: res.rows });
    } catch (err: any) {
        console.error("GET /api/workouts error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/workouts — create a new workout
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, scheduled_at, duration_min, source } = await req.json();

        if (!title) {
            return NextResponse.json({ error: "title is required" }, { status: 400 });
        }

        const res = await pool.query(
            `INSERT INTO workouts (user_id, title, scheduled_at, duration_min, source)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
            [
                session.user.id,
                title,
                scheduled_at ? new Date(scheduled_at).toISOString() : null,
                duration_min ? Number(duration_min) : null,
                source || "custom",
            ]
        );

        return NextResponse.json({ success: true, id: res.rows[0].id });
    } catch (err: any) {
        console.error("POST /api/workouts error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
