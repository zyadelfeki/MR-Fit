import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        await pool.query("DELETE FROM nutrition_logs WHERE id = $1 AND user_id = $2", [
            id,
            session.user.id,
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/nutrition/log/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete log" }, { status: 500 });
    }
}
