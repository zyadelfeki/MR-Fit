"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { showToast } from "@/lib/toast";

type ExerciseOption = {
    label: string;
    slug: string;
    emoji: string;
};

type SensorReading = {
    acc_x: number;
    acc_y: number;
    acc_z: number;
    gyro_x: number;
    gyro_y: number;
    gyro_z: number;
};

type SensorWindow = {
    accelerometer_x: number[];
    accelerometer_y: number[];
    accelerometer_z: number[];
    gyroscope_x: number[];
    gyroscope_y: number[];
    gyroscope_z: number[];
    set_id: number;
    label?: string;
};

type PredictionResult = {
    exercise: string;
    confidence: number;
    probabilities: Record<string, number>;
};

type CountRepsResult = {
    exercise: string;
    reps_predicted: number;
    message: string;
};

type Intensity = {
    label: "Heavy" | "Medium";
    reps: number;
    scale: number;
};

const INTENSITIES: Intensity[] = [
    { label: "Heavy", reps: 5, scale: 1.08 },
    { label: "Medium", reps: 10, scale: 0.94 },
];

function round(value: number) {
    return Number(value.toFixed(2));
}

function buildReadings(slug: string, scale: number): SensorReading[] {
    const series = (values: number[]) => values.map((value, index) => round(value * scale + (index % 2 === 0 ? 0.05 : -0.05)));

    switch (slug) {
        case "bench":
            return series([0.18, 0.2, 0.22, 0.19, 0.21]).map((_, index) => ({
                acc_x: round([0.15, 0.18, 0.16, 0.19, 0.17][index] * scale),
                acc_y: round([0.08, 0.09, 0.1, 0.09, 0.08][index] * scale),
                acc_z: series([9.2, 9.15, 9.35, 9.18, 9.25])[index],
                gyro_x: series([0.18, 0.2, 0.22, 0.19, 0.21])[index],
                gyro_y: series([0.12, 0.11, 0.1, 0.12, 0.11])[index],
                gyro_z: series([0.09, 0.1, 0.11, 0.1, 0.09])[index],
            }));
        case "squat":
            return series([0.2, 0.18, 0.21, 0.19, 0.22]).map((_, index) => ({
                acc_x: round([0.18, 0.17, 0.19, 0.18, 0.17][index] * scale),
                acc_y: series([8.8, 8.95, 8.7, 8.9, 8.82])[index],
                acc_z: round([0.6, 0.55, 0.58, 0.57, 0.56][index] * scale),
                gyro_x: series([0.28, 0.31, 0.29, 0.3, 0.27])[index],
                gyro_y: series([0.22, 0.25, 0.24, 0.23, 0.26])[index],
                gyro_z: series([0.18, 0.2, 0.19, 0.21, 0.18])[index],
            }));
        case "dead":
            return series([0.25, 0.3, 0.28, 0.32, 0.27]).map((_, index) => ({
                acc_x: series([7.4, 7.7, 7.5, 7.8, 7.45])[index],
                acc_y: round([0.42, 0.4, 0.38, 0.41, 0.39][index] * scale),
                acc_z: series([4.95, 5.2, 5.0, 5.15, 4.98])[index],
                gyro_x: series([0.42, 0.5, 0.47, 0.52, 0.44])[index],
                gyro_y: series([0.18, 0.2, 0.19, 0.21, 0.18])[index],
                gyro_z: series([0.14, 0.16, 0.15, 0.17, 0.14])[index],
            }));
        case "ohp":
            return series([0.16, 0.17, 0.18, 0.19, 0.17]).map((_, index) => ({
                acc_x: round([0.24, 0.22, 0.23, 0.21, 0.24][index] * scale),
                acc_y: series([0.65, 0.7, 0.68, 0.72, 0.69])[index],
                acc_z: series([9.45, 9.6, 9.5, 9.58, 9.48])[index],
                gyro_x: series([0.16, 0.15, 0.17, 0.16, 0.15])[index],
                gyro_y: series([0.45, 0.5, 0.48, 0.52, 0.46])[index],
                gyro_z: series([0.12, 0.13, 0.12, 0.14, 0.12])[index],
            }));
        case "row":
        default:
            return [
                { acc_x: round(6.0 * scale), acc_y: 0.62, acc_z: 0.82, gyro_x: 0.22, gyro_y: 0.18, gyro_z: 0.11 },
                { acc_x: round(8.0 * scale), acc_y: 0.58, acc_z: 0.78, gyro_x: 0.25, gyro_y: 0.2, gyro_z: 0.13 },
                { acc_x: round(6.2 * scale), acc_y: 0.61, acc_z: 0.8, gyro_x: 0.23, gyro_y: 0.19, gyro_z: 0.12 },
                { acc_x: round(7.8 * scale), acc_y: 0.57, acc_z: 0.77, gyro_x: 0.24, gyro_y: 0.21, gyro_z: 0.13 },
                { acc_x: round(6.1 * scale), acc_y: 0.6, acc_z: 0.79, gyro_x: 0.22, gyro_y: 0.18, gyro_z: 0.12 },
            ];
    }
}

