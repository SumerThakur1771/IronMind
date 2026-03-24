# Day 2: Admin Knowledge Form

## What We Built
- Interactive form on /admin page for adding fitness knowledge
- Three inputs: title (text), category (dropdown), content (textarea)
- Submit button that logs values and clears the form

## Concepts Learned

### React State (useState)
- State tracks data that changes over time
- `const [value, setValue] = useState("")` creates a state variable
- When state changes, React re-renders the component automatically

### Event Handling
- `onChange` fires every keystroke on inputs
- `onClick` fires when a button is clicked
- `e.target.value` gives the current value of the input
- Arrow functions `(e) => ...` used inline to handle events

### "use client"
- Next.js components run on the server by default
- Any component using useState or event handlers needs "use client" at the top
- This tells Next.js to run the component in the browser

### Controlled Inputs
- `value={stateVariable}` makes React control the input's value
- Combined with `onChange`, React always knows the current input value
- This pattern is called a "controlled component"

## File Changed
- `app/admin/page.tsx` — Replaced placeholder with interactive form

## Git Branch
feature/day2-admin-knowledge-form

## Next Steps
- Connect form to a database (store knowledge entries)
- Display submitted entries below the form
- Add validation (prevent empty submissions)
