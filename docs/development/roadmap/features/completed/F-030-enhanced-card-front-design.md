# F-030: Enhanced Card Front Design

## Problem Statement

The current card front overlay is functional but lacks visual polish. The title could be more prominent, and the gradient overlay doesn't maximise image visibility while ensuring text readability. Inspiration from [Apple Wallet](../../../research/card-ui-design-patterns.md#apple-wallet-design-patterns) and modern card interfaces suggests improvements.

## Design Approach

Enhance the card front with:

1. **Glassmorphism footer** - Frosted glass effect for overlay
2. **Enhanced typography** - Bolder title, better hierarchy
3. **Flexible metadata** - Support for badges, categories, ratings
4. **Image protection** - Better gradient for text readability

### Glassmorphism Footer Design

Based on [glassmorphism research](../../../research/card-ui-design-patterns.md#glassmorphism):

```css
.overlay {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Typography Hierarchy

- **Title**: 1.25rem, font-weight 700, letter-spacing -0.02em
- **Year/Category**: 0.875rem, font-weight 500, opacity 0.9
- **Badges**: Pill-shaped, small caps, accent colour

### Metadata Slots

```
┌─────────────────────────────┐
│                             │
│        [Image Area]         │
│                             │
├─────────────────────────────┤
│ ⭐ 4.8  │  🏷️ Category      │  ← Optional top metadata
├─────────────────────────────┤
│ Title of the Card           │
│ 2024 • Additional Info      │
└─────────────────────────────┘
```

## Implementation Tasks

- [ ] Implement glassmorphism footer overlay
- [ ] Add fallback for browsers without backdrop-filter
- [ ] Enhance title typography (size, weight, shadow)
- [ ] Create metadata badge component
- [ ] Add category/tag display slot
- [ ] Implement optional rating display
- [ ] Create configurable overlay style variants
- [ ] Ensure WCAG contrast compliance (4.5:1)
- [ ] Test glassmorphism on various image backgrounds
- [ ] Add theme-aware colour adjustments
- [ ] Write visual regression tests

## Success Criteria

- [ ] Glassmorphism overlay renders correctly
- [ ] Fallback works in unsupported browsers
- [ ] Title more visually prominent
- [ ] Text readable over any image (4.5:1 contrast)
- [ ] Metadata badges display when data available
- [ ] Design consistent with modern card patterns
- [ ] Performance: no jank from backdrop-filter

## Dependencies

- **Requires**: v0.1.0 Card Flip Animation
- **Recommends**: F-010 Theme System (for variants)
- **Related**: F-008 Card Data Schema (for metadata fields)

## Complexity

Medium

## Milestone

v0.3.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Card Flip Animation](../completed/F-001-card-flip-animation.md)
- [Theme System](./F-010-theme-system.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)

---

**Status**: Planned
