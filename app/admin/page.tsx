"use client";

import { useState } from "react";

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  function handleSubmit() {
    console.log(title);
    console.log(category);
    console.log(content);
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
      </div>
    </div>
  );
}
