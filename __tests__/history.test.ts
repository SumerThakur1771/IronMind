import { describe, it, expect } from "vitest";
import { buildHistory, followUpQuery } from "@/app/lib/history";
import {
  HISTORY_MAX_MESSAGES,
  HISTORY_MAX_CHARS,
  HISTORY_MAX_MESSAGE_CHARS,
} from "@/app/lib/constants";

const u = (content: string) => ({ role: "user", content });
const a = (content: string) => ({ role: "assistant", content });

function alternates(turns: { role: string }[]) {
  return turns.every((t, i) => t.role === (i % 2 === 0 ? "user" : "assistant"));
}

describe("buildHistory", () => {
  it("is empty for a first message", () => {
    expect(buildHistory([])).toEqual([]);
    expect(buildHistory([u("How much protein?")])).toEqual([]);
  });

  it("keeps answered questions in order and drops the current question", () => {
    const h = buildHistory([u("protein?"), a("1.6-2.2 g/kg"), u("rest days?")]);
    expect(h).toEqual([
      { role: "user", content: "protein?" },
      { role: "assistant", content: "1.6-2.2 g/kg" },
    ]);
  });

  it("drops unanswered questions and a reply whose question is outside the window", () => {
    const h = buildHistory([
      a("orphan reply"),
      u("failed question"),
      u("protein?"),
      a("answer"),
      u("current"),
    ]);
    expect(h.map((t) => t.content)).toEqual(["protein?", "answer"]);
    expect(alternates(h)).toBe(true);
  });

  it("keeps only the newest exchanges in a 100+ message session", () => {
    const msgs = [];
    for (let i = 0; i < 60; i++) msgs.push(u(`q${i}`), a(`a${i}`));
    const h = buildHistory(msgs);
    expect(h).toHaveLength(HISTORY_MAX_MESSAGES);
    expect(h.at(-1)?.content).toBe("a59");
    expect(h[0].content).toBe(`q${60 - HISTORY_MAX_MESSAGES / 2}`);
    expect(alternates(h)).toBe(true);
  });

  it("cuts a very long message short", () => {
    const h = buildHistory([u("q"), a("x".repeat(50_000))]);
    expect(h[1].content.length).toBe(HISTORY_MAX_MESSAGE_CHARS);
    expect(h[1].content.endsWith("[truncated]")).toBe(true);
  });

  it("stays within the character budget without leaving gaps", () => {
    const long = "y".repeat(HISTORY_MAX_MESSAGE_CHARS);
    const msgs = [];
    for (let i = 0; i < 3; i++) msgs.push(u(`${i}${long}`), a(long));
    const h = buildHistory(msgs);
    const total = h.reduce((n, t) => n + t.content.length, 0);
    expect(total).toBeLessThanOrEqual(HISTORY_MAX_CHARS);
    expect(h.length).toBeGreaterThanOrEqual(2);
    expect(h.at(-1)?.content.length).toBe(HISTORY_MAX_MESSAGE_CHARS); // newest kept
    expect(h[0].content.startsWith(`${3 - h.length / 2}`)).toBe(true); // contiguous
  });
});

describe("followUpQuery", () => {
  it("is null without history", () => {
    expect(followUpQuery([], "protein?")).toBeNull();
  });

  it("adds the last two earlier questions, oldest first", () => {
    const h = buildHistory([u("protein?"), a("x"), u("rest days?"), a("y"), u("z?"), a("w")]);
    expect(followUpQuery(h, "for beginners?")).toBe("rest days?\nz?\nfor beginners?");
  });
});
