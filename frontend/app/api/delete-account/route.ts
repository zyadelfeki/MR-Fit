import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete all user data in correct order (foreign key constraints)
        await pool.query("DELETE FROM workout_logs WHERE user_id = $1", [session.user.id]);
        await pool.query("DELETE FROM workouts WHERE user_id = $1", [session.user.id]);
        await pool.query("DELETE FROM nutrition_logs WHERE user_id = $1", [session.user.id]);
        await pool.query("DELETE FROM wearable_data WHERE user_id = $1", [session.user.id]);
        await pool.query("DELETE FROM profiles WHERE user_id = $1", [session.user.id]);
        await pool.query("DELETE FROM users WHERE id = $1", [session.user.id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete account error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
