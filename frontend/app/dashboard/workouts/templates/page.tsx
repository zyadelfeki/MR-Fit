"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

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
            showToast("❌ Something went wrong. Please try again.", "error");
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
            showToast("✅ Template created", "success");
            await fetchTemplates();
        } catch {
            showToast("❌ Something went wrong. Please try again.", "error");
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

            showToast("💪 Workout started from template", "success");
            router.push(`/dashboard/workouts/${data.workout_id}`);
            router.refresh();
        } catch {
            showToast("❌ Something went wrong. Please try again.", "error");
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

            showToast("🗑 Template removed", "info");
            await fetchTemplates();
        } catch {
            showToast("❌ Something went wrong. Please try again.", "error");
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workout Templates</h1>
                <Link href="/dashboard/workouts" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    Back to Workouts
                </Link>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Template</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Template name"
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                    />
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="space-y-3">
                    {exercises.map((exercise, index) => (
                        <div key={`row-${index}`} className="grid gap-2 md:grid-cols-6">
                            <input
                                value={exercise.name}
                                onChange={(e) => setExerciseField(index, "name", e.target.value)}
                                placeholder="Exercise"
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white md:col-span-2"
                            />
                            <input
                                type="number"
                                min="1"
                                value={exercise.sets}
                                onChange={(e) => setExerciseField(index, "sets", Number(e.target.value) || 1)}
                                placeholder="Sets"
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <input
                                type="number"
                                min="1"
                                value={exercise.reps}
                                onChange={(e) => setExerciseField(index, "reps", Number(e.target.value) || 1)}
                                placeholder="Reps"
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={exercise.weight_kg ?? ""}
                                onChange={(e) => setExerciseField(index, "weight_kg", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder="Weight"
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => removeExerciseRow(index)}
                                disabled={exercises.length === 1}
                                className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={addExerciseRow}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Add Exercise Row
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save Template"}
                    </button>
                </div>
            </form>

            <section className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Templates</h2>

                {loading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading templates...</p>
                ) : templates.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <p>No templates yet. Build your first reusable routine 🧩</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {templates.map((template) => (
                            <article key={template.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{template.description || "No description"}</p>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{template.exercises?.length || 0} exercises</p>

                                <div className="mt-4 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void handleStartWorkout(template.id)}
                                        className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                                    >
                                        Start Workout
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleDeleteTemplate(template.id)}
                                        className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
