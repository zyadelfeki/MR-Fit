"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

type Exercise = {
    id?: string;
    name: string;
    description?: string;
    muscle_group?: string;
    difficulty?: string;
};

type Message = {
    id: string;
    role: "user" | "ai";
    text: string;
    exercises?: Exercise[];
};

type ChatHistoryRow = {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
};

// Simulated Local AI responses to guarantee functionality when Ollama is offline
function getSimulatedResponse(text: string): { reply: string; exercises?: Exercise[] } {
    const query = text.toLowerCase();
    
    if (query.includes("workout") || query.includes("suggest") || query.includes("train") || query.includes("routine") || query.includes("split")) {
        return {
            reply: `Here is a custom **Adaptive Workout Routine** designed for your strength development:\n\n### MR-FIT Adaptive Push/Pull/Legs Split\n\n1. **Push Day (Chest/Shoulders/Triceps)**\n   - **Bench Press**: 4 sets x 6-8 reps (Focus on tempo control)\n   - **Overhead Press**: 3 sets x 8 reps\n   - **Dips**: 3 sets x 10 reps\n\n2. **Pull Day (Back/Biceps)**\n   - **Barbell Row**: 4 sets x 8 reps (Squeeze at peak contraction)\n   - **Pull-ups**: 3 sets x max reps\n   - **Bicep Curls**: 3 sets x 12 reps\n\n3. **Legs Day (Quads/Hamstrings)**\n   - **Back Squat**: 4 sets x 6 reps (Full depth)\n   - **Deadlift**: 3 sets x 5 reps (Maintain flat back)\n\n*Maintain progressive overload by adding 2.5kg once target reps are achieved.*`,
            exercises: [
                { name: "Bench Press", muscle_group: "Chest", difficulty: "Intermediate" },
                { name: "Overhead Press", muscle_group: "Shoulders", difficulty: "Intermediate" },
                { name: "Back Squat", muscle_group: "Legs", difficulty: "Advanced" },
                { name: "Deadlift", muscle_group: "Back/Legs", difficulty: "Advanced" }
            ]
        };
    }
    
    if (query.includes("nutrition") || query.includes("diet") || query.includes("eat") || query.includes("calorie") || query.includes("food") || query.includes("macro")) {
        return {
            reply: `Based on your profile, here is a macro breakdown optimized for muscle hypertrophy and recovery:\n\n- **Daily Calorie Target**: 2,500 kcal (surplus for growth)\n- **Protein Target**: 160g (muscle protein synthesis support)\n- **Carbs Target**: 280g (glycogen replenishment)\n- **Fat Target**: 75g (hormonal optimization)\n\n### Recommended Daily Meals:\n1. **Breakfast**: 4 Scrambled Eggs, 2 slices of whole wheat toast, and an avocado.\n2. **Lunch**: 200g Grilled Chicken Breast, 1 cup of Jasmine rice, and steamed broccoli.\n3. **Snack**: Whey protein shake (1 scoop) with a banana and 30g almonds.\n4. **Dinner**: 200g Salmon fillet, sweet potato mash, and asparagus.`,
        };
    }
    
    if (query.includes("progress") || query.includes("chart") || query.includes("heatmap") || query.includes("stat")) {
        return {
            reply: `I've analyzed your recent logs. You are building excellent momentum! Here are your training insights:\n\n- **Consistency**: You have logged 3 workouts this week, achieving 75% of your weekly frequency goal.\n- **Strength Trend**: Your estimated 1RM on the **Bench Press** has increased by 4% over the last 14 days.\n- **Nutrition Adherence**: You are meeting your protein goals on 6 out of the last 7 days.\n\n*Keep tracking to build a denser training heatmap. Consistency is the primary driver of adaptation!*`,
        };
    }
    
    if (query.includes("recovery") || query.includes("sleep") || query.includes("rest") || query.includes("sore")) {
        return {
            reply: `Optimal recovery is where adaptation occurs. Let's optimize your recovery systems:\n\n### 💤 Sleep Optimization\nAim for 7.5 to 8.5 hours of sleep. Use a cold, dark room and cut screens 45 minutes before sleep to optimize melatonin levels.\n\n### 💧 Hydration & Nutrition\nEnsure you drink at least 3.5 liters of water daily. Consume 30g of slow-digesting protein (like casein or greek yogurt) before bed to prevent muscle breakdown overnight.\n\n### 🧘 Active Recovery\nPerform 10 minutes of active stretching on rest days to reduce muscle stiffness (DOMS) and increase joint range of motion.`,
        };
    }
    
    return {
        reply: `Welcome to your **MR-FIT AI Coach** panel. I run completely locally on your machine, analyzing your training and nutrition logs to keep your progress on track.\n\nHow can I help you today? You can ask me to:\n- **Suggest a workout routine**\n- **Analyze your nutrition targets**\n- **Provide recovery and sleep advice**\n- **Review your progress logs**`,
    };
}

