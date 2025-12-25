# F-044: Random Card Sampling

## Problem Statement

Users with large collections (100+ items) may want to see a random subset of cards rather than the entire deck. Currently, all cards are always displayed, which can be overwhelming and slow on large collections.

## Design Approach

Add a "Random Selection" toggle with slider that limits the number of cards displayed, randomly selecting from the full deck.

### Setting Location

Placed in Settings > Cards > Layout tab (after Aspect Ratio).

### UI Implementation

Toggle + Slider approach (chosen for better UX over dropdown):

```
Random Selection: [Toggle]

[When enabled:]
Show: [====|====] 10 of 79 cards

A random subset will be selected each time the page loads.
```

### Behaviour

1. When enabled, applies random sampling before shuffle/sort
2. Uses Fisher-Yates shuffle to select random cards
3. Selection refreshes on each page load
4. If count exceeds collection size, shows all items
5. Setting persists in localStorage via Zustand
6. Slider dynamically adjusts to collection size

## Implementation Tasks

- [x] Add `randomSelectionEnabled` to settings store
- [x] Add `randomSelectionCount` to settings store
- [x] Add setting UI to Layout sub-tab
- [x] Implement random sampling logic in CardGrid
- [x] Integrate with shuffle functionality
- [x] Add localStorage persistence (Zustand migration v14)
- [x] Test with various collection sizes
- [x] Document the feature

## Success Criteria

- [x] "Random Selection" toggle appears in Layout sub-tab
- [x] When enabled, slider shows count from 1 to collection size
- [x] Display shows "X of Y cards" when enabled
- [x] Selecting any number shows exactly that many random cards
- [x] Disabling toggle shows all cards
- [x] Random selection applies on each page load
- [x] Setting persists across page reloads

## Dependencies

- **Requires**: F-043 Settings Panel Sub-tabs (for placement)
- **Blocks**: None

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users confused why some cards are missing | Medium | Low | Clear label indicating sampling is active |
| Shuffle + sampling interaction unclear | Low | Low | Selection applied before shuffle |

---

## Related Documentation

- [v0.8.1 Milestone](../../milestones/v0.8.1.md)
- [F-043 Settings Panel Sub-tabs](./F-043-settings-panel-subtabs.md)

---

**Status**: Complete
