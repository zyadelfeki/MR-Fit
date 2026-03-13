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

const MUSCLE_FILTERS = [
    "All",
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Legs",
    "Core",
    "Cardio",
] as const;

export default function ExercisesPage() {
    const [query, setQuery] = useState("");
    const [activeMuscle, setActiveMuscle] = useState<(typeof MUSCLE_FILTERS)[number]>(
        "All"
    );
    const [results, setResults] = useState<ExerciseResult[]>([]);
    const [loading, setLoading] = useState(true);

    const debouncedQuery = useMemo(() => query.trim(), [query]);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams();
                if (debouncedQuery) {
                    params.set("q", debouncedQuery);
                }
                params.set("muscle", activeMuscle);

                const res = await fetch(`/api/exercises/search?${params.toString()}`, {
                    cache: "no-store",
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch exercises");
                }

                const data = (await res.json()) as { exercises?: ExerciseResult[] };
                setResults(data.exercises ?? []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [debouncedQuery, activeMuscle]);

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    Exercise Library
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Browse and search exercises from a live exercise database.
                </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                    {MUSCLE_FILTERS.map((filter) => {
                        const active = filter === activeMuscle;
                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveMuscle(filter)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                    active
                                        ? "bg-indigo-600 text-white"
                                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-56 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                        />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    <p className="text-2xl">🧠</p>
                    <p className="mt-2">No exercises found. Try a different search.</p>
                    <Link
                        href="/dashboard/workouts/new"
                        className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                        Create a Workout
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {results.map((exercise) => (
                        <article
                            key={`${exercise.id}-${exercise.name}`}
                            className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    {exercise.name}
                                </h2>
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    {exercise.category}
                                </span>
                            </div>

                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {exercise.muscles.length > 0
                                    ? exercise.muscles.join(", ")
                                    : "No primary muscles listed"}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1">
                                {exercise.equipment.length > 0 ? (
                                    exercise.equipment.map((item) => (
                                        <span
                                            key={item}
                                            className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                        >
                                            {item}
                                        </span>
                                    ))
                                ) : (
                                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                        No equipment
                                    </span>
                                )}
                            </div>

                            <p className="mt-3 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
                                {exercise.description || "No description available."}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    console.log("Add to Workout", {
                                        id: exercise.id,
                                        name: exercise.name,
                                    })
                                }
                                className="mt-auto pt-4 text-left text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Add to Workout
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
