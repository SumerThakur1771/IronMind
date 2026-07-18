"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const request = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await request.json().catch(() => ({}));
      if (!request.ok || data.error) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }
      // The server sets an HttpOnly auth cookie; now decide where to go.
      const returnTo = new URLSearchParams(window.location.search).get(
        "returnTo",
      );
      const destination =
        returnTo && returnTo.startsWith("/")
          ? returnTo
          : data.role === "admin"
            ? "/admin"
            : "/chat";
      window.location.href = destination;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-app grain relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* depth layers */}
      <div className="bg-mesh pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(59,130,246,0.22), rgba(139,92,246,0.12) 45%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card relative z-10 w-full max-w-md p-8 sm:p-10"
      >
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-gradient">IronMind</span>
          </Link>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-2xl font-bold text-white"
          >
            Welcome back
          </motion.h1>
          <p className="mt-2 text-sm font-light text-gray-400">
            Sign in to manage your knowledge base.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-styled"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-styled"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-light text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
