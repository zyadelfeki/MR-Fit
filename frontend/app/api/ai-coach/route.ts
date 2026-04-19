import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

type IncomingMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { message, messages } = body as {
            message?: string;
            messages?: IncomingMessage[];
        };

        if (!message && (!messages || messages.length === 0)) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        const profileRes = await pool.query(
            `SELECT p.display_name, p.date_of_birth, p.weight_kg, p.height_cm, p.fitness_goal,
                    p.gender, p.fitness_level
             FROM profiles p
             WHERE p.user_id = $1
             LIMIT 1`,
            [userId]
        );

        const userRes = await pool.query(
            `SELECT to_jsonb(u) AS user_payload
             FROM users u
             WHERE u.id = $1
             LIMIT 1`,
            [userId]
        );

        const nutritionRes = await pool.query(
            `SELECT
                COALESCE(SUM(calories), 0) AS calories,
                COALESCE(SUM(protein_g), 0) AS protein,
                COALESCE(SUM(carbs_g), 0) AS carbs,
                COALESCE(SUM(fat_g), 0) AS fat
             FROM nutrition_logs
             WHERE user_id = $1
               AND DATE(logged_at AT TIME ZONE 'UTC') = CURRENT_DATE`,
            [userId]
        );

        const weeklyWorkoutsRes = await pool.query(
            `SELECT
                COUNT(*)::int AS total,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'name', COALESCE(w.title, e.name, 'Workout'),
                            'type', COALESCE(w.source, 'custom')
                        )
                        ORDER BY wl.logged_at DESC
                    ) FILTER (WHERE wl.id IS NOT NULL),
                    '[]'::json
                ) AS workouts
             FROM workout_logs wl
             LEFT JOIN workouts w ON w.id = wl.workout_id
             LEFT JOIN exercises e ON e.id = wl.exercise_id
             WHERE wl.user_id = $1
               AND wl.logged_at >= date_trunc('week', now() AT TIME ZONE 'UTC')`,
            [userId]
        );

        const recentWorkoutRes = await pool.query(
            `SELECT
                COALESCE(w.title, e.name, 'Workout') AS name,
                COALESCE(w.source, 'custom') AS type,
                w.duration_min AS duration_minutes,
                wl.logged_at
             FROM workout_logs wl
             LEFT JOIN workouts w ON w.id = wl.workout_id
             LEFT JOIN exercises e ON e.id = wl.exercise_id
             WHERE wl.user_id = $1
             ORDER BY wl.logged_at DESC
             LIMIT 1`,
            [userId]
        );

        const profile = profileRes.rows[0] as {
            display_name?: string | null;
            date_of_birth?: string | null;
            weight_kg?: number | null;
            height_cm?: number | null;
            fitness_goal?: string | null;
            gender?: string | null;
            fitness_level?: string | null;
        } | undefined;

        const userPayload = (userRes.rows[0] as { user_payload?: Record<string, unknown> } | undefined)?.user_payload ?? {};

        const nutrition = nutritionRes.rows[0] as {
            calories: string;
            protein: string;
            carbs: string;
            fat: string;
        };

        const weeklyWorkouts = weeklyWorkoutsRes.rows[0] as {
            total: number;
            workouts: Array<{ name: string; type: string }>;
        };

        const recentWorkout = recentWorkoutRes.rows[0] as {
            name: string;
            type: string;
            duration_minutes: number | null;
            logged_at: string;
        } | undefined;

        const name = profile?.display_name || "there";
        const age = profile?.date_of_birth
            ? Math.max(0, new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear())
            : "unknown";
        const gender = profile?.gender ? ` ${profile.gender}` : "";
        const weight = profile?.weight_kg ?? "unknown";
        const height = profile?.height_cm ?? "unknown";
        const goal = profile?.fitness_goal ?? "general fitness";
        const activityLevel = profile?.fitness_level ?? "not specified";
        const calories = Number(nutrition?.calories ?? 0);
        const protein = Number(nutrition?.protein ?? 0);
        const carbs = Number(nutrition?.carbs ?? 0);
        const fat = Number(nutrition?.fat ?? 0);
        const calorieGoal = Number(userPayload.calorie_goal ?? 2000);
        const weeklyTotal = Number(weeklyWorkouts?.total ?? 0);
        const weeklyNames = Array.isArray(weeklyWorkouts?.workouts)
            ? weeklyWorkouts.workouts.slice(0, 5).map((item) => `${item.name} (${item.type})`).join(", ")
            : "";

        const recentWorkoutText = recentWorkout
            ? `${recentWorkout.name} (${recentWorkout.type}) on ${new Date(recentWorkout.logged_at).toLocaleDateString()}`
            : "No recent workout logged";

        const systemPrompt = [
            "You are an expert personal trainer and nutritionist AI coach for MR.FIT.",
            `You are speaking to ${name}, a ${age}-year-old${gender}.`,
            `Their stats: ${weight}kg, ${height}cm, goal: ${goal}.`,
            `Activity level: ${activityLevel}.`,
            `Today's nutrition so far: ${calories}kcal, ${protein}g protein, ${carbs}g carbs, ${fat}g fat.`,
            `Their goal is ${calorieGoal}kcal/day.`,
            `This week: ${weeklyTotal} workouts completed. Last workout: ${recentWorkoutText}.`,
            `This week workouts: ${weeklyNames || "No workouts logged this week"}.`,
            "Give specific, data-driven advice. Reference their actual numbers.",
            "Keep responses concise (under 200 words unless asked for detail).",
            "When recommending exercises, format them as a JSON array at the end of your response in this exact format:",
            "EXERCISES_JSON:[{\"name\":\"...\",\"muscle_group\":\"...\",\"difficulty\":\"...\"}]",
        ].join("\n");

        const mergedMessages: IncomingMessage[] = [
            { role: "system", content: systemPrompt },
            ...(Array.isArray(messages) ? messages : []),
        ];

        const fastApiUrl =
            process.env.NEXT_PUBLIC_AI_COACH_API_URL || "http://127.0.0.1:8000";

        const response = await fetch(`${fastApiUrl}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                message: message,
                messages: mergedMessages,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("FastAPI Error:", errorText);
            return NextResponse.json(
                { error: "Failed to communicate with AI Coach" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("AI Coach Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
