import React from "react";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto grid min-h-screen max-w-6xl md:grid-cols-[1.1fr_0.9fr]">
        <aside className="hidden items-center justify-center bg-gray-900 px-8 py-12 text-white md:flex">
          <div className="max-w-md space-y-6">
            <div className="inline-flex rounded-2xl bg-white px-4 py-3">
              <Logo variant="full" height={56} />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-gray-300">
                Smart training
              </p>
              <p className="text-2xl font-semibold leading-tight">
                Workouts, nutrition, and wearable intelligence in one place.
              </p>
              <p className="text-sm leading-6 text-gray-300">
                Build momentum with an AI coach, precise logs, and a smart tracker
                that keeps your sessions moving.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-6 py-10 sm:px-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900 dark:shadow-black/20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
