# F-037: Card Sorting

## Problem Statement

Users may want to view cards in a specific order (newest first, alphabetical, by rating). The current display order is either source order or random (shuffle). Explicit sorting options would give users control over organisation.

## Design Approach

Add a sort dropdown/button group that allows sorting by various fields. Sort can be ascending or descending. Sorting animates cards to new positions using layout animation.

### Sort Options

| Field | Description |
|-------|-------------|
| Title | Alphabetical A-Z / Z-A |
| Year | Newest / Oldest first |
| Date Added | Recently added first |
| Random | Shuffle (existing feature) |
| Custom | User-defined order (drag-and-drop) |

### UI Component

```
┌────────────────────────────┐
│ Sort: [Title ▼] [↑↓]       │  ← Dropdown + direction toggle
└────────────────────────────┘
```

### Animation

Cards animate to new positions using Framer Motion's layout animation (already in use for grid).

## Implementation Tasks

- [ ] Create `SortDropdown` component
- [ ] Add sort direction toggle (asc/desc)
- [ ] Implement `useSortedCards` hook
- [ ] Add sort options for title, year, date added
- [ ] Integrate shuffle as sort option
- [ ] Coordinate with custom order (drag-and-drop)
- [ ] Animate card position changes
- [ ] Persist sort preference to storage
- [ ] Add sort to URL params
- [ ] Ensure dropdown is accessible
- [ ] Write tests for sort logic

## Success Criteria

- [ ] Cards sort by selected field
- [ ] Direction toggle switches asc/desc
- [ ] Cards animate to new positions
- [ ] Sort preference persists
- [ ] Custom order preserved when selected
- [ ] Shuffle integrated as sort option
- [ ] Dropdown keyboard accessible
- [ ] Sort change announced to screen readers

## Dependencies

- **Requires**: v0.2.0 (card data)
- **Recommends**: F-027 Shuffle by Default (integration)
- **Related**: F-028 Card Drag and Drop (custom order)

## Complexity

Small

## Milestone

v0.4.0

---

## Related Documentation

- [Shuffle by Default](./F-027-shuffle-by-default.md)
- [Card Drag and Drop](./F-028-card-drag-and-drop.md)
- [v0.4.0 Milestone](../../milestones/v0.4.0.md)

---

**Status**: Planned
