# F-051: Edit Button Integration

## Problem Statement

Users need clear entry points to edit entity data. Edit buttons should:

1. **Be discoverable** - Visible in expected locations
2. **Respect edit mode** - Only show when edit mode is enabled
3. **Be consistent** - Same behaviour from different entry points
4. **Be accessible** - Keyboard accessible with clear labels

## Design Approach

Add Edit buttons to two locations: CardQuickActions and CardExpanded footer.

### CardQuickActions Location

```
Card (hovered/focused)
┌─────────────────────────────────┐
│ [Image]                         │
│                                 │
│         [ℹ] [♡] [↗] [✎]        │  ← Edit button added
│ Title                           │
└─────────────────────────────────┘
```

### CardExpanded Footer Location

```
CardExpanded Modal
┌─────────────────────────────────────────────────┐
│ Super Metroid                               [×] │
├─────────────────────────────────────────────────┤
│                                                 │
│   [Image Gallery]                               │
│                                                 │
│   Platform: SNES                                │
│   Year: 1994                                    │
│   Summary: A side-scrolling...                  │
│                                                 │
├─────────────────────────────────────────────────┤
│ [View on Wikipedia]            [Edit ✎]        │  ← Edit button
└─────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: CardQuickActions Update

- [ ] Add Edit button to `CardQuickActions.tsx`
- [ ] Conditionally render based on `editModeEnabled`
- [ ] Use pencil icon (✎) consistent with indicator
- [ ] Add `aria-label="Edit card"` for accessibility
- [ ] Add onClick handler to open EditForm modal

### Phase 2: CardExpanded Update

- [ ] Add Edit button to `CardExpanded.tsx` footer
- [ ] Position alongside existing action buttons
- [ ] Conditionally render based on `editModeEnabled`
- [ ] Style consistently with existing footer buttons

### Phase 3: Modal State Management

- [ ] Create `useEditModal` hook for managing edit modal state
- [ ] Track which entity is being edited
- [ ] Close edit modal cleanly from both entry points
- [ ] Handle opening edit modal when CardExpanded is open

### Phase 4: Edit Indicator on Cards

- [ ] Add small pencil icon to cards with local edits
- [ ] Position in corner (e.g., top-right)
- [ ] Show regardless of edit mode (indicates changes exist)
- [ ] Tooltip: "This card has local edits"

## Success Criteria

- [ ] Edit button appears in CardQuickActions when edit mode enabled
- [ ] Edit button appears in CardExpanded footer when edit mode enabled
- [ ] Clicking Edit opens EditForm modal with correct entity
- [ ] Cards with edits show visual indicator (even when edit mode off)
- [ ] Edit buttons have proper ARIA labels
- [ ] Keyboard users can access Edit button

## Dependencies

- **F-048**: Edit Mode Toggle
- **F-049**: Entity Edits Store (for `hasEdits`)
- **F-050**: Edit Form Component

## Complexity

**Small** - Adding buttons to existing components.

## Testing Strategy

- Component tests for button visibility
- E2E test for edit flow from both entry points
- Accessibility test for button labelling

---

## Related Documentation

- [ADR-015: Edit Mode UX](../../decisions/adrs/ADR-015-edit-mode-ux.md)
- [F-050: Edit Form Component](./F-050-edit-form-component.md)

---

**Status**: Planned
