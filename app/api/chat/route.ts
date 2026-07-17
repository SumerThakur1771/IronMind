import { NextResponse, NextRequest } from "next/server";
import { getRelevantKnowledge } from "@/app/lib/rag";
import { generateResponse } from "@/app/lib/ai";

const SIMILARITY_THRESHOLD = 0.3;
const NO_VIEW_MESSAGE = "I don't have Sumer's view on this topic";

const MAX_QUESTION = 1000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const question: string | undefined = body?.question;

  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { error: "A 'question' string is required." },
      { status: 400 }
    );
  }
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { error: `Question must be ≤ ${MAX_QUESTION} characters.` },
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

    const prompt = `You are IronMind AI, a fitness coach that answers ONLY based on Sumer's principles. Use ONLY the following knowledge to answer. If the knowledge doesn't cover the question, say you don't have Sumer's view on this. Here is the knowledge: ${context}. Question: ${question}`;

    const answer = await generateResponse(prompt, context);

    const sources = relevant.map((k) => ({
      knowledgeId: k.knowledge_id,
      title: k.title,
      category: k.category,
      similarity: k.similarity,
    }));

    return NextResponse.json({ answer, sources });
  } catch (err) {
    console.error("chat error:", err);
    return NextResponse.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 502 }
    );
  }
}
