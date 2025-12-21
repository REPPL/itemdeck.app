# F-036: Card Filtering

## Problem Statement

As card collections grow, users need ways to filter and find specific cards. The current implementation shows all cards without filtering capability. Filters by category, year, favourites, or custom attributes would improve discoverability.

## Design Approach

Implement a filter bar with toggleable filter chips/buttons. Filters can be combined (AND logic). Filtered-out cards animate out of view, and the grid reflows.

### Filter Bar Layout

```
┌──────────────────────────────────────────────────────┐
│ 🔍 Search...  │ [All] [Favourites] [2024] [Category▼]│
└──────────────────────────────────────────────────────┘
```

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

## Implementation Tasks

- [ ] Create `FilterBar` component
- [ ] Implement text search input
- [ ] Create filter chip/toggle components
- [ ] Implement dropdown filter for categories
- [ ] Add year range filter (if applicable)
- [ ] Create `useFilteredCards` hook
- [ ] Animate card exit/enter on filter change
- [ ] Handle empty state (no matches)
- [ ] Persist active filters to URL params
- [ ] Sync with virtual scrolling if enabled
- [ ] Ensure filter controls accessible
- [ ] Write tests for filter logic

## Success Criteria

- [ ] Text search filters cards by title
- [ ] Filter toggles work correctly
- [ ] Multiple filters combine (AND)
- [ ] Cards animate in/out on filter change
- [ ] Empty state shown when no matches
- [ ] Filter state persists in URL
- [ ] Filter bar is keyboard accessible
- [ ] Screen readers announce filter results count

## Dependencies

- **Requires**: v0.2.0 (card data from GitHub)
- **Recommends**: F-014 Virtual Scrolling (coordination)
- **Related**: F-035 Card Quick Actions (favourites filter)

## Complexity

Medium

## Milestone

v0.4.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [GitHub Data Source](../completed/F-007-github-data-source.md)
- [v0.4.0 Milestone](../../milestones/v0.4.0.md)

---

**Status**: Planned
