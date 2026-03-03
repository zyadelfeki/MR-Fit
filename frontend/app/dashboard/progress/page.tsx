import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import VolumeChart from "../../../../components/VolumeChart";

// Helper to get week number
function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

export default async function ProgressPage() {
    const supabase = await createClient();

    // Auth Check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        redirect("/login");
    }

    const now = new Date();

    // ==========================================
    // SECTION 1: Volume Over Time (Last 8 Weeks)
    // ==========================================
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(now.getDate() - (8 * 7));

    const { data: rawLogs, error: rawLogsError } = await supabase
        .from("workout_logs")
        .select("sets_completed, reps_completed, weight_kg, logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", eightWeeksAgo.toISOString());

    const weeklyVolumeMap = new Map<string, number>();

    // Initialize last 8 weeks with 0 volume (W1 to W8)
    const weeks: string[] = [];
    for (let i = 7; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - (i * 7));
        // We use a simple label like "W42" to represent the week
        const weekLabel = `W${getWeekNumber(d)}`;
        weeks.push(weekLabel);
        weeklyVolumeMap.set(weekLabel, 0);
    }

    if (!rawLogsError && rawLogs) {
        rawLogs.forEach(log => {
            if (!log.weight_kg) return; // Skip bodyweight sets for simple volume tracking

            const logDate = new Date(log.logged_at);
            const weekLabel = `W${getWeekNumber(logDate)}`;

            if (weeklyVolumeMap.has(weekLabel)) {
                const volume = (log.sets_completed || 0) * (log.reps_completed || 0) * (log.weight_kg || 0);
                const currentVolume = weeklyVolumeMap.get(weekLabel) || 0;
                weeklyVolumeMap.set(weekLabel, currentVolume + volume);
            }
        });
    }

    const volumeChartData = weeks.map(w => ({
        week: w,
        volume: weeklyVolumeMap.get(w) || 0
    }));

    // ==========================================
    // SECTION 2: Personal Records
    // ==========================================
    // Note: Doing max in JS since supabase JS client lacks direct GROUP BY
    // In a prod app, we'd use a postgres function or view
    const { data: allLogsForPr, error: prError } = await supabase
        .from("workout_logs")
        .select(`
            weight_kg,
            logged_at,
            exercises(name)
        `)
        .eq("user_id", user.id)
        .not("weight_kg", "is", null);

    const exerciseMaxes = new Map<string, { weight: number, date: string }>();

    if (!prError && allLogsForPr) {
        allLogsForPr.forEach(log => {
            // @ts-ignore
            const exName = log.exercises?.name;
            if (!exName || !log.weight_kg) return;

            const currentRecord = exerciseMaxes.get(exName);
            if (!currentRecord || log.weight_kg > currentRecord.weight) {
                exerciseMaxes.set(exName, {
                    weight: log.weight_kg,
                    date: log.logged_at
                });
            }
        });
    }

    const prTableData = Array.from(exerciseMaxes.entries()).map(([name, data]) => ({
        name,
        weight: data.weight,
        date: data.date
    })).sort((a, b) => b.weight - a.weight);

    // ==========================================
    // SECTION 3: Body weight trend
    // ==========================================
    const { data: weightData, error: weightError } = await supabase
        .from("wearable_data")
        .select("value, unit, recorded_at")
        .eq("user_id", user.id)
        .eq("metric", "weight_kg")
        .order("recorded_at", { ascending: false })
        .limit(10);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Progress Tracking</h1>

            {/* Volume Chart */}
            <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="mb-4 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-900">Total Volume Over Time</h2>
                    <p className="text-sm text-gray-500 mt-1">Sum of sets × reps × weight (kg) for the last 8 weeks</p>
                </div>
                <VolumeChart data={volumeChartData} />
            </section>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Personal Records */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 shrink-0">
                        <h2 className="text-xl font-bold text-gray-900">Personal Records</h2>
                        <p className="text-sm text-gray-500 mt-1">Heaviest weight lifted per exercise</p>
                    </div>

                    <div className="overflow-y-auto flex-1 p-0">
                        {prTableData.length === 0 ? (
                            <div className="p-8 text-center bg-white h-full flex flex-col items-center justify-center">
                                <p className="text-gray-500 text-sm">No personal records established yet.</p>
                                <p className="text-gray-400 text-xs mt-1">Log some weighted exercises to see them here.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Best Weight</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Date Achieved</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {prTableData.map((pr, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pr.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">{pr.weight} kg</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                {new Date(pr.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                {/* Body Weight Trend */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Bodyweight Trend</h2>
                            <p className="text-sm text-gray-500 mt-1">Last 10 weigh-ins</p>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-0">
                        {!weightData || weightData.length === 0 ? (
                            <div className="p-8 text-center bg-white h-full flex flex-col items-center justify-center">
                                <p className="text-gray-500 text-sm">No weight data synced yet.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {weightData.map((entry, idx) => (
                                    <li key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                                        <div className="flex items-center">
                                            <div className="bg-blue-100 p-2 rounded-full mr-4">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {new Date(entry.recorded_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <span className="text-base font-bold text-gray-900">
                                            {entry.value} {entry.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
