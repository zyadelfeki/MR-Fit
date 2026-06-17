"use client";

import { useState } from "react";
import { Dumbbell, Salad, Scale, Calendar, Zap, Flame, Sparkles } from "lucide-react";

interface IntervalStats {
  workouts: {
    count: number;
    total_sets: number;
    total_reps: number;
  };
  nutrition: {
    avg_calories: number;
    avg_protein: number;
    avg_carbs: number;
    avg_fat: number;
  };
  weight: {
    start_weight: number;
    current_weight: number;
    delta: number;
  };
  active_days: number;
}

interface ProgressStatsTabsProps {
  weekly: IntervalStats;
  monthly: IntervalStats;
  yearly: IntervalStats;
  goals: {
    calorie_goal: number;
    protein_goal: number;
    carb_goal: number;
    fat_goal: number;
  };
}

export default function ProgressStatsTabs({ weekly, monthly, yearly, goals }: ProgressStatsTabsProps) {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "yearly">("weekly");

  const stats = activeTab === "weekly" ? weekly : activeTab === "monthly" ? monthly : yearly;
  const label = activeTab === "weekly" ? "7 Days" : activeTab === "monthly" ? "30 Days" : "365 Days";

  const calorieGoal = goals?.calorie_goal || 2000;
  const proteinGoal = goals?.protein_goal || 150;
  const carbGoal = goals?.carb_goal || 250;
  const fatGoal = goals?.fat_goal || 65;

  const avgCalories = Number(stats.nutrition.avg_calories) || 0;
  const avgProtein = Number(stats.nutrition.avg_protein) || 0;
  const avgCarbs = Number(stats.nutrition.avg_carbs) || 0;
  const avgFat = Number(stats.nutrition.avg_fat) || 0;

  const calDeficit = calorieGoal - avgCalories;
  const hasNutritionLogs = avgCalories > 0;

  const delta = stats.weight.delta;
  const currentW = stats.weight.current_weight;
  const startW = stats.weight.start_weight;

  const daysInPeriod = activeTab === "weekly" ? 7 : activeTab === "monthly" ? 30 : 365;
  const calorieProgress = calorieGoal > 0 ? (avgCalories / calorieGoal) * 100 : 0;
  const proteinProgress = proteinGoal > 0 ? (avgProtein / proteinGoal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
        <div className="flex gap-2 p-1 bg-neutral-900/80 rounded-xl border border-neutral-850">
          {(["weekly", "monthly", "yearly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === t
                  ? "bg-[#FFB800] text-black shadow-md shadow-[#FFB800]/10"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {t === "weekly" ? "Weekly" : t === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-neutral-400">
          Summary for the last <span className="text-[#FFB800] font-bold">{label}</span>
        </span>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workouts */}
        <div className="group relative rounded-2xl border border-neutral-800 bg-[#161616] p-5 transition-all hover:border-[#FFB800]/40 hover:shadow-[0_4px_20px_rgba(255,184,0,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Workouts</span>
            <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-[#FFB800] group-hover:scale-110 transition-transform">
              <Dumbbell className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{stats.workouts.count}</span>
              <span className="text-xs text-neutral-500 font-medium">completed</span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-neutral-450 border-t border-neutral-850 pt-3">
              <div className="flex justify-between">
                <span>Total Sets:</span>
                <span className="font-bold text-white">{stats.workouts.total_sets}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Reps:</span>
                <span className="font-bold text-white">{stats.workouts.total_reps}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calories / Deficit */}
        <div className="group relative rounded-2xl border border-neutral-800 bg-[#161616] p-5 transition-all hover:border-[#FFB800]/40 hover:shadow-[0_4px_20px_rgba(255,184,0,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Nutrition Avg</span>
            <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-[#FFB800] group-hover:scale-110 transition-transform">
              <Salad className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            {!hasNutritionLogs ? (
              <div className="py-4 text-center">
                <span className="text-xs text-neutral-500">No logs in this period</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white">{Math.round(avgCalories)}</span>
                  <span className="text-xs text-neutral-550 font-medium">kcal/day</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-neutral-450 border-t border-neutral-850 pt-3">
                  <div className="flex justify-between">
                    <span>Deficit/Surplus:</span>
                    <span className={`font-bold ${calDeficit >= 0 ? "text-emerald-450" : "text-rose-450"}`}>
                      {calDeficit >= 0 ? `-${Math.round(calDeficit)} kcal (Deficit)` : `+${Math.round(-calDeficit)} kcal (Surplus)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protein Average:</span>
                    <span className="font-bold text-white">{Math.round(avgProtein)}g / {proteinGoal}g</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Weight Change */}
        <div className="group relative rounded-2xl border border-neutral-800 bg-[#161616] p-5 transition-all hover:border-[#FFB800]/40 hover:shadow-[0_4px_20px_rgba(255,184,0,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Weight Shift</span>
            <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-[#FFB800] group-hover:scale-110 transition-transform">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            {currentW === 0 || startW === 0 ? (
              <div className="py-4 text-center">
                <span className="text-xs text-neutral-550">No logs in this period</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold ${delta < 0 ? "text-emerald-450" : delta > 0 ? "text-rose-455" : "text-white"}`}>
                    {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">kg total</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-neutral-450 border-t border-neutral-850 pt-3">
                  <div className="flex justify-between">
                    <span>Starting Weight:</span>
                    <span className="font-semibold text-white">{startW.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latest Weight:</span>
                    <span className="font-semibold text-white">{currentW.toFixed(1)} kg</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active Days / Consistency */}
        <div className="group relative rounded-2xl border border-neutral-800 bg-[#161616] p-5 transition-all hover:border-[#FFB800]/40 hover:shadow-[0_4px_20px_rgba(255,184,0,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Consistency</span>
            <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-[#FFB800] group-hover:scale-110 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{stats.active_days}</span>
              <span className="text-xs text-neutral-500 font-medium">active days</span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-neutral-455 border-t border-neutral-850 pt-3">
              <div className="flex justify-between">
                <span>Active Ratio:</span>
                <span className="font-bold text-white">
                  {Math.round((stats.active_days / daysInPeriod) * 100)}% of period
                </span>
              </div>
              <div className="flex justify-between">
                <span>Period Days:</span>
                <span className="font-bold text-white">{daysInPeriod} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deficit / Macros Detailed Cards */}
      {hasNutritionLogs && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-[#161616] p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 mb-4 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-[#FFB800]" /> Calorie Deficit Progress
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-neutral-400 font-medium">
                <span>Average Intake: {Math.round(avgCalories)} kcal</span>
                <span>Daily Goal: {calorieGoal} kcal</span>
              </div>
              <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-neutral-850 p-[2px]">
                <div
                  className="bg-gradient-to-r from-amber-500 to-[#FFB800] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, calorieProgress)}%` }}
                />
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Your average daily intake is <span className="font-semibold text-white">{Math.round(calorieProgress)}%</span> of your target goal.
                {calDeficit > 0 ? (
                  <> You are maintaining a daily calorie deficit of <span className="font-bold text-emerald-450">{Math.round(calDeficit)} kcal</span>, which supports steady weight reduction.</>
                ) : calDeficit < 0 ? (
                  <> You are in a daily surplus of <span className="font-bold text-rose-455">{Math.round(-calDeficit)} kcal</span>, ideal for bulking or muscle reconstruction.</>
                ) : (
                  " You are exactly meeting your weight maintenance goals."
                )}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-[#161616] p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#FFB800]" /> Macronutrients Distribution
            </h3>
            <div className="space-y-3">
              {/* Protein */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-450 font-medium">Protein</span>
                  <span className="font-bold text-white">{Math.round(avgProtein)}g / {proteinGoal}g</span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-850 p-[1px]">
                  <div
                    className="bg-[#FFB800] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, proteinProgress)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-450 font-medium">Carbs</span>
                  <span className="font-bold text-white">{Math.round(avgCarbs)}g / {carbGoal}g</span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-850 p-[1px]">
                  <div
                    className="bg-neutral-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, carbGoal > 0 ? (avgCarbs / carbGoal) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-450 font-medium">Fat</span>
                  <span className="font-bold text-white">{Math.round(avgFat)}g / {fatGoal}g</span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-850 p-[1px]">
                  <div
                    className="bg-neutral-800 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, fatGoal > 0 ? (avgFat / fatGoal) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
