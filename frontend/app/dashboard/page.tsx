import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";

export const metadata = {
    title: "Dashboard | MR.FIT",
    description: "Your personal fitness overview",
};

const DAILY_QUOTES = [
    "Consistency beats intensity when intensity is occasional.",
    "Small progress each day compounds into big results.",
    "Train with purpose, recover with discipline.",
    "You do not need perfect days, only persistent ones.",
    "Fuel your body for the goals you want tomorrow.",
    "Strong habits build a stronger body.",
    "Your pace is valid. Keep moving forward.",
    "Every rep is a vote for the person you are becoming.",
    "Discipline is self-respect in action.",
    "Progress is earned in ordinary days.",
    "Do the basics exceptionally well.",
    "Fitness is a long game, play it patiently.",
    "Show up first, motivation follows.",
    "Recovery is part of training, not a break from it.",
    "Build strength that supports your everyday life.",
    "One workout does not transform you, a routine does.",
    "Master your form, then master the load.",
    "Healthy routines create confident minds.",
    "Focus on what you can repeat, not what you can survive.",
    "You are closer than yesterday. Keep going.",
];

function timeAgo(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
        const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        return `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    if (diffDays === 1) {
        return "Yesterday";
    }

    return `${diffDays} days ago`;
}

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

    // Calories today (UTC-safe)
    const nutritionRes = await pool.query(
        `SELECT COALESCE(SUM(calories), 0) AS total
     FROM nutrition_logs
     WHERE user_id = $1
       AND DATE(logged_at AT TIME ZONE 'UTC') = CURRENT_DATE`,
        [userId]
    );
    const caloriesToday = Number(nutritionRes.rows[0]?.total ?? 0);

    // Active streak — look at last 30 days of activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const workoutDatesRes = await pool.query(
        `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') AS day
     FROM workout_logs
     WHERE user_id = $1 AND logged_at >= $2`,
        [userId, thirtyDaysAgo.toISOString()]
    );
    const nutritionDatesRes = await pool.query(
        `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') AS day
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

    const activityRes = await pool.query(
        `(SELECT 'workout' AS type, COALESCE(w.title, e.name, 'Workout') AS label, wl.logged_at
          FROM workout_logs wl
          LEFT JOIN workouts w ON w.id = wl.workout_id
          LEFT JOIN exercises e ON e.id = wl.exercise_id
          WHERE wl.user_id = $1
          ORDER BY wl.logged_at DESC
          LIMIT 5)
         UNION ALL
         (SELECT 'nutrition' AS type, nl.food_name AS label, nl.logged_at
          FROM nutrition_logs nl
          WHERE nl.user_id = $1
          ORDER BY nl.logged_at DESC
          LIMIT 5)
         ORDER BY logged_at DESC
         LIMIT 5`,
        [userId]
    );

    const recentActivity = activityRes.rows as Array<{
        type: "workout" | "nutrition";
        label: string;
        logged_at: string;
    }>;

    const quoteIndex = (new Date().getDate() + new Date().getMonth() * 31) % DAILY_QUOTES.length;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm italic text-white shadow-sm">
                {DAILY_QUOTES[quoteIndex]}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-8 dark:text-white">
                Welcome back, {profile.display_name ?? "there"}!
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Workouts This Week */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Workouts This Week
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-400">
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

            <section className="mt-8">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Link
                        href="/dashboard/workouts/new"
                        className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="mb-2 text-xl">🏋️</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Log a Workout</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start tracking today&apos;s training session.</p>
                        <span className="mt-3 inline-block text-sm font-medium text-gray-900 transition group-hover:translate-x-1 dark:text-gray-400">Open →</span>
                    </Link>

                    <Link
                        href="/dashboard/nutrition"
                        className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="mb-2 text-xl">🥗</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Log Food</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add meals and monitor your daily macros.</p>
                        <span className="mt-3 inline-block text-sm font-medium text-gray-900 transition group-hover:translate-x-1 dark:text-gray-400">Open →</span>
                    </Link>

                    <Link
                        href="/dashboard/ai-coach"
                        className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="mb-2 text-xl">🤖</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Ask AI Coach</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get tailored advice based on your progress.</p>
                        <span className="mt-3 inline-block text-sm font-medium text-gray-900 transition group-hover:translate-x-1 dark:text-gray-400">Open →</span>
                    </Link>
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>

                {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity. Start your fitness journey! 🚀</p>
                ) : (
                    <div className="space-y-4">
                        {recentActivity.map((item, index) => (
                            <div key={`${item.type}-${item.label}-${index}`} className="flex items-start gap-3">
                                <span
                                    className={`mt-1 inline-block h-3 w-3 rounded-full ${item.type === "workout" ? "bg-green-500" : "bg-orange-500"}`}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {item.type === "workout" ? "🏋️" : "🥗"} {item.label}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(item.logged_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

