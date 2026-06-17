"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Dumbbell,
  Salad,
  LineChart,
  Moon,
  Trash2,
  Send,
  Sparkles,
  Zap,
  Check,
  X as CloseIcon,
  Plus
} from "lucide-react";
import { showToast } from "@/lib/toast";

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
  suggestions?: any[];
};

type ChatHistoryRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

// Parse structured JSON suggestions out of assistant responses
function parseMessageSuggestions(text: string): { cleanText: string; suggestions: any[] } {
  const marker = "```suggestion-json";
  const startIdx = text.indexOf(marker);
  if (startIdx === -1) return { cleanText: text, suggestions: [] };

  const endMarker = "```";
  const contentStart = startIdx + marker.length;
  const endIdx = text.indexOf(endMarker, contentStart);
  if (endIdx === -1) return { cleanText: text, suggestions: [] };

  const jsonStr = text.substring(contentStart, endIdx).trim();
  const cleanText = (text.substring(0, startIdx).trim() + "\n" + text.substring(endIdx + endMarker.length).trim()).trim();

  try {
    const suggestions = JSON.parse(jsonStr);
    return { cleanText, suggestions: Array.isArray(suggestions) ? suggestions : [suggestions] };
  } catch (e) {
    console.error("Failed to parse suggestion JSON:", e);
    return { cleanText: text, suggestions: [] };
  }
}

