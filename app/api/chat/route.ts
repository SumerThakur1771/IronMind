import { NextResponse, NextRequest } from "next/server";
import { getRelevantKnowledge } from "@/app/lib/rag";
import { generateResponse, streamResponse } from "@/app/lib/ai";
import {
  SIMILARITY_THRESHOLD,
  MAX_QUESTION_LENGTH,
  SYSTEM_PROMPT,
} from "@/app/lib/constants";
import { logError, newRequestId } from "@/app/lib/logger";

// Allow enough headroom for the streamed generation to complete.
export const maxDuration = 30;

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

  // --- RAG (buffered): embed → vector search → sources. Fast, needed up front.
  let context: string;
  let prompt: string;
  let sources: Array<{
    knowledgeId: number;
    title: string;
    category: string;
    similarity: number;
  }>;
  try {
    const knowledge = await getRelevantKnowledge(question);
    const relevant = knowledge.filter(
      (k) => k.similarity >= SIMILARITY_THRESHOLD
    );

    if (relevant.length === 0) {
      return NextResponse.json({ answer: NO_VIEW_MESSAGE, sources: [] });
    }

    context = relevant
      .map((k) => `Title: ${k.title}\nCategory: ${k.category}\n${k.chunk_text}`)
      .join("\n\n---\n\n");
    prompt = `${SYSTEM_PROMPT}\n\nHere is the knowledge:\n${context}\n\nUser question: ${question}`;
    sources = relevant.map((k) => ({
      knowledgeId: k.knowledge_id,
      title: k.title,
      category: k.category,
      similarity: k.similarity,
    }));
  } catch (err) {
    logError("POST /api/chat (rag)", err, requestId);
    return NextResponse.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 502 }
    );
  }

  // Buffered fallback used when streaming can't be established.
  async function buffered(): Promise<NextResponse> {
    try {
      const answer = await generateResponse(prompt, context);
      return NextResponse.json({ answer, sources });
    } catch (err) {
      logError("POST /api/chat (buffered fallback)", err, requestId);
      return NextResponse.json(
        { error: "Failed to generate a response. Please try again." },
        { status: 502 }
      );
    }
  }

  // --- Generation (streamed): plain-text token body + sources in a header.
  try {
    const gen = streamResponse(prompt, context);
    const first = await gen.next();

    // Streaming produced nothing → transparently fall back to a buffered answer.
    if (first.done) {
      return buffered();
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (first.value) controller.enqueue(encoder.encode(first.value));
          for await (const token of gen) {
            controller.enqueue(encoder.encode(token));
          }
        } catch (err) {
          // Mid-stream failure: keep whatever partial text was sent, then close.
          logError("POST /api/chat (stream)", err, requestId);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Chat-Sources": encodeURIComponent(JSON.stringify(sources)),
      },
    });
  } catch (err) {
    // Could not open a stream from any model → buffered fallback.
    logError("POST /api/chat (stream connect)", err, requestId);
    return buffered();
  }
}
