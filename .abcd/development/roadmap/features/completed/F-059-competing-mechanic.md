# F-059: Competing Mechanic (Top Trumps)

## Problem Statement

Users want to compare cards head-to-head using their stats:

1. **Stat comparison** - Compare numeric fields between cards
2. **Win/lose tracking** - Track victories per card
3. **Deck building** - Select cards for tournament
4. **Visual drama** - Exciting comparison reveals

## Design Approach

Create a Top Trumps-style mechanic where cards battle by stats.

### Game Flow

```
1. Setup
   - Select stat category to compare (or random)
   - Shuffle deck
   - Deal cards to players

2. Battle Round
   - Player selects a stat from their top card
   - CPU reveals their top card
   - Higher stat wins both cards
   - Ties: cards go to stack, winner takes all next round

3. Win Condition
   - Game ends when one player has all cards
   - Or after N rounds, most cards wins
```

### Battle Screen

```
┌─────────────────────────────────────────────────────────────┐
│                    BATTLE!                                  │
│                                                             │
│   ┌───────────────┐           ┌───────────────┐             │
│   │   [Image]     │    VS     │   [Image]     │             │
│   │               │           │               │             │
│   │  Metroid      │           │    ???        │             │
│   │               │           │               │             │
│   │  Year: 1986   │           │  Year: ???    │             │
│   │  [SELECT] ←   │           │               │             │
│   └───────────────┘           └───────────────┘             │
│                                                             │
│   Your Cards: 12              CPU Cards: 8                  │
└─────────────────────────────────────────────────────────────┘
```

### After Reveal

```
┌─────────────────────────────────────────────────────────────┐
│                    YOU WIN!                                 │
│                                                             │
│   ┌───────────────┐           ┌───────────────┐             │
│   │   [Image]     │           │   [Image]     │             │
│   │               │           │               │             │
│   │  Metroid      │           │   Zelda       │             │
│   │               │           │               │             │
│   │  Year: 1986 ✓ │    >      │  Year: 1986   │             │
│   │               │           │               │             │
│   └───────────────┘           └───────────────┘             │
│                                                             │
│                    [Next Round]                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Mechanic Core

- [x] Create `src/mechanics/competing/index.ts`
- [x] Define `CompetingMechanicManifest`
- [x] Identify required fields: at least one numeric field
- [x] Create `CompetingMechanic` class
- [x] Register factory with mechanic registry

### Phase 2: State Management

- [x] Create `src/mechanics/competing/store.ts`
- [x] Track: `playerDeck`, `cpuDeck`, `selectedStat`, `gamePhase`
- [x] Implement `selectStat(field)` action
- [x] Implement `revealBattle()` action
- [x] Implement `nextRound()` action
- [x] Implement `startGame()` / `endGame()` actions

### Phase 3: Battle Overlay

- [x] Create `CompetingBattleOverlay.tsx` (replaces grid)
- [x] Show player card with selectable stats
- [x] Show CPU card (hidden until reveal)
- [x] Animate reveal and comparison
- [x] Show win/lose result

### Phase 4: Stat Selection

- [x] Display all numeric fields on player card
- [x] Highlight selected stat
- [x] Confirm selection button
- [x] Show which stats have been used (optional variant)

### Phase 5: AI Opponent

- [x] Simple AI: random stat selection
- [x] Medium AI: select highest stat
- [x] Hard AI: track player patterns

### Phase 6: Game Completion

- [x] Show final score
- [x] Display winning message
- [x] Track win/loss history
- [x] Play again button

## Success Criteria

- [x] Cards dealt correctly
- [x] Stat selection works
- [x] Battle resolution correct
- [x] Cards transfer to winner
- [x] Game ends at proper condition
- [x] Animations enhance experience

## Dependencies

- **F-053**: Mechanic Plugin Registry
- **F-054**: Mechanic Context Provider
- **F-055**: Mechanic Overlay System
- **Requirement**: Collection needs numeric fields

## Complexity

**Large** - Full game with AI and complex state.

## Testing Strategy

- Unit tests for battle resolution logic
- Unit tests for AI decision making
- Component tests for battle overlay
- E2E test for complete game

---

## Related Documentation

- [F-055: Mechanic Overlay System](./F-055-mechanic-overlay-system.md)
- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)
- [ADR-017: Mechanic State Management](../../decisions/adrs/ADR-017-mechanic-state-management.md)

---

**Status**: Complete
