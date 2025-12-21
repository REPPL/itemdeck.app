# F-034: Card Badges

## Problem Statement

Cards may need to display status indicators, categories, or counts. Currently there's no standardised way to show badges (e.g., "New", "Featured", notification counts). [Visual hierarchy research](../../../research/card-ui-design-patterns.md#visual-hierarchy-techniques) shows badges improve scannability.

## Design Approach

Create a flexible badge system that can display:
- Status indicators (New, Featured, Archived)
- Category labels
- Numeric counts (comments, likes)
- Custom icons with labels

### Badge Positions

```
┌─[New]─────────[★]─┐
│                   │
│      [Image]      │
│                   │
└───────────[3 👁️]──┘
```

Positions: top-left, top-right, bottom-left, bottom-right

### Badge Variants

| Variant | Use Case | Style |
|---------|----------|-------|
| solid | Primary status | Filled background |
| outline | Secondary info | Border only |
| subtle | Metadata | Low contrast |
| dot | Notification | Small circle |

### Badge Component Props

```typescript
interface BadgeProps {
  label?: string;
  icon?: React.ReactNode;
  variant: 'solid' | 'outline' | 'subtle' | 'dot';
  colour?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

## Implementation Tasks

- [ ] Create `Badge` component with variants
- [ ] Create `CardBadges` container component
- [ ] Position badges absolutely within card
- [ ] Style badge variants (solid, outline, subtle, dot)
- [ ] Add colour theme support
- [ ] Handle multiple badges per position (stacking)
- [ ] Animate badge appearance
- [ ] Add badge data to card schema
- [ ] Ensure badges accessible (not just colour)
- [ ] Write tests for badge rendering

## Success Criteria

- [ ] Badges render in specified positions
- [ ] All variants visually distinct
- [ ] Colours follow theme
- [ ] Badges don't overflow card bounds
- [ ] Accessible: not colour-only information
- [ ] Multiple badges stack correctly
- [ ] Animation on badge appear/disappear

## Dependencies

- **Requires**: v0.1.0 complete
- **Recommends**: F-010 Theme System (for colours)
- **Related**: F-030 Enhanced Card Front Design

## Complexity

Small

## Milestone

v0.3.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Enhanced Card Front Design](./F-030-enhanced-card-front-design.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)

---

**Status**: Planned
