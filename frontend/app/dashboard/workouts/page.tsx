import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "My Workouts | MR-Fit",
  description: "Track and manage your workouts",
};

export default async function WorkoutsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workoutsRes = await pool.query(
    `SELECT id, title, source, duration_min, scheduled_at, created_at
     FROM workouts WHERE user_id = $1 ORDER BY created_at DESC`,
    [session.user.id]
  );

  // Summary stats
  const statsRes = await pool.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS this_month
     FROM workouts WHERE user_id = $1`,
    [session.user.id]
  );

  const workouts = workoutsRes.rows;
  const total = Number(statsRes.rows[0]?.total ?? 0);
  const thisMonth = Number(statsRes.rows[0]?.this_month ?? 0);

  const getWorkoutType = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("hiit")) return "HIIT";
    if (lower.includes("cardio") || lower.includes("run") || lower.includes("cycle")) return "Cardio";
    if (lower.includes("stretch") || lower.includes("mobility") || lower.includes("yoga")) return "Flexibility";
    if (lower.includes("strength") || lower.includes("upper") || lower.includes("lower") || lower.includes("push") || lower.includes("pull") || lower.includes("legs")) return "Strength";
    return "General";
  };

  const typeBadgeClass: Record<string, string> = {
    Strength: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    Cardio: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    Flexibility: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    HIIT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    General: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Unscheduled";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Workouts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} total · ${thisMonth} this month` : "No workouts logged yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/workouts/templates"
            className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Templates
          </Link>
          <Link
            href="/dashboard/workouts/new"
            className="btn-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Log Workout
          </Link>
        </div>
      </div>

      {!workouts || workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
              <circle cx="4" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="20" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
              <line x1="6.5" y1="12" x2="17.5" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="8" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
            No workouts logged yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
            Choose a template or create your first workout from scratch.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/workouts/new" className="btn-primary">
              Log your first workout
            </Link>
            <Link href="/dashboard/workouts/templates"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Browse Templates
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => {
            const workoutType = getWorkoutType(workout.title);
            return (
              <div key={workout.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
                    {workout.title}
                  </h3>
                  <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${typeBadgeClass[workoutType]}`}>
                    {workoutType}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {formatDate(workout.scheduled_at ?? workout.created_at)}
                  </span>
                  {workout.duration_min && (
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {workout.duration_min} min
                    </span>
                  )}
                </div>

                <Link
                  href={`/dashboard/workouts/${workout.id}`}
                  className="mt-auto flex items-center justify-between w-full rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  View Details
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
