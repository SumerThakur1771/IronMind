"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatView from "./ChatView";
import ChatSidebar, { type SessionMeta } from "./ChatSidebar";

export default function ChatShell({ sessionId }: { sessionId?: string }) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(sessionId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) setSessions(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    setActiveId(sessionId);
  }, [sessionId]);

  async function handleDelete(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
    if (id === activeId) router.push("/chat");
  }

  // Called by ChatView after each message: refresh order + mark active.
  function handleSessionUpdated(id: string) {
    setActiveId(id);
    loadSessions();
  }

  return (
    <main className="bg-app grain relative flex h-[100dvh] pt-20 text-white">
      {/* desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/5 md:flex">
        <ChatSidebar
          sessions={sessions}
          activeId={activeId}
          onDelete={handleDelete}
        />
      </aside>

      {/* mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-[#0a0f1e] pt-20">
            <ChatSidebar
              sessions={sessions}
              activeId={activeId}
              onDelete={handleDelete}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* chat column */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute left-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0a0f1e]/80 text-gray-300 backdrop-blur transition-colors hover:text-white md:hidden"
          aria-label="Open conversations"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h13M3 12h13M3 18h13M20 6h.01M20 12h.01M20 18h.01" />
          </svg>
        </button>

        <ChatView
          key={sessionId ?? "new"}
          sessionId={sessionId}
          onSessionUpdated={handleSessionUpdated}
        />
      </div>
    </main>
  );
}
