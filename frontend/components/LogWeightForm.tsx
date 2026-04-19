"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

export default function LogWeightForm() {
    const router = useRouter();
    const [weightKg, setWeightKg] = useState<number | "">("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (weightKg === "" || Number(weightKg) <= 0) {
            showToast("Please enter a valid weight", "error");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/progress/weight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weight_kg: Number(weightKg) }),
            });

            if (!res.ok) {
                throw new Error("Failed to log weight");
            }

            setWeightKg("");
            showToast("✅ Weight logged", "success");
            router.refresh();
        } catch {
            showToast("❌ Something went wrong. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-end">
            <div className="flex-1">
                <label htmlFor="weight-kg" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Log Weight (kg)
                </label>
                <input
                    id="weight-kg"
                    type="number"
                    min="1"
                    max="500"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 78.4"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={saving}
                className="btn-brand disabled:opacity-60"
            >
                {saving ? "Saving..." : "Log Weight"}
            </button>
        </form>
    );
}
