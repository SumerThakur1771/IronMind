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

function buildContent(prompt: string, context: string): string {
  return `Use the following context to answer the question.\n\nContext:\n${context}\n\nQuestion:\n${prompt}`;
}

export async function generateResponse(prompt: string, context: string): Promise<string> {
  const content = buildContent(prompt, context);

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

/**
 * Streams the model's answer token-by-token as an async generator of text chunks.
 *
 * The FREE_MODELS fallback chain is used for *connection establishment* only —
 * a 429/5xx (or a 200 that streams nothing) falls through to the next model.
 * Once tokens are yielded we're committed to that model; a mid-stream failure
 * throws and cannot fall back (the caller has already sent partial text).
 */
export async function* streamResponse(
  prompt: string,
  context: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const content = buildContent(prompt, context);

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
        stream: true,
      }),
      signal,
    });

    if (!res.ok || !res.body) {
      lastError = `${model} -> ${res.status}`;
      // Transient (429/5xx) → try the next model. Fatal 4xx → stop.
      if (res.status !== 429 && res.status < 500) {
        throw new Error(`Streaming request failed (${lastError})`);
      }
      continue;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let yieldedAny = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // keep the last (possibly partial) line for the next chunk
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue; // keep-alive comment
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;

        try {
          const json = JSON.parse(data);
          const token: string | undefined = json.choices?.[0]?.delta?.content;
          if (token) {
            yieldedAny = true;
            yield token;
          }
        } catch {
          // ignore malformed SSE frames
        }
      }
    }

    if (yieldedAny) return;
    // 200 but produced no tokens → try the next model.
    lastError = `${model}: empty stream`;
  }

  throw new Error(`All streaming models failed. Last error: ${lastError}`);
}
