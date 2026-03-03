import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// GET /api/profile — fetch the current user's profile
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const res = await pool.query(
            `SELECT display_name, date_of_birth, gender, height_cm, weight_kg,
              fitness_goal, fitness_level, updated_at
       FROM profiles
       WHERE user_id = $1`,
            [session.user.id]
        );

        const profile = res.rows[0] ?? null;
        return NextResponse.json({ profile });
    } catch (err: any) {
        console.error("GET /api/profile error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT /api/profile — update the current user's profile
export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            display_name,
            date_of_birth,
            gender,
            height_cm,
            weight_kg,
            fitness_goal,
            fitness_level,
        } = body;

        await pool.query(
            `UPDATE profiles
       SET display_name   = $1,
           date_of_birth  = $2,
           gender         = $3,
           height_cm      = $4,
           weight_kg      = $5,
           fitness_goal   = $6,
           fitness_level  = $7,
           updated_at     = now()
       WHERE user_id = $8`,
            [
                display_name ?? null,
                date_of_birth ?? null,
                gender ?? null,
                height_cm ? Number(height_cm) : null,
                weight_kg ? Number(weight_kg) : null,
                fitness_goal ?? null,
                fitness_level ?? null,
                session.user.id,
            ]
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("PUT /api/profile error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
