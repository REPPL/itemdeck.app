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

- [x] Add Edit button to `CardQuickActions.tsx`
- [x] Conditionally render based on `editModeEnabled`
- [x] Use EditIcon component consistent with indicator
- [x] Add `aria-label="Edit card"` for accessibility
- [x] Add onClick handler passed via props

### Phase 2: CardExpanded Update

- [x] Add Edit button to `CardExpanded.tsx` header
- [x] Position alongside close button
- [x] Conditionally render based on `editModeEnabled`
- [x] Style consistently with existing header buttons

### Phase 3: Modal State Management

- [x] Local state in CardExpanded for managing edit modal
- [x] Track when edit modal is open
- [x] Close edit modal cleanly
- [x] Handle opening edit modal from within CardExpanded

### Phase 4: Edit Indicator on Cards

- [x] Add "Edited" badge to CardExpanded header when card has edits
- [x] Show regardless of edit mode (indicates changes exist)
- [x] Styled with amber colour consistent with EditModeIndicator

## Success Criteria

- [x] Edit button appears in CardQuickActions when edit mode enabled
- [x] Edit button appears in CardExpanded header when edit mode enabled
- [x] Clicking Edit opens EditForm modal with correct entity
- [x] Cards with edits show visual indicator (even when edit mode off)
- [x] Edit buttons have proper ARIA labels
- [x] Keyboard users can access Edit button

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

**Status**: Complete