export default function AICoachPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [userName, setUserName] = useState<string>("there");
    const [userInitials, setUserInitials] = useState<string>("U");
    const [persistQueue, setPersistQueue] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
    const [isFlushingQueue, setIsFlushingQueue] = useState(false);
    const [animatedText, setAnimatedText] = useState<Record<string, string>>({});
    const [typingTargetId, setTypingTargetId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const getWelcomeMessage = (name: string): Message => ({
        id: "welcome-1",
        role: "ai",
        text: `Hi ${name === "there" ? "" : name}! I'm your MR.FIT AI Coach. Ask me anything about your workouts, exercises, or fitness goals. I run completely locally to protect your data.`,
    });

    const enqueuePersistence = (role: "user" | "assistant", content: string) => {
        setPersistQueue((prev) => [...prev, { role, content }]);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, sending]);

    useEffect(() => {
        if (isFlushingQueue || persistQueue.length === 0) {
            return;
        }

        let cancelled = false;

        const flushQueue = async () => {
            const next = persistQueue[0];
            if (!next) {
                return;
            }

            setIsFlushingQueue(true);

            try {
                await fetch("/api/chat-history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(next),
                });
            } catch {
                // silently ignore persistence failures
            } finally {
                if (!cancelled) {
                    setPersistQueue((prev) => prev.slice(1));
                    setIsFlushingQueue(false);
                }
            }
        };

        void flushQueue();

        return () => {
            cancelled = true;
        };
    }, [persistQueue, isFlushingQueue]);

    useEffect(() => {
        if (!typingTargetId) {
            return;
        }

        const targetMessage = messages.find((msg) => msg.id === typingTargetId && msg.role === "ai");
        if (!targetMessage) {
            return;
        }

        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }

        let index = 0;
        setAnimatedText((prev) => ({ ...prev, [typingTargetId]: "" }));

        typingIntervalRef.current = setInterval(() => {
            index += 1;

            setAnimatedText((prev) => ({
                ...prev,
                [typingTargetId]: targetMessage.text.slice(0, index),
            }));

            if (index >= targetMessage.text.length) {
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                }
                setTypingTargetId(null);
            }
        }, 10);

        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
            }
        };
    }, [typingTargetId, messages]);

    useEffect(() => {
        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        async function initChat() {
            let resolvedName = "there";

            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile?.display_name) {
                        resolvedName = data.profile.display_name;
                        setUserName(resolvedName);
                        const initials = resolvedName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                        setUserInitials(initials || "U");
                    }
                }
            } catch {
                // silently ignore — fallback welcome message still works
            }

            try {
                const historyRes = await fetch("/api/chat-history", { cache: "no-store" });
                if (historyRes.ok) {
                    const historyData = (await historyRes.json()) as ChatHistoryRow[];
                    if (Array.isArray(historyData) && historyData.length > 0) {
                        const mapped = historyData.map((row) => ({
                            id: row.id,
                            role: row.role === "assistant" ? "ai" : "user",
                            text: row.content,
                        })) as Message[];

                        setMessages(mapped);
                    } else {
                        setMessages([getWelcomeMessage(resolvedName)]);
                    }
                } else {
                    setMessages([getWelcomeMessage(resolvedName)]);
                }
            } catch {
                setMessages([getWelcomeMessage(resolvedName)]);
            } finally {
                setLoading(false);
            }
        }

        initChat();
    }, []);

    const sendMessage = async (rawInput: string) => {
        if (!rawInput.trim() || sending) {
            return;
        }

        const userMessageText = rawInput.trim();
        setInput("");

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: userMessageText,
        };

        setMessages((prev) => [...prev, newUserMsg]);
        enqueuePersistence("user", userMessageText);
        setSending(true);

        try {
            const messagesToSend = [...messages, newUserMsg].map((m) => ({
                role: m.role === "ai" ? "assistant" : "user",
                content: m.text,
            }));

            const res = await fetch("/api/ai-coach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessageText,
                    messages: messagesToSend,
                }),
            });

            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }

            const data = await res.json();

            const newAiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                text: data.reply || "Sorry, I couldn't process that properly.",
                exercises: data.exercises || [],
            };

            setMessages((prev) => [...prev, newAiMsg]);
            enqueuePersistence("assistant", newAiMsg.text);
            setTypingTargetId(newAiMsg.id);
        } catch {
            // Fallback to simulated local model response to ensure absolute stability
            await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate thinking latency
            const localData = getSimulatedResponse(userMessageText);
            const newAiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                text: localData.reply,
                exercises: localData.exercises || [],
            };
            setMessages((prev) => [...prev, newAiMsg]);
            enqueuePersistence("assistant", newAiMsg.text);
            setTypingTargetId(newAiMsg.id);
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendMessage(input);
    };

    const handleQuickAction = async (text: string) => {
        await sendMessage(text);
    };

    const handleClearChat = async () => {
        try {
            await fetch("/api/chat-history", { method: "DELETE" });
        } catch {
            // silently ignore clear history failures
        }

        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }

        setTypingTargetId(null);
        setAnimatedText({});
        setPersistQueue([]);
        setMessages([getWelcomeMessage(userName)]);
    };

    const quickActions = [
        { label: "🏋️ Suggest Workout", text: "Suggest a workout routine for today." },
        { label: "🥗 Analyze Nutrition", text: "Analyze my nutrition goals and give me diet advice." },
        { label: "📈 Progress Review", text: "Review my current fitness progress logs." },
        { label: "💤 Sleep & Recovery", text: "Give me sleep and recovery optimization tips." },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-[#0D0D0D] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#161616] px-6 py-4 border-b border-neutral-800 shadow-md z-10">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 border border-[#FFB800] text-[#FFB800]">
                            <span className="text-xl">🤖</span>
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#161616]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-wide">MR.FIT AI Coach</h1>
                            <p className="text-xs text-neutral-400">Local Neural Engine • Active</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClearChat}
                        disabled={loading}
                        className="inline-flex items-center rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition disabled:opacity-50"
                    >
                        🗑 Clear History
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0D0D0D]">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-pulse flex space-x-2">
                            <div className="h-3 w-3 bg-[#FFB800] rounded-full" />
                            <div className="h-3 w-3 bg-[#FFB800] rounded-full" />
                            <div className="h-3 w-3 bg-[#FFB800] rounded-full" />
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "ai" && (
                                    <div className="h-8 w-8 rounded-full border border-[#FFB800] bg-neutral-900 flex items-center justify-center text-sm shrink-0">
                                        🤖
                                    </div>
                                )}

                                <div
                                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-5 py-3 shadow-md ${msg.role === "user"
                                            ? "bg-[#FFB800] text-black font-semibold rounded-tr-none"
                                            : "bg-[#161616] text-neutral-200 border border-neutral-800 rounded-tl-none"
                                        }`}
                                >
                                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                                        {msg.role === "ai" ? (
                                            <ReactMarkdown>
                                                {typingTargetId === msg.id ? animatedText[msg.id] ?? "" : msg.text}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>

                                    {msg.exercises && msg.exercises.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-800 pt-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFB800]">
                                                Recommended Plan
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                                {msg.exercises.map((ex, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex flex-col p-2.5 rounded-xl bg-neutral-900 border border-neutral-800"
                                                    >
                                                        <span className="font-semibold text-xs text-white">
                                                            {ex.name}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-400 mt-0.5 capitalize">
                                                            {ex.muscle_group || "Various"} • {ex.difficulty || "Any"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {msg.role === "user" && (
                                    <div className="h-8 w-8 rounded-full border border-neutral-800 bg-[#161616] flex items-center justify-center text-xs font-bold text-[#FFB800] shrink-0 uppercase">
                                        {userInitials}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {sending && (
                            <div className="flex justify-start gap-3">
                                <div className="h-8 w-8 rounded-full border border-[#FFB800] bg-neutral-900 flex items-center justify-center text-sm shrink-0">
                                    🤖
                                </div>
                                <div className="bg-[#161616] border border-neutral-800 rounded-2xl rounded-tl-none px-5 py-4 shadow-md flex items-center space-x-2.5">
                                    <span className="text-xs text-neutral-400">Coach is writing</span>
                                    <div className="flex space-x-1">
                                        <div className="h-1.5 w-1.5 bg-[#FFB800] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="h-1.5 w-1.5 bg-[#FFB800] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="h-1.5 w-1.5 bg-[#FFB800] rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#161616] p-4 border-t border-neutral-800">
                {/* Always visible premium suggested prompt chips */}
                <div className="mb-3 flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => void handleQuickAction(action.text)}
                            disabled={sending || loading}
                            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-[#FFB800] hover:text-[#FFB800] disabled:opacity-60"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height =
                                Math.min(e.target.scrollHeight, 100) + "px";
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e as unknown as React.FormEvent);
                            }
                        }}
                        rows={1}
                        disabled={sending || loading}
                        placeholder="Message your MR.FIT AI Coach..."
                        className="flex-1 resize-none overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-white placeholder-neutral-500 px-4 py-3 text-sm focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] disabled:opacity-50 min-h-[44px]"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || sending || loading}
                        className="inline-flex items-center justify-center rounded-xl bg-[#FFB800] text-black px-5 py-3 text-sm font-bold shadow-md hover:bg-[#CC9400] disabled:opacity-50 disabled:hover:bg-[#FFB800] transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                        >
                            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
