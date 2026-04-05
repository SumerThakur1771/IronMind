# Day 8: useEffect and Delete API

## What We Built
- Entries load from database automatically when admin page opens
- Delete button removes entries from database permanently
- Form submit updates UI instantly without needing refresh

## Concepts Learned

### useEffect
- Runs code when a component first appears on screen
- Used to fetch data from API on page load
- Empty dependency array [] means "run once on mount"
- Can't be async directly — define async function inside and call it

### fetch() for GET
- `fetch("/api/knowledge")` makes a GET request (default method)
- `response.json()` extracts the data from the response
- Used inside useEffect to load entries on page open

### fetch() for POST (from Day 7)
- Updated handleSubmit to store the response and add to state
- This makes new entries appear instantly without page refresh

### fetch() for DELETE
- `fetch(`/api/knowledge/${id}`, { method: "DELETE" })` 
- Backticks needed for template literals (inserting id into URL)
- Must specify method: "DELETE" — fetch defaults to GET

### Dynamic API Routes
- `app/api/knowledge/[id]/route.ts` creates a dynamic endpoint
- [id] captures the value from the URL: /api/knowledge/3 → id = "3"
- params is a Promise in Next.js 16 — must be awaited
- URL params are strings — use Number() to convert to integer for database

### Why Both State Update and API Call
- Database = permanent storage (survives refresh)
- React state = what's on screen right now (resets on refresh)
- On submit: save to database AND update state (instant UI update)
- On delete: delete from database AND filter state (instant UI update)
- On page load: useEffect fetches from database to fill state

## Files Created
- `app/api/knowledge/[id]/route.ts` — DELETE endpoint

## Files Changed
- `app/admin/page.tsx` — Added useEffect, updated handleSubmit and handleDelete

## Git Branch
feature/day8-useeffect-and-delete-api

## Next Steps (Day 9)
- Authentication — register and login system
- Users table in database
- Password hashing and JWT tokens
