import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { searchExercises, type ExerciseResult } from "@/lib/wger";

type LocalExerciseRow = {
    id: string;
    name: string;
    muscle_group: string | null;
    equipment: string | null;
};

function mapLocalExercises(rows: LocalExerciseRow[]): ExerciseResult[] {
    return rows.map((row, index) => ({
        id: Number(index + 1),
        name: row.name,
        description: "",
        category: row.muscle_group ?? "General",
        muscles: [],
        musclesSecondary: [],
        equipment: row.equipment ? [row.equipment] : [],
    }));
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const muscle = searchParams.get("muscle")?.trim() ?? "";

    try {
        const exercises = await searchExercises(q, muscle);

        const normalizedMuscle = muscle.toLowerCase();
        const filteredExercises =
            !normalizedMuscle || normalizedMuscle === "all"
                ? exercises
                : exercises.filter((exercise) =>
                      exercise.muscles.some((muscleName) =>
                          muscleName.toLowerCase().includes(normalizedMuscle)
                      )
                  );

        return NextResponse.json({ exercises: filteredExercises });
    } catch (error) {
        console.error("GET /api/exercises/search external error:", error);

        try {
            const qParam = `%${q || ""}%`;

            const localRes = await pool.query<LocalExerciseRow>(
                `SELECT id, name, muscle_group, equipment
                 FROM exercises
                 WHERE ($1 = '%%' OR name ILIKE $1)
                   AND ($2 = '' OR $2 = 'All' OR muscle_group ILIKE $3)
                 ORDER BY name ASC
                                 LIMIT 10`,
                [qParam, muscle, `%${muscle}%`]
            );

            return NextResponse.json({
                exercises: mapLocalExercises(localRes.rows),
                fallback: true,
            });
        } catch (dbError) {
            console.error("GET /api/exercises/search fallback error:", dbError);
            return NextResponse.json({ exercises: [], error: "Search unavailable" });
        }
    }
}
