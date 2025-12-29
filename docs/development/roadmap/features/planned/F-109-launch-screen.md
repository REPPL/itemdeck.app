# F-109: Launch Screen with Logo

## Problem Statement

The app currently shows a generic loading screen with an inline SVG icon. This misses an opportunity to reinforce brand identity and create a positive first impression.

## Design Approach

Add the itemdeck logo to the launch/loading screen with a visually pleasing fade-in animation.

## Implementation Tasks

- [ ] Copy logo from `docs/assets/img/logo.png` to `src/assets/img/logo.png`
- [ ] Update `LoadingScreen.tsx` to import and display logo
- [ ] Replace inline SVG card-deck icon with logo image
- [ ] Add fade-in animation to logo
- [ ] Ensure logo displays correctly on all screen sizes
- [ ] Test reduced motion preference

## Success Criteria

- [ ] Logo displays on app launch
- [ ] Fade-in animation is smooth
- [ ] Logo is appropriately sized (128px width)
- [ ] Reduced motion preference respected
- [ ] No layout shift during load

## Dependencies

- **Requires**: Logo file exists at `docs/assets/img/logo.png`
- **Blocks**: None

## Complexity

**Small** - Simple component update with CSS animation.

---

## Related Documentation

- [v0.15.0 Milestone](../../milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.15.0/track-a-onboarding.md)
