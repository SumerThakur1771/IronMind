# Day 1: Project Setup & Routing

## What We Built
- Initialized Next.js project with TypeScript and Tailwind CSS
- Created the IronMind landing page
- Created placeholder pages: /chat, /admin, /login
- Added navigation between pages using Next.js Link component

## Concepts Learned

### React
- Components are functions that return JSX (HTML-like code)
- Every component must have one default export
- JSX uses className instead of class

### Next.js
- File-based routing: folder name = URL path
- page.tsx is a special filename that creates a route
- layout.tsx wraps all pages, page content becomes {children}
- Link component for fast client-side navigation

### TypeScript
- Basic types: string, number, boolean
- Interfaces define the shape of objects
- import type imports types for checking only
- Function parameters need type annotations
- React.ReactNode = anything React can display

### Tailwind CSS
- Utility classes applied directly via className
- flex, items-center, justify-center for centering
- text-5xl, font-bold for text styling
- hover: prefix for hover states
- mt-4, px-6, py-3 for spacing

## File Structure
```
app/
├── layout.tsx        → Root layout (wraps all pages)
├── globals.css       → Global styles + Tailwind import
├── page.tsx          → Home page (/)
├── chat/page.tsx     → Chat page (/chat)
├── admin/page.tsx    → Admin page (/admin)
└── login/page.tsx    → Login page (/login)
```

## Git Branch
feature/day1-routing-and-structure

## Next Steps (Day 2)
- Learn React state and event handling
- Build interactive components
- Start on the admin knowledge form