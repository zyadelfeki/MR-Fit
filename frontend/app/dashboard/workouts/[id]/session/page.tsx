"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Check, Award, AlertCircle, Timer, SkipForward, ChevronRight, Play } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

type WorkoutExercise = {
    workout_exercise_id: string;
    exercise_id: string;
    name: string;
    muscle_group: string | null;
    difficulty: string | null;
    sets_target: number;
    reps_target: number;
    order_index: number;
};

type WorkoutDetailResponse = {
    id: string;
    title: string;
    duration_min: number | null;
    scheduled_at: string | null;
    source: string;
    exercises: WorkoutExercise[];
};

type SetLog = {
    sets: number;
    reps: number;
    weight: number | null;
};

type SessionInsertLog = {
    exercise_id: string;
    sets_completed: number;
    reps_completed: number;
    weight_kg: number | null;
};

function formatHms(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

function formatMs(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, "0");
    return `${minutes}:${seconds}`;
}

export default function WorkoutSessionPage({
    params,
}: {
    params: { id: string };
}) {
    const workoutId = params.id;

    const [workoutTitle, setWorkoutTitle] = useState("Workout Session");
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [currentExIndex, setCurrentExIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [repsInput, setRepsInput] = useState<number>(10);
    const [weightInput, setWeightInput] = useState("");
    const [logs, setLogs] = useState<Map<string, SetLog[]>>(new Map());
    const [restTimerActive, setRestTimerActive] = useState(false);
    const [restSecondsLeft, setRestSecondsLeft] = useState(90);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const fetchWorkout = async () => {
            try {
                const res = await fetch(`/api/workouts/${workoutId}`, {
                    cache: "no-store",
                });
                const data = (await res.json()) as WorkoutDetailResponse | { error?: string };

                if (!res.ok) {
                    throw new Error((data as { error?: string }).error || "Failed to load workout");
                }

                if (!isMounted) {
                    return;
                }

                const workoutData = data as WorkoutDetailResponse;
                setWorkoutTitle(workoutData.title || "Workout Session");
                setExercises(Array.isArray(workoutData.exercises) ? workoutData.exercises : []);

                const firstExercise = workoutData.exercises?.[0];
                if (firstExercise) {
                    setRepsInput(Number(firstExercise.reps_target || firstExercise.sets_target));
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || "Failed to load workout session data.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchWorkout();

        const elapsedInterval = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);

        return () => {
            isMounted = false;
            clearInterval(elapsedInterval);
        };
    }, [workoutId]);

    useEffect(() => {
        const currentExercise = exercises[currentExIndex];
        if (!currentExercise) {
            return;
        }

        setRepsInput(Number(currentExercise.reps_target || currentExercise.sets_target));
        setWeightInput("");
    }, [currentExIndex, exercises]);

    useEffect(() => {
        if (!restTimerActive) {
            return;
        }

        if (restSecondsLeft <= 0) {
            setRestTimerActive(false);
            setRestSecondsLeft(90);
            setCurrentSet((prev) => prev + 1);
            return;
        }

        const timer = setTimeout(() => {
            setRestSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [restTimerActive, restSecondsLeft]);

    const currentExercise = exercises[currentExIndex] || null;
    const currentExerciseLogs = currentExercise
        ? logs.get(currentExercise.exercise_id) || []
        : [];

    const totalPlannedSets = useMemo(
        () => exercises.reduce((sum, ex) => sum + Number(ex.sets_target || 0), 0),
        [exercises]
    );

    const completedSets = useMemo(
        () => Array.from(logs.values()).reduce((sum, setLogs) => sum + setLogs.length, 0),
        [logs]
    );

    const isCurrentExerciseComplete =
        !!currentExercise && currentExerciseLogs.length >= currentExercise.sets_target;
    const isLastExercise = currentExIndex === exercises.length - 1;
    const canGoNextExercise = isCurrentExerciseComplete && !isLastExercise;
    const canFinishWorkout = isCurrentExerciseComplete && isLastExercise && exercises.length > 0;

    const progressPercent =
        totalPlannedSets > 0
            ? Math.min(100, Math.round((completedSets / totalPlannedSets) * 100))
            : 0;

    const handleSkipRest = () => {
        setRestTimerActive(false);
        setRestSecondsLeft(90);
        setCurrentSet((prev) => prev + 1);
    };

    const handleCompleteSet = () => {
        if (!currentExercise) {
            return;
        }

        const parsedReps = Number(repsInput);
        if (!Number.isFinite(parsedReps) || parsedReps <= 0) {
            setError("Please enter a valid reps number.");
            return;
        }

        let parsedWeight: number | null = null;
        if (weightInput.trim() !== "") {
            const nextWeight = Number(weightInput);
            if (!Number.isFinite(nextWeight) || nextWeight < 0) {
                setError("Please enter a valid weight or leave it empty for bodyweight.");
                return;
            }
            parsedWeight = nextWeight;
        }

        setError("");

        setLogs((prev) => {
            const next = new Map(prev);
            const existing = next.get(currentExercise.exercise_id) || [];
            next.set(currentExercise.exercise_id, [
                ...existing,
                {
                    sets: currentSet,
                    reps: parsedReps,
                    weight: parsedWeight,
                },
            ]);
            return next;
        });

        if (currentSet < currentExercise.sets_target) {
            setRestSecondsLeft(90);
            setRestTimerActive(true);
        }
    };

    const handleNextExercise = () => {
        if (!canGoNextExercise) {
            return;
        }

        setRestTimerActive(false);
        setRestSecondsLeft(90);
        setCurrentExIndex((prev) => prev + 1);
        setCurrentSet(1);
    };

    const buildPayloadLogs = (): SessionInsertLog[] => {
        return Array.from(logs.entries())
            .map(([exerciseId, setLogs]) => {
                const validWeights = setLogs
                    .map((item) => item.weight)
                    .filter((weight): weight is number => typeof weight === "number");

                const averageWeight =
                    validWeights.length > 0
                        ? Number(
                            (
                                validWeights.reduce((sum, value) => sum + value, 0) /
                                validWeights.length
                            ).toFixed(2)
                        )
                        : null;

                return {
                    exercise_id: exerciseId,
                    sets_completed: setLogs.length,
                    reps_completed: setLogs.reduce((sum, setItem) => sum + setItem.reps, 0),
                    weight_kg: averageWeight,
                };
            })
            .filter((item) => item.sets_completed > 0);
    };

    const handleFinishWorkout = async () => {
        const payloadLogs = buildPayloadLogs();

        if (payloadLogs.length === 0) {
            setError("No completed sets to save yet.");
            return;
        }

        setIsFinishing(true);
        setError("");

        try {
            const res = await fetch("/api/workout-session/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workout_id: workoutId,
                    logs: payloadLogs,
                }),
            });

            const data = (await res.json()) as { error?: string; success?: boolean };
            if (!res.ok) {
                throw new Error(data.error || "Failed to save workout session.");
            }

            setIsComplete(true);
        } catch (err: any) {
            setError(err.message || "Failed to finish workout.");
        } finally {
            setIsFinishing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-800 border-t-[#FFB800]" />
            </div>
        );
    }

    if (!loading && exercises.length === 0 && !isComplete) {
        return (
            <div className="min-h-screen max-w-3xl mx-auto px-4 py-10 text-center flex flex-col justify-center items-center">
                <h1 className="text-3xl font-bold text-white mb-3">
                    {workoutTitle}
                </h1>
                <p className="text-neutral-450 mb-6">
                    This workout has no exercises yet.
                </p>
                <Link
                    href={`/dashboard/workouts/${workoutId}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FFB800] text-black font-bold hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Workout Detail</span>
                </Link>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="min-h-screen max-w-3xl mx-auto px-4 py-10 flex items-center justify-center">
                <div className="w-full bg-[#161616] rounded-2xl border border-neutral-800 p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                            <Check className="h-8 w-8 text-emerald-450" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white font-heading">
                            Workout Complete!
                        </h1>
                        <p className="text-sm text-neutral-450 mt-1">Excellent performance. Your data has been synced.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-450">Total Sets</p>
                            <p className="text-2xl font-black text-white mt-1">
                                {completedSets}
                            </p>
                        </div>
                        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-450">Exercises</p>
                            <p className="text-2xl font-black text-white mt-1">
                                {exercises.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-450">Time</p>
                            <p className="text-2xl font-black text-white mt-1">
                                {formatMs(elapsedSeconds)}
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/workouts"
                        className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#FFB800] text-black font-bold rounded-xl hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] transition"
                    >
                        <span>Back to Workouts</span>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-450 mb-1">
                            Active Workout Session
                        </p>
                        <h1 className="text-2xl md:text-3xl font-bold text-white font-heading">
                            {workoutTitle}
                        </h1>
                    </div>
                    <div className="rounded-xl bg-[#161616] border border-neutral-800 px-4 py-3 min-w-32 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-450">Elapsed</p>
                        <p className="text-xl font-bold text-[#FFB800] tabular-nums mt-0.5">
                            {formatHms(elapsedSeconds)}
                        </p>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex justify-between text-xs text-neutral-400 mb-2">
                        <span>
                            Exercise {Math.min(currentExIndex + 1, exercises.length)} of {exercises.length}
                        </span>
                        <span>{progressPercent}% Complete</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-900 overflow-hidden">
                        <div
                            className="h-full bg-[#FFB800] transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl border border-red-905 bg-red-950/20 text-red-400">
                        {error}
                    </div>
                )}

                {currentExercise && (
                    <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {currentExercise.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                                <span className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-850">
                                    {currentExercise.muscle_group || "General"}
                                </span>
                                <span className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-850">
                                    {currentExercise.difficulty || "standard"}
                                </span>
                                <span className="px-2.5 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] font-semibold">
                                    Target: {currentExercise.sets_target} x {currentExercise.reps_target}
                                </span>
                            </div>
                        </div>

                        {!isCurrentExerciseComplete && (
                            <div className="space-y-5 border-t border-neutral-850 pt-5">
                                <div className="text-lg font-bold text-white">
                                    Set {currentSet} of {currentExercise.sets_target}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="reps"
                                            className="block text-sm font-semibold text-neutral-305"
                                        >
                                            Reps
                                        </label>
                                        <input
                                            id="reps"
                                            type="number"
                                            min={1}
                                            value={repsInput}
                                            onChange={(e) => setRepsInput(Number(e.target.value))}
                                            className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-[#FFB800]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="weight"
                                            className="block text-sm font-semibold text-neutral-350"
                                        >
                                            Weight (kg)
                                        </label>
                                        <input
                                            id="weight"
                                            type="number"
                                            min={0}
                                            step="0.5"
                                            value={weightInput}
                                            onChange={(e) => setWeightInput(e.target.value)}
                                            placeholder="bodyweight"
                                            className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-[#FFB800]"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCompleteSet}
                                    disabled={restTimerActive}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#FFB800] text-black font-bold hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed transition"
                                >
                                    Complete Set
                                </button>
                            </div>
                        )}

                        {isCurrentExerciseComplete && (
                            <div className="mt-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-emerald-400 font-semibold flex items-center gap-1.5 text-sm">
                                    <Check className="h-4 w-4" /> Exercise complete. Great work!
                                </p>
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3 border-t border-neutral-850 pt-5">
                            {canGoNextExercise && (
                                <button
                                    type="button"
                                    onClick={handleNextExercise}
                                    className="inline-flex items-center px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-semibold hover:bg-neutral-850 transition"
                                >
                                    Next Exercise
                                </button>
                            )}

                            {canFinishWorkout && (
                                <button
                                    type="button"
                                    onClick={handleFinishWorkout}
                                    disabled={isFinishing}
                                    className="inline-flex items-center px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                                >
                                    {isFinishing ? "Finishing..." : "Finish Workout"}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {restTimerActive && (
                <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center px-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-neutral-900 p-8 text-center shadow-2xl border border-neutral-800">
                        <p className="text-xs uppercase tracking-wide text-neutral-400 mb-2 flex items-center justify-center gap-1">
                            <Timer className="h-4 w-4 text-[#FFB800]" />
                            <span>Rest Time</span>
                        </p>
                        <div className="text-7xl font-bold text-white tabular-nums mb-4">
                            {restSecondsLeft}s
                        </div>
                        <p className="text-neutral-450 mb-6 text-sm">
                            Catch your breath. Next set starts automatically.
                        </p>
                        <button
                            type="button"
                            onClick={handleSkipRest}
                            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#FFB800] text-black font-bold hover:shadow-[0_0_15px_rgba(255,184,0,0.2)] transition"
                        >
                            <SkipForward className="h-4 w-4" />
                            <span>Skip Rest</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}