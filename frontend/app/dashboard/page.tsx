import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        redirect("/login");
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError || !profile) {
        redirect("/onboarding");
    }

    // Get start of current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    // Workouts this week
    const { count: workoutsThisWeek, error: workoutsError } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("logged_at", startOfWeek.toISOString());

    const displayWorkouts = workoutsError ? 0 : (workoutsThisWeek || 0);

    // Calories today
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: nutritionToday } = await supabase
        .from("nutrition_logs")
        .select("calories")
        .eq("user_id", user.id)
        .gte("logged_at", todayStr + "T00:00:00")
        .lt("logged_at", todayStr + "T23:59:59");

    const caloriesToday = nutritionToday?.reduce((sum, log) => sum + (log.calories || 0), 0) || 0;

    // Active Streak
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const { data: workouts } = await supabase
        .from("workout_logs")
        .select("logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", thirtyDaysAgoStr);

    const { data: nutrition } = await supabase
        .from("nutrition_logs")
        .select("logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", thirtyDaysAgoStr);

    const activityDates = new Set<string>();
    workouts?.forEach((w) => { if (w.logged_at) activityDates.add(w.logged_at.split('T')[0]) });
    nutrition?.forEach((n) => { if (n.logged_at) activityDates.add(n.logged_at.split('T')[0]) });

    let streak = 0;
    let checkDate = new Date();

    // Normalize to midnight UTC for date comparison
    checkDate.setUTCHours(0, 0, 0, 0);

    // Check today first, if not check yesterday
    if (!activityDates.has(checkDate.toISOString().split('T')[0])) {
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    while (activityDates.has(checkDate.toISOString().split('T')[0])) {
        streak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 dark:text-white">
                Welcome back, {profile.display_name}!
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Workouts This Week */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Workouts This Week</h3>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{displayWorkouts}</p>
                </div>

                {/* Card 2: Calories Today */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Calories Today</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{caloriesToday} kcal</p>
                </div>

                {/* Card 3: Current Weight */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Current Weight</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{profile.weight_kg ? `${profile.weight_kg} kg` : '--'}</p>
                </div>

                {/* Card 4: Active Streak */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Streak</h3>
                    <p className="text-3xl font-bold text-orange-500">{streak} {streak === 1 ? 'Day' : 'Days'} 🔥</p>
                </div>
            </div>

        </div>
    );
}
