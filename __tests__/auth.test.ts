import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-pw"), compare: vi.fn() },
}));
vi.mock("@/app/lib/rate-limit", () => ({
  rateLimit: () => true,
  getClientIp: () => "test-ip",
}));

import prisma from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

function req(url: string, body: unknown) {
  return new NextRequest(url, { method: "POST", body: JSON.stringify(body) });
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-value-at-least-32-characters-long!";
  process.env.INVITE_CODE = "invite-123";
});
beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/register", () => {
  it("creates a user and does NOT return the password hash (201)", async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: 1, email: "a@b.com" });

    const res = await registerPOST(
      req("http://localhost/api/auth/register", {
        email: "a@b.com",
        password: "password123",
        inviteCode: "invite-123",
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ id: 1, email: "a@b.com" });
    expect(data.passwordHash).toBeUndefined();
  });

  it("rejects a duplicate email (400)", async () => {
    db.user.findUnique.mockResolvedValue({ id: 1, email: "a@b.com" });
    const res = await registerPOST(
      req("http://localhost/api/auth/register", {
        email: "a@b.com",
        password: "password123",
        inviteCode: "invite-123",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing/invalid invite code (403)", async () => {
    const res = await registerPOST(
      req("http://localhost/api/auth/register", {
        email: "a@b.com",
        password: "password123",
        inviteCode: "wrong",
      }),
    );
    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token cookie + role on valid credentials", async () => {
    db.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@b.com",
      passwordHash: "hashed-pw",
      role: "user",
    });
    (bcrypt.compare as any).mockResolvedValue(true);

    const res = await loginPOST(
      req("http://localhost/api/auth/login", {
        email: "a@b.com",
        password: "password123",
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.role).toBe("user");
    expect(res.cookies.get("token")?.value).toBeTruthy();
  });

  it("returns 401 on a wrong password", async () => {
    db.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@b.com",
      passwordHash: "hashed-pw",
      role: "user",
    });
    (bcrypt.compare as any).mockResolvedValue(false);
    const res = await loginPOST(
      req("http://localhost/api/auth/login", {
        email: "a@b.com",
        password: "nope",
      }),
    );
    expect(res.status).toBe(401);
  });
});
