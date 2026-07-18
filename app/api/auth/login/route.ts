import prisma from "@/app/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, TOKEN_COOKIE, authCookieOptions } from "@/app/lib/auth";
import { rateLimit, getClientIp } from "@/app/lib/rate-limit";
import { logError, newRequestId } from "@/app/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = newRequestId();

  const ip = getClientIp(request);
  if (!rateLimit("login", ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Generic message to avoid user enumeration.
    const invalid = NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
    if (!user) return invalid;

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) return invalid;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      email: user.email,
      role: user.role,
    });
    response.cookies.set(TOKEN_COOKIE, token, authCookieOptions());
    return response;
  } catch (err) {
    logError("POST /api/auth/login", err, requestId);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
