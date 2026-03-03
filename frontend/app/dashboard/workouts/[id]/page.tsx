import { createClient } from "../../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogExerciseForm from "../../../../components/LogExerciseForm";

export default async function WorkoutDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        redirect("/login");
    }

    // Await params if using standard Next.js 13+ dynamic routes approach where params can be handled properly.
    // However, in Next 13/14, `params` in Page props is technically a promise in the latest versions,
    // but often used directly if standard Server Components setup permits. Assuming string standard for now.
    const workoutId = params.id;

    // Fetch workout and verify ownership
    const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", workoutId)
        .eq("user_id", user.id)
        .single();

    if (workoutError || !workout) {
        redirect("/dashboard/workouts");
    }

    // Fetch workout logs joined with exercise name
    const { data: logs, error: logsError } = await supabase
        .from("workout_logs")
        .select(`
            id,
            sets_completed,
            reps_completed,
            weight_kg,
            logged_at,
            notes,
            exercises ( name )
        `)
        .eq("workout_id", workoutId)
        .order("logged_at", { ascending: true });

    // Fetch all available exercises for the dropdown
    const { data: exercises, error: exercisesError } = await supabase
        .from("exercises")
        .select("id, name")
        .order("name", { ascending: true });

    const availableExercises = exercises || [];

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-6 flex items-center">
                <Link href="/dashboard/workouts" className="text-gray-500 hover:text-gray-900 mr-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 truncate">{workout.title}</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
                    <div>
                        <p className="text-gray-500 font-medium">Scheduled For</p>
                        <p className="text-gray-900 font-semibold mt-1">
                            {workout.scheduled_at ? new Date(workout.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unscheduled'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 font-medium">Duration</p>
                        <p className="text-gray-900 font-semibold mt-1">{workout.duration_min} min</p>
                    </div>
                    <div>
                        <p className="text-gray-500 font-medium">Source</p>
                        <p className="text-gray-900 font-semibold mt-1 uppercase">{workout.source}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 font-medium">Status</p>
                        <p className="text-gray-900 font-semibold mt-1">
                            {logs && logs.length > 0 ? "Started" : "Not Started"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Logged Exercises</h2>

                {logsError && (
                    <div className="bg-red-50 p-4 rounded-md text-red-600 mb-4 border border-red-200">
                        Failed to load exercise history.
                    </div>
                )}

                {!logsError && (!logs || logs.length === 0) ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No sets logged yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Record your first exercise down below.</p>
                    </div>
                ) : (
                    <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sets x Reps</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Logged</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs?.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {/* @ts-ignore - Supabase join typing can be tricky depending on setup, falling back to any if unknown. */}
                                                {log.exercises?.name || "Unknown Exercise"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.sets_completed} × {log.reps_completed}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.weight_kg ? `${log.weight_kg} kg` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {log.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <LogExerciseForm workoutId={workoutId} exercises={availableExercises} />
        </div>
    );
}
