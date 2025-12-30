# F-037: Card Sorting (Expanded)

## Problem Statement

Users may want to view cards in a specific order (newest first, alphabetical, by rating, by platform). The current implementation has basic sorting via settings but lacks quick access and additional sort fields.

## Current State

**v0.15.5 Implementation Status:**

The ViewPopover three-column layout (implemented in v0.15.5) provides quick sort access:
- Sort options: Shuffle, By Rank, By Year, By Title
- Available in Grid, List, and Compact views (disabled in Fit view)
- Persists to localStorage via settingsStore/fieldMapping

This feature spec now tracks **remaining enhancements** beyond the v0.15.5 implementation.

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

### Completed (v0.15.5)

- [x] Add quick sort buttons in ViewPopover (three-column layout)
- [x] Sort options: Shuffle, By Rank, By Year, By Title
- [x] Animate card position changes
- [x] Ensure sort controls accessible
- [x] Sort preference persists to localStorage

### Remaining (v1.0.0)

- [ ] Fix Sort/Group By interaction bug (see Known Issues below)
- [ ] Expand `SORT_FIELD_OPTIONS` with platform, category, rating
- [ ] Verify `createFieldSortComparator` handles new field paths
- [ ] Add secondary sort field support (multi-level sorting)
- [ ] Review invalid option combinations (see R-017)
- [ ] Write tests for expanded sort logic

## Success Criteria

### Completed (v0.15.5)

- [x] Quick sort buttons in ViewPopover
- [x] Sort by Shuffle, Rank, Year, Title works
- [x] Cards animate to new positions
- [x] Sort preference persists to localStorage

### Remaining (v1.0.0)

- [ ] Sort/Group By interaction works correctly (no conflicting selections)
- [ ] Invalid combinations prevented or handled gracefully
- [ ] Cards sort by platform, category, rating
- [ ] Direction toggle switches asc/desc in ViewPopover
- [ ] Field path resolution works for nested fields
- [ ] Multi-level sorting (primary + secondary)

## Dependencies

- **Requires**: v0.2.0 (card data)
- **Uses**: `fieldPathResolver.ts` for nested field access
- **Related**: F-036 Card Filtering (search bar placement)

## Complexity

Small (remaining work)

## Milestone

v1.0.0 (partial implementation in v0.15.5)

## Implementation Notes (v0.15.5)

The ViewPopover was enhanced with a three-column layout during v0.15.5 manual testing:

- **View column**: Grid, List, Compact, Fit modes
- **Sort column**: Shuffle, By Rank, By Year, By Title
- **Group By column**: None, Platform, Year, Decade, Genre

**Files modified:**
- `src/components/ViewPopover/ViewPopover.tsx` (411 lines)
- `src/components/ViewPopover/ViewPopover.module.css`

The Sort column provides quick access to the four most common sort options. Extended sort fields (platform, category, rating) and multi-level sorting remain planned for v1.0.0.

## Known Issues (v0.15.5)

### Sort/Group By Interaction Bug

**Issue:** Selecting List | By Rank | Year displays cards sorted by year, not by rank within year groups.

**Expected behaviour:** When "By Rank" is selected as Sort and "Year" is selected as Group By, cards should be:
1. Grouped by year (visual separation)
2. Sorted by rank within each year group

**Actual behaviour:** Cards appear sorted by year overall, ignoring the "By Rank" sort selection.

**Root cause:** The Group By field is overriding the Sort field rather than being applied as a secondary grouping.

**Resolution:** v1.0.0 must:
1. Fix the Sort/Group By interaction logic
2. Consider whether certain combinations are invalid and should be prevented
3. Reference R-017 research on disabled vs hidden options UX pattern

---

## Related Documentation

- [Shuffle by Default](../completed/F-027-shuffle-by-default.md)
- [Card Drag and Drop](../completed/F-028-card-drag-and-drop.md)
- [v0.15.5 Devlog](../../../process/devlogs/v0.15.5/README.md)
- [v1.0.0 Milestone](../../milestones/v1.0.0.md)
- [R-017: Disabled vs Hidden Options](../../../research/R-017-disabled-vs-hidden-options.md)

---

**Status**: Partial (core sorting complete v0.15.5, extended fields deferred to v1.0.0)
