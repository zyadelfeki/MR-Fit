"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { showToast } from "@/lib/toast";

export default function FormAnalysisPage() {
    const [streamActive, setStreamActive] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [exercise, setExercise] = useState("squat");

    const handleSimulateAnalysis = async () => {
        setAnalyzing(true);
        setResult(null);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setAnalyzing(false);

        if (exercise === "squat") {
            setResult(`✅ **Squat Form: 94% Excellent**
- **Depth**: Squat reached full parallel (knee angle: 118°, hip angle: 89°).
- **Spine**: Back remained neutral (lumbar deviation < 4.2°).
- **Bar Path**: Vertical linear bar path (lateral dev: 1.8cm).
- **Tip**: Keep pushing knees outwards at the bottom of the movement.`);
        } else if (exercise === "deadlift") {
            setResult(`✅ **Deadlift Form: 88% Good**
- **Hip Hinge**: Proper initial positioning.
- **Spine**: Back remained neutral (lumbar deviation: 5.6°).
- **Tip**: Avoid minor shoulder shrugging at the lockout phase.`);
        } else {
            setResult(`✅ **Bench Press Form: 96% Excellent**
- **Touchpoint**: Consistent bar touchpoint at the mid-sternum.
- **Spine**: Solid arch maintained with feet planted.
- **Bar Path**: Proper J-curve trajectory.
- **Tip**: Keep wrists straight and stacked over elbows.`);
        }
        showToast("🎯 Analysis completed", "success");
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        ← Back to dashboard
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">AI Form Analysis</h1>
                        <p className="mt-2 text-sm text-neutral-400">
                            Edge-based pose tracking and biomechanical lift feedback
                        </p>
                    </div>
                </div>
                <div className="rounded-full border border-[#FFB800]/20 bg-[#FFB800]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#FFB800]">
                    Coming Soon
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Camera View Area */}
                <div className="lg:col-span-2 rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#FFB800] mb-4">Webcam Feed Mockup</p>
                        
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 flex items-center justify-center">
                            {/* Scanning Canvas Overlay */}
                            <div className="absolute inset-0 border-2 border-dashed border-[#FFB800]/30 m-4 rounded-xl flex flex-col items-center justify-center">
                                {/* Silhouette Graphic using absolute boxes */}
                                <div className="h-24 w-24 rounded-full border-2 border-neutral-800/80 absolute top-12 flex items-center justify-center">
                                    <div className="h-6 w-6 rounded-full bg-neutral-800/60 animate-ping" />
                                </div>
                                <div className="h-40 w-1 bg-neutral-800/80 absolute top-36" />
                                <div className="h-24 w-12 border-t-2 border-x-2 border-neutral-800/80 absolute top-36 rounded-t-xl" />
                                
                                <span className="absolute bottom-6 text-xs text-neutral-500 font-semibold uppercase tracking-wider bg-neutral-950 px-3 py-1 rounded border border-neutral-800">
                                    Align body within frame
                                </span>
                            </div>

                            {/* REC indicator */}
                            <div className="absolute top-4 left-4 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                REC (Simulated)
                            </div>

                            {analyzing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-xs">
                                    <div className="text-center space-y-2">
                                        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#FFB800] border-t-transparent" />
                                        <p className="text-xs text-[#FFB800] font-bold uppercase tracking-widest">Biomechanical evaluation...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[150px]">
                            <select
                                value={exercise}
                                onChange={(e) => setExercise(e.target.value)}
                                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                            >
                                <option value="squat">Back Squat</option>
                                <option value="deadlift">Deadlift</option>
                                <option value="bench">Bench Press</option>
                            </select>
                        </div>
                        <button
                            onClick={handleSimulateAnalysis}
                            disabled={analyzing}
                            className="btn-primary bg-[#FFB800] text-black px-6 py-2.5 text-sm font-bold flex-1 justify-center rounded-xl"
                        >
                            {analyzing ? "Evaluating..." : "Simulate Live Lift Analysis"}
                        </button>
                    </div>
                </div>

                {/* Technical details & feedback */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#FFB800] mb-4">Form Evaluation</p>
                        
                        {result ? (
                            <div className="whitespace-pre-line text-sm text-neutral-300 leading-relaxed font-sans bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
                                {result}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
                                <p className="text-2xl">📊</p>
                                <p className="mt-2 text-xs">Run a simulated lift to view real-time joint angles and biomechanical score.</p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Examiner Tech Specs</p>
                        
                        <div className="space-y-3 text-xs text-neutral-400">
                            <div className="border-b border-neutral-800 pb-2">
                                <span className="block font-bold text-white mb-0.5">Pose Detection</span>
                                <span>MediaPipe Pose topology on TensorFlow.js (WebGL/WebGPU)</span>
                            </div>
                            <div className="border-b border-neutral-800 pb-2">
                                <span className="block font-bold text-white mb-0.5">Biomechanical Model</span>
                                <span>Real-time joints angles vector projection (lumbar spine, knee flexion, hip hinge)</span>
                            </div>
                            <div className="border-b border-neutral-800 pb-2">
                                <span className="block font-bold text-white mb-0.5">Bar Path tracking</span>
                                <span>Bounding-box template matching tracks barbell collar center points</span>
                            </div>
                            <div>
                                <span className="block font-bold text-white mb-0.5">Data Privacy</span>
                                <span>100% Client-side. No video streams are sent to external servers.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
