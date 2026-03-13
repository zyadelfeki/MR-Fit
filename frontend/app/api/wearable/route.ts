import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// GET /api/wearable - latest bodyweight entries for current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const res = await pool.query(
            `SELECT id, value, unit, recorded_at
       FROM wearable_data
       WHERE user_id = $1 AND metric = 'weight_kg'
       ORDER BY recorded_at DESC
       LIMIT 10`,
            [session.user.id]
        );

        return NextResponse.json(res.rows);
    } catch (err: any) {
        console.error("GET /api/wearable error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/wearable - add new bodyweight entry
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json()) as {
            value?: number;
            unit?: string;
            recorded_at?: string;
        };

        const value = Number(body.value);
        const unit = (body.unit || "kg").trim().toLowerCase();
        const recordedAt = body.recorded_at || null;

        if (!Number.isFinite(value) || value <= 0 || value >= 500) {
            return NextResponse.json(
                { error: "value must be > 0 and < 500" },
                { status: 400 }
            );
        }

        if (!["kg", "lbs"].includes(unit)) {
            return NextResponse.json({ error: "unit must be kg or lbs" }, { status: 400 });
        }

        await pool.query(
            `INSERT INTO wearable_data (user_id, metric, value, unit, recorded_at)
       VALUES ($1, 'weight_kg', $2, $3, COALESCE($4::timestamptz, NOW()))`,
            [session.user.id, value, unit, recordedAt]
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("POST /api/wearable error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/wearable - delete one weight entry by id
export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json()) as { id?: string };
        if (!body.id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        await pool.query(`DELETE FROM wearable_data WHERE id = $1 AND user_id = $2`, [
            body.id,
            session.user.id,
        ]);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE /api/wearable error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
