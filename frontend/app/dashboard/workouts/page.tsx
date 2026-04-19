import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";

export const metadata = {
    title: "Workouts | MR.FIT",
    description: "Track and manage your workouts",
};

export default async function WorkoutsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const res = await pool.query(
          `SELECT id, title, source, duration_min, scheduled_at, created_at
     FROM workouts
     WHERE user_id = $1
      ORDER BY created_at DESC`,
        [session.user.id]
    );

    const workouts = res.rows;

    const getWorkoutType = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes("hiit")) return "HIIT";
        if (lower.includes("cardio") || lower.includes("run") || lower.includes("cycle")) return "Cardio";
        if (lower.includes("stretch") || lower.includes("mobility") || lower.includes("yoga")) return "Flexibility";
        if (lower.includes("strength") || lower.includes("upper") || lower.includes("lower") || lower.includes("push") || lower.includes("pull") || lower.includes("legs")) return "Strength";
        return "Other";
    };

    const getWorkoutTypeBadge = (type: string) => {
        if (type === "Strength") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        if (type === "Cardio") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        if (type === "Flexibility") return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
        if (type === "HIIT") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Workouts
                </h1>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/workouts/templates"
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Templates
                    </Link>
                    <Link
                        href="/dashboard/workouts/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm font-medium"
                    >
                        Create Workout
                    </Link>
                </div>
            </div>

            {!workouts || workouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-6xl mb-4">🏋️</div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No workouts logged yet. Start your first workout! 💪
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Choose a template or create one from scratch.
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/workouts/new"
                            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                        >
                            Create Workout
                        </Link>
                        <Link
                            href="/dashboard/workouts/templates"
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Browse Templates
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workouts.map((workout) => {
                        const workoutType = getWorkoutType(workout.title);
                        return (
                            <div key={workout.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition h-full flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        {workout.title}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getWorkoutTypeBadge(workoutType)}`}>
                                        {workoutType}
                                    </span>
                                </div>

                                <div className="mt-auto space-y-2">
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <svg
                                            className="flex-shrink-0 mr-2 h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        {workout.scheduled_at
                                            ? new Date(workout.scheduled_at).toLocaleDateString([], {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "Unscheduled"}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <svg
                                            className="flex-shrink-0 mr-2 h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        {workout.duration_min ? `${workout.duration_min}m` : "-"}
                                    </div>

                                    <Link
                                        href={`/dashboard/workouts/${workout.id}`}
                                        className="inline-flex text-sm font-medium text-gray-900 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        View Details →
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

