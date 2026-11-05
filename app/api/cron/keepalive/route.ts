import prisma from "@/app/lib/prisma";
import { logError, newRequestId } from "@/app/lib/logger";
import { NextResponse, NextRequest } from "next/server";

// Called daily by Vercel Cron (see vercel.json). Running a tiny query keeps
// the Supabase project active so it isn't paused for inactivity.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Vercel sends "Authorization: Bearer <CRON_SECRET>" on cron requests.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = newRequestId();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (error) {
    logError("cron.keepalive", error, requestId);
    return NextResponse.json({ error: "Database unreachable" }, { status: 500 });
  }
}
