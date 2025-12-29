# Track D2: Card Sorting (Expanded)

## Features

- F-037: Card Sorting (Expanded)

## Implementation Prompt

```
Implement expanded card sorting functionality.

## F-037: Card Sorting (Expanded)

### 1. Add new sort fields

Update `src/hooks/useCardSorting.ts` (or create if needed):
- Add platform, category, rating as sortable fields
- Support multi-level sorting

### 2. Add quick sort buttons

Update `src/components/SearchBar/SearchBar.tsx`:
- Add quick sort buttons near search input
- Allow one-click sorting by common fields

### 3. Update sort UI

Update sort selector to show all available fields.

## Files to Modify

- src/hooks/useCardSorting.ts
- src/components/SearchBar/SearchBar.tsx
- src/components/SortSelector/ (if exists)

## Success Criteria

- [ ] Platform field sortable
- [ ] Category field sortable
- [ ] Rating field sortable
- [ ] Multi-level sorting supported
- [ ] Quick sort buttons visible near search
- [ ] One-click sorting works
```

---

## Related Documentation

- [F-037 Feature Spec](../../../development/roadmap/features/planned/F-037-card-sorting.md)
