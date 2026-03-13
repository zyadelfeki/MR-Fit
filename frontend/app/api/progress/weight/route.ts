import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json()) as { weight_kg?: number | string };
        const parsedWeight = Number(body.weight_kg);

        if (!Number.isFinite(parsedWeight) || parsedWeight <= 0 || parsedWeight > 500) {
            return NextResponse.json({ error: "weight_kg must be a valid number between 0 and 500" }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO weight_logs (user_id, weight_kg)
             VALUES ($1, $2)
             RETURNING *`,
            [session.user.id, parsedWeight]
        );

        return NextResponse.json({ entry: result.rows[0] });
    } catch (error) {
        console.error("POST /api/progress/weight error:", error);
        return NextResponse.json({ error: "Failed to log weight" }, { status: 500 });
    }
}
