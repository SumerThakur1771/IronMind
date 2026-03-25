# Day 4: Validation & Delete

## What We Built
- Form validation — prevents submitting empty entries
- Delete button on each entry card
- Alert message when validation fails

## Concepts Learned

### Form Validation
- Check conditions before proceeding: `if (!title || !category || !content)`
- `return` exits the function early, preventing the entry from being added
- `alert()` shows a browser popup message to the user

### Deleting from Array State
- `.filter()` creates a new array excluding the item to delete
- `entries.filter((entry) => entry.id !== id)` keeps everything except the matching id
- Same immutability pattern as adding — never modify state directly, create a new array

### Passing Arguments to Event Handlers
- No arguments: `onClick={handleSubmit}` — pass the function directly
- With arguments: `onClick={() => handleDelete(entry.id)}` — wrap in arrow function
- Without the arrow function wrapper, the function runs immediately on render instead of on click

## File Changed
- `app/admin/page.tsx` — Added validation and delete

## Git Branch
feature/day4-validation-and-delete

## Next Steps (Day 5)
- Break admin page into reusable components (KnowledgeForm, KnowledgeCard)
- Learn React props — passing data between components
