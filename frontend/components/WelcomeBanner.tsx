"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";

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
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3.5 text-neutral-950 shadow-xl transition-all duration-500 ${
        exiting ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <Sparkles className="h-5 w-5 animate-pulse text-neutral-950" />
      <span className="text-sm font-semibold tracking-wide uppercase font-heading">
        Welcome to MR-Fit{name ? `, ${name}` : ""}! You&apos;re all set up.
      </span>
      <button
        onClick={() => { setExiting(true); setTimeout(() => setVisible(false), 400); }}
        className="ml-4 rounded-full p-1 hover:bg-neutral-950/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-neutral-950" />
      </button>
    </div>
  );
}
