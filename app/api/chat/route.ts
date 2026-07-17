import { NextResponse, NextRequest } from "next/server";
import { getRelevantKnowledge } from "@/app/lib/rag";
import { generateResponse } from "@/app/lib/ai";
import {
  SIMILARITY_THRESHOLD,
  MAX_QUESTION_LENGTH,
  SYSTEM_PROMPT,
} from "@/app/lib/constants";
import { logError, newRequestId } from "@/app/lib/logger";

const NO_VIEW_MESSAGE = "I don't have Sumer's view on this topic";

export async function POST(request: NextRequest) {
  const requestId = newRequestId();
  const body = await request.json().catch(() => null);
  const question: string | undefined = body?.question;

  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { error: "A 'question' string is required." },
      { status: 400 }
    );
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Question must be ≤ ${MAX_QUESTION_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    const knowledge = await getRelevantKnowledge(question);
    const relevant = knowledge.filter(
      (k) => k.similarity >= SIMILARITY_THRESHOLD
    );

    if (relevant.length === 0) {
      return NextResponse.json({ answer: NO_VIEW_MESSAGE, sources: [] });
    }

    const context = relevant
      .map((k) => `Title: ${k.title}\nCategory: ${k.category}\n${k.chunk_text}`)
      .join("\n\n---\n\n");

    const prompt = `${SYSTEM_PROMPT}\n\nHere is the knowledge:\n${context}\n\nUser question: ${question}`;

    const answer = await generateResponse(prompt, context);

    const sources = relevant.map((k) => ({
      knowledgeId: k.knowledge_id,
      title: k.title,
      category: k.category,
      similarity: k.similarity,
    }));

    return NextResponse.json({ answer, sources });
  } catch (err) {
    logError("POST /api/chat", err, requestId);
    return NextResponse.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 502 }
    );
  }
}
