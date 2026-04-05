import prisma from "@/app/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.knowledge.delete({ where: { id: Number(id) } });
  return NextResponse.json({ message: "Deleted" });
}
