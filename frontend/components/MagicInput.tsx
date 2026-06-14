"use client";

import { useState, useEffect, useRef } from "react";
import { showToast } from "@/lib/toast";

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
                throw new Error("AI returned an empty list or unexpected format");
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
            showToast("✅ Logs added successfully!", "success");

            // Reload page after a short delay to update dashboard statistics
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (err: any) {
            setStatus({ type: "error", message: err.message || "Failed to save logs" });
            showToast(`❌ Error: ${err.message || "Failed"}`, "error");
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
        <div className="card rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                    </span>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">AI Magic Input</h2>
                </div>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Natural Language</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Log meals or workouts in simple English (e.g., <span className="italic">"had 2 eggs and toast"</span> or <span className="italic">"bench press 3 sets of 10 reps at 60kg"</span>).
            </p>

            <div className="relative">
                <textarea
                    className="w-full min-h-[90px] p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
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
                            : "bg-white dark:bg-gray-850 text-gray-500 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    title={listening ? "Stop voice input" : "Start voice input"}
                    disabled={loading}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" x2="12" y1="19" y2="22"/>
                    </svg>
                </button>
            </div>

            <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Press Ctrl+Enter to submit</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setText("")}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        disabled={loading || !text}
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleLog}
                        className="btn-primary text-xs py-1.5 px-4"
                        disabled={loading || !text.trim()}
                    >
                        Log with AI
                    </button>
                </div>
            </div>

            {status.message && (
                <div
                    className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        status.type === "loading"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30"
                            : status.type === "success"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30"
                            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100/50 dark:border-red-900/30"
                    }`}
                >
                    {status.type === "loading" && (
                        <svg className="animate-spin h-3 w-3 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    <span>{status.message}</span>
                </div>
            )}
        </div>
    );
}
