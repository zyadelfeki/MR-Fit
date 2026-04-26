import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "MR.FIT — AI Fitness Companion",
  description:
    "Personalized workouts, nutrition tracking, and an AI coach that knows your training history — all running locally on your machine.",
};

const features = [
  {
    icon: "🏋️",
    title: "Workout Tracking",
    description:
      "Log sets, reps, and weight. Track every session with detailed exercise history and automatic PR detection.",
  },
  {
    icon: "🥗",
    title: "Nutrition Logging",
    description:
      "Search 3M+ foods via Open Food Facts. Track calories, protein, carbs, and fat against your personal goals.",
  },
  {
    icon: "🤖",
    title: "AI Coach",
    description:
      "Powered by a local LLM. Get personalized advice based on YOUR actual workout and nutrition data.",
  },
  {
    icon: "📊",
    title: "Progress Charts",
    description:
      "Visualise your weight trend, workout heatmap, volume over time, and personal records.",
  },
  {
    icon: "🗂",
    title: "Workout Templates",
    description:
      "Create reusable workout plans and start a session in one tap — no rebuilding from scratch.",
  },
  {
    icon: "⌚",
    title: "Smart Exercise Tracker",
    description:
      "Automatically detects your exercise type and counts reps from wrist-worn IMU data. 100% accuracy.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your profile",
    description:
      "Answer a few questions about your goals and fitness level to personalise the experience.",
  },
  {
    number: "02",
    title: "Log your activity",
    description:
      "Track workouts and meals with a fast, intuitive interface designed for daily use.",
  },
  {
    number: "03",
    title: "Get AI insights",
    description:
      "Your AI coach analyses your real data and gives targeted, actionable advice.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:px-10">
          <div className="inline-flex rounded-lg bg-gray-900 px-3 py-1.5 dark:bg-white">
            <Logo variant="full" height={32} />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center md:px-10 md:py-28">
          {/* Pill badge */}
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            🏋️ MR-Fit
          </span>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            Your AI&#8209;Powered{" "}
            <span className="text-indigo-600 dark:text-indigo-400">Fitness Coach</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base text-gray-600 dark:text-gray-300 sm:text-lg">
            Track workouts, monitor nutrition, and get personalised AI
            coaching — all running locally on your machine. No cloud.
            No subscription. No excuses.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="btn-primary px-6 py-2.5 text-sm">
              Start for Free
            </Link>
            <Link
              href="/login"
              className="btn-secondary px-6 py-2.5 text-sm"
            >
              Sign In
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            {[
              ["6", "Core Modules"],
              ["AI-Powered", "Local Coach"],
              ["100%", "Private & Free"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ML Feature Callout ──────────────────────────────── */}
      <section className="border-y border-gray-200 bg-gray-950 py-12 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Graduation Project · ML Feature
              </p>
              <h2 className="max-w-xl text-2xl font-bold text-white md:text-3xl">
                Automatically detects your exercise and counts your reps.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-300">
                Powered by a Random Forest model trained on 9,009 wrist IMU
                samples. Achieves{" "}
                <strong className="text-white">100% classification accuracy</strong>
                {" "}and{" "}
                <strong className="text-white">MAE &lt; 1 rep/set</strong> across
                5 exercise types.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {[
                "📊 9,009 samples",
                "🎯 5 exercise types",
                "⌚ Wrist IMU",
                "🌳 Random Forest",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────── */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="mb-12 max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Everything you need to reach your goals
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Built for athletes and beginners who want practical tools without
              subscriptions, lock-in, or cloud complexity.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="card card-hover rounded-2xl p-6 transition hover:-translate-y-0.5"
              >
                <div className="mb-3 text-3xl" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section className="border-t border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Simple. Powerful. Yours.
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Up and running in three steps.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-gray-200 bg-gray-50 p-8 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-4 text-5xl font-extrabold text-indigo-100 dark:text-indigo-900/60">
                  {step.number}
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to train smarter?
          </h2>
          <p className="mt-3 text-indigo-200">
            Free forever. No cloud account required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-500 dark:text-gray-400 md:flex-row md:px-10">
          <p>MR.FIT © 2026 — Open Source Fitness Platform</p>
          <div className="flex items-center gap-4">
            <Link href="/signup" className="transition hover:text-gray-900 dark:hover:text-white">Sign up</Link>
            <Link href="/login" className="transition hover:text-gray-900 dark:hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
