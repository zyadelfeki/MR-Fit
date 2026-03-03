import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";

export const metadata = {
    title: "Dashboard | MR-Fit",
    description: "Your personal fitness overview",
};

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;

    // Fetch user profile
    const profileRes = await pool.query(
        `SELECT display_name, weight_kg, fitness_goal FROM profiles WHERE user_id = $1`,
        [userId]
    );
    const profile = profileRes.rows[0] ?? null;

    if (!profile) {
        redirect("/onboarding");
    }

    // Workouts this week
    const now = new Date();
    const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
    );

    const workoutsRes = await pool.query(
        `SELECT COUNT(*) AS count
     FROM workout_logs
     WHERE user_id = $1
       AND logged_at >= $2`,
        [userId, startOfWeek.toISOString()]
    );
    const displayWorkouts = Number(workoutsRes.rows[0]?.count ?? 0);

    // Calories today
    const todayStr = new Date().toISOString().split("T")[0];
    const nutritionRes = await pool.query(
        `SELECT COALESCE(SUM(calories), 0) AS total
     FROM nutrition_logs
     WHERE user_id = $1
       AND logged_at >= $2
       AND logged_at < $3`,
        [userId, `${todayStr}T00:00:00`, `${todayStr}T23:59:59`]
    );
    const caloriesToday = Number(nutritionRes.rows[0]?.total ?? 0);

    // Active streak — look at last 30 days of activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const workoutDatesRes = await pool.query(
        `SELECT DISTINCT DATE(logged_at) AS day
     FROM workout_logs
     WHERE user_id = $1 AND logged_at >= $2`,
        [userId, thirtyDaysAgo.toISOString()]
    );
    const nutritionDatesRes = await pool.query(
        `SELECT DISTINCT DATE(logged_at) AS day
     FROM nutrition_logs
     WHERE user_id = $1 AND logged_at >= $2`,
        [userId, thirtyDaysAgo.toISOString()]
    );

    const activityDates = new Set<string>();
    workoutDatesRes.rows.forEach((r) => {
        if (r.day) activityDates.add(new Date(r.day).toISOString().split("T")[0]);
    });
    nutritionDatesRes.rows.forEach((r) => {
        if (r.day) activityDates.add(new Date(r.day).toISOString().split("T")[0]);
    });

    let streak = 0;
    const checkDate = new Date();
    checkDate.setUTCHours(0, 0, 0, 0);

    // If no activity today try from yesterday
    if (!activityDates.has(checkDate.toISOString().split("T")[0])) {
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    while (activityDates.has(checkDate.toISOString().split("T")[0])) {
        streak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 dark:text-white">
                Welcome back, {profile.display_name ?? "there"}!
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Workouts This Week */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Workouts This Week
                    </h3>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {displayWorkouts}
                    </p>
                </div>

                {/* Card 2: Calories Today */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Calories Today
                    </h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {caloriesToday} kcal
                    </p>
                </div>

                {/* Card 3: Current Weight */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Current Weight
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {profile.weight_kg ? `${profile.weight_kg} kg` : "--"}
                    </p>
                </div>

                {/* Card 4: Active Streak */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Active Streak
                    </h3>
                    <p className="text-3xl font-bold text-orange-500">
                        {streak} {streak === 1 ? "Day" : "Days"} 🔥
                    </p>
                </div>
            </div>
        </div>
    );
}
