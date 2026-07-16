# Deployment

How IronMind is deployed and the environment it needs to run in production.

## Architecture

| Layer | Provider | Notes |
|-------|----------|-------|
| App (Next.js) | **Vercel** | Serverless functions (Node.js runtime) for API routes, static/SSR for pages |
| Database | **Supabase** (PostgreSQL + pgvector) | Stores `knowledge`, `embeddings`, `users` |
| Embeddings | **Google Gemini** | `gemini-embedding-001` (768 dims) |
| Text generation | **OpenRouter** | Free models with a fallback chain |

The app is live at `iron-mind-psi.vercel.app`.

## Environment variables

These must be set **in the Vercel project** (Settings → Environment Variables) for the
deployed app, and in a local `.env` for development. `.env` is gitignored and must never
be committed.

| Variable | Used by | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Prisma (`app/lib/prisma.ts`) | Postgres connection string — **see the pooler note below** |
| `GEMINI_API_KEY` | `app/lib/ai.ts` → `generateEmbedding` | Google Gemini embeddings |
| `OPENROUTER_API_KEY` | `app/lib/ai.ts` → `generateResponse` | OpenRouter text generation |
| `JWT_SECRET` | auth routes | Signs/verifies login tokens |

After changing any env var in Vercel, trigger a redeploy so the new value is picked up.

## The IPv6 / connection pooler issue (important)

**Symptom:** the app deploys and loads, but every API route that touches the database
returns HTTP 500 — including a plain read like `GET /api/knowledge`. It works perfectly
on localhost.

**Cause:** Supabase's **direct** connection host is IPv6-only:

```
db.<project-ref>.supabase.co
  A    (IPv4): (none)
  AAAA (IPv6): 2600:1f11:...
```

Vercel serverless functions are **IPv4-only**, so they can never open a connection to the
direct host. Local development works only because a normal machine has IPv6 connectivity.

This is **not** a Prisma adapter problem. `@prisma/adapter-pg` is correct — the API routes
run on Vercel's Node.js runtime (not the Edge runtime), so the Node `pg` driver works fine.
`@prisma/adapter-pg-worker` is for Cloudflare Workers / edge and would be the wrong choice
here. The failure is the connection **host**, not the driver.

**Fix:** point `DATABASE_URL` at the Supabase **connection pooler** (Supavisor), which
resolves to IPv4 (AWS load balancers) and is designed for serverless. Copy the exact string
from **Supabase → Connect → Transaction pooler**:

```
postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Key differences from the direct connection:
- Host is `aws-0-<region>.pooler.supabase.com` (regional, IPv4), not `db.<ref>.supabase.co`
- Username is `postgres.<project-ref>`, not just `postgres`
- Port is `6543` (transaction mode) instead of `5432`

### Direct vs pooler — when to use which

| Use case | Connection | Why |
|----------|-----------|-----|
| Vercel runtime (serverless) | **Transaction pooler**, port 6543 | IPv4-reachable; pools connections across many short-lived function invocations |
| `prisma migrate` (local/CI) | **Direct**, port 5432 | Migrations need a session-mode connection; run from an IPv6-capable machine |

If a password contains special characters (`@ / : ? # & %`), URL-encode them in the
connection string (e.g. `@` → `%40`).

## Serverless connection hygiene

`app/lib/prisma.ts` is written to be safe under serverless:

- **Singleton client** — reused across hot-reloads (dev) and warm invocations (Vercel) so a
  new `pg` Pool isn't created on every module evaluation.
- **Bounded pool** (`max: 3`) — keeps each function instance's footprint small so many
  concurrent instances don't overrun the pooler's client limit.

## Build configuration

The Prisma client is generated to a gitignored path (`app/generated/prisma`), so it does
not exist in a fresh checkout. A `postinstall` script regenerates it during the Vercel
build:

```json
"postinstall": "npx prisma generate"
```

Without this, the Vercel build fails because the generated client is missing at build time.

## Deploy checklist

1. Set all four environment variables in the Vercel project (use the **pooler** URL for
   `DATABASE_URL`).
2. Ensure database migrations are applied to Supabase: `npx prisma migrate deploy`
   (run locally against the **direct** connection).
3. Seed knowledge entries so `/api/chat` has something to retrieve (via the admin form or
   `POST /api/knowledge`, which auto-generates embeddings).
4. Push to `main` (via PR — `main` is protected) to trigger a Vercel deploy.
5. Smoke-test: `GET /api/knowledge` returns data, and `POST /api/chat` returns a grounded
   answer with sources.
