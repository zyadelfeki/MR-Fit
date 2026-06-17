"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

interface DeleteWorkoutButtonProps {
    workoutId: string;
    workoutTitle: string;
}

export default function DeleteWorkoutButton({ workoutId, workoutTitle }: DeleteWorkoutButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent navigating to workout page since card has links

        if (!confirm(`Are you sure you want to delete the workout "${workoutTitle}"?`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/workouts/${workoutId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                showToast("Workout deleted successfully", "success");
                router.refresh();
            } else {
                const err = await res.json();
                showToast(err.error || "Failed to delete workout", "error");
            }
        } catch {
            showToast("Failed to delete workout", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20 disabled:opacity-50"
            title="Delete Workout"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </button>
    );
}
