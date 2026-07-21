"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { visitorHeaders } from "@/app/lib/client-visitor";
import { motion, AnimatePresence } from "framer-motion";
import ChatView from "./ChatView";
import ChatSidebar, { type SessionMeta } from "./ChatSidebar";

const EASE = [0.22, 1, 0.36, 1] as const;
const SIDEBAR_W = 272;

function HamburgerIcon() {
  return (
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
  );
}

export default function ChatShell({ sessionId }: { sessionId?: string }) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(sessionId);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Bumped to force a fresh ChatView when starting a new chat from the /chat
  // page (see handleNewChat).
  const [resetNonce, setResetNonce] = useState(0);
  const router = useRouter();

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions", {
        headers: visitorHeaders(),
      });
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
      await fetch(`/api/chat/sessions/${id}`, {
        method: "DELETE",
        headers: visitorHeaders(),
      });
    } catch {
      // ignore
    }
    if (id === activeId) router.push("/chat");
  }

  function handleSessionUpdated(id: string) {
    setActiveId(id);
    loadSessions();
  }

  // Start a new chat. On a real /chat/[id] route the router is in sync, so a
  // normal navigation works. On the /chat page, the URL was changed to
  // /chat/[id] via history.replaceState during the first message — which does
  // NOT update the Next router — so router.push("/chat") would be a no-op.
  // In that case reset the view client-side and restore the URL (no reload).
  function handleNewChat() {
    setDrawerOpen(false);
    if (sessionId) {
      router.push("/chat");
      return;
    }
    window.history.replaceState(null, "", "/chat");
    setActiveId(undefined);
    setResetNonce((n) => n + 1);
  }

  const gradientEdge = (
    <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-blue-500/40 to-transparent" />
  );

  return (
    <main className="bg-app grain relative flex h-[100dvh] overflow-hidden pt-16 text-white">
      {/* desktop collapsible sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 0 : SIDEBAR_W }}
        transition={{ duration: 0.35, ease: EASE }}
        className="relative hidden shrink-0 overflow-hidden md:block"
      >
        <div
          className="h-full backdrop-blur-xl"
          style={{
            width: SIDEBAR_W,
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          <ChatSidebar
            sessions={sessions}
            activeId={activeId}
            onDelete={handleDelete}
            onNewChat={handleNewChat}
          />
        </div>
        {gradientEdge}
      </motion.aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute bottom-0 left-0 top-16 w-72 bg-[#0a0f1e]"
            >
              <div className="h-full bg-white/[0.03] backdrop-blur-xl">
                <ChatSidebar
                  sessions={sessions}
                  activeId={activeId}
                  onDelete={handleDelete}
                  onNavigate={() => setDrawerOpen(false)}
                  onNewChat={handleNewChat}
                />
              </div>
              {gradientEdge}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* chat column */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="bg-mesh pointer-events-none absolute inset-0" />

        {/* desktop collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute left-3 top-3 z-20 hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0a0f1e]/70 text-gray-300 backdrop-blur transition-colors hover:text-white md:inline-flex"
          aria-label={collapsed ? "Show conversations" : "Hide conversations"}
        >
          <HamburgerIcon />
        </button>

        {/* mobile drawer toggle */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute left-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0a0f1e]/70 text-gray-300 backdrop-blur transition-colors hover:text-white md:hidden"
          aria-label="Open conversations"
        >
          <HamburgerIcon />
        </button>

        <ChatView
          key={sessionId ?? `new-${resetNonce}`}
          sessionId={sessionId}
          onSessionUpdated={handleSessionUpdated}
        />
      </div>
    </main>
  );
}
