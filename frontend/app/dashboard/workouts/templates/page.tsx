"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Plus, Trash2, Play, Save, ClipboardList, AlertCircle, Loader2 } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

type TemplateExercise = {
    name: string;
    sets: number;
    reps: number;
    weight_kg: number | null;
    notes: string;
};

type WorkoutTemplate = {
    id: string;
    name: string;
    description: string | null;
    exercises: TemplateExercise[];
    created_at: string;
};

const emptyExercise = (): TemplateExercise => ({
    name: "",
    sets: 3,
    reps: 10,
    weight_kg: null,
    notes: "",
});

export default function WorkoutTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [exercises, setExercises] = useState<TemplateExercise[]>([emptyExercise()]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/workout-templates", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch templates");
            }

            setTemplates(Array.isArray(data.templates) ? data.templates : []);
        } catch {
            showToast("Something went wrong. Please try again.", "error");
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchTemplates();
    }, []);

    const setExerciseField = <K extends keyof TemplateExercise>(index: number, key: K, value: TemplateExercise[K]) => {
        setExercises((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [key]: value };
            return next;
        });
    };

    const addExerciseRow = () => {
        setExercises((prev) => [...prev, emptyExercise()]);
    };

    const removeExerciseRow = (index: number) => {
        setExercises((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();

        const validExercises = exercises
            .map((item) => ({
                ...item,
                name: item.name.trim(),
                notes: item.notes.trim(),
            }))
            .filter((item) => item.name.length > 0);

        if (!name.trim() || validExercises.length === 0) {
            showToast("Please provide a name and at least one exercise", "error");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/workout-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    exercises: validExercises,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to create template");
            }

            setName("");
            setDescription("");
            setExercises([emptyExercise()]);
            showToast("Template created", "success");
            await fetchTemplates();
        } catch {
            showToast("Something went wrong. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleStartWorkout = async (templateId: string) => {
        try {
            const res = await fetch("/api/workout-templates/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ template_id: templateId }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to start workout");
            }

            showToast("Workout started from template", "success");
            router.push(`/dashboard/workouts/${data.workout_id}`);
            router.refresh();
        } catch {
            showToast("Something went wrong. Please try again.", "error");
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            const res = await fetch(`/api/workout-templates?id=${templateId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete template");
            }

            showToast("Template removed", "info");
            await fetchTemplates();
        } catch {
            showToast("Something went wrong. Please try again.", "error");
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/workouts"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-[#161616] text-neutral-450 hover:bg-neutral-900 hover:text-white transition"
                        aria-label="Back to workouts"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-heading">Workout Templates</h1>
                </div>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-6 rounded-2xl border border-neutral-800 bg-[#161616] p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-white">Create Reusable Template</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Template name (e.g. Push Day)"
                        className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-[#FFB800]"
                        required
                    />
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-[#FFB800]"
                    />
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-450">Exercises</p>
                    {exercises.map((exercise, index) => (
                        <div key={`row-${index}`} className="grid gap-2 md:grid-cols-6 items-center">
                            <input
                                value={exercise.name}
                                onChange={(e) => setExerciseField(index, "name", e.target.value)}
                                placeholder="Exercise name"
                                className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-[#FFB800] md:col-span-2"
                                required
                            />
                            <input
                                type="number"
                                min="1"
                                value={exercise.sets}
                                onChange={(e) => setExerciseField(index, "sets", Number(e.target.value) || 1)}
                                placeholder="Sets"
                                className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-[#FFB800]"
                                required
                            />
                            <input
                                type="number"
                                min="1"
                                value={exercise.reps}
                                onChange={(e) => setExerciseField(index, "reps", Number(e.target.value) || 1)}
                                placeholder="Reps"
                                className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-[#FFB800]"
                                required
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={exercise.weight_kg ?? ""}
                                onChange={(e) => setExerciseField(index, "weight_kg", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder="Weight (kg)"
                                className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-[#FFB800]"
                            />
                            <button
                                type="button"
                                onClick={() => removeExerciseRow(index)}
                                disabled={exercises.length === 1}
                                className="rounded-xl border border-red-900/50 bg-red-950/20 px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-900/20 transition disabled:opacity-40 flex items-center justify-center gap-1.5"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Remove</span>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-neutral-850 pt-4">
                    <button
                        type="button"
                        onClick={addExerciseRow}
                        className="rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 px-4 py-2.5 text-sm font-bold text-white transition flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        Add Exercise
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-[#FFB800] hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] px-5 py-2.5 text-sm font-bold text-black transition disabled:opacity-60 flex items-center gap-1.5"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin text-black" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>Save Template</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-[#FFB800]" />
                    <span>Your Templates</span>
                </h2>

                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-neutral-450 py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-[#FFB800]" />
                        <span>Loading templates...</span>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-800 bg-[#161616] p-8 text-center text-neutral-400">
                        <AlertCircle className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                        <p className="text-sm">No templates yet. Build your first reusable routine above.</p>
                    </div>
                ) : (
                    <RevealOnScroll className="grid gap-4 md:grid-cols-2">
                        {templates.map((template) => (
                            <article key={template.id} className="rounded-2xl border border-neutral-800 bg-[#161616] p-5 hover:border-neutral-700 transition-all flex flex-col justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{template.name}</h3>
                                    <p className="mt-1 text-sm text-neutral-400">{template.description || "No description"}</p>
                                    <p className="mt-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">{template.exercises?.length || 0} exercises</p>
                                </div>

                                <div className="mt-2 flex items-center gap-2 border-t border-neutral-850 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => void handleStartWorkout(template.id)}
                                        className="rounded-xl bg-[#FFB800] text-black px-4 py-2 text-xs font-bold hover:shadow-[0_0_15px_rgba(255,184,0,0.2)] transition-all flex items-center gap-1.5"
                                    >
                                        <Play className="h-3 w-3 fill-black text-black" />
                                        <span>Start Workout</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleDeleteTemplate(template.id)}
                                        className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/20 transition flex items-center gap-1.5"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </RevealOnScroll>
                )}
            </section>
        </div>
    );
}