function toSensorWindow(readings: SensorReading[], label: string): SensorWindow {
    return {
        accelerometer_x: readings.map((reading) => reading.acc_x),
        accelerometer_y: readings.map((reading) => reading.acc_y),
        accelerometer_z: readings.map((reading) => reading.acc_z),
        gyroscope_x: readings.map((reading) => reading.gyro_x),
        gyroscope_y: readings.map((reading) => reading.gyro_y),
        gyroscope_z: readings.map((reading) => reading.gyro_z),
        set_id: 1,
        label,
    };
}

function normalizeExerciseName(value: string) {
    const normalized = value.trim().toLowerCase();
    if (normalized.includes("bench")) return "Bench Press";
    if (normalized.includes("squat")) return "Back Squat";
    if (normalized.includes("dead")) return "Deadlift";
    if (normalized.includes("ohp") || normalized.includes("overhead")) return "Overhead Press";
    if (normalized.includes("row")) return "Barbell Row";
    return value.trim();
}

function confidenceColor(percent: number) {
    if (percent >= 90) return "bg-emerald-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-red-500";
}

const EXERCISES: ExerciseOption[] = [
    { label: "Bench Press", slug: "bench", emoji: "🏋️" },
    { label: "Back Squat", slug: "squat", emoji: "🦵" },
    { label: "Deadlift", slug: "dead", emoji: "💪" },
    { label: "Overhead Press", slug: "ohp", emoji: "🙆" },
    { label: "Barbell Row", slug: "row", emoji: "🚣" },
];

