import prisma from "@/app/lib/prisma";
import { generateEmbedding } from "@/app/lib/ai";
import { getAuth, isAdmin } from "@/app/lib/auth";
import {
  CATEGORIES,
  MAX_TITLE_LENGTH,
  MAX_CONTENT_LENGTH,
} from "@/app/lib/constants";
import { logError, newRequestId } from "@/app/lib/logger";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Reading the knowledge base requires authentication.
  if (!getAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = newRequestId();
  try {
    const data = await prisma.knowledge.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json(data);
  } catch (err) {
    logError("GET /api/knowledge", err, requestId);
    return NextResponse.json(
      { error: "Failed to load knowledge entries." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Writing to the knowledge base requires an admin session.
  const auth = getAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(auth)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requestId = newRequestId();
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
    if (title.length > MAX_TITLE_LENGTH || content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          error: `Title must be ≤ ${MAX_TITLE_LENGTH} and content ≤ ${MAX_CONTENT_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    // Generate the embedding FIRST so a failure never orphans a knowledge row.
    const embedding = await generateEmbedding(content);
    const vector = `[${embedding.join(",")}]`;

    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.knowledge.create({
        data: { title, category, content },
      });
      await tx.$executeRaw`INSERT INTO embeddings (knowledge_id, chunk_text, embedding) VALUES (${created.id}, ${content}, ${vector}::vector)`;
      return created;
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    logError("POST /api/knowledge", err, requestId);
    return NextResponse.json(
      { error: "Failed to create knowledge entry." },
      { status: 500 },
    );
  }
}
