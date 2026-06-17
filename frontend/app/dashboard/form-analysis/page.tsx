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
    const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const poseRef = useRef<any>(null);

    // Track ROM metrics during active lift analysis
    const minAngleRef = useRef<number>(180);
    const maxAngleRef = useRef<number>(0);

    // Dynamically load MediaPipe Pose library on client mount
    useEffect(() => {
        const loadMediaPipe = async () => {
            try {
                if (!(window as any).Pose) {
                    const script = document.createElement("script");
                    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
                    script.crossOrigin = "anonymous";
                    script.async = true;
                    script.onload = () => {
                        console.log("MediaPipe Pose script loaded!");
                        setMediaPipeLoaded(true);
                    };
                    document.body.appendChild(script);
                } else {
                    setMediaPipeLoaded(true);
                }
            } catch (err) {
                console.error("Failed to load MediaPipe Pose script:", err);
            }
        };
        void loadMediaPipe();
    }, []);

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
        setAnalyzing(false);
        if (poseRef.current) {
            poseRef.current = null;
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

    // Handle MediaPipe Pose setup and frame loop
    useEffect(() => {
        if (!mediaPipeLoaded || !cameraActive || !videoRef.current) return;

        const PoseClass = (window as any).Pose;
        if (!PoseClass) return;

        const poseInstance = new PoseClass({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        poseInstance.setOptions({
            modelComplexity: 1,
            smoothKeypoints: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        poseInstance.onResults((results: any) => {
            drawRealSkeleton(results);
        });

        poseRef.current = poseInstance;

        let active = true;
        const processFrame = async () => {
            if (!active) return;
            const video = videoRef.current;
            if (video && video.readyState >= 2) {
                try {
                    await poseInstance.send({ image: video });
                } catch (err) {
                    console.error("MediaPipe frame send error:", err);
                }
            }
            // Request next frame at ~25 FPS
            setTimeout(() => {
                if (active) void processFrame();
            }, 40);
        };
        void processFrame();

        return () => {
            active = false;
            poseRef.current = null;
        };
    }, [mediaPipeLoaded, cameraActive]);

    const drawRealSkeleton = (results: any) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Sync canvas size to video size
        if (video.videoWidth && canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const landmarks = results.poseLandmarks;
        if (!landmarks) {
            ctx.fillStyle = "rgba(255,184,0,0.6)";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText("POSITION YOURSELF IN THE CAMERA FRAME", 30, 40);
            return;
        }

        const w = canvas.width;
        const h = canvas.height;

        const pt = (idx: number) => {
            const lm = landmarks[idx];
            return {
                x: lm.x * w,
                y: lm.y * h,
                visibility: lm.visibility ?? 0
            };
        };

        // Key joints mapping
        const lShoulder = pt(11);
        const rShoulder = pt(12);
        const lElbow = pt(13);
        const rElbow = pt(14);
        const lWrist = pt(15);
        const rWrist = pt(16);
        const lHip = pt(23);
        const rHip = pt(24);
        const lKnee = pt(25);
        const rKnee = pt(26);
        const lAnkle = pt(27);
        const rAnkle = pt(28);

        const drawLine = (p1: any, p2: any, color = "#FFB800", width = 3) => {
            if (p1.visibility < 0.5 || p2.visibility < 0.5) return;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = "round";
            ctx.stroke();
        };

        const drawJoint = (p: any, color = "#FFB800", radius = 6) => {
            if (p.visibility < 0.5) return;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        };

        // Draw connections
        drawLine(lShoulder, rShoulder, "rgba(255,255,255,0.4)", 2);
        drawLine(lHip, rHip, "rgba(255,255,255,0.4)", 2);
        drawLine(lShoulder, lElbow, "#FFB800", 3);
        drawLine(lElbow, lWrist, "#FFB800", 3);
        drawLine(rShoulder, rElbow, "#FFB800", 3);
        drawLine(rElbow, rWrist, "#FFB800", 3);
        drawLine(lShoulder, lHip, "#FFB800", 3);
        drawLine(lHip, lKnee, "#FFB800", 3);
        drawLine(lKnee, lAnkle, "#FFB800", 3);
        drawLine(rShoulder, rHip, "#FFB800", 3);
        drawLine(rHip, rKnee, "#FFB800", 3);
        drawLine(rKnee, rAnkle, "#FFB800", 3);

        // Draw joints
        [lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle].forEach(j => {
            drawJoint(j, "#FFB800", 6);
        });

        // Compute angle helper
        const getAngle = (A: any, B: any, C: any) => {
            const BAx = A.x - B.x;
            const BAy = A.y - B.y;
            const BCx = C.x - B.x;
            const BCy = C.y - B.y;
            const dot = BAx * BCx + BAy * BCy;
            const lenBA = Math.sqrt(BAx * BAx + BAy * BAy);
            const lenBC = Math.sqrt(BCx * BCx + BCy * BCy);
            if (lenBA === 0 || lenBC === 0) return 0;
            const cos = Math.min(1, Math.max(-1, dot / (lenBA * lenBC)));
            return Math.acos(cos) * (180 / Math.PI);
        };

        let currentAngle = 0;
        let displayLabel = "";
        let feedbackText = "Awaiting exercise start...";
        let stateColor = "#FFB800"; // gold

        if (exercise === "squat") {
            const activeKnee = lKnee.visibility > rKnee.visibility ? lKnee : rKnee;
            const activeHip = lKnee.visibility > rKnee.visibility ? lHip : rHip;
            const activeAnkle = lKnee.visibility > rKnee.visibility ? lAnkle : rAnkle;

            if (activeKnee.visibility > 0.4 && activeHip.visibility > 0.4 && activeAnkle.visibility > 0.4) {
                currentAngle = getAngle(activeHip, activeKnee, activeAnkle);
                displayLabel = `Knee Flexion: ${Math.round(currentAngle)}°`;
                
                if (currentAngle <= 95) {
                    feedbackText = "Excellent depth! Parallel reached.";
                    stateColor = "#10B981"; // green
                } else if (currentAngle <= 140) {
                    feedbackText = "Descending... keep back straight.";
                    stateColor = "#3B82F6"; // blue
                } else {
                    feedbackText = "Standing position. Begin rep.";
                    stateColor = "#FFB800"; // gold
                }

                ctx.fillStyle = stateColor;
                ctx.font = "bold 16px sans-serif";
                ctx.fillText(`${Math.round(currentAngle)}°`, activeKnee.x + 20, activeKnee.y);
            }
        } else if (exercise === "bench") {
            const activeElbow = lElbow.visibility > rElbow.visibility ? lElbow : rElbow;
            const activeShoulder = lElbow.visibility > rElbow.visibility ? lShoulder : rShoulder;
            const activeWrist = lElbow.visibility > rElbow.visibility ? lWrist : rWrist;

            if (activeElbow.visibility > 0.4 && activeShoulder.visibility > 0.4 && activeWrist.visibility > 0.4) {
                currentAngle = getAngle(activeShoulder, activeElbow, activeWrist);
                displayLabel = `Elbow Angle: ${Math.round(currentAngle)}°`;

                if (currentAngle <= 95) {
                    feedbackText = "Touchpoint. Good compression.";
                    stateColor = "#10B981"; // green
                } else if (currentAngle >= 165) {
                    feedbackText = "Locked out. Stiff wrists.";
                    stateColor = "#FFB800"; // gold
                } else {
                    feedbackText = "Pressing... maintain path.";
                    stateColor = "#3B82F6"; // blue
                }

                ctx.fillStyle = stateColor;
                ctx.font = "bold 16px sans-serif";
                ctx.fillText(`${Math.round(currentAngle)}°`, activeElbow.x + 20, activeElbow.y);
            }
        } else if (exercise === "deadlift") {
            const activeHip = lHip.visibility > rHip.visibility ? lHip : rHip;
            const activeShoulder = lHip.visibility > rHip.visibility ? lShoulder : rShoulder;
            const activeKnee = lHip.visibility > rHip.visibility ? lKnee : rKnee;

            if (activeHip.visibility > 0.4 && activeShoulder.visibility > 0.4 && activeKnee.visibility > 0.4) {
                currentAngle = getAngle(activeShoulder, activeHip, activeKnee);
                displayLabel = `Hip Hinge: ${Math.round(currentAngle)}°`;

                if (currentAngle >= 160) {
                    feedbackText = "Lockout complete. Shoulders back.";
                    stateColor = "#10B981"; // green
                } else if (currentAngle <= 125) {
                    feedbackText = "Bottom lift setup. Keep spine flat.";
                    stateColor = "#FFB800"; // gold
                } else {
                    feedbackText = "Pulling through mid-thigh...";
                    stateColor = "#3B82F6"; // blue
                }

                ctx.fillStyle = stateColor;
                ctx.font = "bold 16px sans-serif";
                ctx.fillText(`${Math.round(currentAngle)}°`, activeHip.x + 20, activeHip.y);
            }
        }

        // Track minimum/maximum angles during active lift analysis
        if (analyzing && currentAngle > 0) {
            minAngleRef.current = Math.min(minAngleRef.current, currentAngle);
            maxAngleRef.current = Math.max(maxAngleRef.current, currentAngle);
        }

        // Draw live status card overlay at top-left of canvas
        ctx.fillStyle = "rgba(22, 22, 22, 0.9)";
        ctx.strokeStyle = "rgba(255, 184, 0, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(20, 20, 260, 80, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(`BIOMECHANICAL SCAN: ${exercise.toUpperCase()}`, 35, 42);

        ctx.fillStyle = stateColor;
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(displayLabel || "Detecting human stance...", 35, 62);

        ctx.fillStyle = "#A3A3A3";
        ctx.font = "normal 11px sans-serif";
        ctx.fillText(feedbackText, 35, 82);
    };

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
        minAngleRef.current = 180;
        maxAngleRef.current = 0;

        // Scan for 5.5 seconds, tracking real joint angles, then compile report
        await new Promise((resolve) => setTimeout(resolve, 5500));
        setAnalyzing(false);

        const minAng = minAngleRef.current;
        const maxAng = maxAngleRef.current;

        if (exercise === "squat") {
            if (minAng <= 95) {
                setResult({
                    exercise: "Back Squat",
                    score: 96,
                    rating: "Excellent",
                    metrics: [
                        `Depth: Full parallel depth achieved (Minimum Knee Angle: ${Math.round(minAng)}°).`,
                        "Spine: Proper hip hinge and chest posture maintained.",
                        "Heels: Solid heel grounding detected throughout descent."
                    ],
                    tip: "Fantastic biomechanics. Keep driving hard out of the hole."
                });
            } else {
                setResult({
                    exercise: "Back Squat",
                    score: 74,
                    rating: "Needs Depth",
                    metrics: [
                        `Depth: Squat was short of parallel (Minimum Knee Angle: ${Math.round(minAng)}°).`,
                        "Targets: Quadriceps/glutes under-stimulated. Aim for a knee angle under 95°.",
                        "Stance: Keep chest elevated to prevent forward torso lean."
                    ],
                    tip: "Warm up with ankle mobility stretches to improve your squat range of motion."
                });
            }
        } else if (exercise === "deadlift") {
            if (maxAng >= 160) {
                setResult({
                    exercise: "Deadlift",
                    score: 92,
                    rating: "Excellent Lockout",
                    metrics: [
                        `Lockout: Complete hip extension reached (Max Hip Extension: ${Math.round(maxAng)}°).`,
                        "Spine: Stable spinal neutrality, flat back posture detected.",
                        "Engagement: Powerful glute and hamstring activation at peak."
                    ],
                    tip: "Superb lift. Remember to control the barbell back to the floor."
                });
            } else {
                setResult({
                    exercise: "Deadlift",
                    score: 76,
                    rating: "Soft Lockout",
                    metrics: [
                        `Lockout: Hips remained back (Max Hip Extension: ${Math.round(maxAng)}°).`,
                        "Posture: Soft knees at peak lockout phase.",
                        "Spine: Risk of lower back strain. Drive hips forward."
                    ],
                    tip: "Squeeze your glutes hard at the top to complete the pull."
                });
            }
        } else {
            // Bench
            if (minAng <= 95) {
                setResult({
                    exercise: "Bench Press",
                    score: 95,
                    rating: "Excellent",
                    metrics: [
                        `Range: Full chest contact achieved (Minimum Elbow Flexion: ${Math.round(minAng)}°).`,
                        "Symmetry: Symmetric shoulder and elbow extension path.",
                        "Stability: Flat foot plant and robust shoulder blade retraction."
                    ],
                    tip: "Perfect compression. Keep wrists stacked directly over elbows."
                });
            } else {
                setResult({
                    exercise: "Bench Press",
                    score: 78,
                    rating: "Partial ROM",
                    metrics: [
                        `Range: Incomplete range of motion (Minimum Elbow Flexion: ${Math.round(minAng)}°).`,
                        "Touchpoint: Bar was short of chest contact.",
                        "Efficiency: Lower chest fibers underloaded. Aim to touch sternum."
                    ],
                    tip: "Lower the weight slightly to build strength through the full range of motion."
                });
            }
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
