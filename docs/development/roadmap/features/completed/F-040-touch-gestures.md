# F-040: Touch Gestures

## Problem Statement

Touch device users expect natural gestures beyond tap. The current implementation supports click/tap but lacks swipe, pinch, and long-press gestures that mobile users find intuitive based on [touch considerations research](../../../research/card-ui-design-patterns.md#touch-and-mobile-considerations).

## Design Approach

Implement a comprehensive touch gesture system using Framer Motion's gesture handling. Gestures should feel natural and provide immediate visual feedback.

### Gesture Map

| Gesture | Action | Visual Feedback |
|---------|--------|-----------------|
| Tap | Flip card | Slight scale pulse |
| Long-press (300ms) | Select for drag | Haptic + lift |
| Swipe horizontal | Navigate carousel | Card follows finger |
| Swipe vertical | Scroll grid | Native scroll |
| Pinch spread | Expand to fit view | Cards grow |
| Pinch close | Return to normal | Cards shrink |
| Two-finger tap | Quick info | Info modal opens |

### Visual Feedback

- **Tap**: Brief scale to 0.98, then back to 1.0
- **Long-press**: Scale to 1.05, shadow increases
- **Swipe**: Card moves with finger, rubber-band at edges
- **Pinch**: Smooth scale transformation

### Accessibility Fallbacks

All gestures have button/keyboard alternatives:
- Long-press → Context menu button
- Pinch → Zoom buttons
- Swipe → Arrow buttons

## Implementation Tasks

- [ ] Integrate Framer Motion gesture handling
- [ ] Implement tap feedback animation
- [ ] Add long-press detection with timing
- [ ] Create swipe navigation for carousel
- [ ] Implement pinch-to-zoom (optional)
- [ ] Add haptic feedback (Vibration API)
- [ ] Create gesture overlay hints for onboarding
- [ ] Ensure all gestures have alternatives
- [ ] Handle gesture conflicts (tap vs long-press)
- [ ] Test on iOS and Android devices
- [ ] Write gesture interaction tests

## Success Criteria

- [ ] Tap provides visual feedback
- [ ] Long-press selects card after 300ms
- [ ] Swipe works in carousel mode
- [ ] All gestures have keyboard alternatives
- [ ] Haptic feedback on supported devices
- [ ] Gestures don't conflict with scroll
- [ ] Works on iOS Safari and Android Chrome
- [ ] No gesture hijacks system functions

## Dependencies

- **Requires**: v0.1.0 complete
- **Recommends**: Framer Motion (already installed)
- **Related**: F-028 Drag and Drop, F-038 Carousel Mode

## Complexity

Medium

## Milestone

v0.4.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Card Drag and Drop](./F-028-card-drag-and-drop.md)
- [Card Carousel Mode](./F-038-card-carousel-mode.md)
- [v0.4.0 Milestone](../../milestones/v0.4.0.md)

---

**Status**: Completed
