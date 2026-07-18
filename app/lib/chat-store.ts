import prisma from "@/app/lib/prisma";

export type SourceRow = {
  knowledgeId: number;
  title: string;
  category: string;
  similarity: number;
};

/**
 * Find the session (owned by this visitor) or create a new one. Also decides
 * whether the incoming user message should be inserted — if the session's last
 * message is an identical *unanswered* user message, this is a retry, so we
 * skip re-inserting to avoid duplicates.
 */
export async function resolveSession(opts: {
  visitorId: string;
  userId: number | null;
  sessionId?: string | null;
  question: string;
}): Promise<{ id: string; skipUserInsert: boolean }> {
  const { visitorId, userId, sessionId, question } = opts;

  if (sessionId) {
    const existing = await prisma.chatSession.findFirst({
      where: { id: sessionId, visitorId },
      select: { id: true },
    });
    if (existing) {
      const last = await prisma.chatMessage.findFirst({
        where: { sessionId: existing.id },
        orderBy: { createdAt: "desc" },
        select: { role: true, content: true },
      });
      const skipUserInsert =
        last?.role === "user" && last.content === question;
      return { id: existing.id, skipUserInsert };
    }
  }

  const created = await prisma.chatSession.create({
    data: {
      visitorId,
      userId: userId ?? undefined,
      title: question.slice(0, 60),
    },
    select: { id: true },
  });
  return { id: created.id, skipUserInsert: false };
}

export async function insertUserMessage(sessionId: string, content: string) {
  await prisma.chatMessage.create({
    data: { sessionId, role: "user", content },
  });
}

export async function saveAssistantMessage(
  sessionId: string,
  content: string,
  sources: SourceRow[],
) {
  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { sessionId, role: "assistant", content, sources },
    }),
    prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    }),
  ]);
}
