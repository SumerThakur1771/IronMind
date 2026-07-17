"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  // rotate the message every 2s; cleanup clears the interval when the
  // response arrives and this component unmounts
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-card max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex items-center gap-2.5">
        {/* pulsing dots icon */}
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="thinking-dot h-1.5 w-1.5 rounded-full bg-cyan-300"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>

        {/* rotating message */}
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

      {/* indeterminate gradient loading bar */}
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, failed]);

  async function send(question: string) {
    setFailed(false);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch {
      // Surface a retryable error instead of a dead-end message.
      setFailed(true);
    } finally {
      setLoading(false);
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
    <main className="bg-app grain relative flex h-screen flex-col text-white">
      {/* header */}
      <header className="relative z-10 flex items-center gap-3 px-5 py-4">
        <Link
          href="/"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-colors hover:border-white/25 hover:text-white"
          aria-label="Back to home"
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
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-gradient">IronMind</span>
        </h1>
      </header>

      {/* messages */}
      <div
        data-lenis-prevent
        className="relative flex-1 overflow-y-auto px-5 py-6"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {messages.length === 0 && !loading && (
            <div className="mt-24 flex flex-col items-center text-center">
              <p className="text-gradient text-5xl font-black tracking-tight opacity-40 sm:text-6xl">
                IronMind
              </p>
              <p className="mt-4 text-gray-500">
                Ask me anything about fitness.
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={
                  message.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div className="max-w-[85%]">
                  {message.role === "user" ? (
                    <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-white shadow-lg shadow-blue-500/20">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ) : (
                    <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-2.5 text-gray-100">
                      <p className="whitespace-pre-wrap">{message.content}</p>
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
                          <SourcePill key={source.knowledgeId} source={source} />
                        ))}
                      </motion.div>
                    )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
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
    </main>
  );
}
