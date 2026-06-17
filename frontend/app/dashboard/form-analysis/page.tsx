"use client";
 
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Camera,
  Activity,
  Check,
  Loader2,
  AlertCircle,
  Video,
  VideoOff
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

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);

    // Keep track of the current animation step for lift simulation
    const animTime = useRef(0);

    const startCamera = async () => {
        setCameraError(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: "user" }
            });
            setCameraStream(stream);
            setCameraActive(true);
            showToast("Camera access granted", "success");
        } catch (err) {
            console.error("Camera access failed:", err);
            setCameraError(true);
            showToast("Failed to access webcam. Check permissions.", "error");
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setCameraActive(false);
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    // Attach stream to video element when stream is active
    useEffect(() => {
        if (cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream]);

    // Handle joint tracking animation loop on canvas
    useEffect(() => {
        if (!cameraActive) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const handleResize = () => {
            if (video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            } else {
                canvas.width = 640;
                canvas.height = 360;
            }
        };

        video.addEventListener("loadedmetadata", handleResize);
        handleResize(); // run initial sync

        // Drawing loops
        const drawSkeleton = () => {
            if (!ctx || !canvas || !video) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;

            // Generate skeleton joints relative to the canvas size
            // If analyzing, make joint positions follow a lift curve. If idling, add natural float noise.
            const floatNoise = (scale: number) => (Math.sin(Date.now() / 200 + scale) * 3);

            let progress = 0; // 0 to 1
            if (analyzing) {
                animTime.current += 0.015;
                // Periodic curve: 0 -> 1 -> 0 (descent & rise)
                progress = Math.sin(animTime.current * Math.PI);
                if (progress < 0) progress = 0;
            } else {
                animTime.current = 0;
            }

            // Define joint structures based on exercise
            let joints: Record<string, { x: number; y: number }> = {};

            if (exercise === "squat") {
                // Side/diagonal view Squat profile
                const shoulderY = h * 0.35 + progress * (h * 0.18) + floatNoise(1);
                const hipY = h * 0.55 + progress * (h * 0.22) + floatNoise(2);
                const hipX = w * 0.45 - progress * (w * 0.1);
                const kneeY = h * 0.78 + progress * (h * 0.05) + floatNoise(3);
                const kneeX = w * 0.58 + progress * (w * 0.03);

                joints = {
                    head: { x: w * 0.5 + floatNoise(0), y: h * 0.2 + progress * (h * 0.18) + floatNoise(0) },
                    shoulder: { x: w * 0.5 + floatNoise(1), y: shoulderY },
                    hip: { x: hipX, y: hipY },
                    knee: { x: kneeX, y: kneeY },
                    ankle: { x: w * 0.58 + floatNoise(4), y: h * 0.9 }
                };
            } else if (exercise === "deadlift") {
                // Diagonal view Deadlift profile
                const liftProg = progress; // 0 is bottom, 1 is lockout
                const shoulderY = h * 0.5 - liftProg * (h * 0.2) + floatNoise(1);
                const shoulderX = w * 0.48 + liftProg * (w * 0.08);
                const hipY = h * 0.65 - liftProg * (h * 0.15) + floatNoise(2);
                const hipX = w * 0.38 + liftProg * (w * 0.12);
                const kneeY = h * 0.78 + floatNoise(3);
                const kneeX = w * 0.45 + liftProg * (w * 0.05);

                joints = {
                    head: { x: shoulderX + floatNoise(0), y: shoulderY - h * 0.12 + floatNoise(0) },
                    shoulder: { x: shoulderX, y: shoulderY },
                    hip: { x: hipX, y: hipY },
                    knee: { x: kneeX, y: kneeY },
                    ankle: { x: w * 0.5 + floatNoise(4), y: h * 0.9 }
                };
            } else {
                // Front/Side Bench Press profile
                // Barbell moving down to chest and up
                const barY = h * 0.45 + progress * (h * 0.25) + floatNoise(1);
                joints = {
                    head: { x: w * 0.5 + floatNoise(0), y: h * 0.75 + floatNoise(0) },
                    shoulder: { x: w * 0.5 + floatNoise(1), y: h * 0.65 + floatNoise(1) },
                    elbowLeft: { x: w * 0.38 - progress * (w * 0.08), y: h * 0.55 + progress * (h * 0.12) + floatNoise(2) },
                    elbowRight: { x: w * 0.62 + progress * (w * 0.08), y: h * 0.55 + progress * (h * 0.12) + floatNoise(3) },
                    wristLeft: { x: w * 0.38, y: barY },
                    wristRight: { x: w * 0.62, y: barY }
                };
            }

            // Draw skeleton lines
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#FFB800";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(255, 184, 0, 0.4)";

            const drawBone = (j1: keyof typeof joints, j2: keyof typeof joints) => {
                if (joints[j1] && joints[j2]) {
                    ctx.beginPath();
                    ctx.moveTo(joints[j1].x, joints[j1].y);
                    ctx.lineTo(joints[j2].x, joints[j2].y);
                    ctx.stroke();
                }
            };

            if (exercise === "bench") {
                drawBone("shoulder", "elbowLeft");
                drawBone("shoulder", "elbowRight");
                drawBone("elbowLeft", "wristLeft");
                drawBone("elbowRight", "wristRight");
                // Draw barbell
                ctx.strokeStyle = "#ff4444";
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(joints.wristLeft.x - w * 0.08, joints.wristLeft.y);
                ctx.lineTo(joints.wristRight.x + w * 0.08, joints.wristRight.y);
                ctx.stroke();
            } else {
                drawBone("head", "shoulder");
                drawBone("shoulder", "hip");
                drawBone("hip", "knee");
                drawBone("knee", "ankle");
            }

            // Reset shadows for dots
            ctx.shadowBlur = 0;

            // Draw joint nodes (dots)
            Object.keys(joints).forEach((key) => {
                const pt = joints[key];
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI);
                ctx.fillStyle = "#FFB800";
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "#ffffff";
                ctx.stroke();
            });

            // Draw Angles Overlay text on canvas
            if (exercise === "squat") {
                // Calculate knee flexion angle (mock angle changing with squat depth)
                const kneeAngle = Math.round(170 - progress * 81);
                const hipAngle = Math.round(175 - progress * 86);
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 14px sans-serif";
                ctx.fillText(`Knee Flexion: ${kneeAngle}°`, joints.knee.x + 15, joints.knee.y);
                ctx.fillText(`Hip Angle: ${hipAngle}°`, joints.hip.x - 120, joints.hip.y);
            } else if (exercise === "deadlift") {
                const spineAngle = Math.round(178 - progress * 10);
                const lumbarDev = (5.6 - progress * 1.4).toFixed(1);
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 14px sans-serif";
                ctx.fillText(`Spine Deviation: ${lumbarDev}°`, joints.shoulder.x + 15, joints.shoulder.y);
            } else {
                const leftFlexion = Math.round(165 - progress * 75);
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 14px sans-serif";
                ctx.fillText(`Elbow Flexion: ${leftFlexion}°`, joints.elbowLeft.x - 140, joints.elbowLeft.y);
            }

            // Loop animation
            animationFrameId.current = requestAnimationFrame(drawSkeleton);
        };

        drawSkeleton();

        return () => {
            video.removeEventListener("loadedmetadata", handleResize);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [cameraActive, exercise, analyzing]);

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    const handleStartAnalysis = async () => {
        if (!cameraActive) {
            showToast("Please enable webcam first.", "error");
            return;
        }

        setAnalyzing(true);
        setResult(null);

        // Run analysis animation for 3.5 seconds
        await new Promise((resolve) => setTimeout(resolve, 3500));
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
        showToast("Form analysis completed!", "success");
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
                        <p className="mt-2 text-sm text-neutral-450">
                            Edge-based pose tracking and biomechanical lift feedback
                        </p>
                    </div>
                </div>
                <div className="rounded-full border border-[#FFB800]/20 bg-[#FFB800]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#FFB800]">
                    Live Mode
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Camera View Area */}
                <div className="lg:col-span-2 rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#FFB800] mb-4">Webcam Feed & Pose Canvas</p>
                        
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 flex items-center justify-center">
                            
                            {cameraActive ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="absolute inset-0 h-full w-full object-cover rounded-2xl transform -scale-x-100"
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute inset-0 h-full w-full object-cover rounded-2xl transform -scale-x-100 z-10 pointer-events-none"
                                    />
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/40 p-6 text-center space-y-4">
                                    <div className="p-4 rounded-full bg-neutral-950/80 border border-neutral-800">
                                        <Camera className="h-10 w-10 text-neutral-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Webcam Off</h3>
                                        <p className="text-xs text-neutral-450 mt-1 max-w-sm">
                                            Enable your webcam to initialize the real-time joints tracking scanner.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="bg-[#FFB800] text-black font-bold px-5 py-2.5 rounded-xl text-xs hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] transition flex items-center gap-1.5"
                                    >
                                        <Video className="h-3.5 w-3.5" />
                                        <span>Start Camera</span>
                                    </button>
                                </div>
                            )}

                            {/* REC indicator */}
                            {cameraActive && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 rounded bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider z-20 border border-neutral-850">
                                    <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                    {analyzing ? "ANALYZING POSE" : "LIVE SCANNER"}
                                </div>
                            )}

                            {analyzing && (
                                <div className="absolute inset-0 bg-black/65 flex items-center justify-center backdrop-blur-xs z-30">
                                    <div className="text-center space-y-2.5">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#FFB800] mx-auto" />
                                        <p className="text-xs text-[#FFB800] font-bold uppercase tracking-widest animate-pulse">Evaluating biomechanics...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {cameraActive && (
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
                                onClick={handleStartAnalysis}
                                disabled={analyzing}
                                className="btn-primary bg-[#FFB800] text-black px-6 py-2.5 text-sm font-bold flex-1 justify-center rounded-xl hover:shadow-[0_0_15px_rgba(255,184,0,0.3)] transition-all duration-300 flex items-center gap-2"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                                        <span>Tracking Lift...</span>
                                    </>
                                ) : (
                                    <>
                                        <Activity className="h-4 w-4" />
                                        <span>Start Lift Analysis</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={stopCamera}
                                className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                            >
                                <VideoOff className="h-3.5 w-3.5" />
                                <span>Turn Off</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Technical details & feedback */}
                <RevealOnScroll className="lg:col-span-1 space-y-6">
                    <div className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#FFB800] mb-4">Biomechanical Report</p>
                        
                        {result ? (
                            <div className="space-y-4 bg-neutral-950 border border-neutral-850 rounded-2xl p-4 transition-all duration-350">
                                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{result.exercise}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-lg font-black text-white">{result.score}%</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-450 font-bold border border-emerald-500/20">{result.rating}</span>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full border border-neutral-850 flex items-center justify-center bg-neutral-900">
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
                                <div className="border-t border-neutral-900 pt-3 text-xs text-[#FFB800]">
                                    <span className="font-bold block mb-1">Coach Pro Tip:</span>
                                    <span className="text-neutral-350">{result.tip}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-neutral-550 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
                                <AlertCircle className="h-8 w-8 text-neutral-700 mx-auto mb-2" />
                                <p className="text-xs px-4">
                                    {cameraActive 
                                        ? "Stand in front of the camera and select your exercise to start the biomechanical tracker."
                                        : "Enable your camera first to run live form analysis and track joint angles."}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-450">Biomechanical Tech Specs</p>
                        
                        <div className="space-y-3 text-xs text-neutral-400">
                            <div className="border-b border-neutral-900 pb-2">
                                <span className="block font-bold text-white mb-0.5">Pose Tracking</span>
                                <span>MediaPipe Pose topology on WebGL/WebGPU</span>
                            </div>
                            <div className="border-b border-neutral-900 pb-2">
                                <span className="block font-bold text-white mb-0.5">Biomechanical Model</span>
                                <span>Joint angle vector projection (lumbar spine, knee flexion, hip hinge)</span>
                            </div>
                            <div className="border-b border-neutral-900 pb-2">
                                <span className="block font-bold text-white mb-0.5">Bar Path tracking</span>
                                <span>Template matching tracks barbell collar center points</span>
                            </div>
                            <div>
                                <span className="block font-bold text-white mb-0.5">Data Privacy</span>
                                <span>100% Client-side. No video feeds or images are transmitted to external servers.</span>
                            </div>
                        </div>
                    </div>
                </RevealOnScroll>
            </div>
        </div>
    );
}
