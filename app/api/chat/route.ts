import { NextResponse, NextRequest } from "next/server";
import { getRelevantKnowledge } from "@/app/lib/rag";
import { generateResponse, streamResponse } from "@/app/lib/ai";
import { getAuth } from "@/app/lib/auth";
import { getVisitorId, newVisitorId } from "@/app/lib/visitor";
import {
  resolveSession,
  insertUserMessage,
  saveAssistantMessage,
} from "@/app/lib/chat-store";
import {
  SIMILARITY_THRESHOLD,
  MAX_QUESTION_LENGTH,
  SYSTEM_PROMPT,
} from "@/app/lib/constants";
import { logError, logInfo, newRequestId } from "@/app/lib/logger";

// Allow enough headroom for the streamed generation to complete.
export const maxDuration = 30;

const NO_VIEW_MESSAGE = "I don't have Sumer's view on this topic";

export async function POST(request: NextRequest) {
  const requestId = newRequestId();
  const body = await request.json().catch(() => null);
  const question: string | undefined = body?.question;
  const requestedSessionId: string | undefined =
    typeof body?.sessionId === "string" ? body.sessionId : undefined;

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

  // --- Identity: the visitor cookie is guaranteed by middleware (and forwarded
  // onto this request). The fallback is purely defensive.
  const visitorId = getVisitorId(request) ?? newVisitorId();
  const userId = getAuth(request)?.userId ?? null;

  // --- Persist the session + user message up front (retry-deduped).
  let sessionId: string;
  try {
    const s = await resolveSession({
      visitorId,
      userId,
      sessionId: requestedSessionId,
      question,
    });
    sessionId = s.id;
    if (!s.skipUserInsert) await insertUserMessage(sessionId, question);
    logInfo("POST /api/chat", "session persisted", requestId, {
      sessionId,
      visitor: visitorId.slice(0, 8),
    });
  } catch (err) {
    logError("POST /api/chat (persist user)", err, requestId);
    return NextResponse.json(
      { error: "Failed to save your message. Please try again." },
      { status: 502 }
    );
  }

  // Attach the session id to a JSON response (the visitor cookie is set by
  // middleware).
  function withMeta(res: NextResponse): NextResponse {
    res.headers.set("X-Chat-Session", sessionId);
    return res;
  }

  // --- RAG (buffered): embed → vector search → sources.
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
      await saveAssistantMessage(sessionId, NO_VIEW_MESSAGE, []);
      return withMeta(
        NextResponse.json({ answer: NO_VIEW_MESSAGE, sources: [] })
      );
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
    return withMeta(
      NextResponse.json(
        { error: "Failed to generate a response. Please try again." },
        { status: 502 }
      )
    );
  }

  // Buffered fallback used when streaming can't be established.
  async function buffered(): Promise<NextResponse> {
    try {
      const answer = await generateResponse(prompt, context);
      await saveAssistantMessage(sessionId, answer, sources);
      return withMeta(NextResponse.json({ answer, sources }));
    } catch (err) {
      logError("POST /api/chat (buffered fallback)", err, requestId);
      return withMeta(
        NextResponse.json(
          { error: "Failed to generate a response. Please try again." },
          { status: 502 }
        )
      );
    }
  }

  // --- Generation (streamed): plain-text token body + sources in a header.
  //     The full answer is accumulated and persisted when the stream closes.
  try {
    const gen = streamResponse(prompt, context);
    const first = await gen.next();

    if (first.done) {
      return buffered();
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let acc = "";
        try {
          if (first.value) {
            acc += first.value;
            controller.enqueue(encoder.encode(first.value));
          }
          for await (const token of gen) {
            acc += token;
            controller.enqueue(encoder.encode(token));
          }
        } catch (err) {
          // Mid-stream failure: keep whatever partial text was sent.
          logError("POST /api/chat (stream)", err, requestId);
        }

        // Persist the assistant answer BEFORE closing the stream. On Vercel the
        // serverless function can be frozen the instant the stream closes, so a
        // save in a post-close `finally` never runs (this is why production had
        // user messages but no assistant messages). Awaiting the write here —
        // while the stream is still open — keeps the function alive until it
        // completes. The client already received every token, so the tiny delay
        // before the stream's "done" is imperceptible.
        if (acc) {
          try {
            await saveAssistantMessage(sessionId, acc, sources);
          } catch (err) {
            logError("POST /api/chat (persist assistant)", err, requestId);
          }
        }

        controller.close();
      },
    });

    const headers = new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Chat-Sources": encodeURIComponent(JSON.stringify(sources)),
      "X-Chat-Session": sessionId,
    });
    return new Response(stream, { headers });
  } catch (err) {
    logError("POST /api/chat (stream connect)", err, requestId);
    return buffered();
  }
}
