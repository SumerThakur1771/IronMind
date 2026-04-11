# Day 9: Authentication

## What We Built
- User registration endpoint (POST /api/auth/register)
- User login endpoint (POST /api/auth/login)
- Password hashing with bcrypt
- JWT token generation on login
- Users table in database via Prisma migration

## Concepts Learned

### Password Hashing
- Never store plain text passwords in the database
- bcrypt.hash(password, 10) converts plain text to scrambled string
- bcrypt.compare(plainText, hash) checks if a password matches the hash
- Salt rounds (10) = how many times it scrambles, more = more secure but slower

### JWT (JSON Web Tokens)
- A token the server creates after successful login
- Contains user info (id, email, role) encoded inside
- Browser stores it and sends it with future requests
- Server uses a secret key (JWT_SECRET) to create and verify tokens
- Like a VIP wristband — proves who you are without re-entering credentials

### Prisma Migrations
- npx prisma migrate dev creates tables from schema changes
- Prisma keeps a diary of all migrations
- Had to reset database because knowledge table was created outside Prisma
- From now on, all table changes go through Prisma migrations

### process.env
- How Node.js accesses environment variables from .env file
- process = current program, .env = environment variables
- The ! operator tells TypeScript "I promise this value exists"

### API Design Patterns
- POST for both register and login (sensitive data never in URL)
- Check if email exists before creating (prevent duplicates)
- findUnique to search by unique field (email)
- Return appropriate error messages for different failure cases

## Files Created
- app/api/auth/register/route.ts — Registration endpoint
- app/api/auth/login/route.ts — Login endpoint
- prisma/migrations/ — Initial migration with knowledge + users tables

## Files Changed
- prisma/schema.prisma — Added User model
- .env — Added JWT_SECRET

## Database Changes
- Created users table (id, email, password_hash, role, created_at)
- Sumer's account created with admin role

## Git Branch
feature/day9-authentication

## Next Steps (Day 10)
- Protect /admin route — only logged-in admins can access
- Build login form UI
- Store JWT token in browser
- Next.js middleware for route protection
