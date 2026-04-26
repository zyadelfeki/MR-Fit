"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast";
import Link from "next/link";

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
    totals: { calories: number; protein: number; carbs: number; fat: number };
    goals: { calories: number; protein: number; carbs: number; fat: number };
};

const DEFAULT_SUMMARY: DailySummary = {
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    goals: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
};

const toRounded = (v: number) => Math.round(v * 10) / 10;

type MealGroup = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

function getMealGroup(loggedAt: string): MealGroup {
    const h = new Date(loggedAt).getHours();
    if (h < 10) return "Breakfast";
    if (h < 15) return "Lunch";
    if (h < 20) return "Dinner";
    return "Snacks";
}

export default function NutritionPage() {
    const [logs, setLogs] = useState<NutritionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<DailySummary>(DEFAULT_SUMMARY);
    const [openGroups, setOpenGroups] = useState<Record<MealGroup, boolean>>({
        Breakfast: true, Lunch: true, Dinner: true, Snacks: true,
    });

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Form
    const [foodName, setFoodName] = useState("");
    const [calories, setCalories] = useState<number | "">("");
    const [protein, setProtein] = useState<number | "">("");
    const [carbs, setCarbs] = useState<number | "">("");
    const [fats, setFats] = useState<number | "">("");
    const [loggedDate, setLoggedDate] = useState(() => new Date().toISOString().split("T")[0]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/nutrition");
            if (!res.ok) throw new Error("Failed to fetch logs");
            const data = await res.json();
            setLogs(data.logs ?? []);
        } catch { setError("Failed to load nutrition logs."); }
        finally { setLoading(false); }
    };

    const fetchDailySummary = async () => {
        try {
            const res = await fetch("/api/nutrition/daily-summary", { cache: "no-store" });
            if (!res.ok) throw new Error();
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
        } catch { setSummary(DEFAULT_SUMMARY); }
    };

    const refresh = async () => { await Promise.all([fetchLogs(), fetchDailySummary()]); };

    useEffect(() => { void refresh(); }, []);

    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) { setSearchResults([]); setSearchLoading(false); setSearchError(null); return; }
        const t = setTimeout(async () => {
            try {
                setSearchLoading(true); setSearchError(null);
                const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
                const data = await res.json() as { foods?: FoodResult[]; error?: string };
                setSearchResults(data.foods ?? []);
                if (data.error) setSearchError(data.error);
            } catch { setSearchResults([]); setSearchError("Search unavailable"); }
            finally { setSearchLoading(false); }
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const selectFood = (food: FoodResult) => {
        setFoodName(food.name); setCalories(food.calories); setProtein(food.protein);
        setCarbs(food.carbs); setFats(food.fat); setSearchQuery(food.name); setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foodName || calories === "" || calories < 1) { setError("Please provide a valid food name and calories."); return; }
        try {
            setSubmitting(true); setError(null);
            const res = await fetch("/api/nutrition", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    food_name: foodName, calories: Number(calories),
                    protein_g: protein === "" ? null : Number(protein),
                    carbs_g: carbs === "" ? null : Number(carbs),
                    fat_g: fats === "" ? null : Number(fats),
                    logged_at: loggedDate + "T12:00:00",
                }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
            setFoodName(""); setCalories(""); setProtein(""); setCarbs(""); setFats("");
            setLoggedDate(new Date().toISOString().split("T")[0]);
            await refresh();
            showToast("✅ Food logged successfully", "success");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to add food log.";
            setError(msg); showToast("❌ Something went wrong.", "error");
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            setError(null);
            const res = await fetch(`/api/nutrition/log/${id}`, { method: "DELETE" });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
            await refresh();
            showToast("🗑 Entry removed", "info");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to delete.";
            setError(msg); showToast("❌ Something went wrong.", "error");
        }
    };

    // Group logs by meal time
    const MEAL_ORDER: MealGroup[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];
    const grouped: Record<MealGroup, NutritionLog[]> = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
    logs.forEach((log) => grouped[getMealGroup(log.logged_at)].push(log));

    const macroRows = [
        { label: "Calories", total: summary.totals.calories, goal: summary.goals.calories, color: "bg-indigo-500", unit: "kcal" },
        { label: "Protein",  total: summary.totals.protein,  goal: summary.goals.protein,  color: "bg-emerald-500", unit: "g" },
        { label: "Carbs",    total: summary.totals.carbs,    goal: summary.goals.carbs,    color: "bg-amber-500",   unit: "g" },
        { label: "Fat",      total: summary.totals.fat,      goal: summary.goals.fat,      color: "bg-rose-500",    unit: "g" },
    ];

    const goalsNotSet = summary.goals.calories === 2000 && summary.goals.protein === 150;

    return (
        <div className="mx-auto max-w-4xl space-y-8 p-4">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nutrition</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your daily food intake and macros</p>
                </div>
            </div>

            {/* Macro summary grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {macroRows.map((row) => {
                    const pct = Math.min((row.total / Math.max(row.goal, 1)) * 100, 100);
                    const over = row.total > row.goal;
                    return (
                        <div key={row.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{row.label}</p>
                            <p className={`mt-1 text-lg font-bold ${over ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                                {toRounded(row.total)}
                                <span className="ml-0.5 text-xs font-normal text-gray-400">/ {row.goal} {row.unit}</span>
                            </p>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${over ? "bg-red-500" : row.color}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {goalsNotSet && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Using default macro goals.{" "}
                    <Link href="/dashboard/profile" className="text-indigo-600 hover:underline dark:text-indigo-400">Set your goals →</Link>
                </p>
            )}

            {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

            {/* Log Food Form */}
            <div id="log-food-card" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Log Food</h2>

                <div className="relative mb-5">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search food...</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="Search food..." />
                    </div>

                    {(searchLoading || searchQuery.trim()) && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            {searchLoading && (
                                <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
                                    Searching...
                                </div>
                            )}
                            {!searchLoading && searchError && <div className="p-4 text-sm text-red-500">{searchError}</div>}
                            {!searchLoading && !searchError && searchResults.length === 0 && searchQuery.trim() && (
                                <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No results found</div>
                            )}
                            {!searchLoading && !searchError && searchResults.map((food) => (
                                <button key={`${food.name}-${food.servingSize}`} type="button" onClick={() => selectFood(food)}
                                    className="w-full border-b border-gray-100 px-3 py-2.5 text-left last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{food.name}</div>
                                    <div className="mt-0.5 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="text-indigo-600 dark:text-indigo-400">{food.calories} kcal</span>
                                        <span className="text-emerald-600">P: {food.protein}g</span>
                                        <span className="text-amber-600">C: {food.carbs}g</span>
                                        <span className="text-rose-600">F: {food.fat}g</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Food Name *</label>
                            <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)} required
                                className="input-field" placeholder="e.g. Chicken Breast" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                            <input type="date" value={loggedDate} onChange={(e) => setLoggedDate(e.target.value)} required
                                className="input-field" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Calories *</label>
                            <input type="number" min="1" value={calories}
                                onChange={(e) => setCalories(e.target.value === "" ? "" : Number(e.target.value))} required
                                className="input-field" placeholder="0" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Protein (g)</label>
                            <input type="number" min="0" value={protein}
                                onChange={(e) => setProtein(e.target.value === "" ? "" : Number(e.target.value))}
                                className="input-field" placeholder="0" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Carbs (g)</label>
                            <input type="number" min="0" value={carbs}
                                onChange={(e) => setCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                                className="input-field" placeholder="0" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Fats (g)</label>
                            <input type="number" min="0" value={fats}
                                onChange={(e) => setFats(e.target.value === "" ? "" : Number(e.target.value))}
                                className="input-field" placeholder="0" />
                        </div>
                    </div>
                    <button type="submit" disabled={submitting} className="btn-primary">
                        {submitting ? "Saving..." : "Log Food"}
                    </button>
                </form>
            </div>

            {/* Food Log — grouped by meal */}
            <div className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Today&apos;s Food Log</h2>

                {loading ? (
                    <div className="p-6 text-center text-sm text-gray-500">Loading...</div>
                ) : logs.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-2xl">🍽️</p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No food logged yet today.</p>
                        <a href="#log-food-card"
                            className="mt-3 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700">
                            Log your first meal
                        </a>
                    </div>
                ) : (
                    MEAL_ORDER.map((group) => {
                        const items = grouped[group];
                        if (items.length === 0) return null;
                        const groupCals = items.reduce((s, l) => s + l.calories, 0);
                        const isOpen = openGroups[group];
                        return (
                            <div key={group} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }))}
                                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                                >
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-gray-400">{groupCals} kcal</span>
                                        <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                                        {items.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{log.food_name}</p>
                                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                                        <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                            {log.calories} kcal
                                                        </span>
                                                        {log.protein_g != null && (
                                                            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                P: {log.protein_g}g
                                                            </span>
                                                        )}
                                                        {log.carbs_g != null && (
                                                            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                                C: {log.carbs_g}g
                                                            </span>
                                                        )}
                                                        {log.fat_g != null && (
                                                            <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                                                F: {log.fat_g}g
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleDelete(log.id)}
                                                    className="ml-4 text-sm text-red-400 hover:text-red-600 transition-colors"
                                                    aria-label={`Delete ${log.food_name}`}>
                                                    🗑
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
