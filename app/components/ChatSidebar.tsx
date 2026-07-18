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
}: {
  sessions: SessionMeta[];
  activeId?: string;
  onDelete: (id: string) => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="p-3">
        <Link
          href="/chat"
          onClick={onNavigate}
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
          <p className="px-3 py-6 text-center text-xs font-light text-gray-600">
            No past conversations yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sessions.map((s) => {
              const active = s.id === activeId;
              return (
                <li key={s.id} className="group relative">
                  <Link
                    href={`/chat/${s.id}`}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2 pr-8 transition-colors ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <p className="truncate text-sm">{s.title}</p>
                    <p className="mt-0.5 text-[11px] font-light text-gray-500">
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
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-red-400 group-hover:opacity-100"
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
