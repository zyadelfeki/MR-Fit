"use client";

import { useEffect, useState } from "react";

type StatItemProps = {
  target: number;
  label: string;
  suffix?: string;
  duration?: number;
};

function CountUpStat({ target, label, suffix = "", duration = 1500 }: StatItemProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-3xl sm:text-4xl font-extrabold font-heading text-[#FFB800] tracking-tight">
        {count}{suffix}
      </span>
      <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </span>
    </div>
  );
}

export default function AnimatedStats() {
  return (
    <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto border-t border-neutral-800 pt-10">
      <CountUpStat target={6} label="Core Modules" />
      
      {/* AI Pulse Stat */}
      <div className="flex flex-col items-center gap-0.5 animate-pulse">
        <span 
          className="text-3xl sm:text-4xl font-extrabold font-heading text-[#FFB800] tracking-tight"
          style={{ textShadow: "0 0 12px rgba(255,184,0,0.4)" }}
        >
          AI-Powered
        </span>
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Local Coach
        </span>
      </div>

      <CountUpStat target={100} label="Private & Free" suffix="%" />
    </div>
  );
}
