import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

type MacroTotals = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

const DEFAULT_GOALS: MacroTotals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
};

function toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const totalsRes = await pool.query(
            `SELECT
                COALESCE(SUM(calories), 0) AS calories,
                COALESCE(SUM(protein_g), 0) AS protein,
                COALESCE(SUM(carbs_g), 0) AS carbs,
                COALESCE(SUM(fat_g), 0) AS fat
             FROM nutrition_logs
             WHERE user_id = $1
               AND DATE(logged_at) = CURRENT_DATE`,
            [session.user.id]
        );

        const goalsRes = await pool.query(
            `SELECT to_jsonb(u) AS user_payload
             FROM users u
             WHERE u.id = $1
             LIMIT 1`,
            [session.user.id]
        );

        const totalsRow = totalsRes.rows[0] as Record<string, unknown> | undefined;
        const userPayload =
            (goalsRes.rows[0] as { user_payload?: Record<string, unknown> } | undefined)
                ?.user_payload ?? {};

        const totals: MacroTotals = {
            calories: toNumber(totalsRow?.calories),
            protein: toNumber(totalsRow?.protein),
            carbs: toNumber(totalsRow?.carbs),
            fat: toNumber(totalsRow?.fat),
        };

        const goals: MacroTotals = {
            calories: toNumber(userPayload.calorie_goal) || DEFAULT_GOALS.calories,
            protein: toNumber(userPayload.protein_goal) || DEFAULT_GOALS.protein,
            carbs: toNumber(userPayload.carb_goal) || DEFAULT_GOALS.carbs,
            fat: toNumber(userPayload.fat_goal) || DEFAULT_GOALS.fat,
        };

        return NextResponse.json({ totals, goals });
    } catch (error) {
        console.error("GET /api/nutrition/daily-summary error:", error);
        return NextResponse.json({ error: "Failed to load daily summary" }, { status: 500 });
    }
}
