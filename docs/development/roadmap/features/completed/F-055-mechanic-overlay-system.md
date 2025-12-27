# F-055: Mechanic Overlay System

## Problem Statement

Gaming mechanics need to render custom UI on cards and the grid:

1. **Card overlays** - Match indicators, selection rings, badges
2. **Grid overlays** - Scoreboard, timer, progress bar
3. **Animation coordination** - Work with Framer Motion
4. **Theme integration** - Respect current theme colours

## Design Approach

Add overlay slots to Card and CardGrid components that render mechanic-provided components.

### Card Overlay Slots

```
┌─────────────────────────────────┐
│ [top-left]         [top-right]  │  ← Badge positions
│                                 │
│        Card Content             │
│                                 │
│ [bottom-left]   [bottom-right]  │
└─────────────────────────────────┘
        ↓
    [full-overlay]  ← Match indicator, selection ring
```

### Grid Overlay Positions

```
┌─────────────────────────────────────────────────┐
│  [top-bar]  Score: 150  Attempts: 12            │
├─────────────────────────────────────────────────┤
│                                                 │
│   Card Grid                                     │
│                                                 │
│   [center-modal]  (Game Complete overlay)       │
│                                                 │
├─────────────────────────────────────────────────┤
│  [bottom-bar]  [Pause] [Reset] [Quit]           │
└─────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Overlay Components

- [ ] Create `src/mechanics/components/CardMechanicOverlay.tsx`
- [ ] Create `src/mechanics/components/GridMechanicOverlay.tsx`
- [ ] Define `CardOverlayProps` and `GridOverlayProps`

### Phase 2: Card Integration

- [ ] Add overlay slot to `Card.tsx`
- [ ] Pass card data and mechanic state to overlay
- [ ] Handle pointer events (overlay vs card click)
- [ ] Position overlay with CSS (absolute positioning)

### Phase 3: CardGrid Integration

- [ ] Add grid overlay slot to `CardGrid.tsx`
- [ ] Render GridOverlay when mechanic provides one
- [ ] Position at top/bottom/center as needed
- [ ] Handle z-index layering

### Phase 4: Styling System

- [ ] Define z-index scale for overlays
- [ ] Create CSS custom properties for overlay colours
- [ ] Support reduced motion preferences
- [ ] Test with all three themes

## Success Criteria

- [ ] Card overlays render above card content
- [ ] Grid overlays render above card grid
- [ ] Overlays don't block card interactions (unless intended)
- [ ] Overlays respect theme colours
- [ ] Animations respect reduced motion setting

## Dependencies

- **F-053**: Mechanic Plugin Registry (for mechanic interface)
- **F-054**: Mechanic Context Provider (for state access)
- **ADR**: [ADR-018: Mechanic UI Overlay System](../../decisions/adrs/ADR-018-mechanic-ui-overlay.md)

## Complexity

**Medium** - Component slots with styling considerations.

## Testing Strategy

- Component tests for overlay rendering
- Visual tests for positioning
- Test pointer event handling
- Test theme integration

---

## Related Documentation

- [ADR-018: Mechanic UI Overlay System](../../decisions/adrs/ADR-018-mechanic-ui-overlay.md)
- [Card Layouts & Animations Research](../../research/card-layouts-animations.md)

---

**Status**: Complete
