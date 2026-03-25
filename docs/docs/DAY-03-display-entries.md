# Day 3: Display Knowledge Entries

## What We Built
- Store submitted knowledge entries in an array using React state
- Display entries below the form as styled cards
- Each entry shows title, category, and content

## Concepts Learned

### Arrays in State
- `useState([])` stores a list of items, not just a single value
- Array state starts empty and grows as user adds entries
- React re-renders the page whenever the array changes

### TypeScript Interfaces
- Interface defines the shape/blueprint of an object
- Not an object itself — just rules for what an object must look like
- Example: `interface KnowledgeEntry { id: number; title: string; ... }`
- TypeScript catches errors if an object doesn't match the interface

### Typed State with Generics
- `useState<KnowledgeEntry[]>([])` tells TypeScript "this state holds an array of KnowledgeEntry objects"
- `<KnowledgeEntry[]>` is a generic — it fills in the blank for what type useState holds
- Without this, TypeScript doesn't know what's in the array

### Rendering Lists with .map()
- `.map()` transforms each item in an array into JSX
- `entries.map((entry) => <div>...</div>)` creates one div per entry
- Every mapped element needs a unique `key` prop so React can track changes
- Use parentheses `()` after arrow when returning multiple lines of JSX

### Immutable State Updates
- Never modify state directly (no `entries.push()`)
- Create a new array: `setEntries([...entries, newEntry])`
- Spread operator `...` copies all existing items into the new array
- React only re-renders when you call the setter function

## File Changed
- `app/admin/page.tsx` — Added array state, interface, entry display

## Git Branch
feature/day3-display-knowledge-entries

## Next Steps
- Add delete functionality for entries
- Add validation (prevent empty submissions)
- Connect to a real database (PostgreSQL)

## Interview Talking Points
- "I used TypeScript interfaces to define data shapes, ensuring type safety across the app"
- "I implemented controlled forms in React with useState for real-time state tracking"
- "I followed React's immutability principle using spread operator for state updates"
