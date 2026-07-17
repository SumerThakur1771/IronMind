import "@/app/lib/env"; // validate required env vars at startup (throws if missing)
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Reuse a single client across hot-reloads (dev) and warm serverless
// invocations (Vercel). Creating a new client — and therefore a new pg Pool —
// on every module evaluation exhausts the connection limit of a serverless
// pooler (e.g. Supabase Supavisor) very quickly.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Keep each serverless instance's footprint small so many concurrent
    // functions don't overrun the pooler's client limit.
    max: 3,
  });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
