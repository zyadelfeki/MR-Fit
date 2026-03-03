"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

type NutritionLog = {
    id: string;
    user_id: string;
    food_name: string;
    calories: number;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    logged_at: string;
};

export default function NutritionPage() {
    const [supabase] = useState(() => createBrowserClient());
    const [logs, setLogs] = useState<NutritionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [foodName, setFoodName] = useState("");
    const [calories, setCalories] = useState<number | "">("");
    const [protein, setProtein] = useState<number | "">("");
    const [carbs, setCarbs] = useState<number | "">("");
    const [fats, setFats] = useState<number | "">("");
    const [loggedDate, setLoggedDate] = useState(() => new Date().toISOString().split("T")[0]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            const userId = userData?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            // Generate start of today in local timezone for "today midnight"
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayIso = today.toISOString();

            const { data, error } = await supabase
                .from("nutrition_logs")
                .select("*")
                .eq("user_id", userId)
                .gte("logged_at", todayIso)
                .order("logged_at", { ascending: false });

            if (error) throw error;
            setLogs(data as NutritionLog[]);
        } catch (err: any) {
            console.error("Error fetching logs:", err.message);
            setError("Failed to load nutrition logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foodName || calories === "" || calories < 1) {
            setError("Please provide a valid food name and calories.");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            const userId = userData?.user?.id;
            if (!userId) throw new Error("Not authenticated");

            // We append a time to the date so it's a valid timestamp, 
            // or we can just send it. Let's send it as midnight of the inputted date.
            const timestamp = new Date(loggedDate).toISOString();

            const { error: insertError } = await supabase.from("nutrition_logs").insert([
                {
                    user_id: userId,
                    food_name: foodName,
                    calories: Number(calories),
                    protein_g: protein === "" ? null : Number(protein),
                    carbs_g: carbs === "" ? null : Number(carbs),
                    fat_g: fats === "" ? null : Number(fats),
                    logged_at: timestamp,
                },
            ]);

            if (insertError) throw insertError;

            // Reset form
            setFoodName("");
            setCalories("");
            setProtein("");
            setCarbs("");
            setFats("");
            setLoggedDate(new Date().toISOString().split("T")[0]);

            // Refresh logs
            await fetchLogs();
        } catch (err: any) {
            console.error("Error adding log:", err.message);
            setError("Failed to add food log.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from("nutrition_logs")
                .delete()
                .eq("id", id);

            if (deleteError) throw deleteError;

            await fetchLogs();
        } catch (err: any) {
            console.error("Error deleting log:", err.message);
            setError("Failed to delete log.");
        }
    };

    // Calculate Macros
    const totalCalories = logs.reduce((acc, log) => acc + (log.calories || 0), 0);
    const totalProtein = logs.reduce((acc, log) => acc + (log.protein_g || 0), 0);
    const totalCarbs = logs.reduce((acc, log) => acc + (log.carbs_g || 0), 0);
    const totalFats = logs.reduce((acc, log) => acc + (log.fat_g || 0), 0);

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold">Nutrition Tracker</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    {error}
                </div>
            )}

            {/* Section 1: Daily Log Form */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Log Food</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Food Name *</label>
                            <input
                                type="text"
                                value={foodName}
                                onChange={(e) => setFoodName(e.target.value)}
                                required
                                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Chicken Breast"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input
                                type="date"
                                value={loggedDate}
                                onChange={(e) => setLoggedDate(e.target.value)}
                                required
                                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Calories *</label>
                            <input
                                type="number"
                                min="1"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value === "" ? "" : Number(e.target.value))}
                                required
                                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Protein (g)</label>
                            <input
                                type="number"
                                min="0"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                            <input
                                type="number"
                                min="0"
                                value={carbs}
                                onChange={(e) => setCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Fats (g)</label>
                            <input
                                type="number"
                                min="0"
                                value={fats}
                                onChange={(e) => setFats(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? "Saving..." : "Log Food"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Section 2: Today's Summary */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Today's Summary</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm text-center">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Calories</div>
                        <div className="text-2xl font-bold">{totalCalories}</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm text-center">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Protein</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalProtein}g</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm text-center">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Carbs</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalCarbs}g</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm text-center">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Fats</div>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalFats}g</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-6 text-center text-zinc-500">Loading today's logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500">No food logged today.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                        <th className="p-4 text-sm font-semibold">Food</th>
                                        <th className="p-4 text-sm font-semibold">Cals</th>
                                        <th className="p-4 text-sm font-semibold">P (g)</th>
                                        <th className="p-4 text-sm font-semibold">C (g)</th>
                                        <th className="p-4 text-sm font-semibold">F (g)</th>
                                        <th className="p-4 text-sm font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="p-4 text-sm font-medium">{log.food_name}</td>
                                            <td className="p-4 text-sm">{log.calories}</td>
                                            <td className="p-4 text-sm">{log.protein_g || "-"}</td>
                                            <td className="p-4 text-sm">{log.carbs_g || "-"}</td>
                                            <td className="p-4 text-sm">{log.fat_g || "-"}</td>
                                            <td className="p-4 text-sm text-right">
                                                <button
                                                    onClick={() => handleDelete(log.id)}
                                                    className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
