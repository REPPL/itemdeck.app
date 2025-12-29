# F-037: Card Sorting (Expanded)

## Problem Statement

Users may want to view cards in a specific order (newest first, alphabetical, by rating, by platform). The current implementation has basic sorting via settings but lacks quick access and additional sort fields.

## Current State

Sorting **already exists** in `ConfigSettingsTabs.tsx`:
- Sort field dropdown (order, title, year, playedSince)
- Sort direction toggle (asc/desc)
- Persists to localStorage via settingsStore

This feature expands the existing implementation.

## Design Approach

1. **Expand sort field options** to include platform, rating, category
2. **Add quick sort buttons** near the search bar for common fields
3. **Consider multi-level sorting** (primary + secondary field)

### Expanded Sort Options

| Field | Path | Description |
|-------|------|-------------|
| Order/Rank | `order` | Custom ordering (existing) |
| Title | `title` | Alphabetical A-Z / Z-A |
| Year | `year` | Release year |
| Played Since | `playedSince` | When user started playing |
| Platform | `platform.shortTitle` | **NEW** - Group by device |
| Category | `categoryTitle` | **NEW** - Category name |
| Rating | `rating.score` | **NEW** - User/external rating |
| Random | (shuffle) | Shuffle (existing feature) |

### Quick Sort Buttons (Optional Enhancement)

```
┌────────────────────────────────────────────────────────────┐
│ Sort by: [Title] [Year ▼] [Platform] [Rating]   [↑↓ Asc]  │
└────────────────────────────────────────────────────────────┘
```

Active sort field highlighted; click toggles, double-click reverses.

### Multi-Level Sort (Optional Enhancement)

```
Primary: [Platform ▼]
Secondary: [Rank ▼]
```

Sort by platform, then by rank within each platform.

### Technical Implementation

**Expand SORT_FIELD_OPTIONS in ConfigSettingsTabs.tsx:**
```typescript
const SORT_FIELD_OPTIONS = [
  { value: "order", label: "Order/Rank" },
  { value: "title", label: "Title" },
  { value: "year", label: "Year" },
  { value: "playedSince", label: "Played Since" },
  { value: "platform.shortTitle", label: "Platform" },  // NEW
  { value: "categoryTitle", label: "Category" },        // NEW
  { value: "rating.score", label: "Rating" },           // NEW
];
```

## Implementation Tasks

- [ ] Expand `SORT_FIELD_OPTIONS` with platform, category, rating
- [ ] Verify `createFieldSortComparator` handles new field paths
- [ ] Add quick sort buttons near search bar (optional)
- [ ] Add secondary sort field support (optional)
- [ ] Animate card position changes (already works)
- [ ] Ensure sort controls accessible
- [ ] Write tests for expanded sort logic

## Success Criteria

- [ ] Cards sort by platform, category, rating
- [ ] Existing sort fields continue to work
- [ ] Direction toggle switches asc/desc
- [ ] Cards animate to new positions
- [ ] Sort preference persists to localStorage
- [ ] Field path resolution works for nested fields

## Dependencies

- **Requires**: v0.2.0 (card data)
- **Uses**: `fieldPathResolver.ts` for nested field access
- **Related**: F-036 Card Filtering (search bar placement)

## Complexity

Small

## Milestone

v0.15.0

---

## Related Documentation

- [Shuffle by Default](../completed/F-027-shuffle-by-default.md)
- [Card Drag and Drop](../completed/F-028-card-drag-and-drop.md)
- [v0.15.0 Milestone](../../milestones/v0.15.0.md)

---

**Status**: Planned
