// Client-side anonymous visitor id, persisted in localStorage.
//
// This is the reliable identity source: unlike cookies, it does not depend on
// Set-Cookie surviving a streamed response or a CDN-cached page (both flaky on
// Vercel). The id is sent as the `X-Visitor-Id` header on every chat request.
const KEY = "ironmind_visitor_id";

export const VISITOR_HEADER = "X-Visitor-Id";

/** Get the stored visitor id, creating and persisting one if absent. */
export function getClientVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode edge cases) — fall back to a
    // per-session id so the current tab still works.
    return crypto.randomUUID();
  }
}

/** Headers object carrying the visitor id, to spread into fetch(). */
export function visitorHeaders(): Record<string, string> {
  return { [VISITOR_HEADER]: getClientVisitorId() };
}
