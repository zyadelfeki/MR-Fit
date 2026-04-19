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
      // 1. Register the account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          securityQuestion,
          securityAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // 2. Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created! Please sign in.");
        router.push("/login");
        return;
      }

      // 3. Redirect to onboarding
      router.refresh();
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-sm"
      aria-labelledby="signup-heading"
    >
      <h1 id="signup-heading" className="text-2xl font-semibold">
        Create account
      </h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="confirm">
          Confirm Password
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={6}
          value={confirm}
          autoComplete="new-password"
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="securityQuestion">
          Security Question
        </label>
        <select
          id="securityQuestion"
          value={securityQuestion}
          onChange={(e) => setSecurityQuestion(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option>What was the name of your first pet?</option>
          <option>What city were you born in?</option>
          <option>What is your mother's maiden name?</option>
          <option>What was the name of your first school?</option>
          <option>What is your childhood nickname?</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="securityAnswer">
          Security Answer
        </label>
        <input
          id="securityAnswer"
          type="text"
          required
          value={securityAnswer}
          onChange={(e) => setSecurityAnswer(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-brand w-full justify-center disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
          <Link href="/login" className="text-gray-900 hover:underline dark:text-gray-100">
            Sign in
          </Link>
      </p>
    </form>
  );
}
