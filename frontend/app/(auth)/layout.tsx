import React from "react";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto grid min-h-screen max-w-6xl md:grid-cols-[1.1fr_0.9fr]">

        {/* Brand Panel — desktop only */}
        <aside className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-10 py-16 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 50% 80%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

          <div className="relative z-10 max-w-sm space-y-8">
            {/* Logo */}
            <div className="inline-flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2.5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="MR-Fit logo" className="text-white">
                  <circle cx="4" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="20" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
                  <line x1="6.5" y1="12" x2="17.5" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="8" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="16" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight">MR-Fit</span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-200">
                Smart Training
              </p>
              <p className="text-2xl font-semibold leading-snug">
                Workouts, nutrition, and AI coaching in one place.
              </p>
              <p className="text-sm leading-6 text-indigo-100">
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
                <li key={item} className="flex items-center gap-3 text-sm text-indigo-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-green-300">
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
            {/* Mobile logo */}
            <div className="mb-6 flex justify-center md:hidden">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-indigo-600">
                  <circle cx="4" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="20" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
                  <line x1="6.5" y1="12" x2="17.5" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="8" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="16" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="text-xl font-bold text-gray-900 dark:text-white">MR-Fit</span>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
