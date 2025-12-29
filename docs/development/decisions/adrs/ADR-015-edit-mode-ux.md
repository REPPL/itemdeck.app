# ADR-015: Edit Mode UX Pattern

## Status

Accepted

## Context

Itemdeck needs a user interface pattern for editing entity data. Users should be able to modify text fields (title, year, summary, myVerdict) without disrupting the read-only browsing experience.

We evaluated several UX approaches:

| Pattern | Discoverability | Focus | Complexity | Mobile |
|---------|-----------------|-------|------------|--------|
| **Modal Edit Form** | High | Excellent | Medium | Good |
| **Inline Editing** | Low | Poor | Low | Poor |
| **Slide-out Panel** | Medium | Good | Medium | Fair |
| **Edit Page** | High | Excellent | High | Good |
| **Popover Form** | Medium | Fair | Low | Poor |

## Decision

Use a **Modal Edit Form** pattern.

When editing is triggered (via Edit button), open a modal dialogue containing a form for the entity's editable fields. This mirrors the existing CardExpanded pattern for viewing details.

```
┌────────────────────────────────────────────────┐
│ Edit: Super Metroid                        [×] │
├────────────────────────────────────────────────┤
│                                                │
│ Title *                                        │
│ ┌────────────────────────────────────────────┐ │
│ │ Super Metroid                              │ │
│ └────────────────────────────────────────────┘ │
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
│ └────────────────────────────────────────────┘ │
│                                                │
│ My Verdict                                     │
│ ┌────────────────────────────────────────────┐ │
│ │ One of the greatest games ever made.      │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│            [Cancel]  [Save Changes]            │
│                                                │
│ ⓘ Changes saved locally. Export to backup.    │
└────────────────────────────────────────────────┘
```

## Consequences

### Positive

- **Clear boundaries** - Edit mode is visually distinct from browse mode
- **Focus trap** - Modal keeps user focused on editing task
- **Consistent with CardExpanded** - Users familiar with modal pattern
- **Full form validation** - Can validate all fields before save
- **Cancel safety** - Clear escape path without saving
- **Mobile friendly** - Modal works well on mobile devices
- **Accessibility** - Modal patterns well-established for a11y

### Negative

- **Context switch** - User leaves card grid to edit
- **No live preview** - Can't see changes on card while editing
- **Modal fatigue** - Another modal on top of existing modals

### Mitigations

- **Pre-fill form** - Show current values to minimise disorientation
- **Dirty state indicator** - Show unsaved changes warning
- **Quick save** - Ctrl+Enter to save without mouse
- **Modal stacking** - Ensure proper z-index and backdrop handling

## Entry Points

Two ways to enter edit mode:

1. **CardQuickActions** - Edit button in quick action bar (when edit mode enabled)
2. **CardExpanded footer** - Edit button at bottom of detail modal

```
CardGrid
   └── Card
        ├── CardQuickActions
        │    └── [Edit] button → Opens EditForm modal
        │
        └── (click) → CardExpanded modal
                        └── [Edit] footer button → Opens EditForm modal
```

## Edit Mode Toggle

Global setting to show/hide edit buttons:

```typescript
// In settingsStore
editModeEnabled: boolean;  // Default: false
```

When `editModeEnabled: false`:
- Edit buttons hidden
- Keyboard shortcut (E) shows toast to enable
- Settings panel has toggle

When `editModeEnabled: true`:
- Edit buttons visible
- Cards with edits show indicator
- Export Edits option available

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `E` | Toggle edit mode (global) |
| `Escape` | Close edit modal without saving |
| `Ctrl+Enter` | Save and close |
| `Tab` | Navigate form fields |

## Alternatives Considered

### Inline Editing (Notion-style)

- Click on text to edit in place
- **Rejected**: Conflicts with flip interaction, poor mobile support, requires complex DOM handling

### Slide-out Panel

- Edit form slides from right edge
- **Rejected**: Conflicts with potential sidebar, less mobile-friendly

### Dedicated Edit Page/Route

- Navigate to `/edit/:cardId`
- **Rejected**: Overkill for simple edits, loses context of collection

### Edit Mode Overlay

- Entire grid enters "edit mode" with all cards editable
- **Rejected**: Too complex, overwhelming UI, conflicts with mechanics

---

## Related Documentation

- [R-004: Form Handling in React](../../research/R-004-form-handling.md)
- [ADR-014: Entity Edit Architecture](./ADR-014-entity-edit-architecture.md)
- [Accessibility Research](../../research/accessibility.md)
- [F-050: Edit Form Component](../../roadmap/features/planned/F-050-edit-form-component.md)

---

**Applies to**: Itemdeck v0.10.0+
