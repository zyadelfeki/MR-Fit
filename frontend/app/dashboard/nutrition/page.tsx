"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast";

type NutritionLog = {
    id: string;
    food_name: string;
    calories: number;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    logged_at: string;
};

type FoodResult = {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
};

type DailySummary = {
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    goals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
};

const DEFAULT_SUMMARY: DailySummary = {
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    goals: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
};

const toRounded = (value: number) => Math.round(value * 10) / 10;

export default function NutritionPage() {
    const [logs, setLogs] = useState<NutritionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<DailySummary>(DEFAULT_SUMMARY);

    // Food search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Form state
    const [foodName, setFoodName] = useState("");
    const [calories, setCalories] = useState<number | "">("");
    const [protein, setProtein] = useState<number | "">("");
    const [carbs, setCarbs] = useState<number | "">("");
    const [fats, setFats] = useState<number | "">("");
    const [loggedDate, setLoggedDate] = useState(
        () => new Date().toISOString().split("T")[0]
    );

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/nutrition");
            if (!res.ok) throw new Error("Failed to fetch logs");
            const data = await res.json();
            setLogs(data.logs ?? []);
        } catch {
            setError("Failed to load nutrition logs.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDailySummary = async () => {
        try {
            const res = await fetch("/api/nutrition/daily-summary", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch summary");
            const data = (await res.json()) as DailySummary;
            setSummary({
                totals: {
                    calories: Number(data.totals?.calories ?? 0),
                    protein: Number(data.totals?.protein ?? 0),
                    carbs: Number(data.totals?.carbs ?? 0),
                    fat: Number(data.totals?.fat ?? 0),
                },
                goals: {
                    calories: Number(data.goals?.calories ?? 2000),
                    protein: Number(data.goals?.protein ?? 150),
                    carbs: Number(data.goals?.carbs ?? 250),
                    fat: Number(data.goals?.fat ?? 65),
                },
            });
        } catch {
            setSummary(DEFAULT_SUMMARY);
        }
    };

    const refreshNutritionData = async () => {
        await Promise.all([fetchLogs(), fetchDailySummary()]);
    };

    useEffect(() => {
        refreshNutritionData();
    }, []);

    useEffect(() => {
        const trimmed = searchQuery.trim();

        if (!trimmed) {
            setSearchResults([]);
            setSearchLoading(false);
            setSearchError(null);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                setSearchLoading(true);
                setSearchError(null);

                const res = await fetch(
                    `/api/nutrition/search?q=${encodeURIComponent(trimmed)}`,
                    { cache: "no-store" }
                );
                const data = (await res.json()) as {
                    foods?: FoodResult[];
                    error?: string;
                };

                setSearchResults(data.foods ?? []);
                if (data.error) {
                    setSearchError(data.error);
                }
            } catch {
                setSearchResults([]);
                setSearchError("Search unavailable");
            } finally {
                setSearchLoading(false);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const selectFoodSuggestion = (food: FoodResult) => {
        setFoodName(food.name);
        setCalories(food.calories);
        setProtein(food.protein);
        setCarbs(food.carbs);
        setFats(food.fat);
        setSearchQuery(food.name);
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foodName || calories === "" || calories < 1) {
            setError("Please provide a valid food name and calories.");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const timestamp = loggedDate + "T12:00:00";

            const res = await fetch("/api/nutrition", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    food_name: foodName,
                    calories: Number(calories),
                    protein_g: protein === "" ? null : Number(protein),
                    carbs_g: carbs === "" ? null : Number(carbs),
                    fat_g: fats === "" ? null : Number(fats),
                    logged_at: timestamp,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add food log");
            }

            // Reset form
            setFoodName("");
            setCalories("");
            setProtein("");
            setCarbs("");
            setFats("");
            setLoggedDate(new Date().toISOString().split("T")[0]);

            await refreshNutritionData();
            showToast("✅ Food logged successfully", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to add food log.";
            setError(message);
            showToast("❌ Something went wrong. Please try again.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setError(null);
            const res = await fetch(`/api/nutrition/log/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete log");
            }
            await refreshNutritionData();
            showToast("🗑 Entry removed", "info");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete log.";
            setError(message);
            showToast("❌ Something went wrong. Please try again.", "error");
        }
    };

    const recentLogs = logs.slice(0, 5);

    const progressRows = [
        {
            label: "Calories",
            total: summary.totals.calories,
            goal: summary.goals.calories,
            colorClass: "bg-gray-500",
            unit: "",
        },
        {
            label: "Protein",
            total: summary.totals.protein,
            goal: summary.goals.protein,
            colorClass: "bg-green-500",
            unit: "g",
        },
        {
            label: "Carbs",
            total: summary.totals.carbs,
            goal: summary.goals.carbs,
            colorClass: "bg-yellow-500",
            unit: "g",
        },
        {
            label: "Fat",
            total: summary.totals.fat,
            goal: summary.goals.fat,
            colorClass: "bg-red-500",
            unit: "g",
        },
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold">Nutrition Tracker</h1>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-semibold">Daily Macro Progress</h2>
                {progressRows.map((item) => {
                    const goalValue = item.goal > 0 ? item.goal : 1;
                    const percent = Math.min((item.total / goalValue) * 100, 100);

                    return (
                        <div key={item.label} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.label}</span>
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    {toRounded(item.total)}
                                    {item.unit} / {toRounded(item.goal)}
                                    {item.unit}
                                </span>
                            </div>
                            <div className="h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className={`h-full ${item.colorClass} transition-all duration-300`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
            )}

            {/* Log Food Form */}
            <div id="log-food-card" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Log Food</h2>

                <div className="mb-5 relative">
                    <label className="block text-sm font-medium mb-1">Search food...</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder="Search food..."
                    />

                    {(searchLoading || searchQuery.trim()) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-20 max-h-72 overflow-y-auto">
                            {searchLoading && (
                                <div className="p-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                                    <span className="inline-block h-4 w-4 rounded-full border-2 border-zinc-300 border-t-indigo-500 animate-spin" />
                                    Searching...
                                </div>
                            )}

                            {!searchLoading && searchError && (
                                <div className="p-4 text-sm text-red-500">{searchError}</div>
                            )}

                            {!searchLoading && !searchError && searchResults.length === 0 && searchQuery.trim() && (
                                <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                                    No results found
                                </div>
                            )}

                            {!searchLoading && !searchError && searchResults.map((food) => (
                                <button
                                    key={`${food.name}-${food.servingSize}`}
                                    type="button"
                                    onClick={() => selectFoodSuggestion(food)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b last:border-0 border-zinc-200 dark:border-zinc-700"
                                >
                                    <div className="font-medium text-sm">{food.name}</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        Cal: {food.calories} | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Food Name *
                            </label>
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
                            <label className="block text-sm font-medium mb-1">
                                Calories *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={calories}
                                onChange={(e) =>
                                    setCalories(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                required
                                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Protein (g)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={protein}
                                onChange={(e) =>
                                    setProtein(e.target.value === "" ? "" : Number(e.target.value))
                                }
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
                                onChange={(e) =>
                                    setCarbs(e.target.value === "" ? "" : Number(e.target.value))
                                }
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
                                onChange={(e) =>
                                    setFats(e.target.value === "" ? "" : Number(e.target.value))
                                }
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

            {/* Recently Logged */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Recently Logged</h2>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-6 text-center text-zinc-500">
                            Loading today&apos;s logs...
                        </div>
                    ) : recentLogs.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 space-y-2">
                            <p className="text-2xl">🍽️</p>
                            <p>No food logged today.</p>
                            <a
                                href="#log-food-card"
                                className="inline-flex rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800"
                            >
                                Log your first meal
                            </a>
                        </div>
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
                                        <th className="p-4 text-sm font-semibold text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {recentLogs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <td className="p-4 text-sm font-medium">
                                                {log.food_name}
                                            </td>
                                            <td className="p-4 text-sm">{log.calories}</td>
                                            <td className="p-4 text-sm">{log.protein_g || "-"}</td>
                                            <td className="p-4 text-sm">{log.carbs_g || "-"}</td>
                                            <td className="p-4 text-sm">{log.fat_g || "-"}</td>
                                            <td className="p-4 text-sm text-right">
                                                <button
                                                    onClick={() => handleDelete(log.id)}
                                                    className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                                                    aria-label={`Delete ${log.food_name}`}
                                                >
                                                    🗑
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

