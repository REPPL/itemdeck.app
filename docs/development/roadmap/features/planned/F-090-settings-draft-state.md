# F-090: Settings Draft State Pattern

## Overview

Implement a draft state pattern for settings so changes only apply when the user clicks "Accept", not immediately when values change.

## Problem Statement

Currently, settings changes apply immediately as the user adjusts values. This causes:
- Jarring visual changes while exploring options
- Difficulty reverting if user doesn't like a change
- No clear "save" or "cancel" workflow
- Potential confusion about whether changes are saved

## Proposed Solution

Implement a draft state pattern where:
1. Settings panel operates on a draft copy of settings
2. Changes are previewed but not committed
3. "Accept" button commits all draft changes
4. "Cancel" button discards draft and reverts to committed state

## Design Approach

### Architecture

```
┌─────────────────────────────────────────────────┐
│ Settings Store                                  │
├─────────────────────────────────────────────────┤
│ committed: SettingsState (persisted)            │
│ draft: SettingsState | null                     │
│                                                 │
│ startEditing() → creates draft from committed   │
│ updateDraft(partial) → updates draft only       │
│ commitDraft() → draft → committed, persist      │
│ discardDraft() → draft = null                   │
│                                                 │
│ getEffective() → draft ?? committed             │
└─────────────────────────────────────────────────┘
```

### UI Changes

1. **Accept Button**: Commits draft to committed state
2. **Cancel Button**: Discards draft, closes panel
3. **Preview Mode**: UI reflects draft state while editing
4. **Dirty Indicator**: Show when draft differs from committed

### Scope

Apply to all settings except:
- Dark Mode (should apply immediately for accessibility)
- High Contrast (should apply immediately for accessibility)

### Components Affected

- `settingsStore.ts` - Draft state management
- `SettingsPanel.tsx` - Accept/Cancel workflow
- All settings tabs - Use draft update actions
- Theme application - Use `getEffective()` for preview

## Implementation Tasks

- [ ] Add draft state to settingsStore
- [ ] Add startEditing, updateDraft, commitDraft, discardDraft actions
- [ ] Add getEffective selector
- [ ] Update SettingsPanel to initialise draft on open
- [ ] Update all settings controls to use updateDraft
- [ ] Update Accept button to commit draft
- [ ] Update Cancel button to discard draft
- [ ] Add dirty state indicator
- [ ] Update theme hooks to use effective settings
- [ ] Exclude accessibility settings from draft pattern
- [ ] Add tests for draft state lifecycle

## Success Criteria

- [ ] Settings changes only apply on Accept
- [ ] Cancel reverts to previous state
- [ ] Preview shows draft values while editing
- [ ] Dark Mode and High Contrast still apply immediately
- [ ] Draft state not persisted (only committed state)
- [ ] Clear visual indication when changes are pending

## Complexity

**Large** - Requires changes to store architecture and all settings components.

## Dependencies

- None (can be implemented independently)

## Deferred From

- v0.11.5 (noted as major architectural change)

---

## Related Documentation

- [Settings Panel Redesign](../completed/F-072-settings-panel-redesign.md)
- [v0.14.0 Milestone](../../milestones/v0.14.0.md)

---

**Status**: Planned
