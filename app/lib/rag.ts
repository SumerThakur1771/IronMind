import prisma from "@/app/lib/prisma";
import { generateEmbedding } from "@/app/lib/ai";

export interface RelevantKnowledge {
  knowledge_id: number;
  chunk_text: string;
  title: string;
  category: string;
  similarity: number;
}

export async function getRelevantKnowledge(
  question: string
): Promise<RelevantKnowledge[]> {
  const embedding = await generateEmbedding(question);
  const vector = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRaw<RelevantKnowledge[]>`
    SELECT
      e.knowledge_id,
      e.chunk_text,
      k.title,
      k.category,
      1 - (e.embedding <=> ${vector}::vector) AS similarity
    FROM embeddings e
    JOIN knowledge k ON e.knowledge_id = k.id
    ORDER BY e.embedding <=> ${vector}::vector
    LIMIT 5
  `;

  return results;
}
