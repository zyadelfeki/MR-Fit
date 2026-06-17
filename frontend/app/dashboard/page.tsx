import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { withDb } from "@/lib/db";
import Link from "next/link";
import MagicInput from "@/components/MagicInput";
import {
  Dumbbell,
  Salad,
  Bot,
  Award,
  ChevronRight,
  TrendingUp,
  Scale,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Dashboard | MR.FIT",
  description: "Your personal fitness overview",
};

const DAILY_QUOTES = [
  "Consistency beats intensity when intensity is occasional.",
  "Small progress each day compounds into big results.",
  "Train with purpose, recover with discipline.",
  "You do not need perfect days, only persistent ones.",
  "Fuel your body for the goals you want tomorrow.",
  "Strong habits build a stronger body.",
  "Your pace is valid. Keep moving forward.",
  "Every rep is a vote for the person you are becoming.",
  "Discipline is self-respect in action.",
  "Progress is earned in ordinary days.",
  "Show up first, motivation follows.",
  "Recovery is part of training, not a break from it.",
];

function timeAgo(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return `${Math.max(1, Math.floor(diffMs / 60000))}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function formatActivityDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays === 0) return `Today ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const calorieGoal = 2000;
  const proteinGoal = 150;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);

  // Run all DB queries on a single fresh connection with auto-retry
  const {
    profile,
    displayWorkouts,
    caloriesToday,
    proteinToday,
    activityDates,
    recentActivity,
  } = await withDb(async (client) => {
    const profileRes = await client.query(
      `SELECT display_name, weight_kg, fitness_goal FROM profiles WHERE user_id = $1`,
      [userId]
    );
    const _profile = profileRes.rows[0] ?? null;

    const workoutsRes = await client.query(
      `SELECT COUNT(*) AS count FROM workout_logs WHERE user_id = $1 AND logged_at >= $2`,
      [userId, startOfWeek.toISOString()]
    );
    const _displayWorkouts = Number(workoutsRes.rows[0]?.count ?? 0);

    const nutritionRes = await client.query(
      `SELECT
         COALESCE(SUM(calories), 0)  AS total_calories,
         COALESCE(SUM(protein_g), 0) AS total_protein
       FROM nutrition_logs
       WHERE user_id = $1
         AND DATE(logged_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC')`,
      [userId]
    );
    const _caloriesToday = Number(nutritionRes.rows[0]?.total_calories ?? 0);
    const _proteinToday  = Number(nutritionRes.rows[0]?.total_protein  ?? 0);

    const wDatesRes = await client.query(
      `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') AS day FROM workout_logs WHERE user_id=$1 AND logged_at>=$2`,
      [userId, thirtyAgo.toISOString()]
    );
    const nDatesRes = await client.query(
      `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') AS day FROM nutrition_logs WHERE user_id=$1 AND logged_at>=$2`,
      [userId, thirtyAgo.toISOString()]
    );
    const _activityDates = new Set<string>();
    [...wDatesRes.rows, ...nDatesRes.rows].forEach((r) => {
      if (r.day) _activityDates.add(new Date(r.day).toISOString().split("T")[0]);
    });

    const activityRes = await client.query(
      `(SELECT 'workout' AS type, COALESCE(w.title, e.name, 'Workout') AS label, wl.logged_at
         FROM workout_logs wl
         LEFT JOIN workouts w ON w.id = wl.workout_id
         LEFT JOIN exercises e ON e.id = wl.exercise_id
         WHERE wl.user_id = $1
         ORDER BY wl.logged_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'nutrition' AS type, nl.food_name AS label, nl.logged_at
         FROM nutrition_logs nl WHERE nl.user_id = $1
         ORDER BY nl.logged_at DESC LIMIT 5)
       ORDER BY logged_at DESC LIMIT 6`,
      [userId]
    );

    return {
      profile: _profile,
      displayWorkouts: _displayWorkouts,
      caloriesToday: _caloriesToday,
      proteinToday: _proteinToday,
      activityDates: _activityDates,
      recentActivity: activityRes.rows as Array<{
        type: "workout" | "nutrition";
        label: string;
        logged_at: string;
      }>,
    };
  });

  if (!profile) redirect("/onboarding");

  let streak = 0;
  const checkDate = new Date(); checkDate.setUTCHours(0, 0, 0, 0);
  if (!activityDates.has(checkDate.toISOString().split("T")[0]))
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  while (activityDates.has(checkDate.toISOString().split("T")[0])) {
    streak++; checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  const quoteIndex =
    (new Date().getDate() + new Date().getMonth() * 31) % DAILY_QUOTES.length;

  const caloriesPct = Math.min(Math.round((caloriesToday / (calorieGoal || 1)) * 100), 100);
  const proteinPct  = Math.min(Math.round((proteinToday  / (proteinGoal  || 1)) * 100), 100);
  const workoutPct  = Math.min(Math.round((displayWorkouts / 4) * 100), 100);

  const statCards = [
    {
      label: "Workouts This Week",
      value: String(displayWorkouts),
      sub: displayWorkouts > 0 ? `${displayWorkouts} session${displayWorkouts === 1 ? "" : "s"} logged` : "No sessions yet",
      icon: <Dumbbell className="h-5 w-5" />,
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
      valueColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Calories Today",
      value: caloriesToday > 0 ? `${caloriesToday}` : "0",
      sub: `Goal: ${calorieGoal} kcal`,
      icon: <Zap className="h-5 w-5" />,
      iconBg: "bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-400",
      valueColor: "text-orange-500 dark:text-orange-400",
    },
    {
      label: "Current Weight",
      value: profile.weight_kg ? `${profile.weight_kg}` : "—",
      sub: profile.weight_kg ? "kg" : "Not set",
      icon: <Scale className="h-5 w-5" />,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Active Streak",
      value: String(streak),
      sub: streak > 2 ? "Keep it up!" : streak > 0 ? "Building momentum" : "Start today!",
      icon: <TrendingUp className="h-5 w-5" />,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 text-white">
      {/* Daily quote */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 px-5 py-3.5 text-xs tracking-wider uppercase text-neutral-400 font-heading select-none flex flex-wrap items-center gap-2">
        <span className="text-amber-500 font-bold">MOTIVATION:</span>
        <span className="italic font-medium">&ldquo;{DAILY_QUOTES[quoteIndex]}&rdquo;</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title text-2xl font-bold tracking-tight">
          Welcome back, {profile.display_name?.split(" ")[0] ?? "there"}
        </h1>
        <Link href="/dashboard/workouts/new" className="btn-primary text-sm hidden sm:inline-flex items-center gap-1.5 shadow-md">
          <Dumbbell className="h-4 w-4" /> Log Workout
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="card rounded-2xl p-5 border border-neutral-900 bg-neutral-950/30 hover:border-neutral-800 transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                {card.icon}
              </div>
            </div>
            <p className={`mt-3 text-2xl font-bold font-heading tabular-nums ${card.valueColor}`}>
              {card.value}
              {card.label === "Calories Today" && card.value !== "0" && (
                <span className="ml-1 text-sm font-normal text-gray-400">kcal</span>
              )}
              {card.label === "Active Streak" && (
                <span className="ml-1 text-sm font-normal text-gray-400">{streak === 1 ? "day" : "days"}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-400">{card.label.toUpperCase()}</p>
            <p className="mt-1 text-[11px] text-neutral-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Today at a Glance & Magic Input */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MagicInput />
        </div>
        <div className="lg:col-span-1">
          <div className="card rounded-2xl p-6 border border-neutral-900 bg-neutral-950/30 h-full flex flex-col justify-between">
            <div>
              <h2 className="section-title mb-5 font-heading uppercase text-sm tracking-widest text-neutral-400">Today at a Glance</h2>
              <div className="space-y-4">
                {[
                  { label: "Calories", current: caloriesToday, goal: calorieGoal, pct: caloriesPct, unit: "kcal", color: "bg-amber-500" },
                  { label: "Protein",  current: proteinToday,  goal: proteinGoal,  pct: proteinPct,  unit: "g",    color: "bg-emerald-500" },
                  { label: "Weekly Workouts", current: displayWorkouts, goal: 4, pct: workoutPct, unit: "/ 4 sessions", color: "bg-indigo-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-neutral-300">{item.label}</span>
                      <span className="tabular-nums text-neutral-400 text-xs">
                        {item.label === "Weekly Workouts"
                          ? `${item.current} ${item.unit}`
                          : `${item.current} / ${item.goal} ${item.unit}`}
                      </span>
                    </div>
                    <div className="progress-track bg-neutral-900 border border-neutral-850 h-2">
                      <div
                        className={`progress-fill rounded-full ${item.color}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="section-title font-heading uppercase text-sm tracking-widest text-neutral-400">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { href: "/dashboard/workouts/new",   icon: <Dumbbell className="h-6 w-6 text-amber-500" />, title: "Log a Workout", desc: "Start tracking today’s training session." },
            { href: "/dashboard/nutrition",       icon: <Salad className="h-6 w-6 text-emerald-500" />,   title: "Log Food",      desc: "Add meals and monitor your daily macros." },
            { href: "/dashboard/ai-coach",        icon: <Bot className="h-6 w-6 text-indigo-400" />,   title: "Ask AI Coach",  desc: "Get tailored advice based on your progress." },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group card card-premium-glow rounded-2xl p-5 border border-neutral-900 bg-neutral-950/30 flex flex-col justify-between h-full"
            >
              <div>
                <div className="mb-4 inline-flex p-3 bg-neutral-900 border border-neutral-800 rounded-xl w-fit" aria-hidden="true">
                  {action.icon}
                </div>
                <h3 className="font-bold text-white font-heading uppercase text-sm tracking-wide">{action.title}</h3>
                <p className="mt-1 text-xs text-neutral-400 leading-relaxed">{action.desc}</p>
              </div>
              <span className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-500 transition group-hover:translate-x-1">
                Open <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="card rounded-2xl p-6 border border-neutral-900 bg-neutral-950/30">
        <h2 className="section-title font-heading uppercase text-sm tracking-widest text-neutral-400 mb-5">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Award className="h-10 w-10 text-amber-500 mb-3 animate-pulse" />
            <p className="font-semibold text-neutral-300">Your fitness story starts here.</p>
            <p className="mt-1 text-xs text-neutral-500">Log your first workout or meal to see activity here.</p>
            <Link href="/dashboard/workouts/new" className="btn-primary mt-4 text-xs font-semibold">
              Log first workout
            </Link>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-neutral-900">
            {recentActivity.map((item, i) => (
              <li
                key={`${item.type}-${i}`}
                className="flex items-center gap-4 py-3.5 transition-colors hover:bg-neutral-900/30 rounded-xl px-3 -mx-3"
              >
                {/* Color accent dot */}
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    item.type === "workout" ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                />
                {/* Type badge */}
                <span
                  className={`badge text-[10px] font-semibold tracking-wider ${
                    item.type === "workout"
                      ? "bg-indigo-950/50 text-indigo-400 border border-indigo-900/30"
                      : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                  }`}
                >
                  {item.type === "workout" ? "WORKOUT" : "MEAL"}
                </span>
                <span className="flex-1 truncate text-xs font-medium text-neutral-300">
                  {item.label}
                </span>
                <span className="shrink-0 text-[10px] text-neutral-500 font-semibold uppercase">
                  {formatActivityDate(item.logged_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
