import prisma from "@/app/lib/prisma";
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

  return NextResponse.json(entry);
}
