# F-113: Lazy Loading Visual Indicator

## Problem Statement

When images load lazily, users may not understand why images appear delayed. The current shimmer placeholder is subtle and may go unnoticed, leading to confusion about image loading state.

## Design Approach

Enhance lazy loading visual feedback to make loading state more obvious:
1. Make shimmer animation more visible (slower pulse)
2. Add optional loading spinner overlay
3. Set `aria-busy="true"` during loading for accessibility

## Implementation Tasks

- [ ] Update LazyImage shimmer animation (slower, more visible)
- [ ] Add optional loading spinner overlay
- [ ] Add `aria-busy="true"` during loading state
- [ ] Test visibility on slow network
- [ ] Ensure reduced motion preference respected

## Animation Considerations

Current shimmer:
- Fast pulse animation
- Subtle gradient effect

Enhanced shimmer:
- Slower pulse (2s instead of 1s)
- More pronounced gradient
- Optional spinner icon

## Success Criteria

- [ ] Loading state clearly visible
- [ ] Shimmer animation more noticeable
- [ ] aria-busy attribute set correctly
- [ ] Reduced motion preference respected
- [ ] No layout shift during load

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Small** - CSS animation and attribute changes only.

---

## Related Documentation

- [v0.15.0 Milestone](../../milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.15.0/track-c1-caching.md)
