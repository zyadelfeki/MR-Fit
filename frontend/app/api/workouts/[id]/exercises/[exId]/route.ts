import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

type Params = { params: { id: string; exId: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await pool.query(
      `DELETE FROM workout_logs
        WHERE id = $1 AND workout_id = $2 AND user_id = $3
        RETURNING id`,
      [params.exId, params.id, session.user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Exercise log not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workouts/[id]/exercises/[exId] error:", error);
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
  }
}
