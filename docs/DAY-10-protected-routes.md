# Day 10: Protected Routes & Login UI

## What We Built
- Login form UI on /login page with email and password inputs
- JWT token stored in browser cookie after login
- Middleware that protects /admin — redirects to /login if no token
- Full authentication flow: login → store token → access admin → logout (delete cookie) → blocked

## Concepts Learned

### Cookies
- Small pieces of data the browser stores and sends with every request
- Set with: document.cookie = `token=${data}; path=/`
- path=/ makes it available on all pages
- Browser automatically includes cookies in every request to the server

### Middleware
- Code that runs BEFORE a page loads — like a security guard at the door
- Lives in middleware.ts at the project root (not inside app/)
- config.matcher specifies which routes to protect
- NextResponse.redirect() sends user to a different page
- NextResponse.next() lets user through
- Edge runtime doesn't support all Node.js libraries (jsonwebtoken doesn't work here)

### try/catch
- Wraps code that might fail
- try block runs the risky code
- catch block runs if try fails — prevents app from crashing
- Used for JWT verification, API calls, database operations

### Login Flow
1. User enters email + password on /login
2. handleSubmit calls POST /api/auth/login
3. Server verifies password, creates JWT token
4. Browser stores token in cookie
5. User redirected to /admin
6. Middleware checks cookie — token exists, lets user through

### Route Protection Flow
1. User visits /admin
2. Middleware runs first
3. Checks for token cookie
4. No cookie → redirect to /login
5. Has cookie → let through to /admin

## Files Created
- middleware.ts — Route protection middleware

## Files Changed
- app/login/page.tsx — Login form with styling and cookie storage

## Git Branch
feature/day10-protected-routes

## Next Steps (Day 11)
- Revision day — review everything built so far
- Then: Gemini API integration and embeddings
