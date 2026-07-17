import prisma from "@/app/lib/prisma";
import { generateEmbedding } from "@/app/lib/ai";
import { getAuth } from "@/app/lib/auth";
import { NextResponse, NextRequest } from "next/server";

const CATEGORIES = ["nutrition", "training", "recovery", "mindset"];
const MAX_TITLE = 200;
const MAX_CONTENT = 5000;

export async function GET() {
  try {
    const data = await prisma.knowledge.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("knowledge GET error:", err);
    return NextResponse.json(
      { error: "Failed to load knowledge entries." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Require a valid session — this is a write to the knowledge base.
  if (!getAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!title || !category || !content) {
      return NextResponse.json(
        { error: "Title, category, and content are required." },
        { status: 400 },
      );
    }
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${CATEGORIES.join(", ")}.` },
        { status: 400 },
      );
    }
    if (title.length > MAX_TITLE || content.length > MAX_CONTENT) {
      return NextResponse.json(
        {
          error: `Title must be ≤ ${MAX_TITLE} and content ≤ ${MAX_CONTENT} characters.`,
        },
        { status: 400 },
      );
    }

    // Generate the embedding FIRST. If this external call fails, nothing is
    // written — so we never leave a knowledge row without its embedding.
    const embedding = await generateEmbedding(content);
    const vector = `[${embedding.join(",")}]`;

    // Insert the entry and its embedding atomically.
    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.knowledge.create({
        data: { title, category, content },
      });
      await tx.$executeRaw`INSERT INTO embeddings (knowledge_id, chunk_text, embedding) VALUES (${created.id}, ${content}, ${vector}::vector)`;
      return created;
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("knowledge POST error:", err);
    return NextResponse.json(
      { error: "Failed to create knowledge entry." },
      { status: 500 },
    );
  }
}
