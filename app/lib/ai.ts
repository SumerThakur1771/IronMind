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

// Free models (primary): zero cost. They share an upstream rate-limit pool and
// throttle intermittently (HTTP 429), so we try several — across different
// providers — in order and fall through on transient failures rather than
// depending on any single one being up. All ids verified live on OpenRouter.
const FREE_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
];

// Paid fallback (last resort): a cheap, low-latency, reliable model used only
// when every free model is throttled/unavailable, so credits are spent only when
// they have to be. ~$0.10 / 1M input, ~$0.40 / 1M output.
const PAID_FALLBACK = "google/gemini-2.5-flash-lite";

// Full attempt order: all free models first, then the paid fallback.
const MODEL_CHAIN = [...FREE_MODELS, PAID_FALLBACK];

// Longest we wait on one model before moving on to the next.
const MODEL_TIMEOUT_MS = 10_000;

// Short error text for lastError: names timeouts, otherwise the error message.
function describeError(err: unknown): string {
  if (err instanceof Error && err.name === "TimeoutError") {
    return `timed out after ${MODEL_TIMEOUT_MS / 1000}s`;
  }
  return err instanceof Error ? err.message : String(err);
}

// Combine the caller's signal with a per-model timeout. Without
// AbortSignal.any, fall back to the timeout alone.
function withCallerSignal(timeoutSignal: AbortSignal, caller?: AbortSignal): AbortSignal {
  if (!caller) return timeoutSignal;
  return typeof AbortSignal.any === "function"
    ? AbortSignal.any([caller, timeoutSignal])
    : timeoutSignal;
}

function buildContent(prompt: string, context: string): string {
  return `Use the following context to answer the question.\n\nContext:\n${context}\n\nQuestion:\n${prompt}`;
}

export async function generateResponse(prompt: string, context: string): Promise<string> {
  const content = buildContent(prompt, context);

  let lastError = "";
  for (const model of MODEL_CHAIN) {
    let res: Response;
    let errorBody: string;
    try {
      res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content }],
        }),
        signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
        lastError = `${model}: empty response`;
        continue;
      }
      errorBody = await res.text();
    } catch (err) {
      // Network error or timeout → try the next model.
      lastError = `${model} -> ${describeError(err)}`;
      continue;
    }

    // Only auth errors (401/403) are fatal — every model would fail the same
    // way. Anything else (429, 5xx, or a 400/404 from a retired model) falls
    // through to the next model in the chain.
    lastError = `${model} -> ${res.status}: ${errorBody}`;
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Generation request failed (${lastError})`);
    }
  }

  throw new Error(`All generation models failed. Last error: ${lastError}`);
}

/**
 * Streams the model's answer token-by-token as an async generator of text chunks.
 *
 * The MODEL_CHAIN fallback is used for *connection establishment* only —
 * every failure except an auth error (401/403) falls through to the next
 * model: any other HTTP error, a network error, no first token within 10s, or
 * a 200 that streams nothing. Once tokens are yielded we're committed to that
 * model; a mid-stream failure throws and cannot fall back (the caller has
 * already sent partial text). If the caller's signal aborts, we stop.
 */
export async function* streamResponse(
  prompt: string,
  context: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const content = buildContent(prompt, context);

  let lastError = "";
  for (const model of MODEL_CHAIN) {
    // Per-model timeout for the wait up to the first token. It's cleared once
    // tokens flow, so a long answer isn't cut off partway through.
    const timeout = new AbortController();
    const timer = setTimeout(
      () => timeout.abort(new DOMException("Model timed out", "TimeoutError")),
      MODEL_TIMEOUT_MS,
    );

    try {
      let res: Response;
      try {
        res = await fetch(OPENROUTER_URL, {
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
          signal: withCallerSignal(timeout.signal, signal),
        });
      } catch (err) {
        if (signal?.aborted) throw err; // caller cancelled → stop
        // Network error or timeout → try the next model.
        lastError = `${model} -> ${describeError(err)}`;
        continue;
      }

      if (!res.ok || !res.body) {
        lastError = `${model} -> ${res.status}`;
        // Auth errors (401/403) are fatal → stop. Anything else → next model.
        if (res.status === 401 || res.status === 403) {
          throw new Error(`Streaming request failed (${lastError})`);
        }
        continue;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let yieldedAny = false;

      try {
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
                if (!yieldedAny) clearTimeout(timer);
                yieldedAny = true;
                yield token;
              }
            } catch {
              // ignore malformed SSE frames
            }
          }
        }
      } catch (err) {
        // Failed before the first token (e.g. timed out) → try the next model.
        // After the first token, or if the caller cancelled, we can't.
        if (yieldedAny || signal?.aborted) throw err;
        lastError = `${model} -> ${describeError(err)}`;
        continue;
      }

      if (yieldedAny) return;
      // 200 but produced no tokens → try the next model.
      lastError = `${model}: empty stream`;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`All streaming models failed. Last error: ${lastError}`);
}
