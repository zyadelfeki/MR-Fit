"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { showToast } from "@/lib/toast";

type WorkoutDetail = {
    id: string;
    title: string;
    source: string;
    duration_min: number | null;
    scheduled_at: string | null;
};

type WorkoutExerciseLog = {
    id: string;
    workout_log_id: string;
    exercise_name: string;
    sets: number | null;
    reps: number | null;
    weight_kg: number | null;
    notes: string | null;
    logged_at: string;
};

const TYPE_BADGE: Record<string, string> = {
    manual:   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    strength: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    cardio:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    hiit:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function WorkoutDetailPage() {
    const params = useParams<{ id: string }>();
    const workoutId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
    const [exercises, setExercises] = useState<WorkoutExerciseLog[]>([]);

    const [exerciseName, setExerciseName] = useState("");
    const [sets, setSets] = useState<number | "">("");
    const [reps, setReps] = useState<number | "">("");
    const [weightKg, setWeightKg] = useState<number | "">("");
    const [notes, setNotes] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [workoutRes, exercisesRes] = await Promise.all([
                fetch(`/api/workouts/${workoutId}`, { cache: "no-store" }),
                fetch(`/api/workouts/${workoutId}/exercises`, { cache: "no-store" }),
            ]);
            const workoutData = await workoutRes.json();
            const exerciseData = await exercisesRes.json();
            if (!workoutRes.ok) throw new Error(workoutData.error || "Failed to fetch workout");
            if (!exercisesRes.ok) throw new Error(exerciseData.error || "Failed to fetch exercises");
            setWorkout(workoutData as WorkoutDetail);
            setExercises(Array.isArray(exerciseData.exercises) ? exerciseData.exercises : []);
        } catch {
            setWorkout(null); setExercises([]);
            showToast("❌ Something went wrong.", "error");
        } finally { setLoading(false); }
    };

    useEffect(() => { if (workoutId) void fetchData(); }, [workoutId]);

    const totalVolume = useMemo(
        () => exercises.reduce((sum, item) =>
            sum + Number(item.sets ?? 0) * Number(item.reps ?? 0) * Number(item.weight_kg ?? 0), 0),
        [exercises]
    );

    const handleAddExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!exerciseName.trim() || sets === "" || reps === "") {
            showToast("Please fill exercise, sets, and reps", "error"); return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/workouts/${workoutId}/exercises`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exercise_name: exerciseName, sets: Number(sets), reps: Number(reps),
                    weight_kg: weightKg === "" ? null : Number(weightKg),
                    notes: notes.trim() || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add exercise");
            setExerciseName(""); setSets(""); setReps(""); setWeightKg(""); setNotes("");
            showToast("✅ Exercise added", "success");
            await fetchData();
        } catch { showToast("❌ Something went wrong.", "error"); }
        finally { setSaving(false); }
    };

    const handleDeleteExercise = async (exerciseId: string) => {
        try {
            const res = await fetch(`/api/workouts/${workoutId}/exercises/${exerciseId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            showToast("🗑 Entry removed", "info");
            await fetchData();
        } catch { showToast("❌ Something went wrong.", "error"); }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                ))}
            </div>
        );
    }

    if (!workout) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-300">Workout not found.</p>
                <Link href="/dashboard/workouts" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    ← Back to Workouts
                </Link>
            </div>
        );
    }

    const typeBadgeClass = TYPE_BADGE[workout.source?.toLowerCase() ?? ""] ?? TYPE_BADGE.manual;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link href="/dashboard/workouts"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Workouts
                    </Link>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{workout.title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${typeBadgeClass}`}>
                        {workout.source ?? "Manual"}
                    </span>
                    {workout.duration_min && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {workout.duration_min}m
                        </span>
                    )}
                    {workout.scheduled_at && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(workout.scheduled_at).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Volume banner */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 dark:border-indigo-800 dark:bg-indigo-900/20">
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                    Total Volume: {Math.round(totalVolume).toLocaleString()} kg
                    <span className="ml-2 font-normal text-indigo-600 dark:text-indigo-400">({exercises.length} exercise{exercises.length !== 1 ? "s" : ""})</span>
                </p>
            </div>

            {/* Add exercise form */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Add Exercise</h2>
                <form onSubmit={handleAddExercise} className="grid gap-3 md:grid-cols-5">
                    <input value={exerciseName} onChange={(e) => setExerciseName(e.target.value)}
                        placeholder="Exercise name" required
                        className="input-field md:col-span-2" />
                    <input type="number" min="1" value={sets}
                        onChange={(e) => setSets(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Sets" required className="input-field" />
                    <input type="number" min="1" value={reps}
                        onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Reps" required className="input-field" />
                    <input type="number" min="0" step="0.5" value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Weight kg" className="input-field" />
                    <input value={notes} onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes (optional)" className="input-field md:col-span-4" />
                    <button type="submit" disabled={saving} className="btn-primary">
                        {saving ? "Saving..." : "Add Exercise"}
                    </button>
                </form>
            </section>

            {/* Exercise list */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Logged Exercises</h2>

                {exercises.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
                        <svg className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No exercises logged yet. Add your first set above!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/40">
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Exercise</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sets</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Reps</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Weight</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {exercises.map((item, idx) => (
                                    <tr key={item.id}
                                        className={`${idx % 2 === 0 ? "" : "bg-gray-50/60 dark:bg-gray-700/20"} hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors`}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.exercise_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.sets ?? "—"}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.reps ?? "—"}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.weight_kg != null ? `${item.weight_kg} kg` : "—"}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{item.notes || "—"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button type="button" onClick={() => void handleDeleteExercise(item.id)}
                                                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors dark:text-red-400">
                                                Delete
                                            </button>
                                        </td>
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
