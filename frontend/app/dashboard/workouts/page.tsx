import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No workouts yet</h3>
                    <p className="mt-2 text-sm text-gray-500 mb-6">Get started by creating a new workout session.</p>
                    <Link
                        href="/dashboard/workouts/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm font-medium inline-block"
                    >
                        Create Workout
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
