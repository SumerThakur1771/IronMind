import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

export const TOKEN_COOKIE = "token";
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

export type TokenPayload = {
  userId: number;
  email: string;
  role: string;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

/** Returns the verified token payload from the request cookie, or null. */
export function getAuth(request: NextRequest): TokenPayload | null {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Standard options for the auth cookie. */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  };
}
