"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { showToast } from "@/lib/toast";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from "recharts";

type SleepLog = {
    date: string;
    hours: number;
    quality: "Excellent" | "Good" | "Fair" | "Poor";
};

const DEFAULT_HISTORY: SleepLog[] = [
    { date: "Jun 09", hours: 7.2, quality: "Good" },
    { date: "Jun 10", hours: 6.5, quality: "Fair" },
    { date: "Jun 11", hours: 8.0, quality: "Excellent" },
    { date: "Jun 12", hours: 7.5, quality: "Good" },
    { date: "Jun 13", hours: 5.8, quality: "Poor" },
    { date: "Jun 14", hours: 8.2, quality: "Excellent" },
];

export default function RecoveryPage() {
    const [history, setHistory] = useState<SleepLog[]>(DEFAULT_HISTORY);
    const [hours, setHours] = useState<number>(7.5);
    const [quality, setQuality] = useState<SleepLog["quality"]>("Good");
    const [recoveryScore, setRecoveryScore] = useState<number>(85);

    useEffect(() => {
        const stored = localStorage.getItem("mrfit_sleep_history");
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                // fallback
            }
        }
    }, []);

    useEffect(() => {
        // Calculate recovery score based on the last logged sleep
        const lastSleep = history[history.length - 1];
        if (lastSleep) {
            const sleepScore = Math.min((lastSleep.hours / 8.0) * 100, 100);
            const weights: Record<string, number> = { Excellent: 100, Good: 80, Fair: 50, Poor: 30 };
            const qualityWeight = weights[lastSleep.quality] || 80;
            const calculated = Math.round(sleepScore * 0.6 + qualityWeight * 0.4);
            setRecoveryScore(calculated);
        }
    }, [history]);

    const handleLogSleep = (e: React.FormEvent) => {
        e.preventDefault();
        const dateObj = new Date();
        const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        
        const newLog: SleepLog = { date: dateStr, hours, quality };
        const updated = [...history.slice(1), newLog];
        
        setHistory(updated);
        localStorage.setItem("mrfit_sleep_history", JSON.stringify(updated));
        showToast("💤 Sleep logged successfully", "success");
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        ← Back to dashboard
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">AI Recovery Engine</h1>
                        <p className="mt-2 text-sm text-neutral-400">
                            Monitor sleep cycles and optimize training recovery
                        </p>
                    </div>
                </div>
                <div className="rounded-full border border-[#FFB800]/20 bg-[#FFB800]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#FFB800]">
                    AI Active
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Log Sleep Form & Recovery Dial */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Recovery score dial */}
                    <div className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm flex flex-col items-center justify-center text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">Recovery Status</p>
                        
                        <div className="relative h-36 w-36 flex items-center justify-center">
                            {/* Circular Progress Ring */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="#262626" strokeWidth="8" fill="transparent" />
                                <circle cx="50" cy="50" r="40" 
                                    className={`${scoreColor(recoveryScore)} transition-all duration-500 ease-out`}
                                    strokeWidth="8" 
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - (251.2 * recoveryScore) / 100}
                                    strokeLinecap="round" 
                                    fill="transparent" 
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-black font-heading text-white">{recoveryScore}%</span>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold mt-1">Ready</span>
                            </div>
                        </div>

                        <p className="mt-6 text-sm text-neutral-300">
                            {recoveryScore >= 80 ? "Your body is fully primed for high-intensity training. Push for new personal records today!" : 
                             recoveryScore >= 60 ? "Moderate recovery level. Proceed with medium training load and focus on form." : 
                             "Low recovery level. Consider active rest, mobility workouts, and sleep focus."}
                        </p>
                    </div>

                    {/* Sleep logger form */}
                    <form onSubmit={handleLogSleep} className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#FFB800]">Log Last Night&apos;s Sleep</p>
                        
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-neutral-300">Sleep Duration (Hours)</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="4" max="12" step="0.5" value={hours} onChange={(e) => setHours(Number(e.target.value))}
                                    className="flex-1 accent-[#FFB800] bg-neutral-800 rounded-lg h-2" />
                                <span className="text-sm font-bold text-white w-10 text-right">{hours}h</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-neutral-300">Subjective Sleep Quality</label>
                            <select value={quality} onChange={(e) => setQuality(e.target.value as SleepLog["quality"])}
                                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFB800]">
                                <option value="Excellent">Excellent (Deep, uninterrupted)</option>
                                <option value="Good">Good (Refreshed, minor waking)</option>
                                <option value="Fair">Fair (Slightly tired, restless)</option>
                                <option value="Poor">Poor (Exhausted, fitful sleep)</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-primary w-full py-2.5 text-black bg-[#FFB800] justify-center rounded-xl font-bold text-sm">
                            💾 Log Sleep Entry
                        </button>
                    </form>
                </div>

                {/* Sleep chart and AI tips */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Sleep trend chart card */}
                    <div className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">Sleep Trend (Last 6 Entries)</p>
                        
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FFB800" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#FFB800" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#525252" fontSize={11} tickLine={false} />
                                    <YAxis domain={[4, 10]} stroke="#525252" fontSize={11} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: "#161616", borderColor: "#262626", borderRadius: "12px", color: "#FFF" }} 
                                        labelStyle={{ color: "#FFB800", fontWeight: "bold" }}
                                    />
                                    <Area type="monotone" dataKey="hours" stroke="#FFB800" strokeWidth={2.5} fillOpacity={1} fill="url(#sleepGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AI Coach tips */}
                    <div className="rounded-3xl border border-neutral-800 bg-[#161616] p-6 shadow-sm space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Recovery recommendations</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
                                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                                    <span>🌙</span> Circadian Optimization
                                </h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    Maintain a consistent sleep schedule (+/- 30 mins) to optimize natural cortisol and growth hormone production curves.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
                                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                                    <span>🧘</span> CNS Recovery Load
                                </h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    On low sleep days (less than 6.5 hours), restrict heavy barbell compound movements (deadlifts, squats) to avoid spinal stabilizer fatigue.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500";
    if (score >= 60) return "text-[#FFB800] stroke-[#FFB800]";
    return "text-red-500 stroke-red-500";
};

