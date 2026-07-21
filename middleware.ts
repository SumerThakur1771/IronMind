import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  getVisitorId,
  newVisitorId,
  VISITOR_COOKIE,
  visitorCookieOptions,
} from "@/app/lib/visitor";

export const config = {
  // /admin: auth gate. /chat + /api/chat: ensure the anonymous visitor cookie.
  matcher: ["/admin/:path*", "/chat", "/chat/:path*", "/api/chat/:path*"],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // --- Admin: require a valid session (unchanged behavior).
  if (path.startsWith("/admin")) {
    const token = request.cookies.get("token")?.value;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", path);

    if (!token) return NextResponse.redirect(loginUrl);

    const secret = process.env.JWT_SECRET;
    if (!secret) return NextResponse.redirect(loginUrl);

    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      return response;
    }
  }

  // --- Chat pages + API: guarantee an anonymous visitor id.
  // Setting the cookie here (on a normal response) is reliable; setting it on
  // the streamed POST /api/chat response was not (Vercel drops Set-Cookie on
  // streaming responses). We also forward it onto THIS request so the handler
  // sees the id immediately (e.g. a first POST with no prior page load).
  const existing = getVisitorId(request);
  const visitorId = existing ?? newVisitorId();

  const requestHeaders = new Headers(request.headers);
  if (!existing) {
    const cookieHeader = requestHeaders.get("cookie");
    requestHeaders.set(
      "cookie",
      (cookieHeader ? cookieHeader + "; " : "") +
        `${VISITOR_COOKIE}=${visitorId}`,
    );
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (!existing) {
    response.cookies.set(VISITOR_COOKIE, visitorId, visitorCookieOptions());
  }
  return response;
}
