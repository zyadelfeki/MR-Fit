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

async function ensureTemplateTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON workout_templates(user_id)`);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTemplateTable();
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
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTemplateTable();
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      exercises?: TemplateExercise[];
    };

    const name = body.name?.trim();
    const description = body.description?.trim() || null;
    const exercises = Array.isArray(body.exercises)
      ? body.exercises
          .map((item) => ({
            name: item.name?.trim() ?? "",
            sets: Math.max(1, Number(item.sets ?? 3)),
            reps: Math.max(1, Number(item.reps ?? 10)),
            weight_kg: item.weight_kg == null ? null : Number(item.weight_kg),
            notes: item.notes?.trim() ?? "",
          }))
          .filter((item) => item.name)
      : [];

    if (!name) return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    if (exercises.length === 0) return NextResponse.json({ error: "At least one exercise is required" }, { status: 400 });

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
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTemplateTable();
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("id");

    if (!templateId) return NextResponse.json({ error: "Template id is required" }, { status: 400 });

    await pool.query(
      `DELETE FROM workout_templates WHERE id = $1 AND user_id = $2`,
      [templateId, session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workout-templates error:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
