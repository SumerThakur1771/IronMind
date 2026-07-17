import prisma from "@/app/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/app/lib/rate-limit";
import { logError, newRequestId } from "@/app/lib/logger";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const requestId = newRequestId();

  const ip = getClientIp(request);
  if (!rateLimit("register", ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const inviteCode =
      typeof body?.inviteCode === "string" ? body.inviteCode : "";

    // Registration is invite-only. If no INVITE_CODE is configured, or the
    // provided code doesn't match, registration is closed.
    const expectedInvite = process.env.INVITE_CODE;
    if (!expectedInvite || inviteCode !== expectedInvite) {
      return NextResponse.json(
        { error: "A valid invite code is required to register." },
        { status: 403 },
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash: hashedPassword },
    });

    // Never return the password hash to the client.
    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 },
    );
  } catch (err) {
    logError("POST /api/auth/register", err, requestId);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
