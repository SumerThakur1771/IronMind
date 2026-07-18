"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Source = {
  knowledgeId: number;
  title: string;
  category: string;
  similarity: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt?: string;
  // True only while THIS message is actively being streamed (plain text);
  // parsed as Markdown once false. Per-message so a completed message can never
  // get stuck in the "streaming" state.
  streaming?: boolean;
};

const SUGGESTIONS = [
  "How much protein should I eat?",
  "Give me a beginner workout plan",
  "Should I bulk or cut?",
  "What supplements actually work?",
];

function formatTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

const LOADING_MESSAGES = [
  "Scanning the knowledge base...",
  "Finding the most relevant principles...",
  "Crafting your answer...",
  "Cross-referencing training science...",
  "Consulting 6 years of lifting experience...",
  "Pulling from evidence-based research...",
  "Almost there, no bro-science allowed...",
];

function LoadingIndicator() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="glass-card max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="thinking-dot h-1.5 w-1.5 rounded-full bg-cyan-300"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-sm text-gray-300"
          >
            {LOADING_MESSAGES[index]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-2.5 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="loading-bar h-full w-2/5 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500" />
      </div>
    </div>
  );
}

function SourcePill({ source }: { source: Source }) {
  return (
    <span className="glow-border inline-block text-xs">
      <span className="bg-app inline-flex items-center gap-1 rounded-[calc(1rem-1px)] px-2.5 py-1 text-gray-300">
        {source.title}
        <span className="text-gray-400">· {source.category}</span>
      </span>
    </span>
  );
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-1">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 text-xl font-bold text-white first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-3 text-lg font-bold text-white first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-lg font-bold text-white first:mt-0">
      {children}
    </h3>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse border border-white/10 text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-white/10 px-3 py-1.5 text-left font-semibold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-white/10 px-3 py-1.5 align-top">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-white/5 p-3 font-mono text-sm">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock =
      /language-/.test(className || "") || String(children).includes("\n");
    return isBlock ? (
      <code className="font-mono text-sm">{children}</code>
    ) : (
      <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-white/20 pl-3 text-gray-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-white/10" />,
};

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-gray-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatView({
  sessionId,
  onSessionUpdated,
}: {
  sessionId?: string;
  onSessionUpdated?: (id: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(!!sessionId);
  const [failed, setFailed] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | undefined>(sessionId);

  const isStreaming = messages.some((m) => m.streaming);

  // Load an existing session's messages on mount.
  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}`);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setMessages(
            (data.messages ?? []).map(
              (m: {
                role: string;
                content: string;
                sources?: Source[];
                createdAt?: string;
              }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                sources: m.sources ?? undefined,
                createdAt: m.createdAt,
              }),
            ),
          );
        }
      } catch {
        // ignore — show empty
      } finally {
        if (active) setLoadingSession(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, failed]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function parseSources(res: Response): Source[] {
    const raw = res.headers.get("X-Chat-Sources");
    if (!raw) return [];
    try {
      return JSON.parse(decodeURIComponent(raw)) as Source[];
    } catch {
      return [];
    }
  }

  function adoptSession(res: Response) {
    const id = res.headers.get("X-Chat-Session");
    if (id && !sessionIdRef.current) {
      sessionIdRef.current = id;
      // Reflect the new session in the URL without a full navigation/remount.
      window.history.replaceState(null, "", `/chat/${id}`);
    }
  }

  async function send(question: string) {
    setFailed(false);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, sessionId: sessionIdRef.current }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      adoptSession(res);

      const contentType = res.headers.get("Content-Type") || "";

      if (contentType.includes("application/json") || !res.body) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer,
            sources: data.sources,
            createdAt: new Date().toISOString(),
          },
        ]);
        return;
      }

      const sources = parseSources(res);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let appended = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (!appended) {
          appended = true;
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: acc,
              sources,
              streaming: true,
              createdAt: new Date().toISOString(),
            },
          ]);
        } else {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: acc };
            return copy;
          });
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setFailed(true);
    } finally {
      abortRef.current = null;
      setMessages((prev) =>
        prev.some((m) => m.streaming)
          ? prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
          : prev,
      );
      setLoading(false);
      if (sessionIdRef.current) onSessionUpdated?.(sessionIdRef.current);
    }
  }

  async function submit(raw: string) {
    const question = raw.trim();
    if (!question || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    setLastQuestion(question);
    await send(question);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(input);
  }

  function handleRetry() {
    if (lastQuestion && !loading) send(lastQuestion);
  }

  const lastMsg = messages[messages.length - 1];
  const liveAnnouncement = loading
    ? "IronMind is generating a response."
    : lastMsg?.role === "assistant" && !lastMsg.streaming
      ? "IronMind responded."
      : "";

  return (
    <div className="flex h-full flex-1 flex-col">
      <h1 className="sr-only">IronMind chat</h1>

      {/* screen-reader announcements for new responses */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* messages */}
      <div
        data-lenis-prevent
        className="relative flex-1 overflow-y-auto px-5 py-6"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {messages.length === 0 && !loading && !loadingSession && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-16 flex flex-col items-center text-center"
            >
              <p className="text-gradient text-6xl font-black tracking-tight sm:text-7xl">
                IronMind
              </p>
              <p className="mt-4 text-gray-400">
                Ask me anything about fitness.
              </p>
              <div className="mt-10 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((q, i) => (
                  <motion.button
                    key={q}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
                    onClick={() => submit(q)}
                    className="glass-card rounded-xl px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message, i) => {
              const showPlainText =
                message.role === "assistant" && message.streaming;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={
                    message.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div className="max-w-[85%]">
                    {message.role === "user" ? (
                      <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-white shadow-lg shadow-blue-500/20">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ) : (
                      <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-2.5 text-gray-100">
                        {showPlainText ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <MarkdownMessage content={message.content} />
                        )}
                      </div>
                    )}

                    {message.role === "assistant" &&
                      message.sources &&
                      message.sources.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="mt-2 flex flex-wrap gap-2"
                        >
                          {message.sources.map((source) => (
                            <SourcePill
                              key={source.knowledgeId}
                              source={source}
                            />
                          ))}
                        </motion.div>
                      )}

                    {message.createdAt && (
                      <p
                        className={`mt-1 text-[11px] font-light text-gray-400 ${
                          message.role === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && !isStreaming && (
            <div className="flex justify-start">
              <LoadingIndicator />
            </div>
          )}

          {failed && !loading && (
            <div className="flex justify-start">
              <div className="glass-card max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3">
                <p className="text-sm text-gray-300">
                  Our AI is temporarily busy. Please try again in a moment.
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-1.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* thin gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* input */}
      <footer className="relative z-10 px-5 py-4">
        <div className="mx-auto w-full max-w-2xl">
          {/* gradient-border wrapper; inner glows blue on focus */}
          <div className="glow-border">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 rounded-[calc(1rem-1px)] bg-[#0a0f1e] p-2 transition-shadow focus-within:shadow-[0_0_22px_rgba(59,130,246,0.18)]"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 border-0 bg-transparent px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send"
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
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </form>
          </div>
          <p className="mt-2 text-center text-[11px] font-light text-gray-400">
            IronMind can make mistakes. Verify important information.
          </p>
        </div>
      </footer>
    </div>
  );
}
