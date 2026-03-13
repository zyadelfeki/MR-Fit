import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// GET /api/chat-history - fetch latest chat history for current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const res = await pool.query(
            `SELECT id, role, content, created_at
       FROM chat_history
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT 50`,
            [session.user.id]
        );

        return NextResponse.json(res.rows);
    } catch (err: any) {
        console.error("GET /api/chat-history error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/chat-history - append a chat message
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json()) as {
            role?: "user" | "assistant";
            content?: string;
        };

        const role = body.role;
        const content = body.content?.trim();

        if (!role || !["user", "assistant"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        if (!content) {
            return NextResponse.json({ error: "content is required" }, { status: 400 });
        }

        await pool.query(
            `INSERT INTO chat_history (user_id, role, content)
       VALUES ($1, $2, $3)`,
            [session.user.id, role, content]
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("POST /api/chat-history error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/chat-history - clear all chat history for current user
export async function DELETE() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await pool.query(`DELETE FROM chat_history WHERE user_id = $1`, [
            session.user.id,
        ]);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE /api/chat-history error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
