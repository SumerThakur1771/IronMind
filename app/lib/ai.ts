const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${GEMINI_BASE}/gemini-embedding-001:embedContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey(),
    },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });

  if (!res.ok) {
    throw new Error(`Embedding request failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function openRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  return key;
}

// OpenRouter free models share an upstream rate-limit pool and throttle
// intermittently (HTTP 429), so we try several in order and fall through on
// transient failures rather than depending on any single model being up.
const FREE_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-nano-9b-v2:free",
];

export async function generateResponse(prompt: string, context: string): Promise<string> {
  const content = `Use the following context to answer the question.\n\nContext:\n${context}\n\nQuestion:\n${prompt}`;

  let lastError = "";
  for (const model of FREE_MODELS) {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey()}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
      lastError = `${model}: empty response`;
      continue;
    }

    // 429 (rate-limited) and 5xx (provider hiccup) are transient — try the
    // next model. Other statuses (400/401/403) are fatal, so stop early.
    lastError = `${model} -> ${res.status}: ${await res.text()}`;
    if (res.status !== 429 && res.status < 500) {
      throw new Error(`Generation request failed (${lastError})`);
    }
  }

  throw new Error(`All generation models failed. Last error: ${lastError}`);
}
