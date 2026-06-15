"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { Plus, Loader2 } from "lucide-react";

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
            showToast("Weight logged", "success");
            router.refresh();
        } catch {
            showToast("Something went wrong. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#161616] p-4 sm:flex-row sm:items-end w-full">
            <div className="flex-1 space-y-1.5">
                <label htmlFor="weight-kg" className="block text-xs font-bold uppercase tracking-wider text-neutral-450">
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
                    className="w-full rounded-xl border border-neutral-850 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-[#FFB800] focus:outline-none"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={saving}
                className="btn-primary bg-[#FFB800] text-black font-bold h-[38px] px-5 rounded-xl hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
                {saving ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Logging...</span>
                    </>
                ) : (
                    <>
                        <Plus className="h-4 w-4" />
                        <span>Log Weight</span>
                    </>
                )}
            </button>
        </form>
    );
}
