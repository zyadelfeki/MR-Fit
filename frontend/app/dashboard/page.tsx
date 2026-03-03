import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

function formatText(str: string) {
    if (!str) return "";
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

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

    // Attempt to fetch workout count. If table doesn't exist yet, it will return an error, handle gracefully.
    const { count: workoutsThisWeek, error: workoutsError } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("logged_at", startOfWeek.toISOString());

    const displayWorkouts = workoutsError ? 0 : (workoutsThisWeek || 0);

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Welcome back, {profile.display_name}!
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Fitness Goal */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Fitness Goal</h3>
                    <p className="text-2xl font-bold text-gray-900">{formatText(profile.fitness_goal)}</p>
                </div>

                {/* Card 2: Fitness Level */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Fitness Level</h3>
                    <p className="text-2xl font-bold text-gray-900">{formatText(profile.fitness_level)}</p>
                </div>

                {/* Card 3: Workouts This Week */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Workouts This Week</h3>
                    <p className="text-2xl font-bold text-gray-900">{displayWorkouts}</p>
                </div>

                {/* Card 4: Current Weight */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Current Weight</h3>
                    <p className="text-2xl font-bold text-gray-900">{profile.weight_kg} kg</p>
                </div>
            </div>

        </div>
    );
}
