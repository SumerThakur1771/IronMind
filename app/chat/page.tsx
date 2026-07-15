"use client";

import { useEffect, useRef, useState } from "react";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold">
          Chat with Iron<span className="text-blue-500">Mind</span>
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && !loading && (
            <p className="mt-20 text-center text-gray-500">
              Ask IronMind about training, nutrition, or recovery.
            </p>
          )}

          {messages.map((message, i) => (
            <div
              key={i}
              className={
                message.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div className="max-w-[85%]">
                <div
                  className={
                    message.role === "user"
                      ? "rounded-2xl bg-blue-500 px-4 py-2 text-white"
                      : "rounded-2xl bg-gray-900 px-4 py-2 text-gray-100"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === "assistant" &&
                  message.sources &&
                  message.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <span
                          key={source.knowledgeId}
                          className="rounded-full border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-400"
                        >
                          {source.title}
                          <span className="text-gray-600"> · {source.category}</span>
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-900 px-4 py-2 text-gray-400">
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-gray-800 px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
