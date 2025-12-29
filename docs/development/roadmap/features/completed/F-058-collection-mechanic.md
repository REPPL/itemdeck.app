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

- [x] Create `src/mechanics/collection/index.ts`
- [x] Define `CollectionMechanicManifest`
- [x] Create `CollectionMechanic` class
- [x] Register factory with mechanic registry

### Phase 2: State Management

- [x] Create `src/mechanics/collection/store.ts`
- [x] Track: `ownedIds: Set<string>`, `wishlistIds: Set<string>`
- [x] Implement `toggleOwned(id)` action
- [x] Implement `toggleWishlist(id)` action
- [x] Persist state to localStorage

### Phase 3: Card Overlay

- [x] Create `CollectionCardOverlay.tsx`
- [x] Show ownership badge (checkmark for owned)
- [x] Show wishlist badge (heart for wishlisted)
- [x] Position badge in top-right corner
- [x] Add click handler for quick toggle

### Phase 4: Grid Overlay

- [x] Create `CollectionGridOverlay.tsx`
- [x] Calculate and display progress bar
- [x] Show counts: owned, wishlist, remaining
- [x] Show percentage completion
- [x] Position at top of grid

### Phase 5: Quick Actions

- [x] Add toggle buttons to card overlay
- [x] Support keyboard shortcuts (O for owned, W for wishlist)
- [x] Batch actions (select multiple, mark all owned)

### Phase 6: Export/Import

- [x] Export collection state as JSON
- [x] Import collection state from JSON
- [x] Merge or replace options

## Success Criteria

- [x] Can mark cards as owned
- [x] Can add cards to wishlist
- [x] Owned/wishlist state persists
- [x] Progress bar shows completion
- [x] Quick toggle works from card
- [x] Collection exportable

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

**Status**: Complete
