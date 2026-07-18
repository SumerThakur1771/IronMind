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
  // True only while THIS message is actively being streamed (plain text);
  // parsed as Markdown once false. Per-message so a completed message can never
  // get stuck in the "streaming" state.
  streaming?: boolean;
};

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
        <span className="text-gray-500">· {source.category}</span>
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
              (m: { role: string; content: string; sources?: Source[] }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                sources: m.sources ?? undefined,
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
          { role: "assistant", content: data.answer, sources: data.sources },
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
            { role: "assistant", content: acc, sources, streaming: true },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLastQuestion(question);
    await send(question);
  }

  function handleRetry() {
    if (lastQuestion && !loading) send(lastQuestion);
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* messages */}
      <div
        data-lenis-prevent
        className="relative flex-1 overflow-y-auto px-5 py-6"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {messages.length === 0 && !loading && !loadingSession && (
            <div className="mt-24 flex flex-col items-center text-center">
              <p className="text-gradient text-5xl font-black tracking-tight opacity-40 sm:text-6xl">
                IronMind
              </p>
              <p className="mt-4 text-gray-500">Ask me anything about fitness.</p>
            </div>
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

      {/* gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* input */}
      <footer className="relative z-10 px-5 py-4">
        <form
          onSubmit={handleSubmit}
          className="glass-card mx-auto flex max-w-2xl items-center gap-2 p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-40"
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
      </footer>
    </div>
  );
}
