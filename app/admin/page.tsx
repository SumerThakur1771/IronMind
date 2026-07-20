"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import KnowledgeForm from "../components/KnowledgeForm";
import KnowledgeCard from "../components/KnowledgeCard";

interface KnowledgeEntry {
  id: number;
  title: string;
  category: string;
  content: string;
}

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [access, setAccess] = useState<"checking" | "admin" | "denied">(
    "checking",
  );
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const PER_PAGE = 10;

  const loadEntries = useCallback(async (targetPage: number) => {
    setLoadingEntries(true);
    try {
      const response = await fetch(
        `/api/knowledge?page=${targetPage}&limit=${PER_PAGE}`,
      );
      const data = await response.json();
      if (response.ok && Array.isArray(data.entries)) {
        setEntries(data.entries);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? targetPage);
      }
    } catch {
      setError("Failed to load entries.");
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email ?? null);
          setAccess(data.role === "admin" ? "admin" : "denied");
        } else {
          setAccess("denied");
        }
      } catch {
        setAccess("denied");
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (access === "admin") loadEntries(1);
  }, [access, loadEntries]);

  async function handleSubmit() {
    setError("");
    if (!title || !category || !content) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const request = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content }),
      });
      const data = await request.json().catch(() => ({}));
      if (!request.ok) {
        setError(data.error || "Failed to add entry.");
        return;
      }
      setTitle("");
      setCategory("");
      setContent("");
      // Jump to the last page so the newly added entry is visible.
      const lastPage = Math.max(1, Math.ceil((total + 1) / PER_PAGE));
      loadEntries(lastPage);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete entry.");
      return;
    }
    // Reload; step back a page if we just removed the last item on this page.
    const target = entries.length === 1 && page > 1 ? page - 1 : page;
    loadEntries(target);
  }

  // Non-admins get a clean message instead of a broken, 403-ing admin UI.
  if (access === "denied") {
    return (
      <main className="bg-app grain relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="bg-mesh pointer-events-none absolute inset-0" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">
            You don&apos;t have admin access
          </h1>
          <p className="mt-3 font-light text-gray-400">
            This area is for managing IronMind&apos;s knowledge base.
          </p>
          <Link
            href="/chat"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-3 font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-blue-500/25"
          >
            Go to Chat instead
          </Link>
        </div>
      </main>
    );
  }

  if (access === "checking") {
    return (
      <main className="bg-app grain relative flex min-h-screen items-center justify-center text-gray-400">
        <div className="bg-mesh pointer-events-none absolute inset-0" />
        <p className="relative z-10 text-sm font-light">Loading…</p>
      </main>
    );
  }

  return (
    <main className="bg-app grain relative min-h-screen px-6 pb-16 pt-28 text-white">
      <div className="bg-mesh pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <h1 className="text-center text-4xl font-black tracking-tight">
          <span className="text-gradient">Knowledge Base</span>
        </h1>
        <p className="mt-3 text-center font-light text-gray-400">
          Add and manage the principles IronMind answers from.
        </p>
        {userEmail && (
          <p className="mt-2 text-center text-xs font-light text-gray-400">
            Logged in as {userEmail}
          </p>
        )}

        {/* form */}
        <div className="glass-card mt-10 p-6 sm:p-8">
          <KnowledgeForm
            title={title}
            setTitle={setTitle}
            category={category}
            setCategory={setCategory}
            content={content}
            setContent={setContent}
            handleSubmit={handleSubmit}
            submitting={submitting}
          />
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>

        {/* entries */}
        <div className="mt-10">
          {!loadingEntries && total > 0 && (
            <p className="mb-4 text-sm font-light text-gray-400">
              {total} {total === 1 ? "entry" : "entries"} total
            </p>
          )}

          <div className="flex flex-col gap-4">
            {loadingEntries ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="glass-card animate-pulse p-5">
                    <div className="h-5 w-1/3 rounded bg-white/10" />
                    <div className="mt-2 h-4 w-20 rounded-full bg-white/5" />
                    <div className="mt-4 h-3 w-full rounded bg-white/5" />
                    <div className="mt-2 h-3 w-4/5 rounded bg-white/5" />
                  </div>
                ))}
              </>
            ) : entries.length === 0 ? (
              <p className="text-center text-sm font-light text-gray-400">
                No entries yet. Add your first principle above.
              </p>
            ) : (
              entries.map((entry) => (
                <KnowledgeCard
                  entry={entry}
                  handleDelete={handleDelete}
                  key={entry.id}
                />
              ))
            )}
          </div>

          {/* pagination controls */}
          {!loadingEntries && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => loadEntries(page - 1)}
                disabled={page <= 1}
                className="glass-card px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-light text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => loadEntries(page + 1)}
                disabled={page >= totalPages}
                className="glass-card px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
