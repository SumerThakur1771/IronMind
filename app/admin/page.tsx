"use client";

import { useState } from "react";

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
    console.log(title);
    console.log(category);
    console.log(content);
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center flex flex-col gap-8 w-md">
        <h1 className="text-3xl font-bold"> {title}</h1>
        <input
          type="text"
          placeholder="Enter your title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-4 rounded border border-gray-700 bg-black px-4 py-2 text-white"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-gray-700 bg-black px-4 py-2 text-white"
        >
          <option value="">select one</option>
          <option value="nutrition">Nutrition</option>
          <option value="training">Training</option>
          <option value="recovery">Recovery</option>
          <option value="mindset">Mindset</option>
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your fitness principle here..."
          className="rounded border border-gray-700 bg-black px-4 py-2 text-white"
        ></textarea>
        <button onClick={handleSubmit} className="bg-blue-500 p-1.5 rounded-md">
          Submit
        </button>
        <div>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="mt-4 rounded border border-gray-700 p-4 text-left"
            >
              <h2 className="text-lg font-bold">{entry.title}</h2>
              <p className="text-sm text-blue-400">{entry.category}</p>
              <p className="mt-2 text-gray-300">{entry.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
