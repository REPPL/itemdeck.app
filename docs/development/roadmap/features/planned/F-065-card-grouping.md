# F-065: Card Grouping

## Problem Statement

When browsing large collections, users may want to see cards organised by category (platform, year, genre) with visual section breaks. The current flat grid shows all cards together without grouping capability.

## Design Approach

Allow users to group cards by a selected attribute, displaying collapsible section headers with counts. Cards within each group can still be sorted independently.

### Grouped View Layout

```
┌────────────────────────────────────────────────────────────┐
│ ▼ Game Boy (12 cards)                                      │
├────────────────────────────────────────────────────────────┤
│ [Card] [Card] [Card] [Card]                                │
│ [Card] [Card] [Card] [Card]                                │
│ [Card] [Card] [Card] [Card]                                │
├────────────────────────────────────────────────────────────┤
│ ▶ NES (8 cards)                          [collapsed]       │
├────────────────────────────────────────────────────────────┤
│ ▼ SNES (15 cards)                                          │
├────────────────────────────────────────────────────────────┤
│ [Card] [Card] [Card] [Card]                                │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

### Group By Options

| Field | Path | Description |
|-------|------|-------------|
| Platform | `categoryTitle` | Group by gaming platform |
| Year | `year` | Group by release year |
| Decade | `year` (computed) | Group by decade (1980s, 1990s) |
| Genre | `genres[0]` | Group by primary genre |
| None | `null` | No grouping (default) |

### Key Design Decisions

1. **Collapsible Sections**: Click header to expand/collapse
2. **Persist Collapsed State**: Remember which groups are collapsed
3. **Card Count Badge**: Show count in each group header
4. **Sort Within Groups**: Apply sort settings within each group
5. **Keyboard Navigation**: Arrow keys navigate across group boundaries

### Technical Implementation

**State Management (settingsStore.ts):**
```typescript
groupByField: string | null;  // null = no grouping
collapsedGroups: string[];    // List of collapsed group keys
setGroupByField: (field: string | null) => void;
toggleGroupCollapse: (groupKey: string) => void;
expandAllGroups: () => void;
collapseAllGroups: () => void;
```

**Grouping Logic (CardGrid.tsx):**
```typescript
const groupedCards = useMemo(() => {
  if (!groupByField) return { ungrouped: sortedCards };

  return sortedCards.reduce((groups, card) => {
    const key = String(resolveFieldPath(card, groupByField) ?? 'Unknown');
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
    return groups;
  }, {} as Record<string, DisplayCard[]>);
}, [sortedCards, groupByField]);
```

## Implementation Tasks

- [ ] Add grouping state to `settingsStore.ts`
- [ ] Create `CardGroup` component with collapsible header
- [ ] Implement group header with count badge
- [ ] Modify `CardGrid.tsx` to render grouped sections
- [ ] Handle collapse/expand state persistence
- [ ] Add grouping control to settings panel or toolbar
- [ ] Maintain keyboard navigation across groups
- [ ] Handle empty groups gracefully
- [ ] Add "Expand All" / "Collapse All" controls
- [ ] Ensure group headers are accessible
- [ ] Write tests for grouping logic

## Success Criteria

- [ ] Cards group by platform, year, or genre
- [ ] Group headers show card count
- [ ] Clicking header toggles collapse/expand
- [ ] Collapsed state persists across sessions
- [ ] Sorting applies within each group
- [ ] Keyboard navigation works across groups
- [ ] "None" option returns to flat grid
- [ ] Screen readers announce group structure

## Dependencies

- **Requires**: v0.2.0 (card data)
- **Uses**: `fieldPathResolver.ts` for nested field access
- **Related**: F-036 Card Filtering, F-037 Card Sorting

## Complexity

Medium

## Milestone

v0.11.0

---

## Related Documentation

- [Card Filtering](./F-036-card-filtering.md)
- [Card Sorting](./F-037-card-sorting.md)
- [v0.11.0 Milestone](../../milestones/v0.11.0.md)

---

**Status**: Planned
