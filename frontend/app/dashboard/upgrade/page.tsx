"use client";

import Link from "next/link";
import { Zap, Check } from "lucide-react";
import RevealOnScroll from "@/components/RevealOnScroll";

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
        <h1 className="text-3xl font-black text-white font-heading">Choose your plan</h1>
        <p className="mt-2 text-neutral-400 text-sm">
          Start free. Upgrade when you&apos;re ready.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-2xl border border-neutral-800 bg-[#161616] p-8 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <span className="rounded-full bg-neutral-900 border border-neutral-850 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Current plan
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-heading">Free</h2>
            <p className="mt-2 text-4xl font-black text-white font-heading">
              $0
              <span className="text-base font-normal text-neutral-500">/mo</span>
            </p>
            <p className="mt-2 text-xs text-neutral-400">Everything you need to get started.</p>

            <ul className="mt-6 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center rounded-xl border border-neutral-850 bg-neutral-900 px-4 py-3 text-sm font-semibold text-neutral-305 transition hover:bg-neutral-850"
            >
              You&apos;re on this plan
            </Link>
          </div>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border-2 border-[#FFB800] bg-[#161616] p-8 flex flex-col justify-between shadow-[0_0_25px_rgba(255,184,0,0.1)]">
          {/* Popular badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-[#FFB800] px-4 py-1 text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 fill-black text-black" /> Pro Choice
            </span>
          </div>

          <div>
            <div className="mb-4 mt-2">
              <span className="rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FFB800]">
                Pro
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-heading">Pro Upgrade</h2>
            <p className="mt-2 text-4xl font-black text-white font-heading">
              $9
              <span className="text-base font-normal text-neutral-500">/mo</span>
            </p>
            <p className="mt-2 text-xs text-neutral-400">For serious athletes and fitness enthusiasts.</p>

            <ul className="mt-6 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                  <Check className="h-4 w-4 shrink-0 text-[#FFB800]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <button
              className="flex w-full items-center justify-center rounded-xl bg-[#FFB800] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#e0a200] hover:shadow-[0_0_15px_rgba(255,184,0,0.25)]"
              onClick={() => alert("Payment integration coming soon!")}
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-neutral-500">
        Cancel any time. No hidden fees.
      </p>
    </div>
  );
}
