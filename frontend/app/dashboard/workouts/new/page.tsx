"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

export default function NewWorkoutPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="mx-auto max-w-3xl space-y-6">
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
              Start with the basics, then add exercises on the workout details page.
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
