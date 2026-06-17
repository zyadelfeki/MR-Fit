import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { withDb } from "@/lib/db";
import LogWeightForm from "@/components/LogWeightForm";
import ProgressStatsTabs from "@/components/ProgressStatsTabs";
import { Award, TrendingUp, Calendar, AlertCircle, Trophy, Flame, Medal } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

export const metadata = {
    title: "Progress | MR.FIT",
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

function buildWeightChart(entries: Array<{ date: string; weight: number }>) {
    const W = 760;
    const H = 240;
    const PL = 48; // left padding for y-axis labels
    const PR = 16;
    const PT = 16;
    const PB = 28; // bottom padding for x-axis labels

    if (entries.length < 2) return null;

    const weights = entries.map((e) => e.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = Math.max(0.5, maxW - minW);

    const toX = (i: number) => PL + (i / (entries.length - 1)) * (W - PL - PR);
    const toY = (w: number) => PT + (1 - (w - minW) / range) * (H - PT - PB);

    const pts = entries.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(" ");

    // filled area path
    const firstX = toX(0);
    const lastX = toX(entries.length - 1);
    const bottom = H - PB;
    const areaPath = `M${firstX},${toY(entries[0].weight)} ${entries
        .slice(1)
        .map((e, i) => `L${toX(i + 1)},${toY(e.weight)}`)
        .join(" ")} L${lastX},${bottom} L${firstX},${bottom} Z`;

    // grid lines + y labels
    const gridLines: Array<{ y: number; label: string }> = [];
    for (let step = 0; step <= 4; step++) {
        const val = minW + (step / 4) * range;
        gridLines.push({ y: toY(val), label: val.toFixed(1) });
    }

    // x labels: first, mid, last
    const xLabels = [
        { x: toX(0), label: entries[0].date },
        { x: toX(Math.floor((entries.length - 1) / 2)), label: entries[Math.floor((entries.length - 1) / 2)].date },
        { x: toX(entries.length - 1), label: entries[entries.length - 1].date },
    ];

    const dots = entries.map((e, i) => ({ cx: toX(i), cy: toY(e.weight), label: `${e.date}: ${e.weight} kg` }));

    return { W, H, pts, areaPath, gridLines, xLabels, dots, bottom, minW, maxW };
}

function heatColor(count: number): string {
    if (count <= 0) return "bg-neutral-800";
    if (count === 1) return "bg-[#FFB800]/30";
    if (count === 2) return "bg-[#FFB800]/65";
    return "bg-[#FFB800]";
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default async function ProgressPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const {
        profile,
        weightRows,
        heatmapRows,
        prRows,
        weeklyStats,
        monthlyStats,
        yearlyStats,
        leaderboard,
    } = await withDb(async (client) => {
        // 1. Get profile goals
        const profileRes = await client.query(
            `SELECT calorie_goal, protein_goal, carb_goal, fat_goal, fitness_goal, weight_kg
             FROM profiles WHERE user_id = $1`,
            [userId]
        );
        const _profile = profileRes.rows[0] ?? {
            calorie_goal: 2000,
            protein_goal: 150,
            carb_goal: 250,
            fat_goal: 65,
            fitness_goal: 'maintain',
            weight_kg: 70
        };

        // 2. Get 30-day weight logs
        const weightRes = await client.query(
            `SELECT recorded_at AS logged_at, value AS weight_kg
             FROM wearable_data
             WHERE user_id = $1
               AND metric = 'weight_kg'
               AND recorded_at >= (CURRENT_DATE - INTERVAL '30 days')
             ORDER BY recorded_at ASC`,
            [userId]
        );

        // 3. Get 84-day heatmap rows
        const heatmapRes = await client.query(
            `SELECT DATE(logged_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS count
             FROM workout_logs WHERE user_id = $1
               AND logged_at >= (CURRENT_DATE - INTERVAL '84 days')
             GROUP BY DATE(logged_at AT TIME ZONE 'UTC')`,
            [userId]
        );

        // 4. Get PR rows
        const prRes = await client.query(
            `SELECT e.name AS exercise_name,
                    MAX(wl.weight_kg) AS max_weight,
                    MAX(wl.reps_completed) AS max_reps,
                    MAX(wl.logged_at) AS achieved_at
             FROM workout_logs wl
             JOIN exercises e ON e.id = wl.exercise_id
             WHERE wl.user_id = $1 AND wl.weight_kg IS NOT NULL
             GROUP BY e.name ORDER BY achieved_at DESC LIMIT 10`,
            [userId]
        );

        // Helper for intervals
        const getIntervalStats = async (intervalStr: string) => {
             // Workouts
             const workoutsRes = await client.query(
               `SELECT
                  COUNT(DISTINCT COALESCE(workout_id::text, DATE(logged_at)::text))::int AS count,
                  COALESCE(SUM(sets_completed), 0)::int AS total_sets,
                  COALESCE(SUM(reps_completed), 0)::int AS total_reps
                FROM workout_logs
                WHERE user_id = $1 AND logged_at >= NOW() - CAST($2 AS interval)`,
               [userId, intervalStr]
             );

             // Nutrition
             const nutritionRes = await client.query(
               `SELECT
                  COALESCE(AVG(daily_calories), 0)::numeric(6,1) AS avg_calories,
                  COALESCE(AVG(daily_protein), 0)::numeric(6,1) AS avg_protein,
                  COALESCE(AVG(daily_carbs), 0)::numeric(6,1) AS avg_carbs,
                  COALESCE(AVG(daily_fat), 0)::numeric(6,1) AS avg_fat
                FROM (
                  SELECT
                    SUM(calories) AS daily_calories,
                    SUM(protein_g) AS daily_protein,
                    SUM(carbs_g) AS daily_carbs,
                    SUM(fat_g) AS daily_fat
                  FROM nutrition_logs
                  WHERE user_id = $1 AND logged_at >= NOW() - CAST($2 AS interval)
                  GROUP BY DATE(logged_at AT TIME ZONE 'UTC')
                ) as daily_sums`,
               [userId, intervalStr]
             );

             // Weight change
             const weightChangeRes = await client.query(
               `WITH interval_weights AS (
                  SELECT value AS weight, recorded_at
                  FROM wearable_data
                  WHERE user_id = $1 AND metric = 'weight_kg' AND recorded_at >= NOW() - CAST($2 AS interval)
                  ORDER BY recorded_at ASC
                )
                SELECT
                  (SELECT weight FROM interval_weights ORDER BY recorded_at DESC LIMIT 1)::numeric AS current_weight,
                  (SELECT weight FROM interval_weights ORDER BY recorded_at ASC LIMIT 1)::numeric AS start_weight`,
               [userId, intervalStr]
             );

             // Active days
             const activeDaysRes = await client.query(
               `SELECT COUNT(DISTINCT DATE(logged_at AT TIME ZONE 'UTC'))::int AS active_days
                FROM (
                  SELECT logged_at FROM workout_logs WHERE user_id = $1 AND logged_at >= NOW() - CAST($2 AS interval)
                  UNION ALL
                  SELECT logged_at FROM nutrition_logs WHERE user_id = $1 AND logged_at >= NOW() - CAST($2 AS interval)
                ) as combined_logs`,
               [userId, intervalStr]
             );

             const w = workoutsRes.rows[0];
             const n = nutritionRes.rows[0];
             const wc = weightChangeRes.rows[0];
             const ad = activeDaysRes.rows[0]?.active_days || 0;

             const startW = Number(wc?.start_weight) || 0;
             const currentW = Number(wc?.current_weight) || 0;
             const deltaW = currentW - startW;

             return {
               workouts: {
                 count: Number(w?.count) || 0,
                 total_sets: Number(w?.total_sets) || 0,
                 total_reps: Number(w?.total_reps) || 0,
               },
               nutrition: {
                 avg_calories: Number(n?.avg_calories) || 0,
                 avg_protein: Number(n?.avg_protein) || 0,
                 avg_carbs: Number(n?.avg_carbs) || 0,
                 avg_fat: Number(n?.avg_fat) || 0,
               },
               weight: {
                 start_weight: startW,
                 current_weight: currentW,
                 delta: deltaW,
               },
               active_days: ad,
             };
        };

        const [weekly, monthly, yearly] = await Promise.all([
             getIntervalStats('7 days'),
             getIntervalStats('30 days'),
             getIntervalStats('365 days')
        ]);

        // 5. Get leaderboard top 10 users
        const leaderboardRes = await client.query(
          `WITH user_activity_days AS (
             SELECT DISTINCT user_id, DATE(logged_at AT TIME ZONE 'UTC') AS activity_date
             FROM workout_logs
           ),
           user_streaks AS (
             SELECT
               user_id,
               activity_date,
               activity_date - CAST(row_number() OVER (PARTITION BY user_id ORDER BY activity_date) AS INT) AS grp
             FROM user_activity_days
           ),
           streak_lengths AS (
             SELECT
               user_id,
               COUNT(*) AS streak_len,
               MIN(activity_date) AS start_date,
               MAX(activity_date) AS end_date
             FROM user_streaks
             GROUP BY user_id, grp
           ),
           active_streaks AS (
             SELECT
               user_id,
               COALESCE(MAX(streak_len), 0) AS active_streak
             FROM streak_lengths
             WHERE end_date >= CURRENT_DATE - 1
             GROUP BY user_id
           )
           SELECT
             p.user_id,
             COALESCE(p.display_name, SPLIT_PART(u.email, '@', 1)) AS name,
             p.avatar_url,
             COALESCE(w.workout_count, 0)::int as workouts_count,
             COALESCE(w.total_reps, 0)::int as total_reps,
             COALESCE(w.total_sets, 0)::int as total_sets,
             COALESCE(s.active_streak, 0)::int as streak
           FROM users u
           JOIN profiles p ON u.id = p.user_id
           LEFT JOIN (
             SELECT
               user_id,
               COUNT(DISTINCT COALESCE(workout_id::text, DATE(logged_at)::text)) AS workout_count,
               SUM(reps_completed) AS total_reps,
               SUM(sets_completed) AS total_sets
             FROM workout_logs
             GROUP BY user_id
           ) w ON u.id = w.user_id
           LEFT JOIN active_streaks s ON u.id = s.user_id
           ORDER BY workouts_count DESC, total_reps DESC
           LIMIT 10`
        );

        return {
            profile: _profile,
            weightRows: weightRes.rows as WeightLog[],
            heatmapRows: heatmapRes.rows as WorkoutHeatmapRow[],
            prRows: prRes.rows as PersonalRecord[],
            weeklyStats: weekly,
            monthlyStats: monthly,
            yearlyStats: yearly,
            leaderboard: leaderboardRes.rows,
        };
    });

    const weightSeries = weightRows.map((row) => ({
        date: toIsoDate(new Date(row.logged_at)),
        weight: Number(row.weight_kg),
    }));

    const chart = buildWeightChart(weightSeries);

    const workoutCountMap = new Map<string, number>();
    heatmapRows.forEach((row) => workoutCountMap.set(toIsoDate(new Date(row.day)), Number(row.count)));

    const heatmapDays: Array<{ date: string; count: number }> = [];
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 83);
    for (let i = 0; i < 84; i++) {
        const cur = new Date(start);
        cur.setUTCDate(start.getUTCDate() + i);
        const key = toIsoDate(cur);
        heatmapDays.push({ date: key, count: workoutCountMap.get(key) ?? 0 });
    }
    const weeks = Array.from({ length: 12 }, (_, wi) => heatmapDays.slice(wi * 7, wi * 7 + 7));

    // Weight summary stats
    const currentWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].weight : null;
    const firstWeight = weightSeries.length > 0 ? weightSeries[0].weight : null;
    const weightDelta = currentWeight !== null && firstWeight !== null ? currentWeight - firstWeight : null;

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your weight trend, workout frequency, and personal records</p>
                </div>
            </div>

            {/* Tabbed Progress Comparison stats */}
            <RevealOnScroll className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#FFB800]" />
                    <h2 className="text-lg font-semibold text-white">Progress Comparison Reports</h2>
                </div>
                <ProgressStatsTabs
                    weekly={weeklyStats}
                    monthly={monthlyStats}
                    yearly={yearlyStats}
                    goals={profile}
                />
            </RevealOnScroll>

            {/* Weight Trend */}
            <RevealOnScroll className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#FFB800]" />
                    <h2 className="text-lg font-semibold text-white">Weight Trend — Last 30 Days</h2>
                </div>
                <LogWeightForm />

                <div className="rounded-xl border border-neutral-800 bg-[#161616] p-5 shadow-sm">
                    {/* Summary stats */}
                    {weightSeries.length > 0 && (
                        <div className="mb-5 flex flex-wrap gap-8 border-b border-neutral-850 pb-5">
                            <div>
                                <p className="text-xs font-medium text-neutral-400">Current Weight</p>
                                <p className="mt-0.5 text-xl font-bold text-white">{currentWeight} kg</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-neutral-400">Change (30d)</p>
                                <p className={`mt-0.5 text-xl font-bold ${
                                    weightDelta === null ? "text-neutral-500" :
                                    weightDelta > 0 ? "text-red-500" :
                                    weightDelta < 0 ? "text-emerald-500" : "text-neutral-400"
                                }`}>
                                    {weightDelta === null ? "—" : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-neutral-400">Entries Logged</p>
                                <p className="mt-0.5 text-xl font-bold text-white">{weightSeries.length}</p>
                            </div>
                        </div>
                    )}

                    {!chart ? (
                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                            <AlertCircle className="h-4 w-4 text-neutral-500" />
                            <span>Log your weight daily to see your progress chart.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="h-56 w-full min-w-[580px]">
                                <defs>
                                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FFB800" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#FFB800" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Grid lines + Y labels */}
                                {chart.gridLines.map((gl, i) => (
                                    <g key={i}>
                                        <line x1={48} x2={chart.W - 16} y1={gl.y} y2={gl.y}
                                            stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" className="text-neutral-600" />
                                        <text x={44} y={gl.y + 4} fontSize="10" fill="currentColor"
                                            opacity="0.45" textAnchor="end" className="text-neutral-400">
                                            {gl.label}
                                        </text>
                                    </g>
                                ))}

                                {/* Gradient fill area */}
                                <path d={chart.areaPath} fill="url(#weightGrad)" />

                                {/* Line */}
                                <polyline fill="none" stroke="#FFB800" strokeWidth="2.5"
                                    strokeLinejoin="round" strokeLinecap="round"
                                    points={chart.pts} />

                                {/* Dots */}
                                {chart.dots.map((d, i) => (
                                    <circle key={i} cx={d.cx} cy={d.cy} r="3.5" fill="#FFB800">
                                        <title>{d.label}</title>
                                    </circle>
                                ))}

                                {/* X labels */}
                                {chart.xLabels.map((xl, i) => (
                                    <text key={i} x={xl.x} y={chart.H - 4} fontSize="10" fill="currentColor"
                                        opacity="0.45" textAnchor="middle" className="text-neutral-400">
                                        {xl.label}
                                    </text>
                                ))}
                            </svg>
                        </div>
                    )}
                </div>
            </RevealOnScroll>

            {/* Heatmap */}
            <RevealOnScroll className="rounded-xl border border-neutral-800 bg-[#161616] p-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#FFB800]" />
                    <h2 className="text-lg font-semibold text-white">Workout Frequency</h2>
                </div>
                <p className="mt-1 text-sm text-neutral-400">Last 12 weeks of activity</p>

                <div className="mt-5 flex gap-2 overflow-x-auto">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-0.5 pr-1">
                        {DAY_LABELS.map((d, i) => (
                            <div key={i} className="flex h-3.5 items-center text-[9px] text-neutral-500">{d}</div>
                        ))}
                    </div>

                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-0.5">
                            {week.map((day) => (
                                <div key={day.date}
                                    title={`${day.date}: ${day.count} workouts`}
                                    className={`h-3.5 w-3.5 rounded-sm ${heatColor(day.count)} transition-all hover:scale-[1.15]`} />
                            ))}
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
                    <span>Less</span>
                    <span className="h-3.5 w-3.5 rounded-sm bg-neutral-800" />
                    <span className="h-3.5 w-3.5 rounded-sm bg-[#FFB800]/30" />
                    <span className="h-3.5 w-3.5 rounded-sm bg-[#FFB800]/65" />
                    <span className="h-3.5 w-3.5 rounded-sm bg-[#FFB800]" />
                    <span>More</span>
                </div>
            </RevealOnScroll>

            {/* PRs */}
            <RevealOnScroll className="rounded-xl border border-neutral-800 bg-[#161616] p-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#FFB800]" />
                    <h2 className="text-lg font-semibold text-white">Personal Records</h2>
                </div>

                {prRows.length === 0 ? (
                    <div className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
                        <AlertCircle className="h-4 w-4 text-neutral-500" />
                        <span>Complete workouts with weights to track your PRs.</span>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-800">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Exercise</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Best Weight</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Reps</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Achieved</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800 text-neutral-300">
                                {prRows.map((row, idx) => (
                                    <tr key={`${row.exercise_name}-${row.achieved_at}`}
                                        className={idx === 0 ? "bg-[#FFB800]/5 border-l-2 border-l-[#FFB800]" : ""}>
                                        <td className="px-4 py-3 text-sm font-medium text-white flex items-center gap-1.5">
                                            {row.exercise_name}
                                            {idx === 0 && (
                                                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFB800]/10 px-2 py-0.5 text-[9px] font-bold text-[#FFB800] border border-[#FFB800]/20">
                                                    <Award className="h-2.5 w-2.5" /> PR
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{Number(row.max_weight)} kg</td>
                                        <td className="px-4 py-3 text-sm">{Number(row.max_reps)}</td>
                                        <td className="px-4 py-3 text-sm">{new Date(row.achieved_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </RevealOnScroll>

            {/* Community Leaderboard */}
            <RevealOnScroll className="rounded-xl border border-neutral-850 bg-[#161616] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <Trophy className="h-40 w-40 text-[#FFB800]" />
                </div>
                <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-5">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-[#FFB800]" />
                        <h2 className="text-lg font-semibold text-white">Community Leaderboard</h2>
                    </div>
                    <span className="text-xs font-bold text-[#FFB800] uppercase tracking-widest bg-[#FFB800]/10 px-2.5 py-1 rounded-full border border-[#FFB800]/20">
                        Top Members
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-800">
                        <thead>
                            <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-450">Rank</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-neutral-450">Member</th>
                                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-neutral-450">Workouts</th>
                                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-neutral-450">Total Reps</th>
                                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-neutral-450">Streak</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850 text-neutral-300">
                            {leaderboard.map((member: any, idx: number) => {
                                const isCurrentUser = member.user_id === userId;
                                const isTop3 = idx < 3;
                                const medals = [
                                    <Medal key="gold" className="h-4 w-4 text-[#FFD700]" />,
                                    <Medal key="silver" className="h-4 w-4 text-[#C0C0C0]" />,
                                    <Medal key="bronze" className="h-4 w-4 text-[#CD7F32]" />
                                ];

                                return (
                                    <tr key={member.user_id} className={`transition-all ${
                                        isCurrentUser ? "bg-[#FFB800]/5 border-l-2 border-l-[#FFB800]" : "hover:bg-neutral-900/40"
                                    }`}>
                                        <td className="px-4 py-3.5 text-sm font-medium">
                                            <div className="flex items-center gap-1.5 font-bold">
                                                {isTop3 ? (
                                                    medals[idx]
                                                ) : (
                                                    <span className="text-neutral-500 pl-1">#{idx + 1}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm font-semibold text-white">
                                            <div className="flex items-center gap-2">
                                                <span>{member.name}</span>
                                                {isCurrentUser && (
                                                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/25 px-1.5 py-0.5 rounded">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-center font-bold text-neutral-200">
                                            {member.workouts_count}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-center text-neutral-400 font-medium">
                                            {member.total_reps.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-center">
                                            {member.streak > 0 ? (
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs font-bold">
                                                    <Flame className="h-3 w-3 fill-amber-500" />
                                                    <span>{member.streak} d</span>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-500">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </RevealOnScroll>
        </div>
    );
}
