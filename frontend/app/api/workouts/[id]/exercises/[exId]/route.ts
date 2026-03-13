import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

type Params = { params: { id: string; exId: string } };

export async function DELETE(_req: Request, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const lookup = await client.query(
            `SELECT wle.workout_log_id
             FROM workout_log_exercises wle
             JOIN workout_logs wl ON wl.id = wle.workout_log_id
             WHERE wle.id = $1 AND wl.workout_id = $2 AND wl.user_id = $3
             LIMIT 1`,
            [params.exId, params.id, session.user.id]
        );

        if (lookup.rowCount === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: "Exercise log not found" }, { status: 404 });
        }

        const workoutLogId = lookup.rows[0].workout_log_id as string;

        await client.query(`DELETE FROM workout_log_exercises WHERE id = $1`, [params.exId]);
        await client.query(`DELETE FROM workout_logs WHERE id = $1 AND user_id = $2`, [
            workoutLogId,
            session.user.id,
        ]);

        await client.query("COMMIT");
        return NextResponse.json({ success: true });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("DELETE /api/workouts/[id]/exercises/[exId] error:", error);
        return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
    } finally {
        client.release();
    }
}
