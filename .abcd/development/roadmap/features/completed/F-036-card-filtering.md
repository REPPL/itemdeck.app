# F-036: Card Filtering (with Search)

## Problem Statement

As card collections grow, users need ways to filter and find specific cards. The current implementation shows all cards without filtering capability. A prominent search bar with combined filter chips would improve discoverability.

## Design Approach

Implement a **floating search bar** always visible above the grid, with toggleable filter chips/buttons below. Filters can be combined (AND logic). Filtered-out cards animate out of view, and the grid reflows.

### Search Bar Layout (Primary)

```
┌────────────────────────────────────────────────────────────┐
│ 🔍 Search cards...                                    [✕]  │
├────────────────────────────────────────────────────────────┤
│ Showing 42 of 120 cards                                    │
│ [Platform: Game Boy ✕] [Year: 1990-1995 ✕] [Clear all]    │
└────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Floating Position**: Search bar above grid, always visible (not in settings)
2. **Keyboard Shortcut**: `/` to focus search input
3. **Debounced Input**: 300ms delay before filtering
4. **Result Count**: Display "Showing X of Y cards"
5. **Filter Chips**: Active filters appear as dismissible chips

### Filter Types

| Type | UI | Example |
|------|-----|---------|
| Text search | Input field | Title contains "sunset" |
| Toggle | Button | Favourites only |
| Select | Dropdown | Category = "Nature" |
| Range | Slider | Year 2020-2024 |

### Animation

Cards not matching filter:
1. Scale down slightly (0.95)
2. Fade to 0 opacity
3. Remove from layout (height collapses)
4. Grid reflows with layout animation

### Search Fields (Configurable)

Default fields searched:
- `title` - Card title
- `summary` - Description text
- `verdict` - User verdict/review

### Technical Implementation

**State Management (settingsStore.ts):**
```typescript
searchQuery: string;
searchFields: string[];  // ['title', 'summary', 'verdict']
activeFilters: { field: string; values: string[] }[];
setSearchQuery: (query: string) => void;
clearSearch: () => void;
setFilter: (field: string, values: string[]) => void;
clearFilter: (field: string) => void;
clearAllFilters: () => void;
```

**Filter Logic (CardGrid.tsx):**
```typescript
const searchedCards = useMemo(() => {
  if (!searchQuery.trim()) return selectedCards;
  const query = searchQuery.toLowerCase();
  return selectedCards.filter(card =>
    searchFields.some(field => {
      const value = resolveFieldPath(card, field);
      return String(value ?? '').toLowerCase().includes(query);
    })
  );
}, [selectedCards, searchQuery, searchFields]);
```

## Implementation Tasks

- [ ] Add search/filter state to `settingsStore.ts`
- [ ] Create `SearchBar` component with floating layout
- [ ] Implement debounced text search input
- [ ] Create `FilterChip` component
- [ ] Implement filter dropdown for categories/platform
- [ ] Add year range filter (if applicable)
- [ ] Integrate filter logic in `CardGrid.tsx`
- [ ] Animate card exit/enter on filter change
- [ ] Handle empty state (no matches)
- [ ] Add keyboard shortcut `/` to focus search
- [ ] Persist active filters to URL params (optional)
- [ ] Ensure filter controls accessible
- [ ] Write tests for filter logic

## Success Criteria

- [ ] Text search filters cards by title, summary, verdict
- [ ] Filter chips display and dismiss correctly
- [ ] Multiple filters combine (AND)
- [ ] Cards animate in/out on filter change
- [ ] Empty state shown when no matches
- [ ] `/` keyboard shortcut focuses search
- [ ] Result count displays "Showing X of Y"
- [ ] Search bar is keyboard accessible
- [ ] Screen readers announce filter results count

## Dependencies

- **Requires**: v0.2.0 (card data from GitHub)
- **Uses**: `fieldPathResolver.ts` for nested field access
- **Related**: F-065 Card Grouping, F-067 Statistics Dashboard

## Complexity

Medium

## Milestone

v0.11.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [GitHub Data Source](../completed/F-007-github-data-source.md)
- [v0.11.0 Milestone](../../milestones/v0.11.0.md)

---

**Status**: Complete
