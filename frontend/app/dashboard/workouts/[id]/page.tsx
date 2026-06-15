"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Clock, Calendar, AlertCircle, Trash2, Plus, Dumbbell, Activity, Save, Loader2 } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

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
    manual:   "bg-neutral-800 text-neutral-300 border border-neutral-700",
    strength: "bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20",
    cardio:   "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20",
    hiit:     "bg-amber-500/10 text-amber-400 border border-amber-500/20",
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
            showToast("Something went wrong.", "error");
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
            showToast("Exercise added", "success");
            await fetchData();
        } catch { showToast("Something went wrong.", "error"); }
        finally { setSaving(false); }
    };

    const handleDeleteExercise = async (exerciseId: string) => {
        try {
            const res = await fetch(`/api/workouts/${workoutId}/exercises/${exerciseId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            showToast("Entry removed", "info");
            await fetchData();
        } catch { showToast("Something went wrong.", "error"); }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-900 border border-neutral-800" />
                ))}
            </div>
        );
    }

    if (!workout) {
        return (
            <div className="rounded-2xl border border-neutral-800 bg-[#161616] p-8 text-center">
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-neutral-500" />
                <p className="text-sm text-neutral-400">Workout not found.</p>
                <Link href="/dashboard/workouts" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#FFB800] hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to Workouts
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
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-450 hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Workouts
                    </Link>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white font-heading">{workout.title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${typeBadgeClass}`}>
                        {workout.source ?? "Manual"}
                    </span>
                    {workout.duration_min && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-850 px-2.5 py-1 text-xs font-medium text-neutral-300">
                            <Clock className="h-3.5 w-3.5 text-neutral-450" />
                            {workout.duration_min}m
                        </span>
                    )}
                    {workout.scheduled_at && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-850 px-2.5 py-1 text-xs font-medium text-neutral-300">
                            <Calendar className="h-3.5 w-3.5 text-neutral-450" />
                            {new Date(workout.scheduled_at).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Volume banner */}
            <div className="rounded-xl border border-[#FFB800]/20 bg-[#FFB800]/5 px-5 py-3 text-[#FFB800]">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Activity className="h-4 w-4" />
                    <span>Total Volume: {Math.round(totalVolume).toLocaleString()} kg</span>
                    <span className="ml-2 font-normal text-neutral-400">({exercises.length} exercise{exercises.length !== 1 ? "s" : ""})</span>
                </p>
            </div>

            {/* Add exercise form */}
            <section className="rounded-2xl border border-neutral-800 bg-[#161616] p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-white">Add Exercise</h2>
                <form onSubmit={handleAddExercise} className="grid gap-3 md:grid-cols-5 items-end">
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-405">Exercise Name</label>
                        <input value={exerciseName} onChange={(e) => setExerciseName(e.target.value)}
                            placeholder="e.g. Bench Press" required
                            className="input-field bg-neutral-950 border-neutral-850 focus:border-[#FFB800] text-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-405">Sets</label>
                        <input type="number" min="1" value={sets}
                            onChange={(e) => setSets(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="3" required className="input-field bg-neutral-950 border-neutral-850 focus:border-[#FFB800] text-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-405">Reps</label>
                        <input type="number" min="1" value={reps}
                            onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="10" required className="input-field bg-neutral-950 border-neutral-850 focus:border-[#FFB800] text-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-405">Weight (kg)</label>
                        <input type="number" min="0" step="0.5" value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="60" className="input-field bg-neutral-950 border-neutral-850 focus:border-[#FFB800] text-white" />
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-405">Notes (optional)</label>
                        <input value={notes} onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Focus on chest touchpoint" className="input-field bg-neutral-950 border-neutral-850 focus:border-[#FFB800] text-white" />
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary bg-[#FFB800] text-black font-bold h-[42px] hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] flex items-center justify-center gap-1.5 transition-all">
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin text-black" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                <span>Add Set</span>
                            </>
                        )}
                    </button>
                </form>
            </section>

            {/* Exercise list */}
            <section className="rounded-2xl border border-neutral-800 bg-[#161616] p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-white">Logged Exercises</h2>

                {exercises.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center">
                        <Dumbbell className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
                        <p className="text-sm text-neutral-400">No exercises logged yet. Add your first set above!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-800">
                            <thead>
                                <tr className="bg-neutral-900/40 text-neutral-400">
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Exercise</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Sets</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Reps</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Weight</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Notes</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800 text-neutral-300">
                                {exercises.map((item, idx) => (
                                    <tr key={item.id}
                                        className={`${idx % 2 === 0 ? "" : "bg-neutral-900/10"} hover:bg-[#FFB800]/5 transition-colors`}>
                                        <td className="px-4 py-3 text-sm font-medium text-white">{item.exercise_name}</td>
                                        <td className="px-4 py-3 text-sm">{item.sets ?? "—"}</td>
                                        <td className="px-4 py-3 text-sm">{item.reps ?? "—"}</td>
                                        <td className="px-4 py-3 text-sm">{item.weight_kg != null ? `${item.weight_kg} kg` : "—"}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-400">{item.notes || "—"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button type="button" onClick={() => void handleDeleteExercise(item.id)}
                                                className="text-xs font-medium text-red-400 hover:text-red-500 hover:scale-105 transition-all flex items-center gap-1 ml-auto">
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>Delete</span>
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
