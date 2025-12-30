# F-109: Launch Screen with Logo

## Problem Statement

The app currently shows a generic loading screen with an inline SVG icon. This misses an opportunity to reinforce brand identity and create a positive first impression.

## Design Approach

Add the itemdeck logo to the launch/loading screen with a visually pleasing fade-in animation.

## Implementation Tasks

- [x] Copy logo from `docs/assets/img/logo.png` to `src/assets/img/logo.png`
- [x] Update `LoadingScreen.tsx` to import and display logo
- [x] Replace inline SVG card-deck icon with logo image
- [x] Add fade-in animation to logo
- [x] Ensure logo displays correctly on all screen sizes
- [x] Test reduced motion preference

## Success Criteria

- [x] Logo displays on app launch
- [x] Fade-in animation is smooth
- [x] Logo is appropriately sized (128px width)
- [x] Reduced motion preference respected
- [x] No layout shift during load

## Dependencies

- **Requires**: Logo file exists at `docs/assets/img/logo.png`
- **Blocks**: None

## Complexity

**Small** - Simple component update with CSS animation.

---

## Related Documentation

- [v0.15.0 Milestone](../../milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.15.0/track-a-onboarding.md)

---

**Status**: ✅ Complete
