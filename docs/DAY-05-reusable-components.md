# Day 5: Reusable Components & Props

## What We Built
- Extracted form into KnowledgeForm component
- Extracted entry card into KnowledgeCard component
- Connected child components to parent via props

## Concepts Learned

### Component Architecture
- Break large files into small, focused components
- Each component does one thing (form displays inputs, card displays one entry)
- Parent manages state and logic, children handle the visual display
- This is how real React apps are structured at companies

### Props (Passing Data Between Components)
- Parent passes data DOWN to children via props
- Props are like function arguments — the parent calls the child with specific data
- Child receives props and uses them to render UI
- Child never modifies props — they are read-only

### Props Interfaces
- Every component that receives props needs a TypeScript interface
- Interface describes what props the component expects and their types
- Function types: `(value: string) => void` means "takes a string, returns nothing"
- Catches missing or wrong props at compile time

### Component Files Structure
- Components go in `app/components/` folder
- Each component gets its own file
- Files are imported by parent: `import KnowledgeForm from "../components/KnowledgeForm"`
- Components must have `export default` to be importable

### Key Patterns
- State stays in parent, UI goes in children
- `"use client"` needed on any component with event handlers
- `key` prop goes on the element inside `.map()` in the parent, not inside the child component

## Files Created
- `app/components/KnowledgeForm.tsx` — Form component
- `app/components/KnowledgeCard.tsx` — Entry card component

## Files Changed
- `app/admin/page.tsx` — Refactored to use child components

## Git Branch
feature/day5-reusable-components

## Next Steps (Day 6)
- Set up PostgreSQL database (AWS RDS or local)
- Learn SQL basics and database connection
- Save knowledge entries to a real database
