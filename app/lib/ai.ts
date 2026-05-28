const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${GEMINI_BASE}/text-embedding-004:embedContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey(),
    },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text }] },
    }),
  });

  if (!res.ok) {
    throw new Error(`Embedding request failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

export async function generateResponse(prompt: string, context: string): Promise<string> {
  const res = await fetch(`${GEMINI_BASE}/gemini-2.0-flash:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey(),
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Use the following context to answer the question.\n\nContext:\n${context}\n\nQuestion:\n${prompt}`,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Generation request failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
