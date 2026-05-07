"use client";

import Link from "next/link";

const FREE_FEATURES = [
  "Workout logging",
  "Exercise library",
  "Smart Tracker",
  "Progress charts",
  "Nutrition tracking",
  "Profile & goals",
];

const PRO_FEATURES = [
  "Everything in Free",
  "AI Coach (powered by local LLM)",
  "Wearable device sync",
  "HRV & sleep insights",
  "Advanced analytics",
  "Priority support",
];

export default function UpgradePage() {
  return (
    <div className="mx-auto max-w-3xl py-10 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Choose your plan</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Start free. Upgrade when you&apos;re ready.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              Current plan
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Free</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white">
            $0
            <span className="text-base font-normal text-gray-400">/mo</span>
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Everything you need to get started.</p>

          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              You&apos;re on this plan
            </Link>
          </div>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 dark:bg-gray-800">
          {/* Popular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white">
              ⚡ Most Popular
            </span>
          </div>

          <div className="mb-4">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              Pro
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pro</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white">
            $9
            <span className="text-base font-normal text-gray-400">/mo</span>
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">For serious athletes and fitness enthusiasts.</p>

          <ul className="mt-6 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg className="h-4 w-4 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <button
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              onClick={() => alert("Payment integration coming soon!")}
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        Cancel any time. No hidden fees.
      </p>
    </div>
  );
}
