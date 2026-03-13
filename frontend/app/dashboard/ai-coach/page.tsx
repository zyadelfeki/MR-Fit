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

export default function AICoachPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [userName, setUserName] = useState<string>("there");
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
        text: `Hi ${name === "there" ? "" : name}! I'm your MR-Fit AI Coach. Ask me anything about your workouts, exercises, or fitness goals.`,
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
        }, 12);

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
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                text: "I'm having trouble connecting right now. Make sure Ollama is running: ollama serve",
            };
            setMessages((prev) => [...prev, errorMsg]);
            enqueuePersistence("assistant", errorMsg.text);
            setTypingTargetId(errorMsg.id);
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendMessage(input);
    };

    const handleQuickAction = async (text: string) => {
        setInput(text);
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

    const hasUserSentMessage = messages.some((msg) => msg.role === "user");

    const quickActions = [
        "💪 Suggest today's workout",
        "🥗 Analyze my nutrition",
        "📈 How am I progressing?",
        "🧘 Recovery tips",
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-2xl">🤖</span> AI Coach
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Powered by Ollama (local LLM) — your personalized fitness assistant
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClearChat}
                        disabled={loading}
                        className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        🗑 Clear Chat
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-pulse flex space-x-2">
                            <div className="h-3 w-3 bg-indigo-400 rounded-full" />
                            <div className="h-3 w-3 bg-indigo-400 rounded-full" />
                            <div className="h-3 w-3 bg-indigo-400 rounded-full" />
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === "user"
                                            ? "bg-indigo-600 text-white rounded-br-none"
                                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none"
                                        }`}
                                >
                                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                        {msg.role === "ai" ? (
                                            <ReactMarkdown>
                                                {typingTargetId === msg.id ? animatedText[msg.id] ?? "" : msg.text}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>

                                    {msg.exercises && msg.exercises.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-2">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                                Recommended Exercises
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {msg.exercises.map((ex, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                                                    >
                                                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                            {ex.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-300 mt-1 capitalize">
                                                            {ex.muscle_group || "Various"} •{" "}
                                                            {ex.difficulty || "Any"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {sending && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            AI is thinking...
                                        </span>
                                        <div className="flex space-x-1">
                                            <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                {!hasUserSentMessage && !loading && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {quickActions.map((chip) => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => void handleQuickAction(chip)}
                                disabled={sending}
                                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                )}

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
                        placeholder="Ask about fitness, form, or routines..."
                        className="flex-1 resize-none overflow-hidden rounded-2xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-6 py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 text-sm sm:text-base outline-none ring-1 ring-inset ring-gray-300 dark:ring-gray-600 min-h-[44px]"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || sending || loading}
                        className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5 -ml-1 mr-1 sm:mr-0"
                        >
                            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                        </svg>
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
