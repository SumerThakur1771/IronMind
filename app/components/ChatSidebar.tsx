"use client";

import Link from "next/link";

export type SessionMeta = {
  id: string;
  title: string;
  updatedAt: string;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ChatSidebar({
  sessions,
  activeId,
  onDelete,
  onNavigate,
  onNewChat,
}: {
  sessions: SessionMeta[];
  activeId?: string;
  onDelete: (id: string) => void;
  onNavigate?: () => void;
  onNewChat?: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="p-3">
        <Link
          href="/chat"
          onClick={(e) => {
            // Reset to a fresh chat without a full navigation. On the /chat page
            // the URL may have been changed to /chat/[id] via replaceState during
            // the first message, which desyncs the Next router and makes a plain
            // <Link href="/chat"> a no-op — so drive the reset from onNewChat.
            if (onNewChat) {
              e.preventDefault();
              onNewChat();
            } else {
              onNavigate?.();
            }
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3" data-lenis-prevent>
        {sessions.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs font-light text-gray-400">
            No past conversations yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {sessions.map((s) => {
              const active = s.id === activeId;
              return (
                <li key={s.id} className="group relative">
                  {/* active left-edge gradient accent */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
                  )}
                  <Link
                    href={`/chat/${s.id}`}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2 pr-8 transition-colors ${
                      active
                        ? "bg-white/[0.06] text-white"
                        : "text-gray-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <p className="truncate text-sm">{s.title}</p>
                    <p className="mt-0.5 text-[11px] font-light text-gray-400">
                      {relativeTime(s.updatedAt)}
                    </p>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(s.id);
                    }}
                    aria-label="Delete conversation"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
