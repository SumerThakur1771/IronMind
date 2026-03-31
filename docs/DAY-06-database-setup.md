# Day 6: Database Setup

## What We Built
- Installed PostgreSQL locally on Mac
- Created the ironmind database and knowledge table
- Set up Prisma ORM to connect Next.js to PostgreSQL
- Generated Prisma client for type-safe database queries

## Concepts Learned

### PostgreSQL
- A relational database that stores data in tables (rows and columns)
- `brew install postgresql@17` installs it on Mac
- `brew services start postgresql@17` runs it as a background service
- `createdb ironmind` creates a new database
- `psql ironmind` opens an interactive terminal to the database

### SQL Basics
- `CREATE TABLE` — defines a table with columns and types
- `INSERT INTO` — adds a row of data
- `SELECT * FROM` — reads all rows from a table
- `DELETE FROM ... WHERE` — removes specific rows
- `SERIAL PRIMARY KEY` — auto-incrementing unique ID
- `DEFAULT NOW()` — auto-fills current timestamp

### Prisma ORM
- A translator between TypeScript and PostgreSQL
- `schema.prisma` — describes your database structure in Prisma's language
- `prisma.config.ts` — tells Prisma where the database is
- `.env` — holds the DATABASE_URL (never committed to Git)
- `npx prisma db pull` — checks if schema matches actual database
- `npx prisma generate` — auto-generates TypeScript code for queries
- `@prisma/adapter-pg` — adapter for connecting to PostgreSQL in Prisma 7

### DATABASE_URL
- Connection string: `postgresql://username@localhost:5432/dbname`
- Stored in `.env` file (secret, not committed)
- Read by Prisma to know where to connect

## Files Created
- `prisma/schema.prisma` — Database schema definition
- `prisma.config.ts` — Prisma configuration
- `app/lib/prisma.ts` — Prisma client instance for the app
- `app/generated/prisma/` — Auto-generated Prisma client code
- `.env` — Environment variables (DATABASE_URL)

## Git Branch
feature/day6-database-connection

## Next Steps (Day 7)
- Create API routes (POST and GET for knowledge entries)
- Connect the admin form to save entries to the database
- Learn about server-side code vs client-side code
