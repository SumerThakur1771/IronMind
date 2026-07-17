import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const loginUrl = new URL("/login", request.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify the signature and expiry — not just that a cookie exists.
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    // Invalid or expired token — clear it and send to login.
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }
}
