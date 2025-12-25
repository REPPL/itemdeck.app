# F-057: Memory Game Mechanic

## Problem Statement

Users want a classic memory matching game with their card collection:

1. **Card matching** - Flip cards to find pairs
2. **Score tracking** - Track attempts and matches
3. **Game completion** - Celebrate when all pairs found
4. **Visual feedback** - Animations for flip, match, mismatch

## Design Approach

Create a Memory mechanic that transforms the grid into a matching game.

### Game Flow

```
1. Start Game
   - Shuffle cards
   - Show all cards face-down
   - Reset score

2. Playing
   - Click card → flip face-up
   - Click second card → check for match
   - Match: cards stay face-up, increment score
   - No match: flip both back after delay

3. Win Condition
   - All pairs matched
   - Show completion overlay with stats
```

### Card States

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│             │    │   [Image]   │    │   [Image]   │
│      ?      │    │             │    │     ✓       │
│             │    │    Title    │    │    Title    │
│  Face Down  │    │   Flipped   │    │   Matched   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Grid Overlay

```
┌─────────────────────────────────────────────────────┐
│  Pairs: 6/12    Attempts: 15    Best: 12            │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [?] [?] [?] [?]                                   │
│   [?] [A] [?] [?]                                   │
│   [?] [?] [B] [?]                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Mechanic Core

- [ ] Create `src/mechanics/memory/index.ts`
- [ ] Define `MemoryMechanicManifest`
- [ ] Create `MemoryMechanic` class implementing `Mechanic` interface
- [ ] Register factory with mechanic registry

### Phase 2: State Management

- [ ] Create `src/mechanics/memory/store.ts` with Zustand
- [ ] Track: `shuffledCards`, `flippedIndices`, `matchedPairs`, `attempts`
- [ ] Implement `flipCard(index)` action
- [ ] Implement `checkMatch()` action
- [ ] Implement `resetGame()` action

### Phase 3: Card Overlay

- [ ] Create `MemoryCardOverlay.tsx`
- [ ] Show face-down state (question mark or blank back)
- [ ] Show match indicator (checkmark)
- [ ] Animate flip transition
- [ ] Prevent interaction during match checking

### Phase 4: Grid Overlay

- [ ] Create `MemoryGridOverlay.tsx`
- [ ] Show score: pairs found, total pairs
- [ ] Show attempts counter
- [ ] Show best score (persisted)
- [ ] Reset button

### Phase 5: Game Completion

- [ ] Create win condition check
- [ ] Show completion modal
- [ ] Display final stats: attempts, time
- [ ] Compare to best score
- [ ] Play again button

### Phase 6: Animations

- [ ] Card flip animation (Framer Motion)
- [ ] Match celebration effect
- [ ] Mismatch shake effect
- [ ] Respect reduced motion preferences

## Success Criteria

- [ ] Cards flip on click
- [ ] Matching pairs stay face-up
- [ ] Non-matching pairs flip back
- [ ] Score tracks correctly
- [ ] Game completes when all matched
- [ ] Animations smooth and accessible
- [ ] Best score persisted

## Dependencies

- **F-053**: Mechanic Plugin Registry
- **F-054**: Mechanic Context Provider
- **F-055**: Mechanic Overlay System

## Complexity

**Large** - Full game loop with animations and state.

## Testing Strategy

- Unit tests for state transitions
- Component tests for card overlay
- E2E test for complete game flow
- Visual tests for animations

---

## Related Documentation

- [F-055: Mechanic Overlay System](./F-055-mechanic-overlay-system.md)
- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)
- [ADR-017: Mechanic State Management](../../decisions/adrs/ADR-017-mechanic-state-management.md)

---

**Status**: Planned
