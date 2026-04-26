"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function WelcomeBanner({ name }: { name?: string | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setVisible(true);
      // Strip the param from URL immediately
      router.replace(pathname);
      // Auto-dismiss after 4s
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => setVisible(false), 400);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, pathname]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white shadow-lg transition-transform duration-400 ${
        exiting ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{ transition: "transform 400ms ease, opacity 400ms ease" }}
    >
      <span className="text-lg">🎉</span>
      <span className="text-sm font-medium">
        Welcome to MR-Fit{name ? `, ${name}` : ""}! You&apos;re all set up.
      </span>
      <button
        onClick={() => { setExiting(true); setTimeout(() => setVisible(false), 400); }}
        className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
