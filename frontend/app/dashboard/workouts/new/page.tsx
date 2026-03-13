"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/lib/toast";

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

        if (!title || !durationMin) {
            setError("Title and duration are required.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/workouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
                    duration_min: Number(durationMin),
                    source: "custom",
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create workout");

            showToast("💪 Workout logged!", "success");
            router.push("/dashboard/workouts");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to create workout.");
            showToast("❌ Something went wrong. Please try again.", "error");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-8">
                <Link
                    href="/dashboard/workouts"
                    className="text-gray-500 hover:text-gray-900 mr-4"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Create Workout</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-gray-100">
                {error && (
                    <div className="mb-6 p-4 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Workout Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g. Upper Body Power"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="scheduledAt"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Scheduled Date &amp; Time
                        </label>
                        <input
                            type="datetime-local"
                            id="scheduledAt"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="durationMin"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Estimated Duration (minutes) *
                        </label>
                        <input
                            type="number"
                            id="durationMin"
                            min="1"
                            value={durationMin}
                            onChange={(e) =>
                                setDurationMin(Number(e.target.value) || "")
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="60"
                            required
                        />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3 border-t">
                        <Link
                            href="/dashboard/workouts"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Workout"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
