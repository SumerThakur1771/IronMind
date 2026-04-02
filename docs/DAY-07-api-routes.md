# Day 7: API Routes

## What We Built
Created server-side API endpoints that connect the admin form to PostgreSQL.
Entries are now saved permanently — refreshing the page no longer wipes them.

## Endpoints
- `GET /api/knowledge` — fetches all knowledge entries from the database
- `POST /api/knowledge` — receives form data and saves a new entry to the database

## Concepts Learned
- **API routes** — server-side code that acts as middleman between browser and database
- **HTTP methods** — GET for reading data, POST for creating data
- **Request body** — data attached to a POST request, read with `request.json()`
- **NextRequest / NextResponse** — Next.js types for handling incoming requests and sending responses
- **fetch()** — how the frontend calls an API endpoint
- **JSON.stringify()** — converts a JavaScript object to JSON format before sending
- **Headers** — metadata attached to a request telling the server what format the data is in

## Files Changed
- `app/api/knowledge/route.ts` — created (GET and POST handlers)
- `app/admin/page.tsx` — updated handleSubmit to use fetch() instead of React state
