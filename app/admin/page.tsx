"use client";

import { useState } from "react";
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

  function handleSubmit() {
    if (!title || !category || !content) {
      alert("Please fill in all fields");
      return;
    }

    const newEntry = {
      id: entries.length + 1,
      title: title,
      category: category,
      content: content,
    };
    setEntries([...entries, newEntry]);
    setTitle("");
    setCategory("");
    setContent("");
  }

  function handleDelete(id: number) {
    setEntries(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center flex flex-col gap-8 w-md">
        <h1 className="text-3xl font-bold"> {title}</h1>
        <KnowledgeForm
          title={title}
          setTitle={setTitle}
          category={category}
          setCategory={setCategory}
          content={content}
          setContent={setContent}
          handleSubmit={handleSubmit}
        />
        <div>
          {entries.map((entry) => (
            <KnowledgeCard
              entry={entry}
              handleDelete={handleDelete}
              key={entry.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
