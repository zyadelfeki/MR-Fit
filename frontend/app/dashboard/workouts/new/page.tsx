"use client";
 
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Loader2, Plus, Trash2, Dumbbell } from "lucide-react";

type TemplateExercise = {
  name: string;
  sets: number;
  reps: number;
  weight_kg?: number | null;
  notes?: string;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
};

type FormExercise = {
  name: string;
  sets: number;
  reps: number;
  weight_kg: number | "";
  notes: string;
};

export default function NewWorkoutPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [exercises, setExercises] = useState<FormExercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState("");

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch("/api/workout-templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch (err) {
        console.error("Failed to load templates", err);
      }
    }
    loadTemplates();
  }, []);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setExercises([]);
      return;
    }
        const t = templates.find((x) => x.id === templateId);
    if (t) {
      setTitle(t.name);
      setDurationMin(60); // Default duration for a template workout
      const mapped: FormExercise[] = t.exercises.map((e) => ({
        name: e.name,
        sets: e.sets || 3,
        reps: e.reps || 10,
        weight_kg: e.weight_kg == null ? "" : e.weight_kg,
        notes: e.notes || "",
      }));
      setExercises(mapped);
    }
  };

  const addExercise = () => {
    if (!newExerciseName.trim()) return;
    setExercises((prev) => [
      ...prev,
      {
        name: newExerciseName.trim(),
        sets: 3,
        reps: 10,
        weight_kg: "",
        notes: "",
      },
    ]);
    setNewExerciseName("");
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof FormExercise, value: any) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !durationMin) {
      setError("Title and duration are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          duration_min: Number(durationMin),
          source: "user",
          exercises: exercises.map((e) => ({
            name: e.name,
            sets: Number(e.sets),
            reps: Number(e.reps),
            weight_kg: e.weight_kg === "" ? null : Number(e.weight_kg),
            notes: e.notes,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create workout");

      showToast("Workout created!", "success");
      router.push(`/dashboard/workouts/${data.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workout.");
      showToast("Something went wrong. Please try again.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workouts"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-[#161616] text-neutral-450 hover:bg-neutral-900 hover:text-white transition"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="page-title text-gray-900 dark:text-white font-bold">Create Workout</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start custom, or import and customize a pre-made workout template.
            </p>
          </div>
        </div>
      </div>

      <div className="card rounded-2xl border border-neutral-800 bg-[#161616] p-6 md:p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Import from Template (Optional)
            </label>
            <select
              id="template"
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="input-field"
            >
              <option value="">-- Start with a blank workout --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Workout Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Upper Body Power"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                id="scheduledAt"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="durationMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estimated Duration (minutes) *
              </label>
              <input
                type="number"
                id="durationMin"
                min="1"
                max="600"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value) || "")}
                className="input-field"
                placeholder="60"
                required
              />
            </div>
          </div>

          {/* Exercise Customizer Section */}
          <div className="border-t border-neutral-850 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Dumbbell className="h-4.5 w-4.5 text-amber-500" />
                <span>Customize Exercises ({exercises.length})</span>
              </h3>
            </div>

            {exercises.length === 0 ? (
              <p className="text-xs text-neutral-500 italic bg-neutral-900/50 p-4 rounded-xl border border-neutral-850">
                No exercises added yet. Use the selector above to import a template, or add custom exercises below.
              </p>
            ) : (
              <div className="space-y-3">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-3 bg-neutral-900 p-4 rounded-xl border border-neutral-850 items-center justify-between">
                    <div className="flex-1 w-full text-sm font-bold text-white md:max-w-xs truncate">
                      {idx + 1}. {ex.name}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-neutral-450">Sets:</span>
                        <input
                          type="number"
                          min="1"
                          value={ex.sets}
                          onChange={(e) => updateExercise(idx, "sets", Math.max(1, Number(e.target.value)))}
                          className="w-14 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-center text-xs text-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-neutral-450">Reps:</span>
                        <input
                          type="number"
                          min="1"
                          value={ex.reps}
                          onChange={(e) => updateExercise(idx, "reps", Math.max(1, Number(e.target.value)))}
                          className="w-14 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-center text-xs text-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-neutral-450">Wt (kg):</span>
                        <input
                          type="number"
                          placeholder="body"
                          value={ex.weight_kg}
                          onChange={(e) => updateExercise(idx, "weight_kg", e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-16 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-center text-xs text-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeExercise(idx)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-850 rounded-lg transition-colors"
                        aria-label="Remove exercise"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Custom Exercise Row */}
            <div className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="Add custom exercise by name..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFB800]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExercise();
                  }
                }}
              />
              <button
                type="button"
                onClick={addExercise}
                className="bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-850 rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-800 pt-6 sm:flex-row sm:justify-end">
            <Link href="/dashboard/workouts" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="btn-primary bg-[#FFB800] text-black font-bold hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] flex items-center gap-1.5 justify-center">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Workout</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
