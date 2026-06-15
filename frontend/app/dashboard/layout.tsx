"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Toast from "@/components/Toast";
import WelcomeBanner from "@/components/WelcomeBanner";

const Icons: Record<string, JSX.Element> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  workouts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
    </svg>
  ),
  exercises: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <polyline points="3 6 4 7 6 5" /><polyline points="3 12 4 13 6 11" /><polyline points="3 18 4 19 6 17" />
    </svg>
  ),
  tracker: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="2 12 6 12 8 4 10 20 12 12 14 12 16 8 18 16 20 12 22 12" />
    </svg>
  ),
  progress: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  ai: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  ),
  nutrition: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a4 4 0 0 1 4 4c0 3-4 6-4 6s-4-3-4-6a4 4 0 0 1 4-4z" />
      <path d="M12 12v10" /><path d="M8 16h8" />
    </svg>
  ),
  wearables: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  upgrade: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  sun: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  moon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  signout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  camera: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  recovery: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

type NavItem = { name: string; href: string; iconKey: string; badge?: string; proOnly?: boolean };

const navItems: NavItem[] = [
  { name: "Dashboard",     href: "/dashboard",               iconKey: "dashboard" },
  { name: "Workouts",      href: "/dashboard/workouts",      iconKey: "workouts" },
  { name: "Exercises",     href: "/dashboard/exercises",     iconKey: "exercises" },
  { name: "Form Analysis", href: "/dashboard/form-analysis",  iconKey: "camera", badge: "ML" },
  { name: "Smart Tracker", href: "/dashboard/smart-tracker", iconKey: "tracker", badge: "NEW" },
  { name: "Progress",      href: "/dashboard/progress",      iconKey: "progress" },
  { name: "AI Coach",      href: "/dashboard/ai-coach",      iconKey: "ai",       proOnly: true },
  { name: "Nutrition",     href: "/dashboard/nutrition",     iconKey: "nutrition" },
  { name: "Recovery Engine", href: "/dashboard/recovery",    iconKey: "recovery", badge: "AI" },
  { name: "Wearables",     href: "/dashboard/wearables",     iconKey: "wearables", proOnly: true },
  { name: "Profile",       href: "/dashboard/profile",       iconKey: "profile" },
];

// ─── plan helpers (swap this for a real DB field later) ───────────────────
type Plan = "free" | "pro";
function usePlan(): Plan {
  // TODO: read from session or /api/profile when you add billing
  return "free";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const plan = usePlan();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [routeBarVisible, setRouteBarVisible]   = useState(false);
  const [routeBarPhase,   setRouteBarPhase]     = useState<"idle"|"loading"|"finishing">("idle");

  const userEmail = session?.user?.email ?? null;
  const initials  = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : (userEmail?.[0] ?? "U").toUpperCase();
  const firstName = displayName?.split(" ")[0] ?? "User";

  // ── close mobile menu on route change
  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  // ── theme: apply to <html> AND <body> so every pixel respects it
  useEffect(() => {
    const stored      = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved    = stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
    applyTheme(resolved);
    setTheme(resolved);
  }, []);

  function applyTheme(t: "light" | "dark") {
    const html = document.documentElement;
    html.classList.toggle("dark", t === "dark");
    // force background on both html + body so no white flash
    html.style.backgroundColor   = t === "dark" ? "#111827" : "#f9fafb";
    document.body.style.backgroundColor = t === "dark" ? "#111827" : "#f9fafb";
  }

  // ── route progress bar
  useEffect(() => {
    setRouteBarVisible(true);
    setRouteBarPhase("loading");
    const t1 = setTimeout(() => setRouteBarPhase("finishing"), 180);
    const t2 = setTimeout(() => { setRouteBarVisible(false); setRouteBarPhase("idle"); }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname]);

  // ── fetch profile + streak
  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const res  = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (data.profile?.display_name) setDisplayName(data.profile.display_name);
      } catch { /* non-critical */ }
      try {
        const res  = await fetch("/api/dashboard/stats");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.streak === "number") setStreak(data.streak);
      } catch { /* non-critical */ }
    })();
  }, [session?.user?.id]);

  const handleSignOut = async () => signOut({ callbackUrl: "/login" });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  };

  // ── plan badge styles
  const planBadge = plan === "pro"
    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  const planLabel = plan === "pro" ? "⚡ Pro" : "Free Plan";

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5 dark:border-gray-700">
        <div className="flex items-center justify-center rounded-lg bg-gray-900 p-2 dark:bg-indigo-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
          </svg>
        </div>
        <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">MR-Fit</span>
      </div>

      {/* User pill + plan badge */}
      {userEmail && (
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{firstName}</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${planBadge}`}>
              {planLabel}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul role="list" className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname.startsWith(item.href) &&
              (item.href !== "/dashboard" || pathname === "/dashboard");
            const isLocked = item.proOnly && plan === "free";

            return (
              <li key={item.name}>
                {isLocked ? (
                  // Locked nav item → redirect to upgrade page
                  <Link
                    href="/dashboard/upgrade"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-100 dark:text-gray-600 dark:hover:bg-gray-800"
                    title="Upgrade to Pro to unlock"
                  >
                    <span className="opacity-50">{Icons[item.iconKey]}</span>
                    <span>{item.name}</span>
                    <span className="ml-auto rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                      PRO
                    </span>
                  </Link>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={isActive ? "text-white" : "text-gray-400"}>{Icons[item.iconKey]}</span>
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Upgrade CTA — only shown on free plan */}
        {plan === "free" && (
          <div className="mt-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-900/20 dark:to-purple-900/20">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">⚡ Unlock Pro</p>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">AI Coach, Wearables & advanced analytics</p>
            <Link
              href="/dashboard/upgrade"
              className="mt-2 flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <button
          type="button"
          onClick={toggleTheme}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {theme === "dark" ? Icons.sun : Icons.moon}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
        >
          {Icons.signout} Sign out
        </button>

        <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-500">
          {streak > 0 ? `🔥 ${streak}-day streak — keep it up!` : "Start your streak today!"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Route progress bar */}
      <div className={`fixed left-0 top-0 z-50 h-0.5 w-full transition-opacity duration-200 ${routeBarVisible ? "opacity-100" : "opacity-0"}`}>
        <div className={`h-full bg-indigo-500 transition-all duration-300 ${routeBarPhase === "idle" ? "w-0" : routeBarPhase === "loading" ? "w-2/3" : "w-full"}`} />
      </div>

      <Suspense fallback={null}>
        <WelcomeBanner name={firstName} />
      </Suspense>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-gray-900 p-1.5 dark:bg-indigo-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">MR-Fit</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Open menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900 md:p-8">{children}</main>
      </div>

      <Toast />
    </div>
  );
}
