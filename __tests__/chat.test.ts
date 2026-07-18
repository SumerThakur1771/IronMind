import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/lib/rag", () => ({ getRelevantKnowledge: vi.fn() }));
vi.mock("@/app/lib/ai", () => ({
  streamResponse: vi.fn(),
  generateResponse: vi.fn(),
}));
vi.mock("@/app/lib/chat-store", () => ({
  resolveSession: vi.fn().mockResolvedValue({ id: "sess1", skipUserInsert: false }),
  insertUserMessage: vi.fn(),
  saveAssistantMessage: vi.fn(),
}));
vi.mock("@/app/lib/visitor", () => ({
  getVisitorId: () => "visitor-1",
  newVisitorId: () => "new-visitor",
  VISITOR_COOKIE: "visitor_id",
  visitorCookieOptions: () => ({}),
  serializeVisitorCookie: () => "visitor_id=x",
}));
vi.mock("@/app/lib/auth", () => ({ getAuth: () => null }));

import { getRelevantKnowledge } from "@/app/lib/rag";
import { streamResponse, generateResponse } from "@/app/lib/ai";
import { POST } from "@/app/api/chat/route";

/* eslint-disable @typescript-eslint/no-explicit-any */
function req(body: unknown) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/chat", () => {
  it("returns an answer with sources when relevant knowledge is found", async () => {
    (getRelevantKnowledge as any).mockResolvedValue([
      {
        knowledge_id: 1,
        title: "Protein Requirements",
        category: "nutrition",
        chunk_text: "Aim for 1.6-2.2 g/kg.",
        similarity: 0.72,
      },
    ]);
    // Empty stream -> route transparently falls back to a buffered answer (JSON).
    (streamResponse as any).mockImplementation(async function* () {});
    (generateResponse as any).mockResolvedValue(
      "Aim for 1.6-2.2 grams of protein per kilogram of bodyweight.",
    );

    const res = await POST(req({ question: "How much protein should I eat?" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answer).toContain("protein");
    expect(data.sources).toHaveLength(1);
    expect(data.sources[0].title).toBe("Protein Requirements");
    expect(res.headers.get("X-Chat-Session")).toBe("sess1");
  });

  it("returns the no-view message when nothing clears the threshold", async () => {
    (getRelevantKnowledge as any).mockResolvedValue([
      {
        knowledge_id: 2,
        title: "Irrelevant",
        category: "mindset",
        chunk_text: "x",
        similarity: 0.1,
      },
    ]);
    const res = await POST(req({ question: "What's the capital of France?" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answer.toLowerCase()).toContain("don't have");
    expect(data.sources).toEqual([]);
  });

  it("validates an empty question (400)", async () => {
    const res = await POST(req({ question: "   " }));
    expect(res.status).toBe(400);
  });
});
