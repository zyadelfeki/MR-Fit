"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Brain, Award, Dumbbell, AlertCircle, ChevronRight } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

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
    Chest:     "bg-rose-500/10 text-rose-450 border border-rose-500/20",
    Back:      "bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20",
    Shoulders: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Arms:      "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    Legs:      "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    Core:      "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20",
    Cardio:    "bg-orange-500/10 text-orange-450 border border-orange-500/20",
};

function categoryBadge(category: string): string {
    const key = Object.keys(MUSCLE_BADGE_COLORS).find(
        (k) => category.toLowerCase().includes(k.toLowerCase())
    );
    return key ? MUSCLE_BADGE_COLORS[key] : "bg-neutral-800 text-neutral-300 border border-neutral-700";
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Exercise Library</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-450">
                        Browse and search 800+ exercises filtered by muscle group
                    </p>
                </div>
            </div>

            {/* Search + filters */}
            <div className="rounded-2xl border border-neutral-800 bg-[#161616] p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search exercises (e.g. barbell row)..."
                        className="w-full rounded-xl border border-neutral-850 bg-neutral-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-500 focus:border-[#FFB800] focus:outline-none"
                    />
                </div>

                {/* Pill filters — horizontally scrollable on mobile */}
                <div className="mt-4 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
                    {MUSCLE_FILTERS.map((filter) => {
                        const active = filter === activeMuscle;
                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveMuscle(filter)}
                                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
                                    active
                                        ? "bg-[#FFB800] text-black"
                                        : "bg-neutral-900 text-neutral-400 hover:bg-neutral-850 hover:text-white"
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
                        <div key={i} className="h-44 animate-pulse rounded-2xl border border-neutral-850 bg-neutral-900" />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <div className="rounded-2xl border border-neutral-800 bg-[#161616] p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-450">No exercises found. Try a different search.</p>
                    <Link href="/dashboard/workouts/new"
                        className="mt-4 inline-flex rounded-xl bg-[#FFB800] px-4 py-2 text-xs font-bold text-black hover:shadow-[0_0_15px_rgba(255,184,0,0.2)] transition">
                        Create a Workout
                    </Link>
                </div>
            ) : (
                <RevealOnScroll className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {results.map((exercise) => (
                        <article key={`${exercise.id}-${exercise.name}`}
                            className="relative flex h-full flex-col rounded-2xl border border-neutral-850 bg-[#161616] p-5 hover:border-neutral-700 transition-all hover:scale-[1.02] justify-between">

                            <div>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h2 className="text-sm font-bold text-white leading-snug">
                                        {exercise.name}
                                    </h2>
                                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-semibold ${categoryBadge(exercise.category)}`}>
                                        {exercise.category}
                                    </span>
                                </div>

                                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    {exercise.muscles.length > 0 ? exercise.muscles.join(", ") : "No primary muscles"}
                                </p>

                                <div className="mt-2.5 flex flex-wrap gap-1">
                                    {exercise.equipment.length > 0 ? (
                                        exercise.equipment.map((item) => (
                                            <span key={item}
                                                className="rounded-md bg-neutral-900 border border-neutral-850 px-2 py-0.5 text-[9px] text-neutral-400">
                                                {item}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="rounded-md bg-neutral-900 border border-neutral-850 px-2 py-0.5 text-[9px] text-neutral-505">No equipment</span>
                                    )}
                                </div>

                                <p className="mt-3 line-clamp-3 text-xs text-neutral-400 leading-relaxed">
                                    {exercise.description || "No description available."}
                                </p>
                            </div>

                            <span className="mt-4 text-xs font-bold text-[#FFB800] hover:underline cursor-pointer flex items-center gap-0.5 self-start">
                                <span>View details</span>
                                <ChevronRight className="h-3 w-3" />
                            </span>
                        </article>
                    ))}
                </RevealOnScroll>
            )}
        </div>
    );
}
