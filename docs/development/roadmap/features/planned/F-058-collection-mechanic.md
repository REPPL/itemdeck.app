# F-058: Collection Mechanic

## Problem Statement

Collectors want to track which items they own and which they want:

1. **Ownership tracking** - Mark cards as owned/not owned
2. **Wishlist** - Flag cards to acquire
3. **Progress display** - Show collection completion percentage
4. **Quick toggling** - Fast interaction without opening modals

## Design Approach

Create a Collection mechanic with simple toggle actions on each card.

### Card Overlay

```
Normal Card                    Owned Card                   Wishlisted Card
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│            [+]  │           │            [✓]  │           │            [♡]  │
│   [Image]       │           │   [Image]       │           │   [Image]       │
│                 │           │                 │           │                 │
│   Title         │           │   Title         │           │   Title         │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

### Card Click Actions

```
Click → Cycle: Not Owned → Owned → Wishlist → Not Owned
```

Or use overlay buttons:
- Click [+] → Mark owned
- Click [✓] → Remove from owned
- Click [♡] → Add to wishlist

### Grid Overlay

```
┌─────────────────────────────────────────────────────────────┐
│  Collection Progress                                        │
│  ████████████░░░░░░░░░░░░  45/100 (45%)                     │
│                                                             │
│  Owned: 45    Wishlist: 12    Remaining: 43                 │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Mechanic Core

- [ ] Create `src/mechanics/collection/index.ts`
- [ ] Define `CollectionMechanicManifest`
- [ ] Create `CollectionMechanic` class
- [ ] Register factory with mechanic registry

### Phase 2: State Management

- [ ] Create `src/mechanics/collection/store.ts`
- [ ] Track: `ownedIds: Set<string>`, `wishlistIds: Set<string>`
- [ ] Implement `toggleOwned(id)` action
- [ ] Implement `toggleWishlist(id)` action
- [ ] Persist state to localStorage

### Phase 3: Card Overlay

- [ ] Create `CollectionCardOverlay.tsx`
- [ ] Show ownership badge (checkmark for owned)
- [ ] Show wishlist badge (heart for wishlisted)
- [ ] Position badge in top-right corner
- [ ] Add click handler for quick toggle

### Phase 4: Grid Overlay

- [ ] Create `CollectionGridOverlay.tsx`
- [ ] Calculate and display progress bar
- [ ] Show counts: owned, wishlist, remaining
- [ ] Show percentage completion
- [ ] Position at top of grid

### Phase 5: Quick Actions

- [ ] Add toggle buttons to card overlay
- [ ] Support keyboard shortcuts (O for owned, W for wishlist)
- [ ] Batch actions (select multiple, mark all owned)

### Phase 6: Export/Import

- [ ] Export collection state as JSON
- [ ] Import collection state from JSON
- [ ] Merge or replace options

## Success Criteria

- [ ] Can mark cards as owned
- [ ] Can add cards to wishlist
- [ ] Owned/wishlist state persists
- [ ] Progress bar shows completion
- [ ] Quick toggle works from card
- [ ] Collection exportable

## Dependencies

- **F-053**: Mechanic Plugin Registry
- **F-054**: Mechanic Context Provider
- **F-055**: Mechanic Overlay System

## Complexity

**Medium** - State tracking with UI overlays.

## Testing Strategy

- Unit tests for state management
- Component tests for overlays
- Test persistence across sessions
- Test export/import round-trip

---

## Related Documentation

- [F-055: Mechanic Overlay System](./F-055-mechanic-overlay-system.md)
- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)
- [ADR-017: Mechanic State Management](../../decisions/adrs/ADR-017-mechanic-state-management.md)

---

**Status**: Planned
