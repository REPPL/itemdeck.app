# F-061: Snap Ranking Mechanic

## Problem Statement

Users want a fun, spontaneous way to rank items without overthinking:

1. **Blind presentation** - See cards one at a time, no peeking ahead
2. **Instant rating** - Quick rating input without deliberation
3. **First impression** - Captures authentic gut reactions
4. **Surprise element** - Not knowing what's next adds excitement
5. **Shareable results** - Generate tier lists from ratings

## Design Approach

Create a Snap Ranking mechanic inspired by viral social media ranking trends.

### Game Flow

```
1. Start
   - Shuffle all cards randomly
   - Hide the deck (no previewing)
   - Explain the rules

2. Rating Round (per card)
   - Reveal next card
   - User rates immediately (1-10 or S/A/B/C/D/F tier)
   - Cannot go back or change
   - Move to next card

3. Completion
   - All cards rated
   - Generate tier list from ratings
   - Show summary and shareable result
```

### Rating Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Snap Ranking    Card 5 of 24    ⏱ 1:23                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              ┌───────────────────────┐                      │
│              │                       │                      │
│              │       [Image]         │                      │
│              │                       │                      │
│              │   Super Metroid       │                      │
│              │   SNES, 1994          │                      │
│              │                       │                      │
│              └───────────────────────┘                      │
│                                                             │
│  Rate this item:                                            │
│                                                             │
│  [S] [A] [B] [C] [D] [F]                                    │
│   or                                                        │
│  1 ──────────●────────── 10                                 │
│                                                             │
│  ⚡ No going back! Trust your gut!                          │
└─────────────────────────────────────────────────────────────┘
```

### Results Screen

```
┌─────────────────────────────────────────────────────────────┐
│  🎉 Snap Ranking Complete!                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  S Tier (2)                                                 │
│  ┌─────┐ ┌─────┐                                            │
│  │ 🎮  │ │ 🎮  │                                            │
│  └─────┘ └─────┘                                            │
│                                                             │
│  A Tier (5)                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │ 🎮  │ │ 🎮  │ │ 🎮  │ │ 🎮  │ │ 🎮  │                    │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                    │
│                                                             │
│  B Tier (8)                                                 │
│  [...]                                                      │
│                                                             │
│  Time: 2:45    Cards: 24    Fastest: 1.2s    Slowest: 8.3s  │
│                                                             │
│  [Copy Results 📋]  [Share Image 🖼]  [Rank Again 🔄]       │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Mechanic Core

- [ ] Create `src/mechanics/snap-ranking/index.ts`
- [ ] Define `SnapRankingMechanicManifest`
- [ ] Create `SnapRankingMechanic` class
- [ ] Register factory with mechanic registry

### Phase 2: State Management

- [ ] Create `src/mechanics/snap-ranking/store.ts`
- [ ] Track: `shuffledCards`, `currentIndex`, `ratings`, `timing`
- [ ] Implement `startRanking()` action (shuffle deck)
- [ ] Implement `rateCard(rating)` action (lock in, advance)
- [ ] Implement `finishRanking()` action (generate results)
- [ ] Track time per card for stats

### Phase 3: Rating Overlay

- [ ] Create `SnapRankingOverlay.tsx` (fullscreen mode)
- [ ] Show single card prominently
- [ ] Hide remaining card count (or show progress without revealing)
- [ ] Display rating options (tier buttons or slider)
- [ ] "No going back" reminder

### Phase 4: Rating Input

- [ ] Tier buttons: S, A, B, C, D, F
- [ ] Alternative: numeric slider 1-10
- [ ] Keyboard shortcuts (1-6 or S/A/B/C/D/F keys)
- [ ] Swipe gestures for mobile
- [ ] Optional: timer pressure (rate within N seconds)

### Phase 5: Transition Animation

- [ ] Card slides/fades out after rating
- [ ] Next card slides/fades in
- [ ] Brief rating confirmation flash
- [ ] Smooth, fast transitions to maintain momentum

### Phase 6: Results Generation

- [ ] Group cards by tier/rating
- [ ] Sort within tiers (by rating timestamp or random)
- [ ] Generate text summary for copying
- [ ] Generate shareable image (optional, complex)

### Phase 7: Sharing

- [ ] Copy tier list as text to clipboard
- [ ] Format: "S: Card1, Card2 | A: Card3..."
- [ ] Optional: Generate image using canvas/html2canvas
- [ ] Share URL with encoded results (if practical)

## Success Criteria

- [ ] Cards presented one at a time
- [ ] Cannot preview upcoming cards
- [ ] Cannot go back to change ratings
- [ ] Rating input responsive and fast
- [ ] Progress indicator doesn't reveal content
- [ ] Results generate tier list correctly
- [ ] Results shareable

## Dependencies

- **F-053**: Mechanic Plugin Registry
- **F-054**: Mechanic Context Provider
- **F-055**: Mechanic Overlay System

## Complexity

**Medium** - Focused UX with results generation.

## Testing Strategy

- Unit tests for shuffling and state
- Test rating lockout (no going back)
- Component tests for rating overlay
- Test tier list generation
- E2E test for complete ranking flow

---

## Related Documentation

- [F-055: Mechanic Overlay System](./F-055-mechanic-overlay-system.md)
- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)
- [ADR-017: Mechanic State Management](../../decisions/adrs/ADR-017-mechanic-state-management.md)

---

**Status**: Completed (v0.12.5)
