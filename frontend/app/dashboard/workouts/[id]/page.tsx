import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";
import LogExerciseForm from "@/components/LogExerciseForm";

export default async function WorkoutDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const workoutId = params.id;

    // Fetch workout and verify ownership
    const workoutRes = await pool.query(
        `SELECT id, title, source, duration_min, scheduled_at, created_at
     FROM workouts
     WHERE id = $1 AND user_id = $2`,
        [workoutId, session.user.id]
    );

    if (workoutRes.rows.length === 0) {
        redirect("/dashboard/workouts");
    }

    const workout = workoutRes.rows[0];

    const workoutExercisesCountRes = await pool.query(
        `SELECT COUNT(*)::int AS count
     FROM workout_exercises
     WHERE workout_id = $1`,
        [workoutId]
    );
    const hasPlannedExercises = (workoutExercisesCountRes.rows[0]?.count || 0) > 0;

    // Fetch logged sets for this workout
    const logsRes = await pool.query(
        `SELECT wl.id, wl.sets_completed, wl.reps_completed, wl.weight_kg,
            wl.logged_at, wl.notes, e.name AS exercise_name
     FROM workout_logs wl
     LEFT JOIN exercises e ON wl.exercise_id = e.id
     WHERE wl.workout_id = $1
     ORDER BY wl.logged_at ASC`,
        [workoutId]
    );
    const logs = logsRes.rows;

    // Fetch all exercises for the log form dropdown
    const exercisesRes = await pool.query(
        `SELECT id, name FROM exercises ORDER BY name ASC`
    );
    const availableExercises = exercisesRes.rows;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Link
                href="/dashboard/workouts"
                className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
            >
                ← Back to Workouts
            </Link>

            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white truncate">
                    {workout.title}
                </h1>
                {hasPlannedExercises && (
                    <Link
                        href={`/dashboard/workouts/${workout.id}/session`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition shadow-md text-lg"
                    >
                        ▶ Start Workout
                    </Link>
                )}
            </div>

            {/* Workout meta */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-8">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Scheduled For
                        </p>
                        <p className="text-gray-900 dark:text-white font-semibold mt-1">
                            {workout.scheduled_at
                                ? new Date(workout.scheduled_at).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                                : "Unscheduled"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Duration
                        </p>
                        <p className="text-gray-900 dark:text-white font-semibold mt-1">
                            {workout.duration_min} min
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Source
                        </p>
                        <p className="text-gray-900 dark:text-white font-semibold mt-1 uppercase">
                            {workout.source}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Status
                        </p>
                        <p className="text-gray-900 dark:text-white font-semibold mt-1">
                            {logs.length > 0 ? "Started" : "Not Started"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Logged exercises */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Logged Exercises
                </h2>

                {logs.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                            No sets logged yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Record your first exercise down below.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Exercise
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Sets × Reps
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Weight
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Time Logged
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Notes
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {log.exercise_name || "Unknown Exercise"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {log.sets_completed} × {log.reps_completed}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {log.weight_kg ? `${log.weight_kg} kg` : "-"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(log.logged_at).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                {log.notes || "-"}
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
