# F-039: Responsive Typography

## Problem Statement

Card text currently uses fixed font sizes that may be too small on mobile or too large on big screens. [Typography research](../../../research/card-ui-design-patterns.md#typography-for-cards) recommends fluid typography that scales with viewport for optimal readability.

## Design Approach

Implement fluid typography using CSS `clamp()` for smooth scaling between minimum and maximum sizes. Card text should remain readable at all card sizes, especially in fit-to-viewport mode.

### Type Scale

| Element | Mobile | Desktop | Formula |
|---------|--------|---------|---------|
| Title | 1rem | 1.5rem | `clamp(1rem, 2vw + 0.5rem, 1.5rem)` |
| Year | 0.875rem | 1.125rem | `clamp(0.875rem, 1.5vw + 0.5rem, 1.125rem)` |
| Badge | 0.75rem | 0.875rem | `clamp(0.75rem, 1vw + 0.5rem, 0.875rem)` |

### Card-Relative Sizing

For cards that change size (fit-to-viewport, carousel):

```css
.overlayTitle {
  font-size: clamp(0.75rem, calc(var(--card-width) * 0.045), 1.5rem);
}
```

This scales text relative to card width rather than viewport.

### CSS Custom Properties

```css
:root {
  --text-scale-base: 1rem;
  --text-scale-sm: 0.875rem;
  --text-scale-lg: 1.25rem;
  --text-scale-xl: 1.5rem;

  /* Fluid versions */
  --text-fluid-title: clamp(1rem, 2vw + 0.5rem, 1.5rem);
  --text-fluid-body: clamp(0.875rem, 1.5vw + 0.5rem, 1.125rem);
  --text-fluid-small: clamp(0.75rem, 1vw + 0.5rem, 0.875rem);
}
```

## Implementation Tasks

- [ ] Define fluid typography scale in CSS variables
- [ ] Update card title to use fluid sizing
- [ ] Update card year/metadata typography
- [ ] Add card-relative sizing for variable card widths
- [ ] Ensure minimum readable size (never below 12px)
- [ ] Test across viewport sizes
- [ ] Coordinate with fit-to-viewport mode
- [ ] Verify WCAG contrast at all sizes
- [ ] Update theme to include typography tokens
- [ ] Write visual regression tests

## Success Criteria

- [ ] Text scales smoothly with viewport
- [ ] Text scales with card size in fit mode
- [ ] Minimum size never drops below readable (12px)
- [ ] Maximum size prevents oversized text
- [ ] Contrast maintained at all sizes (4.5:1)
- [ ] Typography consistent across cards
- [ ] No layout shift during resize

## Dependencies

- **Requires**: v0.1.0 complete
- **Enhances**: F-031 Fit to Viewport Mode
- **Related**: F-010 Theme System

## Complexity

Small

## Milestone

v0.3.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Fit to Viewport Mode](./F-031-fit-to-viewport.md)
- [Theme System](./F-010-theme-system.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)

---

**Status**: Completed
