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

const DEFAULT_TEMPLATES = [
  {
    name: "Push Day (Chest, Shoulders & Triceps)",
    description: "Focus on chest pressing power, shoulder stability, and triceps lockout.",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: 8, weight_kg: 60, notes: "Warm up properly; focus on controlled descent and explosive press." },
      { name: "Overhead Barbell Press", sets: 3, reps: 8, weight_kg: 40, notes: "Keep core tight, avoid excessive arching of lower back." },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, weight_kg: 22, notes: "30-degree incline, full range of motion." },
      { name: "Cable Lateral Raises", sets: 4, reps: 12, weight_kg: 10, notes: "Keep tension on lateral delts; slow eccentrics." },
      { name: "Tricep Rope Pushdowns", sets: 3, reps: 15, weight_kg: 25, notes: "Keep elbows pinned to your sides; squeeze at the bottom." }
    ]
  },
  {
    name: "Pull Day (Back & Biceps)",
    description: "Target the upper and lower back muscles along with bicep flexion.",
    exercises: [
      { name: "Barbell Rows", sets: 4, reps: 8, weight_kg: 50, notes: "Keep back flat; pull toward your belly button." },
      { name: "Lat Pulldowns", sets: 3, reps: 10, weight_kg: 55, notes: "Pull with your elbows, squeeze your shoulder blades." },
      { name: "Single-Arm Dumbbell Rows", sets: 3, reps: 12, weight_kg: 20, notes: "Drive elbow up and back; control the stretch." },
      { name: "Face Pulls", sets: 3, reps: 15, weight_kg: 18, notes: "Pull rope to forehead, flare elbows out for rear delts." },
      { name: "Incline Dumbbell Curls", sets: 3, reps: 12, weight_kg: 12, notes: "Fully extend arms at the bottom to stretch biceps." }
    ]
  },
  {
    name: "Legs Day (Quads, Hamstrings & Calves)",
    description: "High-intensity leg development training targeting posterior and anterior chains.",
    exercises: [
      { name: "Barbell Squats", sets: 4, reps: 6, weight_kg: 80, notes: "Find a comfortable stance; break parallel if mobility allows." },
      { name: "Romanian Deadlifts", sets: 4, reps: 8, weight_kg: 70, notes: "Hinge at the hips, feel the stretch in your hamstrings." },
      { name: "Leg Press", sets: 3, reps: 10, weight_kg: 120, notes: "Do not lock out knees at the top; place feet shoulder-width." },
      { name: "Seated Leg Curls", sets: 3, reps: 12, weight_kg: 45, notes: "Keep hips firmly in the seat; contract fully." },
      { name: "Standing Calf Raises", sets: 4, reps: 15, weight_kg: 50, notes: "Hold stretch at the bottom for 1 second." }
    ]
  },
  {
    name: "Upper Body Hypertrophy",
    description: "Balanced, high-volume hypertrophy workout for the entire upper torso.",
    exercises: [
      { name: "Incline Barbell Bench Press", sets: 4, reps: 8, weight_kg: 50, notes: "Good target for upper chest fibers." },
      { name: "Weighted Pull-Ups", sets: 3, reps: 8, weight_kg: 5, notes: "Use belt/chain or perform bodyweight if needed." },
      { name: "Dumbbell Bench Press", sets: 3, reps: 10, weight_kg: 24, notes: "Stable pressing motion, drive from feet." },
      { name: "Seated Cable Rows", sets: 3, reps: 10, weight_kg: 50, notes: "Use V-bar; pull to mid-torso." },
      { name: "Dumbbell Hammer Curls", sets: 3, reps: 12, weight_kg: 14, notes: "Alternate arms; keep palms facing each other." }
    ]
  }
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTemplateTable();
    let result = await pool.query(
      `SELECT id, name, description, exercises, created_at
         FROM workout_templates
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      // Seed default templates
      for (const t of DEFAULT_TEMPLATES) {
        await pool.query(
          `INSERT INTO workout_templates (user_id, name, description, exercises)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [session.user.id, t.name, t.description, JSON.stringify(t.exercises)]
        );
      }
      // Re-query
      result = await pool.query(
        `SELECT id, name, description, exercises, created_at
           FROM workout_templates
          WHERE user_id = $1
          ORDER BY created_at DESC`,
        [session.user.id]
      );
    }

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
