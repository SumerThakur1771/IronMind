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

  useEffect(() => {
    async function loadEntries() {
      const response = await fetch("/api/knowledge");
      const data = await response.json();
      setEntries(data);
    }
    loadEntries();
  }, []);

  async function handleSubmit() {
    if (!title || !category || !content) {
      alert("Please fill in all fields");
      return;
    }

    const request = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, content }),
    });
    const newEntry = await request.json();
    setEntries([...entries, newEntry]);
    setTitle("");
    setCategory("");
    setContent("");
  }

  async function handleDelete(id: number) {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    setEntries(entries.filter((entry) => entry.id !== id));
  }

  return (
    <main className="bg-app grain relative min-h-screen px-6 py-16 text-white">
      <div className="bg-mesh pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <h1 className="text-center text-4xl font-black tracking-tight">
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
          />
        </div>

        {/* entries */}
        <div className="mt-10 flex flex-col gap-4">
          {entries.length === 0 && (
            <p className="text-center text-sm font-light text-gray-500">
              No entries yet. Add your first principle above.
            </p>
          )}
          {entries.map((entry) => (
            <KnowledgeCard
              entry={entry}
              handleDelete={handleDelete}
              key={entry.id}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
