import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Workouts | MR-Fit", description: "Track and manage your workouts" };

export default async function WorkoutsPage() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        redirect("/login");
    }

    const { data: workouts, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: false });

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
                <Link
                    href="/dashboard/workouts/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm font-medium"
                >
                    Create Workout
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6 border border-red-200">
                    Failed to load workouts. {error.message}
                </div>
            )}

            {!error && (!workouts || workouts.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-6xl mb-4">🏋️</div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No workouts yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Start tracking your fitness journey today
                    </p>
                    <Link href="/dashboard/workouts/new"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Create Your First Workout
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workouts?.map((workout) => (
                        <Link key={workout.id} href={`/dashboard/workouts/${workout.id}`}>
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition cursor-pointer h-full flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 truncate">{workout.title}</h3>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${workout.source === 'ai' ? 'bg-purple-100 text-purple-700' :
                                        workout.source === 'trainer' ? 'bg-green-100 text-green-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {workout.source}
                                    </span>
                                </div>

                                <div className="mt-auto space-y-2">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <svg className="flex-shrink-0 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {workout.scheduled_at ? new Date(workout.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unscheduled'}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <svg className="flex-shrink-0 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {workout.duration_min} min
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
