import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withDb } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, newName, description, muscle_group, equipment } = body;

    const currentName = name?.trim();
    const targetName = (newName || name)?.trim();

    if (!currentName || !targetName) {
      return NextResponse.json({ error: "Exercise name is required" }, { status: 400 });
    }

    const result = await withDb(async (client) => {
      // Check if it exists locally
      const existing = await client.query(
        "SELECT id FROM exercises WHERE LOWER(name) = LOWER($1) LIMIT 1",
        [currentName]
      );

      if (existing.rows.length > 0) {
        // Update existing exercise
        const res = await client.query(
          `UPDATE exercises
           SET name = $1, description = $2, muscle_group = $3, equipment = $4
           WHERE id = $5
           RETURNING id, name, description, muscle_group AS category, equipment`,
          [
            targetName,
            description || "",
            muscle_group || "General",
            equipment || "",
            existing.rows[0].id
          ]
        );
        return { success: true, exercise: res.rows[0] };
      } else {
        // Insert new exercise
        const res = await client.query(
          `INSERT INTO exercises (name, description, muscle_group, equipment, difficulty)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, description, muscle_group AS category, equipment`,
          [
            targetName,
            description || "",
            muscle_group || "General",
            equipment || "",
            "intermediate"
          ]
        );
        return { success: true, exercise: res.rows[0] };
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/exercises/update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update exercise" }, { status: 500 });
  }
}
