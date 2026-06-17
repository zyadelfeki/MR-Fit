import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withDb } from "@/lib/db";

// GET /api/nutrition — nutrition logs for the current user (defaults to today in UTC or a specific date)
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date"); // YYYY-MM-DD format

        const res = await withDb(async (client) => {
            if (dateParam) {
                return await client.query(
                    `SELECT id, food_name, calories, protein_g, carbs_g, fat_g, logged_at
                     FROM nutrition_logs
                     WHERE user_id = $1
                       AND DATE(logged_at AT TIME ZONE 'UTC') = $2
                     ORDER BY logged_at DESC`,
                    [userId, dateParam]
                );
            } else {
                return await client.query(
                    `SELECT id, food_name, calories, protein_g, carbs_g, fat_g, logged_at
                     FROM nutrition_logs
                     WHERE user_id = $1
                       AND DATE(logged_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC')
                     ORDER BY logged_at DESC`,
                    [userId]
                );
            }
        });

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

    const userId = session.user.id;

    try {
        const { food_name, calories, protein_g, carbs_g, fat_g, logged_at } =
            await req.json();

        if (!food_name || !calories || calories < 1) {
            return NextResponse.json(
                { error: "food_name and valid calories are required" },
                { status: 400 }
            );
        }

        const res = await withDb(async (client) => {
            return await client.query(
                `INSERT INTO nutrition_logs (user_id, food_name, calories, protein_g, carbs_g, fat_g, logged_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [
                    userId,
                    food_name,
                    Number(calories),
                    protein_g !== "" && protein_g != null ? Number(protein_g) : null,
                    carbs_g !== "" && carbs_g != null ? Number(carbs_g) : null,
                    fat_g !== "" && fat_g != null ? Number(fat_g) : null,
                    logged_at || new Date().toISOString(),
                ]
            );
        });

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

    const userId = session.user.id;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        await withDb(async (client) => {
            await client.query(
                "DELETE FROM nutrition_logs WHERE id = $1 AND user_id = $2",
                [id, userId]
            );
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE /api/nutrition error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
