# F-041: Card Animation Polish

## Problem Statement

Current animations are functional but lack the polish of professional card interfaces. [Animation research](../../../research/card-ui-design-patterns.md#animation-and-timing) shows that refined motion design with spring physics, staggered timing, and meaningful easing creates a premium feel.

## Design Approach

Enhance all card animations with:

1. **Spring physics** for natural motion
2. **Staggered entrances** for grid loading
3. **Meaningful easing** curves
4. **Micro-interactions** for feedback

### Animation Library

Using Framer Motion's spring configurations:

```typescript
const springPresets = {
  gentle: { stiffness: 120, damping: 14 },
  snappy: { stiffness: 300, damping: 20 },
  bouncy: { stiffness: 400, damping: 10 },
  smooth: { stiffness: 100, damping: 20 },
};
```

### Enhanced Animations

| Interaction | Current | Enhanced |
|-------------|---------|----------|
| Card flip | CSS transition | Spring with overshoot |
| Grid load | Instant | Staggered fade + scale |
| Hover lift | CSS shadow | Scale + shadow spring |
| Filter hide | None | Scale down + fade |
| Reorder | CSS transition | Spring to new position |

### Staggered Grid Load

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', ...springPresets.gentle },
  },
};
```

## Implementation Tasks

- [ ] Define spring animation presets
- [ ] Implement staggered grid entrance
- [ ] Enhance flip animation with spring
- [ ] Add scale + shadow on hover
- [ ] Polish filter in/out animations
- [ ] Improve reorder animation with springs
- [ ] Add subtle pulse on tap feedback
- [ ] Create loading skeleton animation
- [ ] Ensure all animations respect reduced motion
- [ ] Performance test animations (60fps target)
- [ ] Write visual animation tests

## Success Criteria

- [ ] Grid cards stagger in on load
- [ ] Flip has satisfying spring overshoot
- [ ] Hover feels responsive and lively
- [ ] All animations 60fps
- [ ] Reduced motion: instant but still shows state
- [ ] Animations don't cause layout shift
- [ ] Consistent timing across the app
- [ ] No animation on page refresh (only data load)

## Dependencies

- **Requires**: v0.1.0 Animation Foundation
- **Recommends**: Framer Motion (already installed)
- **Related**: F-005 Reduced Motion Support

## Complexity

Medium

## Milestone

v0.15.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Card Flip Animation](../completed/F-001-card-flip-animation.md)
- [Reduced Motion Support](../completed/F-005-reduced-motion-support.md)
- [v0.15.0 Milestone](../../milestones/v0.15.0.md)

---

**Status**: Planned
