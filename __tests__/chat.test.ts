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
  getRecentMessages: vi.fn().mockResolvedValue([]),
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
import { getRecentMessages } from "@/app/lib/chat-store";
import { HISTORY_NOTE } from "@/app/lib/constants";
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

describe("POST /api/chat — conversation memory", () => {
  const protein = {
    knowledge_id: 1,
    title: "Protein Requirements",
    category: "nutrition",
    chunk_text: "Aim for 1.6-2.2 g/kg, every day including rest days.",
    similarity: 0.7,
  };
  const recovery = {
    knowledge_id: 3,
    title: "Rest Days",
    category: "recovery",
    chunk_text: "Rest days are for recovery.",
    similarity: 0.4,
  };
  const earlier = [
    { role: "user", content: "How much protein should I eat?" },
    { role: "assistant", content: "Aim for 1.6-2.2 g/kg." },
  ];

  beforeEach(() => {
    (streamResponse as any).mockImplementation(async function* () {});
    (generateResponse as any).mockResolvedValue("Same on rest days.");
  });

  it("first message: no history, a single search, no history note", async () => {
    (getRelevantKnowledge as any).mockResolvedValue([protein]);
    const res = await POST(req({ question: "How much protein should I eat?" }));
    expect(res.status).toBe(200);
    expect(getRecentMessages).not.toHaveBeenCalled();
    expect(getRelevantKnowledge).toHaveBeenCalledTimes(1);
    const [prompt, , history] = (generateResponse as any).mock.calls[0];
    expect(history).toEqual([]);
    expect(prompt).not.toContain(HISTORY_NOTE);
  });

  it("follow-up: sends earlier turns in order and searches with the earlier question", async () => {
    (getRecentMessages as any).mockResolvedValue([
      ...earlier,
      { role: "user", content: "what about on rest days?" }, // the current question
    ]);
    (getRelevantKnowledge as any).mockImplementation(async (q: string) =>
      q.includes("protein") ? [protein] : [recovery, { ...protein, similarity: 0.2 }],
    );

    const res = await POST(req({ question: "what about on rest days?", sessionId: "sess1" }));
    expect(res.status).toBe(200);

    expect((getRelevantKnowledge as any).mock.calls.map((c: any[]) => c[0])).toEqual([
      "what about on rest days?",
      "How much protein should I eat?\nwhat about on rest days?",
    ]);

    const [prompt, , history] = (generateResponse as any).mock.calls[0];
    expect(history).toEqual(earlier);
    expect((streamResponse as any).mock.calls[0][2]).toEqual(earlier);
    expect(prompt).toContain(HISTORY_NOTE);
    expect(prompt.indexOf("Protein Requirements")).toBeLessThan(prompt.indexOf("Rest Days"));

    const data = await res.json();
    // Protein appears once, at its best similarity.
    expect(data.sources.map((s: any) => [s.title, s.similarity])).toEqual([
      ["Protein Requirements", 0.7],
      ["Rest Days", 0.4],
    ]);
  });

  it("still answers, without memory, if loading history fails", async () => {
    (getRecentMessages as any).mockRejectedValue(new Error("db down"));
    (getRelevantKnowledge as any).mockResolvedValue([protein]);
    const res = await POST(req({ question: "rest days?", sessionId: "sess1" }));
    expect(res.status).toBe(200);
    expect((generateResponse as any).mock.calls[0][2]).toEqual([]);
  });

  it("still answers if one of the two searches fails", async () => {
    (getRecentMessages as any).mockResolvedValue(earlier);
    (getRelevantKnowledge as any)
      .mockRejectedValueOnce(new Error("embedding failed"))
      .mockResolvedValueOnce([protein]);
    const res = await POST(req({ question: "rest days?", sessionId: "sess1" }));
    expect(res.status).toBe(200);
    expect((await res.json()).sources).toHaveLength(1);
  });

  it("ignores history for a session the visitor doesn't own", async () => {
    const { resolveSession } = await import("@/app/lib/chat-store");
    (resolveSession as any).mockResolvedValueOnce({ id: "new-sess", skipUserInsert: false });
    (getRelevantKnowledge as any).mockResolvedValue([protein]);
    await POST(req({ question: "rest days?", sessionId: "someone-elses" }));
    expect(getRecentMessages).not.toHaveBeenCalled();
  });
});
