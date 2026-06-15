import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import AnimatedStats from "@/components/AnimatedStats";
import RevealOnScroll from "@/components/RevealOnScroll";
import {
  Dumbbell,
  Salad,
  Bot,
  LineChart,
  FolderHeart,
  Watch,
  Cpu,
  Target,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "MR.FIT — AI Fitness Companion",
  description:
    "Personalized workouts, nutrition tracking, and an AI coach that knows your training history — all running locally on your machine.",
};

const features = [
  {
    icon: <Dumbbell className="h-6 w-6 text-amber-500" />,
    title: "Workout Tracking",
    description:
      "Log sets, reps, and weight. Track every session with detailed exercise history and automatic PR detection.",
  },
  {
    icon: <Salad className="h-6 w-6 text-amber-500" />,
    title: "Nutrition Logging",
    description:
      "Search 3M+ foods via Open Food Facts. Track calories, protein, carbs, and fat against your personal goals.",
  },
  {
    icon: <Bot className="h-6 w-6 text-amber-500" />,
    title: "AI Coach",
    description:
      "Powered by a local LLM. Get personalized advice based on YOUR actual workout and nutrition data.",
  },
  {
    icon: <LineChart className="h-6 w-6 text-amber-500" />,
    title: "Progress Charts",
    description:
      "Visualise your weight trend, workout heatmap, volume over time, and personal records.",
  },
  {
    icon: <FolderHeart className="h-6 w-6 text-amber-500" />,
    title: "Workout Templates",
    description:
      "Create reusable workout plans and start a session in one tap — no rebuilding from scratch.",
  },
  {
    icon: <Watch className="h-6 w-6 text-amber-500" />,
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <div className="inline-flex rounded-lg bg-gray-950 px-3.5 py-2 dark:bg-transparent dark:px-0 dark:py-0 transition-all">
            <Logo variant="full" height={44} />
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
              className="btn-primary text-sm shadow-md hover:shadow-lg transition-all"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30 dark:from-gray-950 dark:via-gray-950 dark:to-amber-950/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center md:px-10 md:py-28">
          {/* Pill badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300">
            <Dumbbell className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> MR-Fit Platform
          </span>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            Your AI&#8209;Powered{" "}
            <span className="text-amber-500 drop-shadow-sm">Fitness Coach</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base text-gray-600 dark:text-gray-300 sm:text-lg">
            Track workouts, monitor nutrition, and get personalised AI
            coaching — all running locally on your machine. No cloud.
            No subscription. No excuses.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="btn-primary px-6 py-2.5 text-sm shadow-lg hover:shadow-xl transition-all">
              Start for Free
            </Link>
            <Link
              href="/login"
              className="btn-secondary px-6 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Animated Stats Row */}
          <RevealOnScroll className="w-full mt-6">
            <AnimatedStats />
          </RevealOnScroll>
        </div>
      </section>

      {/* ── ML Feature Callout ──────────────────────────────── */}
      <section className="border-y border-gray-200 bg-gray-950 py-12 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <RevealOnScroll className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
                Graduation Project · ML Feature
              </p>
              <h2 className="max-w-xl text-2xl font-bold text-white md:text-3xl font-heading">
                AUTOMATICALLY DETECTS YOUR EXERCISE AND COUNTS YOUR REPS.
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
                { label: "9,009 samples", icon: <LineChart className="h-3.5 w-3.5 text-amber-400" /> },
                { label: "5 exercise types", icon: <Target className="h-3.5 w-3.5 text-amber-400" /> },
                { label: "Wrist IMU", icon: <Watch className="h-3.5 w-3.5 text-amber-400" /> },
                { label: "Random Forest", icon: <Cpu className="h-3.5 w-3.5 text-amber-400" /> },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
                >
                  {tag.icon}
                  {tag.label}
                </span>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────── */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <RevealOnScroll className="mb-12 max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-heading">
              EVERYTHING YOU NEED TO REACH YOUR GOALS
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Built for athletes and beginners who want practical tools without
              subscriptions, lock-in, or cloud complexity.
            </p>
          </RevealOnScroll>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <RevealOnScroll
                key={feature.title}
                delayClass={`stagger-${(idx % 3) + 1}`}
                className="h-full"
              >
                <article
                  className="card card-premium-glow rounded-2xl p-6 bg-white dark:bg-gray-950 border border-gray-100 dark:border-neutral-900 shadow-sm h-full flex flex-col"
                >
                  <div className="mb-4 inline-flex p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl w-fit" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-gray-900 dark:text-white font-heading">
                    {feature.title.toUpperCase()}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 flex-1">
                    {feature.description}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section className="border-t border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <RevealOnScroll className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-heading">
              SIMPLE. POWERFUL. YOURS.
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Up and running in three steps.
            </p>
          </RevealOnScroll>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, idx) => (
              <RevealOnScroll
                key={step.number}
                delayClass={`stagger-${idx + 1}`}
              >
                <div
                  className="relative rounded-2xl border border-gray-200 bg-gray-50 p-8 dark:border-neutral-900 dark:bg-gray-900/40 card-premium-glow"
                >
                  <div className="mb-4 text-5xl font-extrabold text-amber-100 dark:text-amber-900/20 font-heading">
                    {step.number}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white font-heading">
                    {step.title.toUpperCase()}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-600 py-16 text-gray-950 dark:text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="mx-auto max-w-2xl px-6 text-center relative z-10">
          <RevealOnScroll>
            <h2 className="text-3xl font-bold font-heading">
              READY TO TRAIN SMARTER?
            </h2>
            <p className="mt-3 opacity-90">
              Free forever. No cloud account required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gray-950 text-white dark:bg-white dark:text-gray-950 px-8 py-3 text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </RevealOnScroll>
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
