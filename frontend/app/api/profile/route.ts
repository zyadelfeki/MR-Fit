import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];
const GOALS = ["lose_weight", "build_muscle", "improve_endurance", "maintain", "flexibility"];
const LEVELS = ["beginner", "intermediate", "advanced"];

function nullableNumber(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error("INVALID_NUMBER");
  return n;
}

function nullableEnum(value: unknown, allowed: string[]): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !allowed.includes(value)) throw new Error("INVALID_ENUM");
  return value;
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = createAdminClient();
    const res = await db.query(
      `SELECT display_name, avatar_url, date_of_birth, gender,
              height_cm, weight_kg, fitness_goal, fitness_level, updated_at
         FROM profiles
        WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json({ profile: res.rows[0] ?? null });
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let displayName: string | null;
  let dateOfBirth: string | null;
  let gender: string | null;
  let heightCm: number | null;
  let weightKg: number | null;
  let fitnessGoal: string | null;
  let fitnessLevel: string | null;

  try {
    displayName =
      body.display_name === null || body.display_name === undefined || body.display_name === ""
        ? null
        : String(body.display_name).trim().slice(0, 120);
    dateOfBirth =
      body.date_of_birth === null || body.date_of_birth === undefined || body.date_of_birth === ""
        ? null
        : String(body.date_of_birth);
    gender = nullableEnum(body.gender, GENDERS);
    heightCm = nullableNumber(body.height_cm, 50, 300);
    weightKg = nullableNumber(body.weight_kg, 20, 500);
    fitnessGoal = nullableEnum(body.fitness_goal, GOALS);
    fitnessLevel = nullableEnum(body.fitness_level, LEVELS);
  } catch {
    return NextResponse.json({ error: "One or more fields are invalid." }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const res = await db.query(
      `INSERT INTO profiles
         (user_id, display_name, date_of_birth, gender, height_cm, weight_kg, fitness_goal, fitness_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         display_name  = EXCLUDED.display_name,
         date_of_birth = EXCLUDED.date_of_birth,
         gender        = EXCLUDED.gender,
         height_cm     = EXCLUDED.height_cm,
         weight_kg     = EXCLUDED.weight_kg,
         fitness_goal  = EXCLUDED.fitness_goal,
         fitness_level = EXCLUDED.fitness_level,
         updated_at    = now()
       RETURNING display_name, avatar_url, date_of_birth, gender,
                 height_cm, weight_kg, fitness_goal, fitness_level, updated_at`,
      [userId, displayName, dateOfBirth, gender, heightCm, weightKg, fitnessGoal, fitnessLevel]
    );

    return NextResponse.json({ success: true, profile: res.rows[0] });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
