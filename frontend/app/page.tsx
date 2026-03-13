import type { Metadata } from "next";
import Link from "next/link";

const subheadline =
  "Personalized workouts, nutrition tracking, and an AI coach that actually knows your training history - all running locally on your machine.";

export const metadata: Metadata = {
  title: "MR-Fit — AI Fitness Companion",
  description: subheadline,
};

const features = [
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
      <section className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start px-6 py-20 md:px-10 md:py-28">
          <p className="mb-4 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium tracking-wide">
            MR-Fit
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Your AI-Powered Fitness Companion
          </h1>
          <p className="mt-6 max-w-3xl text-base text-indigo-100 sm:text-lg">
            {subheadline}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/80 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="text-2xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
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
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
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
        <p>MR-Fit © 2026 — Open Source Fitness Platform</p>
        <div className="flex items-center gap-4">
          <Link href="/signup" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Sign up
          </Link>
          <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Login
          </Link>
        </div>
      </footer>
    </main>
  );
}
