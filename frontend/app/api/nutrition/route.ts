import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// GET /api/nutrition — today's nutrition logs for the current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const todayStr = new Date().toISOString().split("T")[0];

        const res = await pool.query(
            `SELECT id, food_name, calories, protein_g, carbs_g, fat_g, logged_at
       FROM nutrition_logs
       WHERE user_id = $1
         AND logged_at >= $2
         AND logged_at < $3
       ORDER BY logged_at DESC`,
            [session.user.id, `${todayStr}T00:00:00`, `${todayStr}T23:59:59`]
        );

        return NextResponse.json({ logs: res.rows });
    } catch (err: any) {
        console.error("GET /api/nutrition error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/nutrition — add a food log entry
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { food_name, calories, protein_g, carbs_g, fat_g, logged_at } =
            await req.json();

        if (!food_name || !calories || calories < 1) {
            return NextResponse.json(
                { error: "food_name and valid calories are required" },
                { status: 400 }
            );
        }

        const res = await pool.query(
            `INSERT INTO nutrition_logs (user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
            [
                session.user.id,
                food_name,
                Number(calories),
                protein_g !== "" && protein_g != null ? Number(protein_g) : null,
                carbs_g !== "" && carbs_g != null ? Number(carbs_g) : null,
                fat_g !== "" && fat_g != null ? Number(fat_g) : null,
                logged_at || new Date().toISOString(),
            ]
        );

        return NextResponse.json({ success: true, id: res.rows[0].id });
    } catch (err: any) {
        console.error("POST /api/nutrition error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/nutrition?id=<uuid> — remove a food log entry
export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        // Only delete if it belongs to the current user
        await pool.query(
            "DELETE FROM nutrition_logs WHERE id = $1 AND user_id = $2",
            [id, session.user.id]
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE /api/nutrition error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
