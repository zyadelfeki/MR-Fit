"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const verifyQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/verify-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to fetch security question.");
        return;
      }

      setQuestion(data.question);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          answer,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect answer.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={question ? resetPassword : verifyQuestion}
      className="space-y-6 w-full max-w-sm"
      aria-labelledby="forgot-password-heading"
    >
      <h1 id="forgot-password-heading" className="text-2xl font-semibold">
        Reset password
      </h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {success ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <p>Password reset! Sign in now.</p>
          <Link href="/login" className="mt-2 inline-block text-gray-900 hover:underline">
            Go to Sign in
          </Link>
        </div>
      ) : (
        <>
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
              disabled={Boolean(question)}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700"
            />
          </div>

          {question ? (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">Security Question</p>
                <p className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {question}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="answer">
                  Your Answer
                </label>
                <input
                  id="answer"
                  type="text"
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-gray-900 focus:ring-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full justify-center disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : question
                ? "Reset Password"
                : "Continue"}
          </button>

          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Remembered your password?{" "}
              <Link href="/login" className="text-gray-900 hover:underline dark:text-gray-100">
                Sign in
              </Link>
          </p>
        </>
      )}
    </form>
  );
}

