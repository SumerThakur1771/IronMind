"use client";

import { useState } from "react";
import KnowledgeForm from "../components/KnowledgeForm";

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
            <div
              key={entry.id}
              className="mt-4 rounded border border-gray-700 p-4 text-left"
            >
              <h2 className="text-lg font-bold">{entry.title}</h2>
              <p className="text-sm text-blue-400">{entry.category}</p>
              <p className="mt-2 text-gray-300">{entry.content}</p>
              <button
                className="bg-red-500 px-2.5 rounded-md m-2"
                onClick={() => handleDelete(entry.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
