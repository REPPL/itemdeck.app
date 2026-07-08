# F-062: Collection Statistics Summary

## Problem Statement

Users have no insight into their collection's composition:

1. **No counts** - How many items in the collection?
2. **No range info** - What years/eras are covered?
3. **No distribution** - How are items distributed across categories?
4. **No averages** - What's the average rating, year, etc.?

## Design Approach

Add a dismissible statistics bar above the card grid.

### Statistics Bar

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 124 items | Years: 1985-2024 | Platforms: 12 | Avg Rating: 8.2 | [×] │
└─────────────────────────────────────────────────────────────────────────┘
```

### Expanded Statistics Panel (Optional)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Collection Statistics                                            [×]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Total Items: 124                    Year Range: 1985 - 2024             │
│                                                                         │
│ Platform Distribution:              Rating Distribution:                │
│ ████████████ SNES (42)              ★★★★★ 9-10: ████████ 28             │
│ ████████░░░░ NES (31)               ★★★★☆ 7-8:  ██████████████ 56       │
│ █████░░░░░░░ Genesis (18)           ★★★☆☆ 5-6:  ██████████ 32           │
│ ████░░░░░░░░ PS1 (15)               ★★☆☆☆ 3-4:  ██ 6                    │
│ ███░░░░░░░░░ Other (18)             ★☆☆☆☆ 1-2:  █ 2                     │
│                                                                         │
│ Decade Breakdown:                   Most Common:                        │
│ 1980s: ████████ 28                  Genre: RPG (34)                     │
│ 1990s: ████████████████ 56          Publisher: Nintendo (45)            │
│ 2000s: ██████████ 32                Year: 1994 (12 items)               │
│ 2010s: █████ 18                                                         │
│ 2020s: ███ 10                                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Statistics Computation

- [x] Create `src/utils/collectionStats.ts`
- [x] Compute total count
- [x] Compute numeric field ranges (min, max, average)
- [x] Compute categorical field distributions
- [x] Handle missing/null values gracefully

### Phase 2: Statistics Bar Component

- [x] Create `src/components/Statistics/StatisticsBar.tsx`
- [x] Display key metrics in single line
- [x] Add dismiss button (×)
- [x] Persist dismissed state in settings
- [x] Toggle visibility from settings

### Phase 3: Dynamic Field Detection

- [x] Identify numeric fields for range/average
- [x] Identify categorical fields for distribution
- [x] Identify date/year fields for timeline
- [x] Configurable field names

### Phase 4: Expanded Panel (Optional)

- [ ] Create `StatisticsPanel.tsx` for detailed view (deferred to future)
- [ ] Add expandable section to statistics bar (deferred)
- [ ] Render bar charts for distributions (deferred)
- [ ] Make charts responsive (deferred)

### Phase 5: Settings Integration

- [x] Add `showStatisticsBar` toggle to settings store
- [x] Persist preference
- [x] Allow re-showing after dismissal

## Success Criteria

- [x] Statistics bar displays above grid
- [x] Total count accurate
- [x] Year/date range calculated correctly
- [x] Averages computed for numeric fields
- [x] Bar dismissible and stays dismissed
- [x] Can re-enable from settings

## Dependencies

- **Existing**: Card data from collection
- **Existing**: Settings store

## Complexity

**Small** - Computation + simple UI component.

## Testing Strategy

- Unit tests for statistics computation
- Test with empty collection
- Test with missing fields
- Component tests for bar rendering

---

## Related Documentation

- [F-063: Collection Export](./F-063-collection-export.md)

---

**Status**: Complete
