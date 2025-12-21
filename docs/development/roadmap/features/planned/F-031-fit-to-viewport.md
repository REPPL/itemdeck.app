# F-031: Fit to Viewport Mode

## Problem Statement

Users may want to see all cards simultaneously without scrolling. The current grid layout uses fixed card sizes, which can result in cards being cut off or requiring scroll. A "fit to viewport" mode would dynamically resize cards to always show the complete collection.

## Design Approach

Implement a layout mode that calculates optimal card size based on:
- Viewport dimensions
- Number of cards
- Minimum readable card size
- Desired gap spacing

This creates an "extreme resizing" effect where all cards shrink proportionally to fit the available space.

### Size Calculation Algorithm

```typescript
function calculateFitSize(
  viewportWidth: number,
  viewportHeight: number,
  cardCount: number,
  minWidth: number = 80,
  aspectRatio: number = 1.4,
  gap: number = 8
): { width: number; columns: number } {
  // Try different column counts, find best fit
  for (let cols = Math.ceil(Math.sqrt(cardCount)); cols >= 1; cols--) {
    const rows = Math.ceil(cardCount / cols);
    const availableWidth = viewportWidth - (gap * (cols + 1));
    const availableHeight = viewportHeight - (gap * (rows + 1));

    const cardWidth = availableWidth / cols;
    const cardHeight = cardWidth * aspectRatio;

    if (cardWidth >= minWidth && cardHeight * rows <= availableHeight) {
      return { width: cardWidth, columns: cols };
    }
  }
  return { width: minWidth, columns: 1 };
}
```

### Configuration

```typescript
// Addition to BehaviourConfigSchema
fitToViewport: z.boolean().default(false),
fitMinCardWidth: z.number().min(60).max(200).default(80),
```

## Implementation Tasks

- [ ] Add `fitToViewport` and `fitMinCardWidth` to config schema
- [ ] Create `useFitToViewport` hook with size calculation
- [ ] Add viewport resize observer
- [ ] Implement debounced recalculation on resize
- [ ] Create toggle button for fit-to-viewport mode
- [ ] Animate card size transitions smoothly
- [ ] Handle edge cases (0 cards, very narrow viewport)
- [ ] Add minimum size threshold warning
- [ ] Integrate with virtual scrolling (disable when fit mode active)
- [ ] Write tests for size calculation edge cases

## Success Criteria

- [ ] All cards visible without scrolling when enabled
- [ ] Cards resize dynamically on viewport change
- [ ] Minimum readable size enforced
- [ ] Smooth animation during resize
- [ ] Toggle easily accessible (keyboard shortcut?)
- [ ] Works with any card count
- [ ] Performance: debounced resize, no layout thrashing

## Dependencies

- **Requires**: v0.1.0 complete
- **Conflicts**: F-014 Virtual Scrolling (mutually exclusive modes)
- **Recommends**: F-013 Settings Panel (for toggle)

## Complexity

Medium

## Milestone

v0.4.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Virtual Scrolling](./F-014-virtual-scrolling.md)
- [v0.4.0 Milestone](../../milestones/v0.4.0.md)

---

**Status**: Planned
