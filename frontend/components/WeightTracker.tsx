"use client";

import { useEffect, useMemo, useState } from "react";

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
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Bodyweight Trend
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        required
                    />
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as "kg" | "lbs")}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                    </select>
                    <input
                        type="date"
                        value={recordedDate}
                        onChange={(e) => setRecordedDate(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                    >
                        {submitting ? "Saving..." : "Log Weight"}
                    </button>
                </form>

                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div className="overflow-y-auto flex-1 p-0">
                {loading ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
                    </div>
                ) : sortedEntries.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-gray-800 h-full flex flex-col items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No weight entries yet. Log your first weigh-in above.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedEntries.map((entry) => (
                            <li
                                key={entry.id}
                                className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {new Date(entry.recorded_at).toLocaleDateString([], {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                    <span className="text-base font-bold text-gray-900 dark:text-white">
                                        {entry.value} {entry.unit}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(entry.id)}
                                    disabled={deletingId === entry.id}
                                    className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"
                                    aria-label="Delete weight entry"
                                >
                                    {deletingId === entry.id ? "Deleting..." : "🗑"}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
