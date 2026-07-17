import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";
import { NextResponse, NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Require a valid session — this deletes from the knowledge base.
  if (!getAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    await prisma.knowledge.delete({ where: { id: numericId } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    // Prisma throws P2025 when the row doesn't exist.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    console.error("knowledge DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete entry." },
      { status: 500 },
    );
  }
}
