import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";

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

// Stat card icon SVGs
const DumbbellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
  </svg>
);
const FlameIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c0 0-4 4-4 8a4 4 0 0 0 8 0c0-2-1-4-1-4s-1 2-3 2c0-2 1-4 0-6z" />
    <path d="M12 14c0 2-1 4-3 5" />
  </svg>
);
const ScaleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M3 12h18" />
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);
const BoltIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Profile
  const profileRes = await pool.query(
    `SELECT display_name, weight_kg, fitness_goal, calorie_goal, protein_goal FROM profiles WHERE user_id = $1`,
    [userId]
  );
  const profile = profileRes.rows[0] ?? null;
  if (!profile) redirect("/onboarding");

  const calorieGoal = Number(profile.calorie_goal ?? 2000);
  const proteinGoal = Number(profile.protein_goal ?? 150);

  // Workouts this week
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const workoutsRes = await pool.query(
    `SELECT COUNT(*) AS count FROM workout_logs WHERE user_id = $1 AND logged_at >= $2`,
    [userId, startOfWeek.toISOString()]
  );
  const displayWorkouts = Number(workoutsRes.rows[0]?.count ?? 0);

  // Calories + protein today
  const nutritionRes = await pool.query(
    `SELECT
       COALESCE(SUM(calories), 0)  AS total_calories,
       COALESCE(SUM(protein_g), 0) AS total_protein
     FROM nutrition_logs
     WHERE user_id = $1
       AND DATE(logged_at AT TIME ZONE 'UTC') = CURRENT_DATE`,
    [userId]
  );
  const caloriesToday = Number(nutritionRes.rows[0]?.total_calories ?? 0);
  const proteinToday  = Number(nutritionRes.rows[0]?.total_protein  ?? 0);

  // Streak
  const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const [wDates, nDates] = await Promise.all([
    pool.query(
      `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') AS day FROM workout_logs  WHERE user_id=$1 AND logged_at>=$2`,
      [userId, thirtyAgo.toISOString()]
    ),
    pool.query(
      `SELECT DISTINCT DATE(logged_at AT TIME ZONE 'UTC') AS day FROM nutrition_logs WHERE user_id=$1 AND logged_at>=$2`,
      [userId, thirtyAgo.toISOString()]
    ),
  ]);
  const activityDates = new Set<string>();
  [...wDates.rows, ...nDates.rows].forEach((r) => {
    if (r.day) activityDates.add(new Date(r.day).toISOString().split("T")[0]);
  });
  let streak = 0;
  const checkDate = new Date(); checkDate.setUTCHours(0, 0, 0, 0);
  if (!activityDates.has(checkDate.toISOString().split("T")[0]))
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  while (activityDates.has(checkDate.toISOString().split("T")[0])) {
    streak++; checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  // Recent activity
  const activityRes = await pool.query(
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
  const recentActivity = activityRes.rows as Array<{
    type: "workout" | "nutrition";
    label: string;
    logged_at: string;
  }>;

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
      icon: <DumbbellIcon />,
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      valueColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Calories Today",
      value: caloriesToday > 0 ? `${caloriesToday}` : "0",
      sub: `Goal: ${calorieGoal} kcal`,
      icon: <FlameIcon />,
      iconBg: "bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400",
      valueColor: "text-orange-500 dark:text-orange-400",
    },
    {
      label: "Current Weight",
      value: profile.weight_kg ? `${profile.weight_kg}` : "—",
      sub: profile.weight_kg ? "kg" : "Not set",
      icon: <ScaleIcon />,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Active Streak",
      value: String(streak),
      sub: streak > 2 ? "Keep it up! 🔥" : streak > 0 ? "Building momentum" : "Start today!",
      icon: <BoltIcon />,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Daily quote */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm italic text-white shadow-sm">
        &ldquo;{DAILY_QUOTES[quoteIndex]}&rdquo;
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">
          Welcome back, {profile.display_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <Link href="/dashboard/workouts/new" className="btn-primary text-sm hidden sm:inline-flex">
          + Log Workout
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                {card.icon}
              </div>
            </div>
            <p className={`mt-3 text-2xl font-bold tabular-nums ${card.valueColor}`}>
              {card.value}
              {card.label === "Calories Today" && card.value !== "0" && (
                <span className="ml-1 text-sm font-normal text-gray-400">kcal</span>
              )}
              {card.label === "Active Streak" && (
                <span className="ml-1 text-sm font-normal text-gray-400">{streak === 1 ? "day" : "days"}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Today at a Glance */}
      <div className="card rounded-2xl p-6">
        <h2 className="section-title mb-5">Today at a Glance</h2>
        <div className="space-y-4">
          {[
            { label: "Calories", current: caloriesToday, goal: calorieGoal, pct: caloriesPct, unit: "kcal", color: "bg-indigo-500" },
            { label: "Protein",  current: proteinToday,  goal: proteinGoal,  pct: proteinPct,  unit: "g",    color: "bg-emerald-500" },
            { label: "Weekly Workouts", current: displayWorkouts, goal: 4, pct: workoutPct, unit: "/ 4 sessions", color: "bg-orange-400" },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className="tabular-nums text-gray-500 dark:text-gray-400">
                  {item.label === "Weekly Workouts"
                    ? `${item.current} ${item.unit}`
                    : `${item.current} / ${item.goal} ${item.unit}`}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill ${item.color}`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { href: "/dashboard/workouts/new",   emoji: "🏋️", title: "Log a Workout", desc: "Start tracking today’s training session." },
            { href: "/dashboard/nutrition",       emoji: "🥗",   title: "Log Food",      desc: "Add meals and monitor your daily macros." },
            { href: "/dashboard/ai-coach",        emoji: "🤖",   title: "Ask AI Coach",  desc: "Get tailored advice based on your progress." },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group card card-hover rounded-xl p-5"
            >
              <div className="mb-2 text-2xl" aria-hidden="true">{action.emoji}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{action.desc}</p>
              <span className="mt-3 inline-block text-sm font-medium text-indigo-600 transition group-hover:translate-x-1 dark:text-indigo-400">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="card rounded-2xl p-6">
        <h2 className="section-title">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 text-4xl">💪</div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Your fitness story starts here.</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Log your first workout or meal to see activity here.</p>
            <Link href="/dashboard/workouts/new" className="btn-primary mt-4 text-sm">
              Log first workout
            </Link>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentActivity.map((item, i) => (
              <li
                key={`${item.type}-${i}`}
                className="flex items-center gap-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-2 -mx-2"
              >
                {/* Color accent dot */}
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    item.type === "workout" ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                />
                {/* Type badge */}
                <span
                  className={`badge ${
                    item.type === "workout"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  }`}
                >
                  {item.type === "workout" ? "Workout" : "Meal"}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </span>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
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
