# v0.15.6 Devlog

## Overview

| Metric | Value |
|--------|-------|
| **Version** | v0.15.6 |
| **Theme** | Settings Consistency & Bug Fixes |
| **Bugs Fixed** | 5 |
| **Modified Files** | 8 |
| **Tests** | 722 passing |

---

## Implementation Narrative

v0.15.6 is a bug fix release addressing inconsistencies in the Settings dialogue discovered through user testing. The primary issue was that some settings appeared to work visually but either had no effect after closing the dialogue, had no effect at all (orphaned settings), or exhibited unexpected behaviour during drag-and-drop operations.

### Root Cause Discovery

User testing revealed three categories of issues:

1. **Draft Pattern Inconsistency** - Several settings components used direct setters instead of the F-090 draft pattern, causing changes to commit immediately rather than waiting for Accept/Cancel.

2. **Orphaned Settings** - The `showDragIcon` setting was defined, stored, and persisted but never consumed by any component.

3. **Zustand Subscription Gaps** - Components using `getEffective()` weren't re-rendering when draft state changed because they weren't subscribed to `_draft` changes.

---

## Bugs Fixed

### Bug 1: Settings Not Persisting After Accept

**Symptom:** Changing Default Card Face to "Front" would flip cards during preview but revert to "Back" after clicking Accept.

**Root Cause:** `AppearanceSettingsTabs.tsx`, `ThemeSettingsTabs.tsx`, `CardSettingsTabs.tsx`, and `ConfigSettingsTabs.tsx` were using direct setters like `setDefaultCardFace()` instead of `updateDraft()`. This meant changes were committed immediately, bypassing the draft pattern entirely.

**Solution:** Migrated all four components to use `getEffective()` for reading values and `updateDraft()` for writing values, consistent with the F-090 draft state pattern.

### Bug 2: Show Drag Icon Has No Effect

**Symptom:** The "Show Drag Icon" toggle in Settings had zero visible effect.

**Root Cause:** The setting was defined in the store, exposed in the UI, and persisted to localStorage, but no component actually consumed the value to control icon visibility.

**Solution:**
- Added `showDragIcon` prop to `DraggableCardGrid` interface
- Read `showDragIcon` from settings store in `CardGrid.tsx`
- Pass through to `SortableCard` which controls `showFrontDragHandle` and `showBackDragHandle` props

### Bug 3: Settings UI Not Updating After First Change

**Symptom:** After changing a setting, subsequent changes wouldn't visually update in the Settings dialogue.

**Root Cause:** Components subscribed to `getEffective` (a stable function reference) but not to `_draft` state changes. Since `getEffective` uses `get()` internally, Zustand didn't trigger re-renders when draft values changed.

**Solution:** Added explicit `_draft` subscription to all settings components:

```typescript
// Subscribe to _draft to trigger re-renders when draft changes
useSettingsStore((s) => s._draft);
const getEffective = useSettingsStore((s) => s.getEffective);
const updateDraft = useSettingsStore((s) => s.updateDraft);
```

### Bug 4: Card Reverting to Default Face After Drag

**Symptom:** When dragging a card to reorder while Default Card Face is "Front", the dragged card would flip back to front after being dropped.

**Root Cause:** The flip state initialisation effect in `CardGrid.tsx` compared card IDs as an ordered string:

```typescript
const currentIdsKey = cards.map(c => c.id).join(',');
```

When card order changed from drag-drop, it detected a "new card set" and reinitialised all flip states.

**Solution:** Compare card IDs as a sorted set (ignoring order):

```typescript
const sortedIds = cards.map(c => c.id).sort();
const currentIdsKey = sortedIds.join(',');
```

### Bug 5: Duplicate Settings Causing Confusion

**Symptom:** Same settings appeared in multiple locations with different UIs, creating confusion about which was canonical.

**Solution:** Removed duplicates from `ConfigSettingsTabs.tsx`:
- Removed "Show Cards" (Default Card Face) - canonical location is Appearance > Interactions
- Removed "Shuffle on Load" - canonical location is Quick tab
- Removed entire "Behaviour" sub-tab (now empty after consolidation)
- Updated help text references

---

## Technical Highlights

### Draft Pattern Subscription Fix

The key insight was that `getEffective()` is a function that uses `get()` internally, which is outside Zustand's subscription mechanism:

```typescript
getEffective: <K extends DraftableSettingsKeys>(key: K): SettingsState[K] => {
  const state = get();  // This doesn't create a subscription
  if (state._draft && key in state._draft) {
    return state._draft[key] as SettingsState[K];
  }
  return state[key];
}
```

By adding `useSettingsStore((s) => s._draft)` before calling `getEffective()`, components subscribe to draft changes and re-render appropriately.

### Order-Insensitive Card Set Comparison

The original comparison was order-sensitive:
```typescript
// ["a", "b", "c"].join(',') !== ["b", "a", "c"].join(',')
```

The fix uses sorted IDs:
```typescript
// ["a", "b", "c"].sort().join(',') === ["b", "a", "c"].sort().join(',')
```

This ensures reordering doesn't trigger flip state reinitialisation while still detecting actual card set changes (additions/removals).

---

## Files Modified

| File | Changes |
|------|---------|
| `AppearanceSettingsTabs.tsx` | Draft pattern migration, _draft subscription, conditional Drag Face/Show Drag Icon |
| `ThemeSettingsTabs.tsx` | Draft pattern migration, _draft subscription |
| `CardSettingsTabs.tsx` | Draft pattern migration, _draft subscription |
| `ConfigSettingsTabs.tsx` | Draft pattern migration, _draft subscription, removed duplicates, removed Behaviour tab |
| `QuickSettings.tsx` | Added _draft subscription |
| `SystemSettings.tsx` | Added _draft subscription |
| `CardGrid.tsx` | Fixed card flip reset on reorder (sorted IDs), reads showDragIcon from store |
| `DraggableCardGrid.tsx` | Already had showDragIcon prop, verified working |

---

## UX Improvements

### Conditional Drag Settings

The Drag Face selector and Show Drag Icon toggle are now only visible when Drag Mode is enabled:

```typescript
{dragModeEnabled && (
  <>
    {/* Drag Face: Front | Back | Both */}
    {/* Show Drag Icon toggle */}
  </>
)}
```

This reduces visual clutter when drag mode is disabled.

### Simplified Configuration Tab

The Configuration tab was simplified from three sub-tabs to two:
- **Display**: Random Selection, Max Visible, Sort By, Sort Direction
- **Edit**: Edit Mode toggle

The removed Behaviour tab contained only duplicates of settings available elsewhere.

---

## Testing

### Manual Test Cases Verified

1. **Default Card Face** - Change to Front, Accept, verify cards remain on front, refresh page, verify persistence
2. **Cancel Reverts Changes** - Change Card Size, Cancel, verify revert
3. **Drag Icon Visibility** - Enable Drag Mode, toggle Show Drag Icon, verify icon appears/disappears
4. **Card Drag Preservation** - Flip a card, drag to reorder, verify flip state preserved
5. **Multiple Settings Changes** - Change multiple settings in sequence, verify all UI updates reflect changes

### Build Verification

- TypeScript compilation: Pass
- ESLint: No new violations
- Production build: Success

---

## Related Documentation

- [v0.15.6 Retrospective](../../retrospectives/v0.15.6/README.md)
- [v0.15.6 Implementation Prompt](../../../prompts/implementation/v0.15.6/README.md)
- [F-090 Draft State Pattern](../../../roadmap/features/completed/F-090-settings-draft-state.md)
