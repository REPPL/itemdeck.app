# F-028: Card Drag and Drop

## Problem Statement

Users cannot manually reorder cards to create custom arrangements. Physical card collections allow tactile organisation; itemdeck should offer similar flexibility through intuitive drag-and-drop interactions.

## Design Approach

Implement drag-and-drop reordering using @dnd-kit/core library. Cards can be dragged to new positions with visual feedback (ghost image, drop indicators). Support both mouse and touch interactions with appropriate affordances.

### Visual Feedback System

Based on [research on drag-and-drop patterns](../../../research/card-ui-design-patterns.md#drag-and-drop-patterns):

1. **Drag handle**: Six-dot grip icon, always visible on hover
2. **Ghost image**: Semi-transparent clone follows cursor
3. **Drop indicator**: Subtle line or gap shows insertion point
4. **Elevation**: Dragged card lifts with increased shadow

### Touch Considerations

- Long-press (300ms) to initiate drag on touch devices
- Minimum 44x44px drag handle touch target
- Clear haptic/visual feedback when grab succeeds
- Cancel drag by returning to original position

## Implementation Tasks

- [ ] Install @dnd-kit/core and @dnd-kit/sortable
- [ ] Create `DraggableCard` wrapper component
- [ ] Add drag handle with six-dot icon
- [ ] Implement ghost image rendering
- [ ] Create drop indicator component
- [ ] Add elevation change on drag start
- [ ] Handle reorder logic in CardGrid
- [ ] Persist custom order to state/storage
- [ ] Implement touch long-press detection
- [ ] Add keyboard reorder alternative (up/down)
- [ ] Animate cards moving out of the way
- [ ] Write integration tests for drag-and-drop
- [ ] Ensure screen reader announces reorder

## Success Criteria

- [ ] Cards can be dragged and dropped to new positions
- [ ] Visual feedback clearly indicates drag state and drop target
- [ ] Touch devices support long-press to drag
- [ ] Keyboard users can reorder via arrow keys
- [ ] Custom order persists across sessions
- [ ] Animation smooth (60fps) during reorder
- [ ] Accessibility: reorder changes announced

## Dependencies

- **Requires**: v0.1.0 complete
- **Recommends**: F-012 State Persistence (for order storage)
- **New Dependencies**: @dnd-kit/core, @dnd-kit/sortable

## Complexity

Large

## Milestone

v0.4.0

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [State Persistence](./F-012-state-persistence.md)
- [Keyboard Navigation](../completed/F-004-keyboard-navigation.md)
- [v0.4.0 Milestone](../../milestones/v0.4.0.md)

---

**Status**: Planned
