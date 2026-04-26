"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(
    "What was the name of your first pet?"
  );
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!securityAnswer.trim()) {
      setError("Security answer is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, securityQuestion, securityAnswer }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { router.push("/login"); return; }

      router.refresh();
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full" aria-labelledby="signup-heading">
      <div className="space-y-1">
        <h1 id="signup-heading" className="text-2xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Join MR-Fit — it&apos;s free</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">Email address</label>
        <input id="email" type="email" required value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={6} value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Min. 6 chars" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="confirm">Confirm</label>
          <input id="confirm" type="password" required minLength={6} value={confirm} autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} className="input-field" placeholder="Repeat password" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="securityQuestion">Security Question</label>
        <select id="securityQuestion" value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} className="input-field">
          <option>What was the name of your first pet?</option>
          <option>What city were you born in?</option>
          <option>What is your mother&apos;s maiden name?</option>
          <option>What was the name of your first school?</option>
          <option>What is your childhood nickname?</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="securityAnswer">Security Answer</label>
        <input id="securityAnswer" type="text" required value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} className="input-field" placeholder="Your answer" />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account...
          </>
        ) : "Create account"}
      </button>

      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          Sign in →
        </Link>
      </p>
    </form>
  );
}
