import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/lib/prisma", () => ({
  default: {
    knowledge: { findMany: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/app/lib/ai", () => ({ generateEmbedding: vi.fn() }));
vi.mock("@/app/lib/auth", () => ({ getAuth: vi.fn(), isAdmin: vi.fn() }));

import prisma from "@/app/lib/prisma";
import { generateEmbedding } from "@/app/lib/ai";
import { getAuth, isAdmin } from "@/app/lib/auth";
import { GET, POST } from "@/app/api/knowledge/route";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

function req(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(url, init);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/knowledge", () => {
  it("returns 401 without auth", async () => {
    (getAuth as any).mockReturnValue(null);
    const res = await GET(req("http://localhost/api/knowledge"));
    expect(res.status).toBe(401);
  });

  it("returns paginated { entries, total, page, totalPages }", async () => {
    (getAuth as any).mockReturnValue({ userId: 1, role: "admin" });
    db.knowledge.findMany.mockResolvedValue([
      { id: 11, title: "A", category: "nutrition", content: "x" },
    ]);
    db.knowledge.count.mockResolvedValue(25);

    const res = await GET(req("http://localhost/api/knowledge?page=2&limit=10"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(25);
    expect(data.page).toBe(2);
    expect(data.totalPages).toBe(3);
    expect(data.entries).toHaveLength(1);
    // page 2, limit 10 => skip 10, take 10
    expect(db.knowledge.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});

describe("POST /api/knowledge", () => {
  it("creates an entry for an admin (201)", async () => {
    (getAuth as any).mockReturnValue({ userId: 1, role: "admin" });
    (isAdmin as any).mockReturnValue(true);
    (generateEmbedding as any).mockResolvedValue(new Array(768).fill(0));
    db.$transaction.mockResolvedValue({
      id: 5,
      title: "T",
      category: "nutrition",
      content: "C",
    });

    const res = await POST(
      req("http://localhost/api/knowledge", {
        method: "POST",
        body: JSON.stringify({ title: "T", category: "nutrition", content: "C" }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe(5);
  });

  it("rejects a non-admin (403)", async () => {
    (getAuth as any).mockReturnValue({ userId: 2, role: "user" });
    (isAdmin as any).mockReturnValue(false);
    const res = await POST(
      req("http://localhost/api/knowledge", {
        method: "POST",
        body: JSON.stringify({ title: "T", category: "nutrition", content: "C" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("validates required fields (400)", async () => {
    (getAuth as any).mockReturnValue({ role: "admin" });
    (isAdmin as any).mockReturnValue(true);
    const res = await POST(
      req("http://localhost/api/knowledge", {
        method: "POST",
        body: JSON.stringify({ title: "", category: "", content: "" }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
