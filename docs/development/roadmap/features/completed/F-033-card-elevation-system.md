# F-033: Card Elevation System

## Problem Statement

The current card shadow is static. [Material Design elevation](../../../research/card-ui-design-patterns.md#depth-and-elevation) research shows that dynamic elevation creates depth hierarchy and provides feedback during interactions. Cards should rise when hovered/selected and sink when released.

## Design Approach

Implement a 6-level elevation system with corresponding shadows. Cards transition between elevation levels based on state (resting, hovered, pressed, dragged, selected).

### Elevation Levels

| Level | Use Case | Shadow |
|-------|----------|--------|
| 0 | Disabled/inactive | None |
| 1 | Resting state | Subtle |
| 2 | Hovered | Light |
| 3 | Focused/selected | Medium |
| 4 | Pressed (momentary) | Compressed |
| 5 | Dragging | Deep |

### CSS Custom Properties

```css
:root {
  --elevation-0: none;
  --elevation-1: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  --elevation-2: 0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12);
  --elevation-3: 0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10);
  --elevation-4: 0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05);
  --elevation-5: 0 20px 40px rgba(0, 0, 0, 0.2);
}
```

### Scale Transform

Elevation includes subtle scale changes:
- Level 1: scale(1)
- Level 3: scale(1.02)
- Level 5: scale(1.05)

## Implementation Tasks

- [ ] Define elevation CSS custom properties
- [ ] Create elevation utility classes
- [ ] Add elevation to theme tokens
- [ ] Implement state-based elevation in Card component
- [ ] Animate shadow transitions smoothly
- [ ] Add scale transform for higher elevations
- [ ] Coordinate with drag-and-drop elevation
- [ ] Ensure reduced motion respects elevation
- [ ] Theme-aware shadow colours (lighter in dark mode)
- [ ] Write tests for elevation state transitions

## Success Criteria

- [ ] Cards have dynamic shadow based on state
- [ ] Hover increases elevation smoothly
- [ ] Pressed state briefly compresses elevation
- [ ] Dragged cards have maximum elevation
- [ ] Animations smooth (no shadow flicker)
- [ ] Dark mode has appropriate shadow colours
- [ ] Reduced motion: instant transitions, still shows elevation

## Dependencies

- **Requires**: v0.1.0 complete
- **Enhances**: F-028 Card Drag and Drop
- **Related**: F-010 Theme System

## Complexity

Small

## Milestone

v0.3.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [ADR-029: Card Elevation Strategy](../../../decisions/adrs/ADR-029-card-elevation-strategy.md)
- [Theme System](./F-010-theme-system.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)

---

**Status**: Completed
