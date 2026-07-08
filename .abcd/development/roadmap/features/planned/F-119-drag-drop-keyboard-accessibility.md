# F-119: Drag-Drop Keyboard Accessibility

## Problem Statement

While drag-and-drop reordering (F-028) provides an excellent experience for mouse and touch users, keyboard-only users face significant barriers:

1. **No visible keyboard controls** - Users must know `Space` starts drag and arrow keys move
2. **No ARIA announcements** - Screen reader users receive no feedback on position changes
3. **Limited discoverability** - Keyboard shortcuts not documented in help or visible in UI
4. **No alternative interaction** - Users must learn the keyboard drag paradigm

Research findings from [Card UI Design Patterns](../../research/card-ui-design-patterns.md#drag-and-drop-patterns) strongly recommend:
- **Salesforce Pattern**: Dedicated "Move Up/Down" buttons alongside drag handles
- **ARIA Live Regions**: Announce position changes ("Item moved from position 3 to position 2")
- **Focus Management**: Return focus to moved item after reorder

## Design Approach

Implement **dual interaction mode** following Salesforce UX patterns:

### 1. Keyboard Shortcut Mode (Existing Enhancement)

Enhance existing @dnd-kit keyboard support:
- Add ARIA live announcements for all reorder actions
- Improve focus management after drag complete
- Add keyboard shortcut hints to help documentation

### 2. Button-Based Alternative (New)

Add accessible move buttons for users who cannot use keyboard drag:
- "Move Up" / "Move Down" buttons on focused cards
- Visible on focus (keyboard users)
- Hidden on touch/mouse hover (they use drag)
- WAI-ARIA compliant with proper roles

### Visual Design

```
┌────────────────────┐
│  ┌──────────────┐  │
│  │  Card Image  │  │
│  └──────────────┘  │
│                    │
│  Card Title        │
│                    │
│  [▲] [▼]           │  ← Move buttons (visible on focus)
└────────────────────┘
```

Buttons appear:
- **On keyboard focus**: Always visible
- **On hover (mouse)**: Hidden (drag handle shown instead)
- **On touch**: Hidden (drag handle shown instead)

## Implementation Tasks

### Phase 1: ARIA Announcements

- [ ] Create `src/hooks/useDragAnnouncements.ts` hook
- [ ] Implement announcements for drag start/end/cancel
- [ ] Add position change announcements ("Moved from 3 to 2")
- [ ] Create visually hidden live region component
- [ ] Integrate with DraggableCardGrid

### Phase 2: Move Button Component

- [ ] Create `src/components/MoveButtons/MoveButtons.tsx`
- [ ] Implement "Move Up" and "Move Down" buttons
- [ ] Style buttons for keyboard-focus visibility
- [ ] Add button click handlers that call reorder logic
- [ ] Disable buttons at collection boundaries (first/last)

### Phase 3: Integration

- [ ] Add MoveButtons to Card component (keyboard focus only)
- [ ] Create CSS for focus-visible button display
- [ ] Ensure buttons hidden during mouse/touch interactions
- [ ] Update CardGrid to support both interaction modes

### Phase 4: Documentation & Help

- [ ] Add keyboard shortcuts to Help panel
- [ ] Document reorder shortcuts in user guide
- [ ] Add tooltips explaining keyboard alternatives
- [ ] Update F-028 spec with accessibility notes

### Phase 5: Testing

- [ ] Add unit tests for MoveButtons component
- [ ] Add integration tests for keyboard reordering
- [ ] Add Playwright a11y tests for announcements
- [ ] Test with VoiceOver and NVDA

## Success Criteria

- [ ] Screen readers announce all position changes
- [ ] Keyboard-only users can reorder without learning drag shortcuts
- [ ] Move buttons visible on keyboard focus
- [ ] Move buttons hidden during mouse/touch interaction
- [ ] Focus returns to moved card after reorder
- [ ] Keyboard shortcuts documented in Help
- [ ] WCAG 2.2 AA compliance verified

## Dependencies

- **Requires**: F-028 (Card Drag and Drop) - ✅ Complete
- **Requires**: F-019 (Accessibility Audit) - ✅ Complete
- **Recommends**: F-073 (User Documentation) - ✅ Complete (for Help updates)

## Complexity

**Small-Medium** - Accessibility enhancement to existing feature.

## Research References

From [Card UI Design Patterns Research](../../research/card-ui-design-patterns.md#drag-and-drop-patterns):

> "Drag-and-drop is notoriously difficult for keyboard users... Salesforce recommends providing explicit 'Move Up/Down' buttons as alternatives."

Key patterns to implement:
- **Explicit Keyboard Mode**: Visible buttons for keyboard users
- **ARIA Live Regions**: Screen reader announcements
- **Focus Management**: Maintain focus on moved items

## Code Examples

### ARIA Announcements Hook

```typescript
function useDragAnnouncements() {
  const announce = useCallback((message: string) => {
    const region = document.getElementById('drag-announcements');
    if (region) {
      region.textContent = message;
    }
  }, []);

  return {
    onDragStart: (id: string, position: number) =>
      announce(`Started dragging item at position ${position}`),
    onDragEnd: (id: string, from: number, to: number) =>
      announce(`Item moved from position ${from} to position ${to}`),
    onDragCancel: () =>
      announce('Drag cancelled'),
  };
}
```

### Move Buttons Component

```tsx
function MoveButtons({ onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className={styles.moveButtons} role="group" aria-label="Reorder controls">
      <button
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label="Move up"
        className={styles.moveButton}
      >
        ▲
      </button>
      <button
        onClick={onMoveDown}
        disabled={isLast}
        aria-label="Move down"
        className={styles.moveButton}
      >
        ▼
      </button>
    </div>
  );
}
```

### CSS for Focus Visibility

```css
.moveButtons {
  display: none;
}

.card:focus-visible .moveButtons {
  display: flex;
  gap: 4px;
}

/* Hide when drag handle is shown (mouse/touch) */
.card:hover .moveButtons,
.card[data-dragging] .moveButtons {
  display: none;
}
```

---

## Related Documentation

- [Card UI Design Patterns Research](../../research/card-ui-design-patterns.md)
- [F-028: Card Drag and Drop](../completed/F-028-card-drag-and-drop.md)
- [F-019: Accessibility Audit](../completed/F-019-accessibility-audit.md)
- [Accessibility Research](../../research/accessibility.md)
- [v1.0.0 Milestone](../../milestones/v1.0.0.md)

---

**Status**: Planned
