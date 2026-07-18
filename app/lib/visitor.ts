import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

// Anonymous per-browser identity used to own chat sessions without login.
// HttpOnly so client JS can't read/forge it; the server always derives the
// owner from this cookie (never trusts a client-supplied id).
export const VISITOR_COOKIE = "visitor_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** The existing visitor id from the request cookie, or null. */
export function getVisitorId(request: NextRequest): string | null {
  return request.cookies.get(VISITOR_COOKIE)?.value ?? null;
}

/** A fresh visitor id. */
export function newVisitorId(): string {
  return randomUUID();
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

/** Serialize a Set-Cookie header value (for raw `Response`, which has no
 *  cookies API like NextResponse). */
export function serializeVisitorCookie(visitorId: string): string {
  const o = visitorCookieOptions();
  let s = `${VISITOR_COOKIE}=${visitorId}; Path=${o.path}; Max-Age=${o.maxAge}; SameSite=Lax; HttpOnly`;
  if (o.secure) s += "; Secure";
  return s;
}
