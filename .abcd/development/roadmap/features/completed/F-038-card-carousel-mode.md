# F-038: Card Carousel Mode

## Problem Statement

The grid view shows many cards but none at large scale. A carousel mode would spotlight one card at a time, allowing detailed viewing with easy navigation to adjacent cards. This supports focused browsing workflows.

## Design Approach

Implement a full-width carousel view where one card is displayed large, with peek previews of adjacent cards. Navigation via swipe, arrow keys, or nav buttons.

### Carousel Layout

```
     ┌─────┐   ┌───────────────┐   ┌─────┐
     │     │   │               │   │     │
     │ ←   │   │    Current    │   │  →  │
     │     │   │     Card      │   │     │
     └─────┘   │               │   └─────┘
               └───────────────┘
                     ●○○○○
```

### Navigation

| Input | Action |
|-------|--------|
| Left arrow / Swipe right | Previous card |
| Right arrow / Swipe left | Next card |
| Home | First card |
| End | Last card |
| Number keys | Jump to card N |

### Transitions

- Current card slides out, next slides in
- Crossfade option for smoother feel
- Spring physics for natural motion
- Gesture-driven: follows finger during swipe

## Implementation Tasks

- [ ] Create `CardCarousel` layout component
- [ ] Implement swipe gesture handling
- [ ] Add arrow navigation buttons
- [ ] Create dot indicators for position
- [ ] Implement keyboard navigation
- [ ] Add adjacent card peek previews
- [ ] Animate transitions (slide/crossfade)
- [ ] Support reduced motion (instant transition)
- [ ] Create carousel/grid mode toggle
- [ ] Persist active card index on mode switch
- [ ] Integrate with layout presets (F-011)
- [ ] Write tests for carousel navigation

## Success Criteria

- [ ] Single card displayed at large scale
- [ ] Swipe/arrows navigate between cards
- [ ] Adjacent cards visible as previews
- [ ] Smooth slide/fade transitions
- [ ] Keyboard navigation works fully
- [ ] Position indicators show current card
- [ ] Mode switch preserves card selection
- [ ] Reduced motion: instant transitions

## Dependencies

- **Requires**: v0.1.0 complete
- **Recommends**: Framer Motion gestures
- **Related**: F-011 Layout Presets (carousel as preset)

## Complexity

Large

## Milestone

v0.4.0

---

---

## Implementation Notes

**Milestone**: v0.10.6 (recognised as complete - originally planned for v0.4.0)

### Component Path

`src/components/CardCarousel/`

### Key Files

- `CardCarousel.tsx` - Full-width carousel view component
- `CardCarousel.module.css` - Carousel layout and transition styles
- `index.ts` - Module exports

### Integration

- Uses Framer Motion for slide/crossfade transitions
- Supports swipe gestures and arrow key navigation
- Shows adjacent card peek previews
- Integrates with layout presets (F-011)
- Respects reduced motion preference

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Layout Presets](../completed/F-011-layout-presets.md)
- [v0.10.6 Milestone](../../milestones/v0.10.6.md)

---

**Status**: Complete