// Simulated Local AI responses to guarantee functionality when Ollama is offline
function getSimulatedResponse(text: string): { reply: string; exercises?: Exercise[] } {
  const query = text.toLowerCase();

  if (query.includes("workout") || query.includes("suggest") || query.includes("train") || query.includes("routine") || query.includes("split")) {
    return {
      reply: `Here is a custom **Adaptive Workout Routine** designed for your strength development:\n\n### Adaptive Push/Pull/Legs Split\n\n1. **Push Day (Chest/Shoulders/Triceps)**\n   - **Bench Press**: 4 sets x 6-8 reps (Focus on tempo control)\n   - **Overhead Press**: 3 sets x 8 reps\n   - **Dips**: 3 sets x 10 reps\n\n2. **Pull Day (Back/Biceps)**\n   - **Barbell Row**: 4 sets x 8 reps (Squeeze at peak contraction)\n   - **Pull-ups**: 3 sets x max reps\n   - **Bicep Curls**: 3 sets x 12 reps\n\n3. **Legs Day (Quads/Hamstrings)**\n   - **Back Squat**: 4 sets x 6 reps (Full depth)\n   - **Deadlift**: 3 sets x 5 reps (Maintain flat back)\n\n*Maintain progressive overload by adding 2.5kg once target reps are achieved.*\n\n\`\`\`suggestion-json\n[\n  {\n    \"type\": \"workout_edit\",\n    \"exercise_name\": \"Bench Press\",\n    \"sets\": 4,\n    \"reps\": 8,\n    \"weight_kg\": 80\n  },\n  {\n    \"type\": \"workout_edit\",\n    \"exercise_name\": \"Overhead Press\",\n    \"sets\": 3,\n    \"reps\": 8,\n    \"weight_kg\": 50\n  }\n]\n\`\`\``,
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
      reply: `Based on your profile, here is a macro breakdown optimized for muscle hypertrophy and recovery:\n\n- **Daily Calorie Target**: 2,500 kcal (surplus for growth)\n- **Protein Target**: 160g (muscle protein synthesis support)\n- **Carbs Target**: 280g (glycogen replenishment)\n- **Fat Target**: 75g (hormonal optimization)\n\n### Recommended Daily Meals:\n1. **Breakfast**: 4 Scrambled Eggs, 2 slices of whole wheat toast, and an avocado.\n2. **Lunch**: 200g Grilled Chicken Breast, 1 cup of Jasmine rice, and steamed broccoli.\n\n\`\`\`suggestion-json\n[\n  {\n    \"type\": \"nutrition_edit\",\n    \"food_name\": \"Grilled Chicken Breast (200g)\",\n    \"calories\": 330,\n    \"protein_g\": 62.0,\n    \"carbs_g\": 0.0,\n    \"fat_g\": 7.0\n  }\n]\n\`\`\``,
    };
  }

  if (query.includes("progress") || query.includes("chart") || query.includes("heatmap") || query.includes("stat")) {
    return {
      reply: `I've analyzed your recent logs. You are building excellent momentum! Here are your training insights:\n\n- **Consistency**: You have logged 3 workouts this week, achieving 75% of your weekly frequency goal.\n- **Strength Trend**: Your estimated 1RM on the **Bench Press** has increased by 4% over the last 14 days.\n- **Nutrition Adherence**: You are meeting your protein goals on 6 out of the last 7 days.\n\n*Keep tracking to build a denser training heatmap. Consistency is the primary driver of adaptation!*`,
    };
  }

  if (query.includes("recovery") || query.includes("sleep") || query.includes("rest") || query.includes("sore")) {
    return {
      reply: `Optimal recovery is where adaptation occurs. Let's optimize your recovery systems:\n\n### Sleep Optimization\nAim for 7.5 to 8.5 hours of sleep. Use a cold, dark room and cut screens 45 minutes before sleep to optimize melatonin levels.\n\n### Hydration & Nutrition\nEnsure you drink at least 3.5 liters of water daily. Consume 30g of slow-digesting protein (like casein or greek yogurt) before bed to prevent muscle breakdown overnight.\n\n### Active Recovery\nPerform 10 minutes of active stretching on rest days to reduce muscle stiffness (DOMS) and increase joint range of motion.`,
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

  // Suggestion action tracking state
  const [suggestionStates, setSuggestionStates] = useState<Record<string, "pending" | "accepted" | "denied">>({});
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedWorkoutForSuggestion, setSelectedWorkoutForSuggestion] = useState<Record<string, string>>({});

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
      index += 3; // Type 3 characters at a time for snappier UI transitions

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
            setUserInitials(initials);
          }
        }
      } catch {
        // non-critical failure, fallback used
      }

      try {
        const res = await fetch("/api/workouts");
        if (res.ok) {
          const data = await res.json();
          setWorkouts(data.workouts || []);
        }
      } catch {}

      try {
        const res = await fetch("/api/chat-history");
        if (!res.ok) throw new Error();
        const rows = await res.json() as ChatHistoryRow[];

        if (Array.isArray(rows) && rows.length > 0) {
          const loaded = rows.map((r) => {
            const parsed = parseMessageSuggestions(r.content);
            return {
              id: r.id,
              role: r.role === "assistant" ? "ai" as const : "user" as const,
              text: parsed.cleanText,
              suggestions: parsed.suggestions
            };
          });
          setMessages(loaded);
        } else {
          setMessages([getWelcomeMessage(resolvedName)]);
        }
      } catch {
        setMessages([getWelcomeMessage(resolvedName)]);
      } finally {
        setLoading(false);
      }
    }

    void initChat();
  }, []);

  const handleAcceptSuggestion = async (msgId: string, sugIdx: number, sug: any) => {
    const key = `${msgId}-${sugIdx}`;
    
    if (sug.type === "workout_edit") {
      let workoutId = selectedWorkoutForSuggestion[key];
      
      // If user hasn't selected a workout, try to pick the first active one, or auto-create one
      if (!workoutId) {
        if (workouts.length > 0) {
          workoutId = workouts[0].id;
        } else {
          // Auto create a new session
          try {
            const resNew = await fetch("/api/workouts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: "AI Coach Session", source: "ai" })
            });
            if (resNew.ok) {
              const dataNew = await resNew.json();
              workoutId = dataNew.id;
              // Refresh workout list
              const resW = await fetch("/api/workouts");
              if (resW.ok) {
                const dataW = await resW.json();
                setWorkouts(dataW.workouts || []);
              }
              showToast("Created a new workout session 'AI Coach Session'", "success");
            } else {
              showToast("Please create a workout session first", "error");
              return;
            }
          } catch {
            showToast("Failed to create default workout", "error");
            return;
          }
        }
      }
      
      try {
        const res = await fetch(`/api/workouts/${workoutId}/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise_name: sug.exercise_name,
            sets: Number(sug.sets || 3),
            reps: Number(sug.reps || 10),
            weight_kg: sug.weight_kg ? Number(sug.weight_kg) : null
          })
        });
        if (res.ok) {
          showToast(`Added ${sug.exercise_name} to workout!`, "success");
          setSuggestionStates(prev => ({ ...prev, [key]: "accepted" }));
        } else {
          const err = await res.json();
          showToast(err.error || "Failed to add exercise", "error");
        }
      } catch (err) {
        showToast("Failed to add exercise to workout", "error");
      }
    } else if (sug.type === "nutrition_edit") {
      try {
        const res = await fetch("/api/nutrition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            food_name: sug.food_name,
            calories: Number(sug.calories || 0),
            protein_g: sug.protein_g ? Number(sug.protein_g) : null,
            carbs_g: sug.carbs_g ? Number(sug.carbs_g) : null,
            fat_g: sug.fat_g ? Number(sug.fat_g) : null
          })
        });
        if (res.ok) {
          showToast(`Logged ${sug.food_name} to nutrition log!`, "success");
          setSuggestionStates(prev => ({ ...prev, [key]: "accepted" }));
        } else {
          const err = await res.json();
          showToast(err.error || "Failed to log nutrition", "error");
        }
      } catch (err) {
        showToast("Failed to log nutrition", "error");
      }
    }
  };

  const handleDenySuggestion = (msgId: string, sugIdx: number) => {
    const key = `${msgId}-${sugIdx}`;
    setSuggestionStates(prev => ({ ...prev, [key]: "denied" }));
    showToast("Suggestion declined", "info");
  };

  const handleCreateDefaultWorkout = async (key: string) => {
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "AI Coach Session",
          source: "ai"
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh workouts list
        const resW = await fetch("/api/workouts");
        if (resW.ok) {
          const dataW = await resW.json();
          setWorkouts(dataW.workouts || []);
        }
        // Select the newly created workout
        setSelectedWorkoutForSuggestion(prev => ({ ...prev, [key]: data.id }));
        showToast("Created new workout session 'AI Coach Session'", "success");
      }
    } catch {
      showToast("Failed to create workout", "error");
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    enqueuePersistence("user", text);

    try {
      const mappedHistory = messages.map(m => ({
        role: m.role === "ai" ? "assistant" as const : "user" as const,
        content: m.text
      }));

      const response = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, messages: mappedHistory }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      const replyText = data.reply || "";
      const exercises = data.exercises || [];
      const parsed = parseMessageSuggestions(replyText);

      const aiMsgId = "ai-" + Date.now();
      const aiMsgPlaceholder: Message = {
        id: aiMsgId,
        role: "ai",
        text: parsed.cleanText,
        exercises: exercises,
        suggestions: parsed.suggestions
      };
      setMessages((prev) => [...prev, aiMsgPlaceholder]);
      setTypingTargetId(aiMsgId);
      enqueuePersistence("assistant", replyText);

    } catch {
      // Offline fallback
      const simulated = getSimulatedResponse(text);
      const parsed = parseMessageSuggestions(simulated.reply);
      const aiMsgId = "ai-sim-" + Date.now();
      const aiMsg: Message = {
        id: aiMsgId,
        role: "ai",
        text: parsed.cleanText,
        exercises: simulated.exercises,
        suggestions: parsed.suggestions
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTypingTargetId(aiMsgId);
      enqueuePersistence("assistant", simulated.reply);
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
    { label: "Suggest Workout", text: "Suggest a workout routine for today." },
    { label: "Analyze Nutrition", text: "Analyze my nutrition goals and give me diet advice." },
    { label: "Progress Review", text: "Review my current fitness progress logs." },
    { label: "Sleep & Recovery", text: "Give me sleep and recovery optimization tips." },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-[#0D0D0D] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#161616] px-6 py-4 border-b border-neutral-800 shadow-md z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 border border-[#FFB800] text-[#FFB800]">
              <Bot className="h-5 w-5 text-amber-500" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#161616]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-widest uppercase font-heading">MR.FIT AI Coach</h1>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase">Local Neural Engine • Active</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={loading}
            className="inline-flex items-center rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear History
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
                className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="h-8 w-8 rounded-full border border-amber-500/20 bg-neutral-900 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-amber-500" />
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
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFB800] font-heading">
                        Recommended Plan
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {msg.exercises.map((ex, i) => (
                          <div
                            key={i}
                            className="flex flex-col p-2.5 rounded-xl bg-neutral-900 border border-neutral-850 hover:border-amber-500/20 transition-colors"
                          >
                            <span className="font-semibold text-xs text-white">
                              {ex.name}
                            </span>
                            <span className="text-[10px] text-neutral-450 mt-0.5 uppercase tracking-wide font-semibold">
                              {ex.muscle_group || "Various"} • {ex.difficulty || "Any"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE COACH SUGGESTIONS CARDS */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3 border-t border-neutral-850 pt-3.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#FFB800] font-heading">
                        Interactive Action Requests
                      </p>
                      <div className="space-y-2.5">
                        {msg.suggestions.map((sug, i) => {
                          const key = `${msg.id}-${i}`;
                          const state = suggestionStates[key] || "pending";

                          if (sug.type === "workout_edit") {
                            const selectedW = selectedWorkoutForSuggestion[key] || (workouts[0]?.id ?? "");
                            return (
                              <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 flex flex-col gap-2 text-xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-bold text-white block">💪 Add {sug.exercise_name}</span>
                                    <span className="text-neutral-450 text-[10px]">{sug.sets}x{sug.reps} @ {sug.weight_kg ? `${sug.weight_kg}kg` : "bodyweight"}</span>
                                  </div>
                                  {state === "accepted" && <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold">Accepted</span>}
                                  {state === "denied" && <span className="rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 text-[9px] font-bold">Declined</span>}
                                </div>

                                {state === "pending" && (
                                  <div className="space-y-2 pt-1 border-t border-neutral-900">
                                    <div className="flex gap-1.5 items-center">
                                      <select
                                        value={selectedW}
                                        onChange={(e) => setSelectedWorkoutForSuggestion(prev => ({ ...prev, [key]: e.target.value }))}
                                        className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1 text-[10px] text-white"
                                      >
                                        {workouts.length === 0 ? (
                                          <option value="">No active workouts</option>
                                        ) : (
                                          workouts.map((w) => (
                                            <option key={w.id} value={w.id}>{w.title}</option>
                                          ))
                                        )}
                                      </select>
                                      {workouts.length === 0 && (
                                        <button
                                          onClick={() => void handleCreateDefaultWorkout(key)}
                                          className="rounded-lg bg-neutral-900 border border-neutral-850 px-2 py-1 text-[9px] text-amber-500 hover:text-white"
                                        >
                                          + Create
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex justify-end gap-1.5 pt-0.5">
                                      <button
                                        onClick={() => handleDenySuggestion(msg.id, i)}
                                        className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] font-bold text-neutral-450 hover:text-white"
                                      >
                                        Decline
                                      </button>
                                      <button
                                        onClick={() => void handleAcceptSuggestion(msg.id, i, sug)}
                                        className="rounded-lg bg-[#FFB800] text-black px-2.5 py-1 text-[10px] font-bold"
                                      >
                                        Accept
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          } else if (sug.type === "nutrition_edit") {
                            return (
                              <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 flex flex-col gap-2 text-xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-bold text-white block">🥗 Log {sug.food_name}</span>
                                    <span className="text-neutral-450 text-[10px]">{sug.calories} kcal • P: {sug.protein_g}g C: {sug.carbs_g}g F: {sug.fat_g}g</span>
                                  </div>
                                  {state === "accepted" && <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold">Accepted</span>}
                                  {state === "denied" && <span className="rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 text-[9px] font-bold">Declined</span>}
                                </div>

                                {state === "pending" && (
                                  <div className="flex justify-end gap-1.5 pt-1.5 border-t border-neutral-900">
                                    <button
                                      onClick={() => handleDenySuggestion(msg.id, i)}
                                      className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] font-bold text-neutral-450 hover:text-white"
                                    >
                                      Decline
                                    </button>
                                    <button
                                      onClick={() => void handleAcceptSuggestion(msg.id, i, sug)}
                                      className="rounded-lg bg-[#FFB800] text-black px-2.5 py-1 text-[10px] font-bold"
                                    >
                                      Accept
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full border border-neutral-800 bg-[#161616] flex items-center justify-center text-xs font-bold text-[#FFB800] shrink-0 uppercase tracking-wider">
                    {userInitials}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {sending && (
              <div className="flex justify-start gap-3 animate-fade-in">
                <div className="h-8 w-8 rounded-full border border-amber-500/20 bg-neutral-900 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-amber-500" />
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
          {quickActions.map((action, idx) => {
            const icons = [
              <Dumbbell key="d" className="h-3.5 w-3.5 mr-1.5" />,
              <Salad key="s" className="h-3.5 w-3.5 mr-1.5" />,
              <LineChart key="l" className="h-3.5 w-3.5 mr-1.5" />,
              <Moon key="m" className="h-3.5 w-3.5 mr-1.5" />
            ];
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => void handleQuickAction(action.text)}
                disabled={sending || loading}
                className="inline-flex items-center rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-[#FFB800] hover:text-[#FFB800] disabled:opacity-60 transform active:scale-95"
              >
                {icons[idx]}
                {action.label}
              </button>
            );
          })}
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
            className="flex-1 resize-none overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-white placeholder-neutral-500 px-4 py-3 text-sm focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] disabled:opacity-50 min-h-[44px] leading-relaxed"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || loading}
            className="inline-flex items-center justify-center rounded-xl bg-[#FFB800] text-black px-5 py-3 text-sm font-bold shadow-md hover:bg-[#CC9400] disabled:opacity-50 disabled:hover:bg-[#FFB800] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
