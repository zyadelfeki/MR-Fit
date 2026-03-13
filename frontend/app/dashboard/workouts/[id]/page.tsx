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

            if (!workoutRes.ok) {
                throw new Error(workoutData.error || "Failed to fetch workout");
            }

            if (!exercisesRes.ok) {
                throw new Error(exerciseData.error || "Failed to fetch exercises");
            }

            setWorkout(workoutData as WorkoutDetail);
            setExercises(Array.isArray(exerciseData.exercises) ? exerciseData.exercises : []);
        } catch {
            setWorkout(null);
            setExercises([]);
            showToast("❌ Something went wrong. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workoutId) {
            void fetchData();
        }
    }, [workoutId]);

    const totalVolume = useMemo(
        () =>
            exercises.reduce((sum, item) => {
                const s = Number(item.sets ?? 0);
                const r = Number(item.reps ?? 0);
                const w = Number(item.weight_kg ?? 0);
                return sum + s * r * w;
            }, 0),
        [exercises]
    );

    const handleAddExercise = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!exerciseName.trim() || sets === "" || reps === "") {
            showToast("Please fill exercise, sets, and reps", "error");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/workouts/${workoutId}/exercises`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exercise_name: exerciseName,
                    sets: Number(sets),
                    reps: Number(reps),
                    weight_kg: weightKg === "" ? null : Number(weightKg),
                    notes: notes.trim() || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to add exercise");
            }

            setExerciseName("");
            setSets("");
            setReps("");
            setWeightKg("");
            setNotes("");
            showToast("✅ Exercise added", "success");
            await fetchData();
        } catch {
            showToast("❌ Something went wrong. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExercise = async (exerciseId: string) => {
        try {
            const res = await fetch(`/api/workouts/${workoutId}/exercises/${exerciseId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete");
            }

            showToast("🗑 Entry removed", "info");
            await fetchData();
        } catch {
            showToast("❌ Something went wrong. Please try again.", "error");
        }
    };

    if (loading) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">Loading workout details...</p>;
    }

    if (!workout) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-600 dark:text-gray-300">Workout not found.</p>
                <Link href="/dashboard/workouts" className="mt-3 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    Back to Workouts
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/workouts" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                        ← Back to Workouts
                    </Link>
                    <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{workout.title}</h1>
                </div>
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <p>Type: {workout.source}</p>
                    <p>Duration: {workout.duration_min ? `${workout.duration_min}m` : "-"}</p>
                    <p>Date: {workout.scheduled_at ? new Date(workout.scheduled_at).toLocaleDateString() : "Not scheduled"}</p>
                </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200">
                <p className="font-semibold">Total Volume: {Math.round(totalVolume)}kg</p>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Exercise</h2>
                <form onSubmit={handleAddExercise} className="mt-4 grid gap-3 md:grid-cols-5">
                    <input
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        placeholder="Exercise name"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white md:col-span-2"
                        required
                    />
                    <input
                        type="number"
                        min="1"
                        value={sets}
                        onChange={(e) => setSets(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Sets"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                    />
                    <input
                        type="number"
                        min="1"
                        value={reps}
                        onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Reps"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                    />
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Weight kg"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white md:col-span-4"
                    />
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Add Exercise"}
                    </button>
                </form>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Logged Exercises</h2>

                {exercises.length === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        No exercises logged yet. Add your first set! 🏁
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Exercise</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sets</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Reps</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Weight</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {exercises.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.exercise_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.sets ?? "-"}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.reps ?? "-"}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.weight_kg != null ? `${item.weight_kg} kg` : "-"}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.notes || "-"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteExercise(item.id)}
                                                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
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
            </section>
        </div>
    );
}
