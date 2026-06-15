"use client";

import React, { useState } from "react";
import Link from "next/link";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Camera,
  Activity,
  Check,
  Cpu,
  Info,
  Loader2,
  AlertCircle
} from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

type FormResult = {
  exercise: string;
  score: number;
  rating: string;
  metrics: string[];
  tip: string;
};

export default function FormAnalysisPage() {
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<FormResult | null>(null);
    const [exercise, setExercise] = useState("squat");

    const handleSimulateAnalysis = async () => {
        setAnalyzing(true);
        setResult(null);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setAnalyzing(false);

        if (exercise === "squat") {
            setResult({
                exercise: "Back Squat",
                score: 94,
                rating: "Excellent",
                metrics: [
                    "Depth: Squat reached full parallel (knee angle: 118°, hip angle: 89°).",
                    "Spine: Back remained neutral (lumbar deviation < 4.2°).",
                    "Bar Path: Vertical linear bar path (lateral dev: 1.8cm)."
                ],
                tip: "Keep pushing knees outwards at the bottom of the movement."
            });
        } else if (exercise === "deadlift") {
            setResult({
                exercise: "Deadlift",
                score: 88,
                rating: "Good",
                metrics: [
                    "Hip Hinge: Proper initial positioning.",
                    "Spine: Back remained neutral (lumbar deviation: 5.6°)."
                ],
                tip: "Avoid minor shoulder shrugging at the lockout phase."
            });
        } else {
            setResult({
                exercise: "Bench Press",
                score: 96,
                rating: "Excellent",
                metrics: [
                    "Touchpoint: Consistent bar touchpoint at the mid-sternum.",
                    "Spine: Solid arch maintained with feet planted.",
                    "Bar Path: Proper J-curve trajectory."
                ],
                tip: "Keep wrists straight and stacked over elbows."
            });
        }
        showToast("Analysis completed", "success");
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to dashboard
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
                                        <Loader2 className="h-8 w-8 animate-spin text-[#FFB800] mx-auto" />
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
                            onClick={() => void handleSimulateAnalysis()}
                            disabled={analyzing}
                            className="btn-primary bg-[#FFB800] text-black px-6 py-2.5 text-sm font-bold flex-1 justify-center rounded-xl hover:shadow-[0_0_15px_rgba(255,184,0,0.3)] transition-all duration-300 flex items-center gap-2"
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                                    <span>Evaluating...</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="h-4 w-4" />
                                    <span>Simulate Live Lift Analysis</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Technical details & feedback */}
                <RevealOnScroll className="lg:col-span-1 space-y-6">
                    <div className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#FFB800] mb-4">Form Evaluation</p>
                        
                        {result ? (
                            <div className="space-y-4 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 transition-all duration-350">
                                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{result.exercise}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-lg font-black text-white">{result.score}%</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">{result.rating}</span>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full border border-neutral-800 flex items-center justify-center bg-neutral-900">
                                        <Activity className="h-4 w-4 text-[#FFB800]" />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    {result.metrics.map((metric, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                                            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{metric}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-neutral-800 pt-3 text-xs text-[#FFB800]">
                                    <span className="font-bold block mb-1">Coach Pro Tip:</span>
                                    <span className="text-neutral-300">{result.tip}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
                                <AlertCircle className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                                <p className="text-xs px-4">Run a simulated lift to view real-time joint angles and biomechanical score.</p>
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
                </RevealOnScroll>
            </div>
        </div>
    );
}
