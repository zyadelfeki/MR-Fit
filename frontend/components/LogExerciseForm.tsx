"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Exercise {
    id: string;
    name: string;
}

interface LogExerciseFormProps {
    workoutId: string;
    exercises: Exercise[];
}

export default function LogExerciseForm({ workoutId, exercises }: LogExerciseFormProps) {
    const supabase = createClient();
    const router = useRouter();

    const [exerciseId, setExerciseId] = useState("");
    const [setsCompleted, setSetsCompleted] = useState<number | "">("");
    const [repsCompleted, setRepsCompleted] = useState<number | "">("");
    const [weightKg, setWeightKg] = useState<number | "">("");
    const [notes, setNotes] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!exerciseId || setsCompleted === "" || repsCompleted === "") {
            setError("Exercise, Sets, and Reps are required.");
            return;
        }

        setLoading(true);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("User not authenticated.");

            const { error: insertError } = await supabase
                .from("workout_logs")
                .insert({
                    workout_id: workoutId,
                    exercise_id: exerciseId,
                    user_id: user.id,
                    sets_completed: Number(setsCompleted),
                    reps_completed: Number(repsCompleted),
                    weight_kg: weightKg === "" ? null : Number(weightKg),
                    notes: notes || null
                });

            if (insertError) throw insertError;

            // Reset form
            setExerciseId("");
            setSetsCompleted("");
            setRepsCompleted("");
            setWeightKg("");
            setNotes("");

            setSuccess("Exercise logged successfully!");

            // Re-fetch data for the Server Component
            router.refresh();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to log exercise.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Log Exercise</h3>

            {error && (
                <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-sm">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="exercise" className="block text-sm font-medium text-gray-700">Exercise *</label>
                    <select
                        id="exercise"
                        value={exerciseId}
                        onChange={(e) => setExerciseId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    >
                        <option value="" disabled>Select an exercise</option>
                        {exercises.map((ex) => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="sets" className="block text-sm font-medium text-gray-700">Sets *</label>
                        <input
                            type="number"
                            id="sets"
                            min="1"
                            value={setsCompleted}
                            onChange={(e) => setSetsCompleted(Number(e.target.value) || "")}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="reps" className="block text-sm font-medium text-gray-700">Reps *</label>
                        <input
                            type="number"
                            id="reps"
                            min="1"
                            value={repsCompleted}
                            onChange={(e) => setRepsCompleted(Number(e.target.value) || "")}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                        <input
                            type="number"
                            id="weight"
                            min="0"
                            step="0.5"
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        id="notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. Felt heavy today"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                    >
                        {loading ? "Logging..." : "Log Exercise"}
                    </button>
                </div>
            </form>
        </div>
    );
}
