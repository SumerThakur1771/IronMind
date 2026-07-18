"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AuthState = {
  status: "loading" | "guest" | "authed";
  email?: string;
  role?: string;
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        setAuth(
          data
            ? { status: "authed", email: data.email, role: data.role }
            : { status: "guest" },
        );
      })
      .catch(() => {
        if (active) setAuth({ status: "guest" });
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const isAuthed = auth.status === "authed";
  const isAdmin = isAuthed && auth.role === "admin";

  // Right-side items, reused for desktop and mobile.
  const links = (
    <>
      <Link
        href="/chat"
        onClick={() => setMenuOpen(false)}
        className="transition-colors hover:text-white"
      >
        Chat
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setMenuOpen(false)}
          className="transition-colors hover:text-white"
        >
          Admin
        </Link>
      )}

      {auth.status === "guest" && (
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className="rounded-full border border-white/10 px-4 py-1.5 transition-colors hover:border-blue-500/60 hover:text-white"
        >
          Login
        </Link>
      )}

      {isAuthed && (
        <button
          onClick={handleLogout}
          className="rounded-full border border-white/10 px-4 py-1.5 text-left transition-colors hover:border-blue-500/60 hover:text-white"
        >
          Logout
        </button>
      )}
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnimatePresence>
        {(scrolled || menuOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl"
          />
        )}
      </AnimatePresence>

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="text-lg font-bold tracking-tight text-white"
        >
          Iron<span className="text-blue-500">Mind</span>
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-7 text-sm font-light text-gray-300 sm:flex">
          {links}
        </div>

        {/* mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-gray-300 transition-colors hover:text-white sm:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {menuOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </nav>

      {/* mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden border-b border-white/5 bg-[#0a0f1e]/95 backdrop-blur-xl sm:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-5 text-base font-light text-gray-300">
              {links}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
