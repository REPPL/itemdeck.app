# F-029: Card Info Button

## Problem Statement

The current card flip reveals limited information (logo and year on back). Users may want to access extended content (description, metadata, links) without leaving the card grid view. An info button provides progressive disclosure of detailed card data.

## Design Approach

Add an info button (ℹ️ icon) to the card front that triggers a modal or slide-out panel with extended content. This follows [progressive disclosure patterns](../../../research/card-ui-design-patterns.md#progressive-disclosure-patterns) - showing essential info first, with details on demand.

### Button Placement Options

1. **Top-right corner** - Standard position for actions (recommended)
2. **In overlay footer** - Near title, contextually grouped
3. **Appears on hover** - Reduces visual clutter

### Modal Content Structure

```
┌─────────────────────────────┐
│ [Image]           [×] Close │
├─────────────────────────────┤
│ Title                       │
│ Year • Category             │
├─────────────────────────────┤
│ Description                 │
│ ...                         │
├─────────────────────────────┤
│ [Source Link] [Share]       │
└─────────────────────────────┘
```

## Implementation Tasks

- [ ] Create `InfoButton` component with icon
- [ ] Position button in card front (top-right)
- [ ] Create `CardDetailModal` component
- [ ] Add modal open/close state management
- [ ] Display extended card data in modal
- [ ] Handle keyboard navigation (Escape to close)
- [ ] Trap focus within modal when open
- [ ] Add backdrop click to close
- [ ] Animate modal entrance/exit
- [ ] Ensure button doesn't trigger card flip
- [ ] Style button for visibility over images
- [ ] Write tests for modal accessibility

## Success Criteria

- [ ] Info button visible on card front
- [ ] Clicking button opens detail modal (not flip)
- [ ] Modal displays extended card information
- [ ] Modal is keyboard accessible (Escape closes)
- [ ] Focus trapped within modal
- [ ] Screen readers announce modal content
- [ ] Modal animates smoothly

## Dependencies

- **Requires**: F-008 Card Data Schema (for extended fields)
- **Recommends**: F-010 Theme System (for modal styling)
- **Related**: Card flip should ignore info button clicks

## Complexity

Medium

## Milestone

v0.3.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Card Data Schema](../completed/F-008-card-data-schema.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)

---

**Status**: Planned
