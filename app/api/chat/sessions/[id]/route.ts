import { NextResponse, NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { getVisitorId } from "@/app/lib/visitor";
import { logError, newRequestId } from "@/app/lib/logger";

// Load one session's messages — scoped to the owning visitor.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const visitorId = getVisitorId(request);
  if (!visitorId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const requestId = newRequestId();
  try {
    const { id } = await params;
    const session = await prisma.chatSession.findFirst({
      where: { id, visitorId },
      select: { id: true, title: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        sources: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ id: session.id, title: session.title, messages });
  } catch (err) {
    logError("GET /api/chat/sessions/[id]", err, requestId);
    return NextResponse.json(
      { error: "Failed to load session." },
      { status: 500 },
    );
  }
}

// Delete a session (and its messages, via cascade) — scoped to the visitor.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const visitorId = getVisitorId(request);
  if (!visitorId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const requestId = newRequestId();
  try {
    const { id } = await params;
    const result = await prisma.chatSession.deleteMany({
      where: { id, visitorId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    logError("DELETE /api/chat/sessions/[id]", err, requestId);
    return NextResponse.json(
      { error: "Failed to delete session." },
      { status: 500 },
    );
  }
}
