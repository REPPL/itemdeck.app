# F-044: Random Card Sampling

## Problem Statement

Users with large collections (100+ items) may want to see a random subset of cards rather than the entire deck. Currently, all cards are always displayed, which can be overwhelming and slow on large collections.

## Design Approach

Add a "Max visible cards" setting that limits the number of cards displayed, randomly selecting from the full deck.

### Setting Location

Place in the new "General" sub-tab of Cards settings (see F-043).

### Options

Dynamic dropdown from 1 to total number of cards in collection:

- **All** (default) - Show entire deck
- **1 to N** - Where N is the total number of cards in the current collection

The dropdown dynamically populates based on collection size. For a 79-card collection:
`All, 1, 2, 3, ... 78, 79`

### Behaviour

1. When deck loads or shuffles, apply random sampling
2. If shuffle is enabled, re-sample on each shuffle action
3. If shuffle is disabled, maintain consistent random selection until page reload
4. If selected value exceeds collection size, show all items
5. Setting persists in localStorage (as number, not index)
6. When switching collections, clamp value to new collection size

### UI

Dropdown with dynamic range:

```
Max visible cards: [All ▾]
                   ├─ All
                   ├─ 1
                   ├─ 2
                   ├─ 3
                   ├─ ...
                   ├─ 78
                   └─ 79
```

For large collections, consider:
- Searchable/filterable dropdown
- Number input with validation (min: 1, max: collection size)
- Slider with numeric display

## Implementation Tasks

- [ ] Add `maxVisibleCards` to settings store
- [ ] Add setting UI to General sub-tab
- [ ] Implement random sampling logic in `useCollection` or grid
- [ ] Integrate with shuffle functionality
- [ ] Add localStorage persistence
- [ ] Test with various collection sizes
- [ ] Document the feature

## Success Criteria

- [ ] "Max visible cards" setting appears in General sub-tab
- [ ] Dropdown shows "All" plus 1 to N (collection size)
- [ ] Selecting any number shows exactly that many random cards
- [ ] Selecting "All" shows all cards
- [ ] Shuffle re-samples the random selection
- [ ] Setting persists across page reloads
- [ ] When switching collections, value clamps to new collection size
- [ ] Large collections have usable UI (searchable dropdown or number input)

## Dependencies

- **Requires**: F-043 Settings Panel Sub-tabs (for placement)
- **Blocks**: None

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users confused why some cards are missing | Medium | Low | Clear label indicating sampling is active |
| Shuffle + sampling interaction unclear | Low | Low | Document behaviour clearly |

---

## Related Documentation

- [v0.6.1 Milestone](../../milestones/v0.6.1.md)
- [F-043 Settings Panel Sub-tabs](./F-043-settings-panel-subtabs.md)

---

**Status**: Planned
