import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const thirtyAgo = new Date();
    thirtyAgo.setUTCDate(thirtyAgo.getUTCDate() - 30);

    const [workoutDates, nutritionDates] = await Promise.all([
      pool.query(
        `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') AS day
           FROM workout_logs
          WHERE user_id = $1 AND logged_at >= $2`,
        [userId, thirtyAgo.toISOString()]
      ),
      pool.query(
        `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') AS day
           FROM nutrition_logs
          WHERE user_id = $1 AND logged_at >= $2`,
        [userId, thirtyAgo.toISOString()]
      ),
    ]);

    const activityDates = new Set<string>();
    [...workoutDates.rows, ...nutritionDates.rows].forEach((row) => {
      if (row.day) activityDates.add(new Date(row.day).toISOString().split("T")[0]);
    });

    let streak = 0;
    const checkDate = new Date();
    checkDate.setUTCHours(0, 0, 0, 0);

    if (!activityDates.has(checkDate.toISOString().split("T")[0])) {
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    while (activityDates.has(checkDate.toISOString().split("T")[0])) {
      streak += 1;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    return NextResponse.json({ streak });
  } catch (err) {
    console.error("GET /api/dashboard/stats error:", err);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
