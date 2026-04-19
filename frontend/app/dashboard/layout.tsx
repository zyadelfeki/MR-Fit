"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Toast from "@/components/Toast";
import Logo from "@/components/Logo";

type NavLink = {
    name: string;
    href: string;
    icon?: "sensor";
    badge?: string;
};

const navLinks: NavLink[] = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Workouts", href: "/dashboard/workouts" },
    { name: "Exercises", href: "/dashboard/exercises" },
    { name: "Smart Tracker", href: "/dashboard/smart-tracker", icon: "sensor", badge: "NEW" as const },
    { name: "Progress", href: "/dashboard/progress" },
    { name: "AI Coach", href: "/dashboard/ai-coach" },
    { name: "Nutrition", href: "/dashboard/nutrition" },
    { name: "Profile", href: "/dashboard/profile" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [routeBarVisible, setRouteBarVisible] = useState(false);
    const [routeBarPhase, setRouteBarPhase] = useState<"idle" | "loading" | "finishing">("idle");

    const userEmail = session?.user?.email ?? null;

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        const storedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
        const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const resolvedTheme = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";

        setTheme(resolvedTheme);
        document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    }, []);

    useEffect(() => {
        setRouteBarVisible(true);
        setRouteBarPhase("loading");

        const finishTimer = setTimeout(() => {
            setRouteBarPhase("finishing");
        }, 180);

        const hideTimer = setTimeout(() => {
            setRouteBarVisible(false);
            setRouteBarPhase("idle");
        }, 500);

        return () => {
            clearTimeout(finishTimer);
            clearTimeout(hideTimer);
        };
    }, [pathname]);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/profile");
                if (!res.ok) return;
                const data = await res.json();
                if (data.profile?.display_name) {
                    setDisplayName(data.profile.display_name);
                }
            } catch {
                // silently ignore — display name is non-critical
            }
        }

        if (session?.user?.id) {
            fetchProfile();
        }
    }, [session?.user?.id]);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    const toggleTheme = () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
        localStorage.setItem("theme", nextTheme);
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <div
                className={`fixed left-0 top-0 z-50 h-1 w-full transition-opacity duration-200 ${routeBarVisible ? "opacity-100" : "opacity-0"}`}
            >
                <div
                    className={`h-full bg-gray-900 transition-all duration-300 ${
                        routeBarPhase === "idle" ? "w-0" : routeBarPhase === "loading" ? "w-2/3" : "w-full"
                    }`}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Brand */}
                    <div className="flex items-center justify-center h-16 border-b px-4">
                        <div className="inline-flex rounded-xl bg-gray-900 px-3 py-2 dark:bg-white">
                            <Logo variant="full" height={36} />
                        </div>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navLinks.map((link) => {
                            const isActive = pathname.startsWith(link.href) && (link.href !== "/dashboard" || pathname === "/dashboard");
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex items-center gap-3 rounded-md px-4 py-3 transition-colors ${
                                        isActive
                                            ? "bg-gray-100 font-semibold text-gray-900 dark:bg-gray-800 dark:text-white"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.icon === "sensor" ? (
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <polyline points="2 12 6 12 8 4 10 20 12 12 14 12 16 8 18 16 20 12 22 12" />
                                        </svg>
                                    ) : null}
                                    <span>{link.name}</span>
                                    {link.badge ? (
                                        <span className="ml-auto rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-white dark:text-gray-900">
                                            {link.badge}
                                        </span>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info & Sign Out */}
                    <div className="p-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="mb-4 flex w-full items-center justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                        </button>

                        {userEmail && (
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <div className="h-9 w-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {displayName
                                        ? displayName[0].toUpperCase()
                                        : userEmail?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {displayName || "User"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {userEmail}
                                    </p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleSignOut}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                {/* Mobile Header / Hamburger */}
                <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700 md:hidden">
                    <div className="inline-flex rounded-xl bg-gray-900 px-3 py-2 dark:bg-white">
                        <Logo variant="text" height={28} />
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
            </div>

            <Toast />
        </div>
    );
}
