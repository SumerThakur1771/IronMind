"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email ?? null);
        }
      } catch {
        // non-fatal
      }
    }
    async function loadEntries() {
      try {
        const response = await fetch("/api/knowledge");
        const data = await response.json();
        if (Array.isArray(data)) setEntries(data);
      } catch {
        setError("Failed to load entries.");
      } finally {
        setLoadingEntries(false);
      }
    }
    loadUser();
    loadEntries();
  }, []);

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
      setEntries((prev) => [...prev, data]);
      setTitle("");
      setCategory("");
      setContent("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const previous = entries;
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (!res.ok) {
      // roll back the optimistic removal
      setEntries(previous);
      setError("Failed to delete entry.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="bg-app grain relative min-h-screen px-6 py-16 text-white">
      <div className="bg-mesh pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 text-left">
            {userEmail && (
              <p className="truncate text-xs font-light text-gray-500">
                Logged in as{" "}
                <span className="text-gray-300">{userEmail}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary shrink-0 px-4 py-2 text-sm"
          >
            Log out
          </button>
        </div>
        <h1 className="mt-6 text-center text-4xl font-black tracking-tight">
          <span className="text-gradient">Knowledge Base</span>
        </h1>
        <p className="mt-3 text-center font-light text-gray-400">
          Add and manage the principles IronMind answers from.
        </p>

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
        <div className="mt-10 flex flex-col gap-4">
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
            <p className="text-center text-sm font-light text-gray-500">
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
      </div>
    </main>
  );
}
