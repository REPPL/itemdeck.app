# F-050: Edit Form Component

## Problem Statement

Users need a form interface to modify entity data (title, year, summary, myVerdict, etc.). The form must:

1. **Display current values** - Pre-fill with existing data (including any local edits)
2. **Validate input** - Required fields, data types, constraints
3. **Accessible** - Proper labels, error messages, keyboard navigation
4. **Match existing UI** - Consistent with CardExpanded modal styling

## Design Approach

Create a modal-based edit form that opens when an Edit button is clicked.

### Form Layout

```
┌────────────────────────────────────────────────┐
│ Edit: Super Metroid                        [×] │
├────────────────────────────────────────────────┤
│                                                │
│ Title *                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ Super Metroid                              │ │
│ └────────────────────────────────────────────┘ │
│ ⚠ Title is required                            │
│                                                │
│ Year                                           │
│ ┌────────────────────────────────────────────┐ │
│ │ 1994                                       │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Summary                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ A side-scrolling action-adventure game... │ │
│ │                                            │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ My Verdict                                     │
│ ┌────────────────────────────────────────────┐ │
│ │ One of the greatest games ever made.      │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ My Rank                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ 1                                          │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│            [Cancel]  [Save Changes]            │
└────────────────────────────────────────────────┘
```

### Field Types

| Field | Type | Control | Validation |
|-------|------|---------|------------|
| title | string | text input | Required, min 1 char |
| year | number | number input | Optional, 1900-2100 |
| summary | text | textarea | Optional |
| myVerdict | text | textarea | Optional |
| myRank | number | number input | Optional, >= 1 |
| genres | string[] | tag input | Optional |

## Implementation Tasks

### Phase 1: Form Component

- [x] Create `src/components/EditForm/EditForm.tsx`
- [x] Create `src/components/EditForm/EditForm.module.css`
- [x] Implement controlled form with React state
- [x] Pre-fill form with card data (merged with edits)

### Phase 2: Field Components

- [x] Create inline field components for text/number inputs
- [x] Create inline textarea for multiline text (summary, myVerdict)
- [x] Tag input deferred to future enhancement
- [x] Style fields to match existing form patterns

### Phase 3: Validation

- [x] Create Zod schema for editable fields
- [x] Implement validation on submit
- [x] Display inline error messages
- [x] Add ARIA attributes for accessibility

### Phase 4: Modal Integration

- [x] Wrap form in modal component
- [x] Add close button (×) with Escape key handler
- [x] Focus first input on open
- [x] Add backdrop click to close

### Phase 5: Save Flow

- [x] Connect Save button to `editsStore.setFields()`
- [x] Close modal on successful save
- [x] Handle Cancel to close without saving
- [x] Add Revert Changes button for edited cards

## Success Criteria

- [x] Form displays all editable fields with current values
- [x] Required field validation prevents saving empty title
- [x] Keyboard navigation works (Tab, Shift+Tab, Escape)
- [x] Screen readers announce field labels and errors
- [x] Save updates editsStore and closes modal
- [x] Cancel closes modal without changes

## Dependencies

- **F-048**: Edit Mode Toggle (for visibility)
- **F-049**: Entity Edits Store (for saving)
- **ADR**: [ADR-015: Edit Mode UX](../../decisions/adrs/ADR-015-edit-mode-ux.md)

## Complexity

**Medium** - Modal form with validation and accessibility.

## Testing Strategy

- Component tests for form rendering
- Validation tests for each field type
- Accessibility tests (axe-core)
- E2E test for complete edit flow

---

## Related Documentation

- [R-004: Form Handling in React](../../research/R-004-form-handling.md)
- [ADR-015: Edit Mode UX](../../decisions/adrs/ADR-015-edit-mode-ux.md)
- [F-051: Edit Button Integration](./F-051-edit-button-integration.md)
- [Accessibility Research](../../research/accessibility.md)

---

**Status**: Complete
