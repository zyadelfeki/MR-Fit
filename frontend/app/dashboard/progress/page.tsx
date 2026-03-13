import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import LogWeightForm from "@/components/LogWeightForm";

export const metadata = {
    title: "Progress | MR-Fit",
    description: "Track your fitness progress over time",
};

type WeightLog = {
    logged_at: string;
    weight_kg: string;
};

type WorkoutHeatmapRow = {
    day: string;
    count: string;
};

type PersonalRecord = {
    exercise_name: string;
    max_weight: string;
    max_reps: string;
    achieved_at: string;
};

function toIsoDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

function buildWeightChartPoints(entries: Array<{ date: string; weight: number }>) {
    const width = 760;
    const height = 220;
    const padding = 24;

    if (entries.length < 2) {
        return { width, height, points: "", minY: 0, maxY: 0 };
    }

    const weights = entries.map((entry) => entry.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const yRange = Math.max(0.5, maxWeight - minWeight);

    const points = entries
        .map((entry, index) => {
            const x = padding + (index / (entries.length - 1)) * (width - padding * 2);
            const y = height - padding - ((entry.weight - minWeight) / yRange) * (height - padding * 2);
            return `${x},${y}`;
        })
        .join(" ");

    return { width, height, points, minY: minWeight, maxY: maxWeight };
}

function heatColor(count: number): string {
    if (count <= 0) return "bg-gray-100 dark:bg-gray-800";
    if (count === 1) return "bg-indigo-200";
    if (count === 2) return "bg-indigo-400";
    return "bg-indigo-600";
}

export default async function ProgressPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;

    let weightRows: WeightLog[] = [];
    let heatmapRows: WorkoutHeatmapRow[] = [];
    let prRows: PersonalRecord[] = [];

    try {
        const weightRes = await pool.query(
            `SELECT logged_at, weight_kg
             FROM weight_logs
             WHERE user_id = $1
               AND logged_at >= (CURRENT_DATE - INTERVAL '30 days')
             ORDER BY logged_at ASC`,
            [userId]
        );
        weightRows = weightRes.rows as WeightLog[];
    } catch {
        weightRows = [];
    }

    try {
        const heatmapRes = await pool.query(
            `SELECT DATE(logged_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS count
             FROM workout_logs
             WHERE user_id = $1
               AND logged_at >= (CURRENT_DATE - INTERVAL '84 days')
             GROUP BY DATE(logged_at AT TIME ZONE 'UTC')`,
            [userId]
        );
        heatmapRows = heatmapRes.rows as WorkoutHeatmapRow[];
    } catch {
        heatmapRows = [];
    }

    try {
        const prsRes = await pool.query(
            `SELECT exercise_name,
                    MAX(weight_kg) AS max_weight,
                    MAX(reps) AS max_reps,
                    MAX(wl.logged_at) AS achieved_at
             FROM workout_log_exercises wle
             JOIN workout_logs wl ON wl.id = wle.workout_log_id
             WHERE wl.user_id = $1 AND weight_kg IS NOT NULL
             GROUP BY exercise_name
             ORDER BY achieved_at DESC
             LIMIT 10`,
            [userId]
        );
        prRows = prsRes.rows as PersonalRecord[];
    } catch {
        prRows = [];
    }

    const weightSeries = weightRows.map((row) => ({
        date: toIsoDate(new Date(row.logged_at)),
        weight: Number(row.weight_kg),
    }));

    const chart = buildWeightChartPoints(weightSeries);

    const workoutCountMap = new Map<string, number>();
    heatmapRows.forEach((row) => {
        workoutCountMap.set(toIsoDate(new Date(row.day)), Number(row.count));
    });

    const heatmapDays: Array<{ date: string; count: number }> = [];
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 83);

    for (let i = 0; i < 84; i += 1) {
        const current = new Date(start);
        current.setUTCDate(start.getUTCDate() + i);
        const key = toIsoDate(current);
        heatmapDays.push({ date: key, count: workoutCountMap.get(key) ?? 0 });
    }

    const weeks = Array.from({ length: 12 }, (_, weekIndex) =>
        heatmapDays.slice(weekIndex * 7, weekIndex * 7 + 7)
    );

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Progress Tracking</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weight Trend (Last 30 Days)</h2>
                <LogWeightForm />

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {weightSeries.length < 2 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Log your weight daily to see your progress chart 📉
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-64 w-full min-w-[640px]">
                                <polyline
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-indigo-500"
                                    points={chart.points}
                                />
                                {weightSeries.map((entry, index) => {
                                    const x = 24 + (index / (weightSeries.length - 1)) * (chart.width - 48);
                                    const y = chart.height - 24 - ((entry.weight - chart.minY) / Math.max(0.5, chart.maxY - chart.minY)) * (chart.height - 48);
                                    return (
                                        <circle key={`${entry.date}-${entry.weight}`} cx={x} cy={y} r="4" className="fill-indigo-600">
                                            <title>{`${entry.date}: ${entry.weight} kg`}</title>
                                        </circle>
                                    );
                                })}
                            </svg>
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Workout Frequency Heatmap</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Last 12 weeks of workout activity</p>

                <div className="mt-4 flex gap-2 overflow-x-auto">
                    {weeks.map((week, weekIndex) => (
                        <div key={`week-${weekIndex}`} className="flex flex-col gap-0.5">
                            {week.map((day) => (
                                <div
                                    key={day.date}
                                    title={`${day.date}: ${day.count} workouts`}
                                    className={`h-3.5 w-3.5 rounded-sm ${heatColor(day.count)}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Less</span>
                    <span className="h-3.5 w-3.5 rounded-sm bg-gray-100 dark:bg-gray-800" />
                    <span className="h-3.5 w-3.5 rounded-sm bg-indigo-200" />
                    <span className="h-3.5 w-3.5 rounded-sm bg-indigo-400" />
                    <span className="h-3.5 w-3.5 rounded-sm bg-indigo-600" />
                    <span>More</span>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Records</h2>

                {prRows.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Complete workouts with weights to track your PRs 🏆
                    </p>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Exercise</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Best Weight</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Reps</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date achieved</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {prRows.map((row) => (
                                    <tr key={`${row.exercise_name}-${row.achieved_at}`}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.exercise_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{Number(row.max_weight)} kg</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{Number(row.max_reps)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{new Date(row.achieved_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
