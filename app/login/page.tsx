"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    const request = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await request.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    document.cookie = `token=${data}; path=/`;
    window.location.href = "/admin";
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col gap-6 w-md">
        <h1 className="text-3xl font-bold text-center">
          Login to Iron<span className="text-blue-500">Mind</span>
        </h1>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-gray-700 bg-black px-4 py-2 text-white"
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-gray-700 bg-black px-4 py-2 text-white"
        />
        <button onClick={handleSubmit} className="bg-blue-500 p-2 rounded-md font-semibold">
          Login
        </button>
      </div>
    </div>
  );
}