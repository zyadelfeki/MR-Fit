import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

const subheadline =
  "Personalized workouts, nutrition tracking, and an AI coach that actually knows your training history - all running locally on your machine.";

export const metadata: Metadata = {
  title: "MR.FIT — AI Fitness Companion",
  description: subheadline,
};

type Feature = {
  icon: string;
  title: string;
  description: string;
  featured?: boolean;
};

const features: Feature[] = [
  {
    icon: "🏋️",
    title: "Smart Workout Tracking",
    description: "Log sets, reps, and weight. Track every PR automatically.",
  },
  {
    icon: "🤖",
    title: "AI Coach",
    description:
      "Ask anything. Your coach knows your workout history and adapts to you.",
  },
  {
    icon: "🥗",
    title: "Nutrition Tracker",
    description:
      "Log meals and track macros. No food database subscription needed.",
  },
  {
    icon: "📊",
    title: "Progress Analytics",
    description:
      "Weekly volume charts, personal records, and streak tracking.",
  },
  {
    icon: "🔒",
    title: "100% Private",
    description:
      "Everything runs locally. Your data never leaves your machine.",
  },
  {
    icon: "⚡",
    title: "Instant Setup",
    description:
      "No cloud accounts. No API keys. Just PostgreSQL and Ollama.",
  },
  {
    icon: "⌚",
    title: "Smart Exercise Tracker",
    description:
      "Detect exercises automatically and count reps from wrist IMU data.",
    featured: true,
  },
];

const steps = [
  {
    title: "Create your account & complete onboarding",
    description: "Set your goal and fitness level.",
  },
  {
    title: "Log workouts and meals",
    description: "Track your training and nutrition daily.",
  },
  {
    title: "Chat with your AI Coach",
    description:
      "Get personalized recommendations based on your actual data.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="w-full bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 text-white">
        <div className="mx-auto max-w-6xl px-6 py-6 md:px-10">
          <header className="flex items-center justify-between gap-4">
            <Logo variant="full" height={44} />
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-200 transition hover:text-white">
                Sign in
              </Link>
              <Link href="/signup" className="btn-brand bg-white text-gray-900 hover:bg-gray-100">
                Get started
              </Link>
            </div>
          </header>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col items-start px-6 py-16 md:px-10 md:py-24">
          <div className="mb-8 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <Logo variant="full" height={64} />
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Your AI-Powered Fitness Companion
          </h1>
          <p className="mt-6 max-w-3xl text-base text-gray-200 sm:text-lg">
            {subheadline}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/signup" className="btn-brand bg-white text-gray-900 hover:bg-gray-100">
              Get Started Free
            </Link>
            <Link href="/login" className="btn-brand-outline border-white/80 text-white hover:bg-white hover:text-gray-900">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <h2 className="text-3xl font-bold">Everything you need to train smarter</h2>
        <p className="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">
          Built for athletes and beginners who want practical tools without
          subscriptions, lock-in, or cloud complexity.
        </p>

        <div className="mt-10 rounded-2xl border border-gray-800 border-l-4 border-l-emerald-400 bg-gray-900 p-8 text-white shadow-xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Smart Exercise Tracker
              </p>
              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                Automatically detects your exercise and counts your reps.
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-200 sm:text-base">
                100% classification accuracy • MAE &lt; 1 rep/set • Powered by a
                Random Forest model and wrist-worn IMU data.
              </p>
            </div>
            <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-gray-950">
              New
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-200">
            <span className="rounded-full border border-white/10 px-3 py-1">📊 9,009 training samples</span>
            <span className="rounded-full border border-white/10 px-3 py-1">🎯 5 exercise types</span>
            <span className="rounded-full border border-white/10 px-3 py-1">⌚ Wrist-worn IMU</span>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                feature.featured
                  ? "border-gray-900 bg-gray-900 text-white dark:border-gray-700 dark:bg-gray-950"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              <div className="text-2xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
              <p className={`mt-2 text-sm ${feature.featured ? "text-gray-200" : "text-gray-600 dark:text-gray-300"}`}>
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white/80 py-16 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <h2 className="text-3xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-gray-600 dark:text-gray-400 md:flex-row md:items-center md:justify-between md:px-10">
        <p>MR.FIT © 2026 — Open Source Fitness Platform</p>
        <div className="flex items-center gap-4">
          <Link href="/signup" className="hover:text-gray-900 dark:hover:text-white">
            Sign up
          </Link>
          <Link href="/login" className="hover:text-gray-900 dark:hover:text-white">
            Login
          </Link>
        </div>
      </footer>
    </main>
  );
}
