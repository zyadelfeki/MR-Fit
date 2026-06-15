import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";
import { Calendar, Clock, Dumbbell, ClipboardList, Plus, ChevronRight } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

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
    Strength: "bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20",
    Cardio: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Flexibility: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    HIIT: "bg-red-500/10 text-red-400 border border-red-500/20",
    General: "bg-neutral-800 text-neutral-300 border border-neutral-700",
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
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#161616] px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            Templates
          </Link>
          <Link
            href="/dashboard/workouts/new"
            className="btn-primary bg-[#FFB800] text-black hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Log Workout
          </Link>
        </div>
      </div>

      {!workouts || workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FFB800]/5 flex items-center justify-center mb-4 border border-[#FFB800]/10">
            <Dumbbell className="h-8 w-8 text-[#FFB800]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-750 dark:text-neutral-300 mb-1">
            No workouts logged yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-450 mb-6 max-w-xs">
            Choose a template or create your first workout from scratch.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/workouts/new" className="btn-primary bg-[#FFB800] text-black">
              Log your first workout
            </Link>
            <Link href="/dashboard/workouts/templates"
              className="px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-sm font-medium text-neutral-300 hover:bg-neutral-850 hover:text-white transition-colors">
              Browse Templates
            </Link>
          </div>
        </div>
      ) : (
        <RevealOnScroll className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => {
            const workoutType = getWorkoutType(workout.title);
            return (
              <div key={workout.id}
                className="bg-[#161616] rounded-xl border border-neutral-800 p-5 hover:border-neutral-700 transition-all hover:scale-[1.02] flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-white leading-snug">
                    {workout.title}
                  </h3>
                  <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${typeBadgeClass[workoutType]}`}>
                    {workoutType}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                    {formatDate(workout.scheduled_at ?? workout.created_at)}
                  </span>
                  {workout.duration_min && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" />
                      {workout.duration_min} min
                    </span>
                  )}
                </div>

                <Link
                  href={`/dashboard/workouts/${workout.id}`}
                  className="mt-auto flex items-center justify-between w-full rounded-lg bg-neutral-900/60 hover:bg-[#FFB800]/10 px-3 py-2 text-sm font-medium text-neutral-300 hover:text-[#FFB800] border border-neutral-800 hover:border-[#FFB800]/20 transition-all"
                >
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </RevealOnScroll>
      )}
    </div>
  );
}
