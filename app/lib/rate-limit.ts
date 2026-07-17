import type { NextRequest } from "next/server";
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from "@/app/lib/constants";

// In-memory fixed-window rate limiter keyed by IP + bucket.
//
// NOTE: this state is per-server-instance, so on serverless it resets across
// cold starts and does NOT coordinate between concurrent instances. It's a
// best-effort brute-force speed bump, not a distributed guarantee. For real
// protection, back this with Upstash/Redis or Vercel KV.
const hits = new Map<string, { count: number; resetAt: number }>();

/** Extract the client IP from proxy headers (best-effort). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * `scope` namespaces limits (e.g. "login" vs "register").
 */
export function rateLimit(scope: string, ip: string): boolean {
  const now = Date.now();
  const key = `${scope}:${ip}`;
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}
