"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AuthState = {
  status: "loading" | "guest" | "authed";
  email?: string;
  role?: string;
};

function AnimatedHamburger({ open }: { open: boolean }) {
  const line = "absolute left-0 h-0.5 w-5 rounded-full bg-current";
  return (
    <span className="relative block h-4 w-5">
      <motion.span
        className={line}
        style={{ top: 1, originX: 0.5, originY: 0.5 }}
        animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25 }}
      />
      <motion.span
        className={line}
        style={{ top: 7 }}
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className={line}
        style={{ top: 13, originX: 0.5, originY: 0.5 }}
        animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25 }}
      />
    </span>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

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

  const links = (
    <>
      <Link
        href="/chat"
        onClick={() => setMenuOpen(false)}
        className="text-gray-400 transition-colors hover:text-white"
      >
        Chat
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setMenuOpen(false)}
          className="text-gray-400 transition-colors hover:text-white"
        >
          Admin
        </Link>
      )}

      {auth.status === "guest" && (
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className="rounded-full border border-white/[0.1] px-4 py-1.5 text-gray-300 transition-all hover:border-blue-500/50 hover:text-white hover:shadow-[0_0_14px_rgba(59,130,246,0.25)]"
        >
          Login
        </Link>
      )}

      {isAuthed && (
        <button
          onClick={handleLogout}
          className="text-left text-gray-500 transition-colors hover:text-gray-200"
        >
          Logout
        </button>
      )}
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-white/[0.03] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="text-gradient animate-gradient-x text-lg font-bold tracking-tight"
        >
          IronMind
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-7 text-sm sm:flex">{links}</div>

        {/* mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-gray-300 transition-colors hover:text-white sm:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <AnimatedHamburger open={menuOpen} />
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
            className="overflow-hidden border-b border-white/[0.05] bg-[#0a0f1e]/95 backdrop-blur-xl sm:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-5 text-base">
              {links}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
