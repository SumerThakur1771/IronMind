import prisma from "@/app/lib/prisma";
import { getAuth, isAdmin } from "@/app/lib/auth";
import { logError, newRequestId } from "@/app/lib/logger";
import { NextResponse, NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Deleting from the knowledge base requires an admin session.
  const auth = getAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(auth)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requestId = newRequestId();
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    await prisma.knowledge.delete({ where: { id: numericId } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    logError("DELETE /api/knowledge/[id]", err, requestId);
    return NextResponse.json(
      { error: "Failed to delete entry." },
      { status: 500 },
    );
  }
}
