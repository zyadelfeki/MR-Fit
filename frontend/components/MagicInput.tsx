"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast";
import { Mic, MicOff, Sparkles, Loader2, Trash2, Check, AlertCircle } from "lucide-react";

type ParsedItem = {
    type: "EXERCISE" | "NUTRITION";
    name: string;
    calories?: number | null;
    sets?: number | null;
    reps?: number | null;
    weight?: number | null;
    volume?: number | null;
};

export default function MagicInput() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | ""; message: string }>({
        type: "",
        message: "",
    });
    const [listening, setListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        // Initialize SpeechRecognition on mount if supported
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.lang = "en-US";
            rec.interimResults = true;
            rec.continuous = true;

            rec.onresult = (event: any) => {
                let finalTranscript = "";
                let interimTranscript = "";
                for (let i = 0; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setText(finalTranscript + interimTranscript);
            };

            rec.onend = () => {
                setListening(false);
            };

            rec.onerror = (event: any) => {
                setListening(false);
                if (event.error !== "aborted") {
                    showToast(`Voice input error: ${event.error}`, "error");
                }
            };

            setRecognition(rec);
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) {
            showToast("Voice input is only supported in Chrome or Edge", "error");
            return;
        }

        if (listening) {
            recognition.stop();
            setListening(false);
        } else {
            setStatus({ type: "", message: "" });
            try {
                recognition.start();
                setListening(true);
                showToast("Listening... speak now", "info");
            } catch (err) {
                console.error("Failed to start speech recognition:", err);
            }
        }
    };

    const handleLog = async () => {
        const trimmedText = text.trim();
        if (!trimmedText || loading) return;

        setLoading(true);
        setStatus({ type: "loading", message: "Parsing entry with AI..." });

        try {
            // 1. Call proxy parser route
            const parseRes = await fetch("/api/smart-tracker/parse-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: trimmedText }),
            });

            if (!parseRes.ok) {
                const errData = await parseRes.json();
                throw new Error(errData.error || "Failed to parse entry");
            }

            const parsedItems = (await parseRes.json()) as ParsedItem[];
            if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
                throw new Error("I couldn't extract a log from that. Try including an exercise name plus sets/reps/weight, or calories for food.");
            }

            // 2. Loop over and insert each parsed item into PostgreSQL
            const savedNames: string[] = [];
            for (const item of parsedItems) {
                if (item.type === "EXERCISE") {
                    // workout logs route handles resolve/create exercise by name automatically
                    const logRes = await fetch("/api/workout-logs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            exercise_name: item.name,
                            sets_completed: item.sets || 1,
                            reps_completed: item.reps || 0,
                            weight_kg: item.weight || null,
                            notes: "Logged via Magic Input",
                        }),
                    });

                    if (!logRes.ok) {
                        const err = await logRes.json();
                        throw new Error(`Failed to log exercise: ${err.error || "Unknown"}`);
                    }
                } else if (item.type === "NUTRITION") {
                    const nutritionRes = await fetch("/api/nutrition", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            food_name: item.name,
                            calories: item.calories || 0,
                            protein_g: null,
                            carbs_g: null,
                            fat_g: null,
                            logged_at: new Date().toISOString(),
                        }),
                    });

                    if (!nutritionRes.ok) {
                        const err = await nutritionRes.json();
                        throw new Error(`Failed to log food: ${err.error || "Unknown"}`);
                    }
                }
                savedNames.push(item.name);
            }

            setText("");
            setStatus({ type: "success", message: `Successfully logged: ${savedNames.join(", ")}` });
            showToast("Logs added successfully!", "success");

            // Reload page after a short delay to update dashboard statistics
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (err: any) {
            setStatus({ type: "error", message: err.message || "Failed to save logs" });
            showToast(`Error: ${err.message || "Failed"}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey) {
            void handleLog();
        }
    };

    return (
        <div className="card rounded-2xl border border-neutral-800 bg-[#161616] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFB800] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFB800]"></span>
                    </span>
                    <h2 className="text-base font-bold text-white font-heading">AI Magic Input</h2>
                </div>
                <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">Natural Language</span>
            </div>

            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                Log meals or workouts in simple English (e.g., <span className="italic">"had 2 eggs and toast"</span> or <span className="italic">"bench press 3 sets of 10 reps at 60kg"</span>).
            </p>

            <div className="relative">
                <textarea
                    className="w-full min-h-[90px] p-3 text-sm rounded-xl border border-neutral-805 bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFB800] transition resize-none"
                    placeholder="Describe your workout or food..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                        listening
                            ? "bg-red-500 text-white border-red-500 animate-pulse"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                    title={listening ? "Stop voice input" : "Start voice input"}
                    disabled={loading}
                >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
            </div>

            <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] text-neutral-500">Press Ctrl+Enter to submit</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setText("")}
                        className="px-3 py-1.5 text-xs font-semibold text-neutral-450 hover:text-white hover:bg-neutral-905 rounded-lg transition"
                        disabled={loading || !text}
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => void handleLog()}
                        className="btn-primary bg-[#FFB800] text-black text-xs font-bold py-1.5 px-4 rounded-lg hover:shadow-[0_0_15px_rgba(255,184,0,0.25)] flex items-center gap-1.5 transition-all disabled:opacity-50"
                        disabled={loading || !text.trim()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Logging...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Log with AI</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {status.message && (
                <div
                    className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                        status.type === "loading"
                            ? "bg-[#FFB800]/5 text-[#FFB800] border-[#FFB800]/20"
                            : status.type === "success"
                            ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                >
                    {status.type === "loading" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FFB800]" />
                    )}
                    {status.type === "success" && (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {status.type === "error" && (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span>{status.message}</span>
                </div>
            )}
        </div>
    );
}
