"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Workouts", href: "/dashboard/workouts" },
    { name: "🏋️ Exercises", href: "/exercises" },
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
    const router = useRouter();
    const { data: session } = useSession();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(null);

    const userEmail = session?.user?.email ?? null;

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

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Brand */}
                    <div className="flex items-center justify-center h-16 border-b px-4">
                        <span className="text-xl font-bold text-blue-600">MR-Fit</span>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`block px-4 py-3 rounded-md transition-colors ${isActive
                                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info & Sign Out */}
                    <div className="p-4 border-t dark:border-gray-700">
                        {userEmail && (
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
                    <span className="text-xl font-bold text-blue-600">MR-Fit</span>
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
        </div>
    );
}
