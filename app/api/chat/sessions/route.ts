import { NextResponse, NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { getVisitorId } from "@/app/lib/visitor";
import { logError, logInfo, newRequestId } from "@/app/lib/logger";

// List the current visitor's chat sessions (newest first).
export async function GET(request: NextRequest) {
  const visitorId = getVisitorId(request);
  if (!visitorId) return NextResponse.json([]); // no cookie yet → no history

  const requestId = newRequestId();
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { visitorId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    });
    logInfo("GET /api/chat/sessions", "listed", requestId, {
      visitor: visitorId.slice(0, 8),
      count: sessions.length,
    });
    return NextResponse.json(sessions);
  } catch (err) {
    logError("GET /api/chat/sessions", err, requestId);
    return NextResponse.json(
      { error: "Failed to load sessions." },
      { status: 500 },
    );
  }
}
