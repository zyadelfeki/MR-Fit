"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Calendar, Scale, Loader2, AlertCircle } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

type WeightEntry = {
    id: string;
    value: number;
    unit: string;
    recorded_at: string;
};

function toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export default function WeightTracker() {
    const [entries, setEntries] = useState<WeightEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const [weightValue, setWeightValue] = useState<string>("");
    const [unit, setUnit] = useState<"kg" | "lbs">("kg");
    const [recordedDate, setRecordedDate] = useState<string>(
        toDateInputValue(new Date())
    );

    const sortedEntries = useMemo(
        () => [...entries].sort((a, b) => +new Date(b.recorded_at) - +new Date(a.recorded_at)),
        [entries]
    );

    const fetchEntries = async () => {
        try {
            const res = await fetch("/api/wearable", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to load weight entries");
            }
            setEntries(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || "Failed to load weight entries");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedValue = Number(weightValue);
        if (!Number.isFinite(parsedValue) || parsedValue <= 0 || parsedValue >= 500) {
            setError("Weight must be greater than 0 and less than 500.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/wearable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    value: parsedValue,
                    unit,
                    recorded_at: recordedDate
                        ? new Date(`${recordedDate}T12:00:00`).toISOString()
                        : undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to log weight");
            }

            setWeightValue("");
            await fetchEntries();
        } catch (err: any) {
            setError(err.message || "Failed to log weight");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        setError("");

        try {
            const res = await fetch("/api/wearable", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to delete entry");
            }

            await fetchEntries();
        } catch (err: any) {
            setError(err.message || "Failed to delete entry");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="bg-[#161616] rounded-2xl border border-neutral-800 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b border-neutral-850 shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-1.5 font-heading">
                    <Scale className="h-5 w-5 text-[#FFB800]" />
                    <span>Bodyweight Trend</span>
                </h2>
                <p className="text-xs text-neutral-450 mt-1 uppercase tracking-wider">
                    Last 10 weigh-ins
                </p>

                <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                        type="number"
                        step="0.1"
                        min={1}
                        max={500}
                        value={weightValue}
                        onChange={(e) => setWeightValue(e.target.value)}
                        placeholder="Weight"
                        className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-[#FFB800] focus:outline-none"
                        required
                    />
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as "kg" | "lbs")}
                        className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-[#FFB800] focus:outline-none"
                    >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                    </select>
                    <input
                        type="date"
                        value={recordedDate}
                        onChange={(e) => setRecordedDate(e.target.value)}
                        className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-[#FFB800] focus:outline-none"
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl bg-[#FFB800] hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] text-black px-4 py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin text-black" />
                        ) : (
                            <Plus className="h-4 w-4 text-black" />
                        )}
                        <span>Log</span>
                    </button>
                </form>

                {error && (
                    <div className="mt-3 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className="overflow-y-auto flex-1 p-0">
                {loading ? (
                    <div className="p-8 text-center flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FFB800]" />
                    </div>
                ) : sortedEntries.length === 0 ? (
                    <div className="p-8 text-center h-full flex flex-col items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-neutral-600 mb-2" />
                        <p className="text-neutral-450 text-xs">
                            No weight entries yet. Log your first weigh-in above.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-neutral-850">
                        {sortedEntries.map((entry) => (
                            <li
                                key={entry.id}
                                className="px-6 py-4 flex justify-between items-center hover:bg-neutral-900/40 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-semibold text-neutral-400">
                                        {new Date(entry.recorded_at).toLocaleDateString([], {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                    <span className="text-sm font-bold text-white">
                                        {entry.value} {entry.unit}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleDelete(entry.id)}
                                    disabled={deletingId === entry.id}
                                    className="text-xs font-semibold text-neutral-455 hover:text-red-400 disabled:opacity-50 hover:scale-105 transition flex items-center gap-1 p-1"
                                    aria-label="Delete weight entry"
                                >
                                    {deletingId === entry.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Delete</span>
                                        </>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
