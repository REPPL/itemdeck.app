# F-048: Edit Mode Toggle

## Problem Statement

Itemdeck is currently read-only with no way for users to modify entity data. Before implementing editing functionality, users need a way to:

1. **Enable edit mode** - Opt-in to editing features (hidden by default)
2. **Visual indication** - Know when edit mode is active
3. **Quick toggle** - Switch between browse and edit modes easily
4. **Persistent preference** - Remember edit mode state across sessions

This is the foundation for all editing features (F-049 to F-052).

## Design Approach

Add a global `editModeEnabled` setting to the settings store with UI controls and visual feedback.

### UI Components

```
Settings Panel → System Tab
┌─────────────────────────────────────┐
│ Edit Mode                           │
│ ┌─────────────────────────────────┐ │
│ │ ☐ Enable editing                │ │
│ │   Allow modifying entity data   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⓘ Changes are saved locally only.  │
│   Export edits to backup.           │
└─────────────────────────────────────┘
```

### Visual Indicator (When Active)

```
┌─────────────────────────────────────┐
│ [✎ Edit Mode]              [⚙]     │  ← Header bar
├─────────────────────────────────────┤
│                                     │
│   Card Grid...                      │
│                                     │
└─────────────────────────────────────┘
```

### Keyboard Shortcut

`E` key toggles edit mode globally (when not in text input).

## Implementation Tasks

### Phase 1: Store Update

- [ ] Add `editModeEnabled: boolean` to `settingsStore`
- [ ] Add `setEditModeEnabled(enabled: boolean)` action
- [ ] Add version migration (v11) for new field
- [ ] Default to `false`

### Phase 2: Settings UI

- [ ] Add "Edit Mode" section to System tab in SettingsPanel
- [ ] Create toggle switch with label and description
- [ ] Add informational text about local-only storage
- [ ] Style consistently with existing settings

### Phase 3: Visual Indicator

- [ ] Create `src/components/EditModeIndicator/EditModeIndicator.tsx`
- [ ] Show "Edit Mode" badge in header when active
- [ ] Use distinct colour (e.g., amber/yellow)
- [ ] Add click handler to open settings

### Phase 4: Keyboard Shortcut

- [ ] Add `E` key handler to `useGlobalKeyboard` hook
- [ ] Toggle `editModeEnabled` on keypress
- [ ] Show toast notification when toggled
- [ ] Ignore when focused on input/textarea

## Success Criteria

- [ ] Toggle persists across browser sessions
- [ ] Visual indicator clearly shows when edit mode is active
- [ ] Keyboard shortcut works from anywhere in the app
- [ ] Settings UI matches existing design patterns
- [ ] No edit buttons visible when edit mode is disabled

## Dependencies

- **Existing**: `settingsStore`, `useGlobalKeyboard`, `SettingsPanel`
- **New**: None

## Complexity

**Small** - Simple boolean toggle with UI feedback.

## Testing Strategy

- Unit test for store toggle action
- Component test for settings toggle
- E2E test for keyboard shortcut
- Visual regression test for indicator

---

## Related Documentation

- [ADR-015: Edit Mode UX Pattern](../../decisions/adrs/ADR-015-edit-mode-ux.md)
- [F-049: Entity Edits Store](./F-049-entity-edits-store.md)
- [v0.10.0 Milestone](../../milestones/v0.10.0.md)

---

**Status**: Planned
