# F-032: Card Stack View

## Problem Statement

The grid layout is efficient for browsing but lacks the tactile feel of a physical card stack. [Card stack metaphors](../../../research/card-ui-design-patterns.md#card-stack-and-wallet-metaphors) from Apple Wallet and similar apps provide an engaging alternative view where cards overlap like a fanned deck.

## Design Approach

Implement an alternative "stack" layout mode where cards overlap with slight offset, similar to Apple Wallet's pass collection. Users can swipe/click through the stack, bringing cards to the front.

### Stack Visualisation

```
     ┌─────────────┐
   ┌─┴───────────┐ │
 ┌─┴───────────┐ │ │
 │             │ │ │
 │   Card 1    │ │ │
 │   (front)   │ │─┘
 │             │─┘
 └─────────────┘
```

### Interaction Patterns

- **Click/tap**: Bring card to front
- **Swipe up/down**: Cycle through stack
- **Pinch spread**: Expand to grid view
- **Pinch close**: Collapse to stack

### Stack Configuration

```typescript
stackOffset: z.number().min(5).max(30).default(15), // pixels between cards
stackFanAngle: z.number().min(0).max(10).default(2), // degrees of rotation
```

## Implementation Tasks

- [ ] Create `CardStack` layout component
- [ ] Implement overlapping card positioning with z-index
- [ ] Add offset and rotation calculations
- [ ] Handle click-to-front interaction
- [ ] Implement swipe gesture for cycling
- [ ] Add pinch gesture for mode switching (optional)
- [ ] Animate card movements (spring physics)
- [ ] Create stack/grid toggle button
- [ ] Persist layout mode preference
- [ ] Ensure keyboard accessibility (arrow keys to cycle)
- [ ] Write tests for stack interactions

## Success Criteria

- [ ] Cards display in overlapping stack formation
- [ ] Clicking card brings it to front with animation
- [ ] Swipe/arrow keys cycle through stack
- [ ] Smooth animations (spring easing, 60fps)
- [ ] Toggle between stack and grid views
- [ ] Preference persists across sessions
- [ ] Keyboard users can navigate stack

## Dependencies

- **Requires**: v0.1.0 complete
- **Recommends**: Framer Motion (already installed)
- **Related**: F-011 Layout Presets (stack as a preset)

## Complexity

Large

## Milestone

v0.4.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Layout Presets](./F-011-layout-presets.md)
- [v0.4.0 Milestone](../../milestones/v0.4.0.md)

---

**Status**: Planned
