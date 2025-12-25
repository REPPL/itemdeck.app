# F-064: Collection Comparison Mode

## Problem Statement

Users with multiple collections cannot find relationships:

1. **No duplicate detection** - Which items appear in both collections?
2. **No gap analysis** - What's in Collection A but not B?
3. **No similarity search** - Are there similar items across collections?
4. **No merge preview** - What would a combined collection look like?

## Design Approach

Add side-by-side comparison view with matching algorithms.

### Comparison View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Compare Collections                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Collection A: Retro Games (124)     Collection B: SNES Library (89)      │
│                                                                          │
│ ┌─────────────────────────┐         ┌─────────────────────────┐          │
│ │ ○ Only in A (78)        │         │ ○ Only in B (43)        │          │
│ │ ● In Both (46)          │         │ ● In Both (46)          │          │
│ │ ○ Similar matches (12)  │         │ ○ Similar matches (12)  │          │
│ └─────────────────────────┘         └─────────────────────────┘          │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ Matches (46)                                              [Export]   │ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │                                                                      │ │
│ │ ┌─────────┐     ═══════     ┌─────────┐                              │ │
│ │ │Super    │  Exact Match    │Super    │                              │ │
│ │ │Metroid  │                 │Metroid  │                              │ │
│ │ └─────────┘                 └─────────┘                              │ │
│ │                                                                      │ │
│ │ ┌─────────┐     ═══════     ┌─────────┐                              │ │
│ │ │Zelda    │  Exact Match    │Zelda    │                              │ │
│ │ │ALTTP    │                 │ALTTP    │                              │ │
│ │ └─────────┘                 └─────────┘                              │ │
│ │                                                                      │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Match Types

```
1. Exact Match (by ID)
   - Same entity ID in both collections
   - Highest confidence

2. Title Match
   - Same title (case-insensitive)
   - High confidence

3. Fuzzy Match
   - Similar titles (Fuse.js scoring)
   - Shows similarity percentage
   - User confirms

4. Field Match
   - Same values in key fields (year + platform)
   - Medium confidence
```

## Implementation Tasks

### Phase 1: Multi-Collection Loading

- [ ] Enable loading two collections simultaneously
- [ ] Create comparison mode toggle
- [ ] Store both collections in memory

### Phase 2: Matching Engine

- [ ] Create `src/utils/collectionMatcher.ts`
- [ ] Implement exact ID matching
- [ ] Implement title matching (normalised)
- [ ] Implement fuzzy matching using Fuse.js
- [ ] Implement field-based matching

### Phase 3: Comparison UI

- [ ] Create `src/components/ComparisonView/ComparisonView.tsx`
- [ ] Side-by-side collection panels
- [ ] Filter tabs: "Only in A", "Only in B", "In Both", "Similar"
- [ ] Match visualisation connecting pairs

### Phase 4: Match Review

- [ ] Show match confidence score
- [ ] Allow user to confirm/reject fuzzy matches
- [ ] Save confirmed matches for future

### Phase 5: Results Export

- [ ] Export matches as CSV/JSON
- [ ] Export "only in A" list
- [ ] Export "only in B" list
- [ ] Export comparison summary

### Phase 6: Merge Preview

- [ ] Preview combined collection
- [ ] Highlight duplicates
- [ ] Choose which version of duplicates to keep
- [ ] Export merged collection

## Success Criteria

- [ ] Two collections loadable simultaneously
- [ ] Exact matches found correctly
- [ ] Fuzzy matches have confidence scores
- [ ] "Only in A/B" lists accurate
- [ ] Results exportable
- [ ] UI clearly shows match relationships

## Dependencies

- **Remote Source Management** (v0.9.0): Multiple collection sources
- **R-008**: Fuzzy Matching (Fuse.js integration)

## Complexity

**Large** - Multi-collection state + matching algorithms + complex UI.

## Testing Strategy

- Unit tests for matching algorithms
- Test edge cases (empty collections, no matches, all matches)
- Test fuzzy matching thresholds
- E2E test for comparison workflow
- Performance test with large collections

---

## Related Documentation

- [R-008: Fuzzy Matching](../../research/R-008-fuzzy-matching.md)
- [F-063: Collection Export](./F-063-collection-export.md)

---

**Status**: Planned