export default function SmartTrackerPage() {
    const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].slug);
    const [intensity, setIntensity] = useState<Intensity["label"]>("Heavy");
    const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [repCount, setRepCount] = useState<number | null>(null);

    const selectedExerciseOption = useMemo(
        () => EXERCISES.find((item) => item.slug === selectedExercise) ?? EXERCISES[0],
        [selectedExercise]
    );

    const selectedIntensity = useMemo(
        () => INTENSITIES.find((item) => item.label === intensity) ?? INTENSITIES[0],
        [intensity]
    );

    useEffect(() => {
        let active = true;

        async function checkService() {
            try {
                const res = await fetch("/api/smart-tracker/predict", {
                    method: "HEAD",
                    cache: "no-store",
                });
                if (active) {
                    setServiceOnline(res.ok);
                }
            } catch {
                if (active) {
                    setServiceOnline(false);
                }
            }
        }

        void checkService();

        return () => {
            active = false;
        };
    }, []);

    const statusClasses =
        serviceOnline === false
            ? "border-red-200 bg-red-50 text-red-700"
            : serviceOnline === true
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-gray-200 bg-gray-50 text-gray-600";

    const buildPayload = () =>
        toSensorWindow(buildReadings(selectedExerciseOption.slug, selectedIntensity.scale), selectedExerciseOption.label);

    const handleRunPrediction = async () => {
        setRunning(true);
        setPrediction(null);
        setRepCount(null);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const payload = buildPayload();
            const predictRes = await fetch("/api/smart-tracker/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!predictRes.ok) {
                throw new Error("Prediction failed");
            }

            const predicted = (await predictRes.json()) as PredictionResult;
            const displayExercise = normalizeExerciseName(predicted.exercise);

            const countRes = await fetch(
                `/api/smart-tracker/count-reps?exercise=${encodeURIComponent(selectedExerciseOption.slug)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!countRes.ok) {
                throw new Error("Rep counting failed");
            }

            const counted = (await countRes.json()) as CountRepsResult;

            setPrediction({
                ...predicted,
                exercise: displayExercise,
            });
            setRepCount(Number(counted.reps_predicted));
        } catch (error) {
            console.error(error);
            showToast("❌ Smart Tracker could not run the prediction.", "error");
        } finally {
            setRunning(false);
        }
    };

    const handleSaveToWorkoutLog = async () => {
        if (!prediction || repCount == null) {
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/workout-logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exercise_name: prediction.exercise,
                    sets_completed: 1,
                    reps_completed: repCount,
                    weight_kg: null,
                    notes: "Auto-detected by Smart Tracker",
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Failed to save workout log");
            }

            showToast("✅ Saved to your workout log!", "success");
        } catch (error) {
            console.error(error);
            showToast("❌ Failed to save — check your workout API", "error");
        } finally {
            setSaving(false);
        }
    };

    const confidencePercent = prediction
        ? Math.round(Math.min(1, Math.max(0, prediction.confidence)) * 100)
        : 0;

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        ← Back to dashboard
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Exercise Tracker</h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Powered by AI — 100% accurate exercise classification
                        </p>
                    </div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${statusClasses}`}>
                    <span className={`mr-2 inline-block h-2 w-2 rounded-full ${serviceOnline ? "bg-emerald-500" : serviceOnline === false ? "bg-red-500" : "bg-gray-400"}`} />
                    {serviceOnline === false ? "Offline — Start smart-tracker/api/main.py" : serviceOnline === true ? "Online" : "Checking..."}
                </div>
            </div>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                            Demo Prediction
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                            Simulate a sensor window to see real-time exercise classification
                        </h2>
                    </div>
                    <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-gray-950">
                        New
                    </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {EXERCISES.map((exercise) => {
                        const active = exercise.slug === selectedExercise;
                        return (
                            <button
                                key={exercise.slug}
                                type="button"
                                onClick={() => setSelectedExercise(exercise.slug)}
                                className={`rounded-xl border-2 p-4 text-center transition ${
                                    active
                                        ? "border-gray-900 bg-gray-900 text-white"
                                        : "border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                }`}
                            >
                                <div className="text-2xl" aria-hidden="true">
                                    {exercise.emoji}
                                </div>
                                <div className="mt-2 text-sm font-semibold">{exercise.label}</div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    {INTENSITIES.map((item) => {
                        const active = item.label === intensity;
                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => setIntensity(item.label)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    active
                                        ? "bg-gray-900 text-white"
                                        : "border border-gray-300 bg-white text-gray-700 hover:border-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                                }`}
                            >
                                {item.label} ({item.reps} reps)
                            </button>
                        );
                    })}
                </div>

                <button type="button" className="btn-brand mt-6 w-full justify-center" onClick={() => void handleRunPrediction()} disabled={running}>
                    {running ? (
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.2s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.1s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white" />
                        </span>
                    ) : (
                        "Run Prediction"
                    )}
                </button>

                {prediction && repCount != null ? (
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                            Exercise Detected
                        </p>
                        <h3 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                            {prediction.exercise.toUpperCase()}
                        </h3>

                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                                <span>Confidence</span>
                                <span>{confidencePercent}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${confidenceColor(confidencePercent)}`}
                                    style={{ width: `${confidencePercent}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Repetitions Counted</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{repCount}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void handleSaveToWorkoutLog()}
                            className="btn-brand mt-5 w-full justify-center disabled:opacity-60"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save to Workout Log"}
                        </button>
                    </div>
                ) : null}
            </section>

            <section className="grid gap-6 md:grid-cols-3">
                <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="text-3xl">📡</div>
                    <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Sensor Data</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Your wrist-worn IMU captures 6-axis motion data (acc + gyro) at 5Hz.
                    </p>
                </article>

                <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="text-3xl">🧠</div>
                    <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">AI Classification</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        A Random Forest model trained on 9,009 samples classifies your exercise with 100% accuracy across 5 barbell movements.
                    </p>
                </article>

                <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="text-3xl">🔢</div>
                    <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Rep Counting</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Peak detection on filtered accelerometer signal counts reps with MAE &lt; 1 rep per set.
                    </p>
                </article>
            </section>

            <details className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <summary className="cursor-pointer list-none text-lg font-bold text-gray-900 dark:text-white">
                    Technical Details
                </summary>
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Dataset</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">9,009 samples, 5 exercises, 2 intensities</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Best Model</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">Random Forest</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Accuracy</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">100% (F-Set 3 + F-Set 4)</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Rep Counter MAE</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">0.88 reps/set</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Features</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">PCA (3), Magnitudes (2), Temporal (12), FFT (3), K-Means (1)</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Filter</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">Butterworth Low-Pass, 1.2 Hz, Order 5</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">API</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">FastAPI, POST /predict + POST /count-reps</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Integration</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">Next.js proxy → smart-tracker/api/main.py</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}
