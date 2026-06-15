import React from "react";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto grid min-h-screen max-w-6xl md:grid-cols-[1.1fr_0.9fr]">

        {/* Brand Panel — desktop only */}
        {/* Brand Panel — desktop only */}
        <aside className="hidden md:flex flex-col items-center justify-center bg-[#0D0D0D] border-r border-[#262626] px-10 py-16 text-white relative overflow-hidden">
          {/* Subtle gold grid lines pattern */}
          <div 
            className="absolute inset-0 opacity-[0.04]" 
            style={{ 
              backgroundImage: "linear-gradient(to right, #FFB800 1px, transparent 1px), linear-gradient(to bottom, #FFB800 1px, transparent 1px)", 
              backgroundSize: "40px 40px" 
            }} 
          />

          <div className="relative z-10 max-w-sm space-y-8">
            {/* Logo */}
            <Logo variant="full" height={44} />

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#FFB800]">
                TRAIN SMARTER. STRIKE HARDER.
              </p>
              <p className="text-2xl font-semibold leading-snug font-heading">
                WORKOUTS, NUTRITION, AND AI COACHING IN ONE PLACE.
              </p>
              <p className="text-sm leading-6 text-neutral-400">
                Build momentum with an AI coach, precise logs, and progress
                analytics that keep your sessions moving.
              </p>
            </div>

            {/* Feature bullets */}
            <ul className="space-y-3">
              {[
                "Track workouts & exercises",
                "Log nutrition with 3M+ foods",
                "AI coach powered by local LLM",
                "Progress charts & analytics",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-neutral-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#FFB800]">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Form Panel */}
        <main className="flex items-center justify-center px-6 py-10 sm:px-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900 dark:shadow-black/20">
            <div className="mb-6 flex justify-center md:hidden">
              <div className="inline-flex rounded-lg bg-gray-950 px-3 py-1.5 dark:bg-transparent dark:px-0 dark:py-0">
                <Logo variant="full" height={36} />
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
