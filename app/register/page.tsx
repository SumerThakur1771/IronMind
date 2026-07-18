"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const request = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, inviteCode }),
      });
      const data = await request.json().catch(() => ({}));
      if (!request.ok || data.error) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }
      window.location.href = "/login";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-app grain relative flex min-h-screen items-center justify-center overflow-hidden px-6">
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
          <h1 className="mt-6 text-2xl font-bold text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm font-light text-gray-400">
            Start building your knowledge base.
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
              autoComplete="new-password"
            />
          </div>

          <div>
            <p className="mb-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-light text-gray-400">
              Registration is invite-only. Contact Sumer for access.
            </p>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Invite code
            </label>
            <input
              type="text"
              placeholder="Enter your invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="input-styled"
              autoComplete="off"
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
                Creating account…
              </>
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-light text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link
            href="/"
            className="text-xs font-light text-gray-600 transition-colors hover:text-gray-400"
          >
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
