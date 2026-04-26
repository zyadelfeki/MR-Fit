"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ExerciseResult = {
    id: number;
    name: string;
    description: string;
    category: string;
    muscles: string[];
    musclesSecondary: string[];
    equipment: string[];
};

const MUSCLE_FILTERS = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"] as const;

const MUSCLE_BADGE_COLORS: Record<string, string> = {
    Chest:     "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    Back:      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    Shoulders: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Arms:      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Legs:      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    Core:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    Cardio:    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

function categoryBadge(category: string): string {
    const key = Object.keys(MUSCLE_BADGE_COLORS).find(
        (k) => category.toLowerCase().includes(k.toLowerCase())
    );
    return key ? MUSCLE_BADGE_COLORS[key] : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

export default function ExercisesPage() {
    const [query, setQuery] = useState("");
    const [activeMuscle, setActiveMuscle] = useState<(typeof MUSCLE_FILTERS)[number]>("All");
    const [results, setResults] = useState<ExerciseResult[]>([]);
    const [loading, setLoading] = useState(true);

    const debouncedQuery = useMemo(() => query.trim(), [query]);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (debouncedQuery) params.set("q", debouncedQuery);
                params.set("muscle", activeMuscle);
                const res = await fetch(`/api/exercises/search?${params.toString()}`, { cache: "no-store" });
                if (!res.ok) throw new Error();
                const data = (await res.json()) as { exercises?: ExerciseResult[] };
                setResults(data.exercises ?? []);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 400);
        return () => clearTimeout(timeout);
    }, [debouncedQuery, activeMuscle]);

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exercise Library</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Browse and search 800+ exercises filtered by muscle group
                    </p>
                </div>
            </div>

            {/* Search + filters */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="relative">
                    <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search exercises..."
                        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Pill filters — horizontally scrollable on mobile */}
                <div className="mt-4 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-0.5">
                    {MUSCLE_FILTERS.map((filter) => {
                        const active = filter === activeMuscle;
                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveMuscle(filter)}
                                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                                    active
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                }`}
                            >
                                {filter}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-2xl">🧠</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No exercises found. Try a different search.</p>
                    <Link href="/dashboard/workouts/new"
                        className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        Create a Workout
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {results.map((exercise) => (
                        <article key={`${exercise.id}-${exercise.name}`}
                            className="relative flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">

                            {/* Muscle group badge — top right */}
                            <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryBadge(exercise.category)}`}>
                                {exercise.category}
                            </span>

                            <h2 className="pr-16 text-sm font-semibold text-gray-900 dark:text-white">
                                {exercise.name}
                            </h2>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {exercise.muscles.length > 0 ? exercise.muscles.join(", ") : "No primary muscles listed"}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1">
                                {exercise.equipment.length > 0 ? (
                                    exercise.equipment.map((item) => (
                                        <span key={item}
                                            className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                            {item}
                                        </span>
                                    ))
                                ) : (
                                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">No equipment</span>
                                )}
                            </div>

                            <p className="mt-3 line-clamp-2 flex-1 text-xs text-gray-600 dark:text-gray-300">
                                {exercise.description || "No description available."}
                            </p>

                            <span className="mt-4 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer">
                                View details →
                            </span>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
