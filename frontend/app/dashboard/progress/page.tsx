import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import dynamic from "next/dynamic";
import WeightTracker from "@/components/WeightTracker";

export const metadata = {
    title: "Progress | MR-Fit",
    description: "Track your fitness progress over time",
};

const VolumeChart: React.ComponentType<{ data: { week: string; volume: number }[] }> = dynamic(
    () => import("@/components/VolumeChart"),
    {
        ssr: false,
        loading: () => <div className="h-48 animate-pulse bg-gray-100 rounded-lg" />,
    }
) as any;

// Helper to get week number
function getWeekNumber(d: Date) {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    return Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default async function ProgressPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;
    const now = new Date();

    // =====================================
    // SECTION 1: Volume Over Time (8 Weeks)
    // =====================================
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(now.getDate() - 8 * 7);

    const rawLogsRes = await pool.query(
        `SELECT sets_completed, reps_completed, weight_kg, logged_at
     FROM workout_logs
     WHERE user_id = $1 AND logged_at >= $2`,
        [userId, eightWeeksAgo.toISOString()]
    );
    const rawLogs = rawLogsRes.rows;

    const weeklyVolumeMap = new Map<string, number>();
    const weeks: string[] = [];
    for (let i = 7; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i * 7);
        const weekLabel = `W${getWeekNumber(d)}`;
        weeks.push(weekLabel);
        weeklyVolumeMap.set(weekLabel, 0);
    }

    rawLogs.forEach((log) => {
        if (!log.weight_kg) return;
        const logDate = new Date(log.logged_at);
        const weekLabel = `W${getWeekNumber(logDate)}`;
        if (weeklyVolumeMap.has(weekLabel)) {
            const volume =
                (log.sets_completed || 0) * (log.reps_completed || 0) * (log.weight_kg || 0);
            weeklyVolumeMap.set(weekLabel, (weeklyVolumeMap.get(weekLabel) || 0) + volume);
        }
    });

    const volumeChartData = weeks.map((w) => ({
        week: w,
        volume: weeklyVolumeMap.get(w) || 0,
    }));

    // =====================================
    // SECTION 2: Personal Records
    // =====================================
    const prLogsRes = await pool.query(
        `SELECT wl.weight_kg, wl.logged_at, e.name AS exercise_name
     FROM workout_logs wl
     LEFT JOIN exercises e ON wl.exercise_id = e.id
     WHERE wl.user_id = $1 AND wl.weight_kg IS NOT NULL`,
        [userId]
    );

    const exerciseMaxes = new Map<string, { weight: number; date: string }>();
    prLogsRes.rows.forEach((log) => {
        const exName = log.exercise_name;
        if (!exName || !log.weight_kg) return;
        const current = exerciseMaxes.get(exName);
        if (!current || log.weight_kg > current.weight) {
            exerciseMaxes.set(exName, { weight: log.weight_kg, date: log.logged_at });
        }
    });

    const prTableData = Array.from(exerciseMaxes.entries())
        .map(([name, data]) => ({ name, weight: data.weight, date: data.date }))
        .sort((a, b) => b.weight - a.weight);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Progress Tracking
            </h1>

            {/* Volume Chart */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="mb-4 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Total Volume Over Time
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Sum of sets × reps × weight (kg) for the last 8 weeks
                    </p>
                </div>
                {rawLogs.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">
                            Log some workouts to start tracking your progress
                        </p>
                    </div>
                ) : (
                    <VolumeChart data={volumeChartData} />
                )}
            </section>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Personal Records */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Personal Records
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Heaviest weight lifted per exercise
                        </p>
                    </div>

                    <div className="overflow-y-auto flex-1 p-0">
                        {prTableData.length === 0 ? (
                            <div className="p-8 text-center bg-white dark:bg-gray-800 h-full flex flex-col items-center justify-center">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No personal records established yet.
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                    Log some weighted exercises to see them here.
                                </p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Exercise
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Best Weight
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Date Achieved
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                    {prTableData.map((pr, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {pr.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">
                                                {pr.weight} kg
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                                                {new Date(pr.date).toLocaleDateString([], {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                <WeightTracker />
            </div>
        </div>
    );
}
