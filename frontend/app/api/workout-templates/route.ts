import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

type TemplateExercise = {
    name: string;
    sets: number;
    reps: number;
    weight_kg?: number | null;
    notes?: string;
};

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await pool.query(
            `SELECT id, name, description, exercises, created_at
             FROM workout_templates
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [session.user.id]
        );

        return NextResponse.json({ templates: result.rows });
    } catch (error) {
        console.error("GET /api/workout-templates error:", error);
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json()) as {
            name?: string;
            description?: string;
            exercises?: TemplateExercise[];
        };

        const name = body.name?.trim();
        const description = body.description?.trim() || null;
        const exercises = Array.isArray(body.exercises) ? body.exercises : [];

        if (!name) {
            return NextResponse.json({ error: "Template name is required" }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO workout_templates (user_id, name, description, exercises)
             VALUES ($1, $2, $3, $4::jsonb)
             RETURNING *`,
            [session.user.id, name, description, JSON.stringify(exercises)]
        );

        return NextResponse.json({ template: result.rows[0] });
    } catch (error) {
        console.error("POST /api/workout-templates error:", error);
        return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const templateId = searchParams.get("id");

        if (!templateId) {
            return NextResponse.json({ error: "Template id is required" }, { status: 400 });
        }

        await pool.query(
            `DELETE FROM workout_templates
             WHERE id = $1 AND user_id = $2`,
            [templateId, session.user.id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/workout-templates error:", error);
        return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }
}
