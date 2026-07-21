import type { NextRequest } from "next/server";

// Anonymous per-browser identity used to own chat sessions without login.
// HttpOnly so client JS can't read/forge it; the server always derives the
// owner from this cookie (never trusts a client-supplied id).
//
// The cookie is set in middleware (a normal, non-streamed response) rather than
// on the streamed POST /api/chat response, because Vercel's proxy does not
// reliably forward Set-Cookie on a streaming response.
export const VISITOR_COOKIE = "visitor_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** The existing visitor id from the request cookie, or null. */
export function getVisitorId(request: NextRequest): string | null {
  return request.cookies.get(VISITOR_COOKIE)?.value ?? null;
}

/** A fresh visitor id. Uses the global Web Crypto API so it works in both the
 *  Node.js runtime (route handlers) and the Edge runtime (middleware). */
export function newVisitorId(): string {
  return crypto.randomUUID();
}

/** Cookie attributes for setting the visitor id on a response. */
export function visitorCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR,
  };
}
