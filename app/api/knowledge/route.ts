import prisma from "@/app/lib/prisma";
import { generateEmbedding } from "@/app/lib/ai";
import { NextResponse, NextRequest } from "next/server";

export async function GET() {
  const data = await prisma.knowledge.findMany();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const entry = await prisma.knowledge.create({
    data: {
      title: body.title,
      category: body.category,
      content: body.content,
    },
  });

  const embedding = await generateEmbedding(entry.content);
  const vector = `[${embedding.join(",")}]`;
  await prisma.$executeRaw`INSERT INTO embeddings (knowledge_id, chunk_text, embedding) VALUES (${entry.id}, ${entry.content}, ${vector}::vector)`;

  return NextResponse.json(entry);
}
