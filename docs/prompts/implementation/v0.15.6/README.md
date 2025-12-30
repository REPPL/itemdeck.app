# v0.15.6 Implementation Prompt: Settings Consistency Fix

## Summary

Fix settings that have no effect due to inconsistent use of the draft state pattern (F-090) or orphaned settings not connected to any functionality.

## Problem Statement

The Settings dialogue has multiple issues where changing a setting appears to work visually but either:
1. Has no effect after closing the dialogue (draft pattern not used)
2. Has no effect at all (setting is orphaned - defined but never consumed)
3. Is overridden by collection-level forced settings

### User-Reported Issues

1. **Default Card Face**: Changing to "Front" flips cards during preview but reverts to "Back" on Accept
2. **Drag Mode**: Toggle works but has unclear relationship with "Drag to Reorder" in Fields tab
3. **Show Drag Icon**: Toggle has zero effect (orphaned setting)

## Root Cause Analysis

### Issue 1: Draft Pattern Inconsistency

**QuickSettings.tsx** and **SystemSettings.tsx** correctly use the F-090 draft pattern:
```typescript
const getEffective = useSettingsStore((s) => s.getEffective);
const updateDraft = useSettingsStore((s) => s.updateDraft);

// Reading values
const shuffleOnLoad = getEffective("shuffleOnLoad");

// Writing values
updateDraft({ shuffleOnLoad: e.target.checked });
```

**AppearanceSettingsTabs.tsx**, **ThemeSettingsTabs.tsx**, **CardSettingsTabs.tsx**, and **ConfigSettingsTabs.tsx** INCORRECTLY use direct setters:
```typescript
const { setDragModeEnabled, setDefaultCardFace } = useSettingsStore();

// This commits IMMEDIATELY, bypassing draft
setDefaultCardFace("front");
```

This means:
- Changes appear to work (committed immediately)
- On Cancel: `discardDraft()` is called but settings were already committed
- On Accept: `commitDraft()` commits the draft copy (which may be stale)

### Issue 2: Orphaned Settings

**showDragIcon** is:
- Defined in settingsStore.ts (line 423)
- Exposed in AppearanceSettingsTabs.tsx (line 51-55, 91-100)
- Included in draft state (line 1191)
- Persisted to localStorage (line 1345)
- **Never consumed by any component**

The setting should control whether drag handle icons are visible on cards when drag mode is enabled.

### Issue 3: Duplicate/Confusing Settings

The same setting appears in multiple places with different UIs:
- **Default Card Face**: Appearance > Interactions AND Fields > Display ("Show Cards")
- **Drag Mode**: Appearance > Interactions (toggle) AND Fields > Behaviour ("Drag to Reorder" segmented)
- **Shuffle on Load**: Quick AND Fields > Behaviour

This creates confusion about which control is canonical.

## Solution Design

### Phase 1: Fix Draft Pattern Usage

Migrate all settings components to use `getEffective()` for reading and `updateDraft()` for writing.

**Files to modify:**
1. `AppearanceSettingsTabs.tsx` - Interactions sub-tab
2. `ThemeSettingsTabs.tsx` - All theme customisation handlers
3. `CardSettingsTabs.tsx` - Layout, Front Face, Back Face sub-tabs
4. `ConfigSettingsTabs.tsx` - Display, Behaviour, Edit sub-tabs

### Phase 2: Connect showDragIcon Setting

Implement the drag icon visibility feature:

1. **DraggableCardGrid.tsx**: Pass `showDragIcon` to Card components
2. **Card.tsx**: Accept `showDragIcon` prop, conditionally render drag handle
3. **CardBack.tsx** or **CardFront.tsx**: Show/hide drag handle icon based on prop

The drag icon should appear:
- When `dragModeEnabled === true`
- When `showDragIcon === true`
- On the card face specified by `dragFace` ("front", "back", or "both")

### Phase 3: Consolidate Duplicate Settings

**Decision**: Remove duplicates, keep each setting in ONE canonical location only.

| Setting | Keep In | Remove From |
|---------|---------|-------------|
| Default Card Face | Appearance > Interactions | Fields > Display ("Show Cards") |
| Drag Mode | Appearance > Interactions | N/A (Fields has different UI) |
| Shuffle on Load | Quick | Fields > Behaviour |

### Design Decisions (User-Confirmed)

1. **Drag Icon Style**: Grip dots (6 dots in two columns of 3)
2. **Drag Icon Position**: Bottom-centre of card
3. **Duplicate Settings**: Remove duplicates, single canonical location

## Implementation Checklist

### Phase 1: Draft Pattern Fix

- [x] **AppearanceSettingsTabs.tsx**
  - [x] Import `getEffective` and `updateDraft` from store
  - [x] Replace `dragModeEnabled` direct read with `getEffective("dragModeEnabled")`
  - [x] Replace `showDragIcon` direct read with `getEffective("showDragIcon")`
  - [x] Replace `defaultCardFace` direct read with `getEffective("defaultCardFace")`
  - [x] Replace `setDragModeEnabled(x)` with `updateDraft({ dragModeEnabled: x })`
  - [x] Replace `setShowDragIcon(x)` with `updateDraft({ showDragIcon: x })`
  - [x] Replace `setDefaultCardFace(x)` with `updateDraft({ defaultCardFace: x })`

- [x] **ThemeSettingsTabs.tsx**
  - [x] Import `getEffective` and `updateDraft` from store
  - [x] Replace `visualTheme` direct read with `getEffective("visualTheme")`
  - [x] Replace `themeCustomisations` direct read with `getEffective("themeCustomisations")`
  - [x] Replace all `setVisualTheme(x)` with `updateDraft({ visualTheme: x })`
  - [x] Replace all `setThemeCustomisation(theme, x)` with draft pattern
  - [x] Handle nested themeCustomisations update correctly

- [x] **CardSettingsTabs.tsx**
  - [x] Import `getEffective` and `updateDraft` from store
  - [x] Replace all direct reads with `getEffective()`
  - [x] Replace all direct setters with `updateDraft()`

- [x] **ConfigSettingsTabs.tsx**
  - [x] Import `getEffective` and `updateDraft` from store
  - [x] Replace all direct reads with `getEffective()`
  - [x] Replace all direct setters with `updateDraft()`

### Phase 2: Connect showDragIcon

- [x] **DraggableCardGrid.tsx**
  - [x] Add `showDragIcon` prop to interface
  - [x] Pass `showDragIcon` through to SortableCard

- [x] **CardGrid.tsx**
  - [x] Read `showDragIcon` from settings store
  - [x] Pass `showDragIcon` prop to DraggableCardGrid

- [x] **Card components** (already implemented)
  - [x] `showFrontDragHandle` and `showBackDragHandle` props exist
  - [x] DragGripIcon (6 dots in 2x3 pattern) already implemented
  - [x] Icon positioned at bottom-centre of card

### Phase 3: Consolidate Duplicates

- [x] **ConfigSettingsTabs.tsx**
  - [x] Remove "Show Cards" (Default Card Face duplicate from Display sub-tab)
  - [x] Remove "Shuffle on Load" (duplicate from Behaviour sub-tab - keep in Quick)
  - [x] Keep "Drag to Reorder" (different UI from toggle, provides None/Front/Back/Both)
  - [x] Update help text to reference Quick tab instead of Behaviour tab

## Testing

### Manual Test Cases

1. **Default Card Face**
   - [ ] Open Settings > Appearance > Interactions
   - [ ] Change "Start On" from Back to Front
   - [ ] Verify cards flip to front (preview)
   - [ ] Click Accept
   - [ ] Verify cards remain on front
   - [ ] Refresh page
   - [ ] Verify cards start on front

2. **Cancel Reverts Changes**
   - [ ] Open Settings > Quick
   - [ ] Change Card Size from Medium to Large
   - [ ] Click Cancel
   - [ ] Verify Card Size reverts to Medium

3. **Drag Icon Visibility**
   - [ ] Enable Drag Mode
   - [ ] Enable Show Drag Icon
   - [ ] Verify drag icon appears on cards
   - [ ] Disable Show Drag Icon
   - [ ] Verify drag icon disappears (drag still works)

4. **Theme Customisation**
   - [ ] Open Settings > Appearance > Theme
   - [ ] Change Border Radius to Large
   - [ ] Click Cancel
   - [ ] Verify Border Radius reverts

## Technical Notes

### Draft Pattern for Nested Objects

The `themeCustomisations` object is nested. The `updateDraft()` function already handles this:

```typescript
updateDraft: (partial) => {
  set((state) => {
    if (!state._draft) return state;
    const newDraft = { ...state._draft, ...partial };

    // Handle nested objects
    if (partial.themeCustomisations) {
      newDraft.themeCustomisations = {
        ...state._draft.themeCustomisations,
        ...partial.themeCustomisations,
      };
    }
    // ...
  });
};
```

However, updating a single theme's customisation requires:
```typescript
const currentCustomisations = getEffective("themeCustomisations");
const currentTheme = getEffective("visualTheme");

updateDraft({
  themeCustomisations: {
    ...currentCustomisations,
    [currentTheme]: {
      ...currentCustomisations[currentTheme],
      borderRadius: "large",
    },
  },
});
```

### Accessibility Exception

Per F-090, accessibility settings (reduceMotion, highContrast) bypass the draft pattern and apply immediately. SystemSettings.tsx already handles this correctly.

## Files Affected

| File | Changes |
|------|---------|
| `AppearanceSettingsTabs.tsx` | Draft pattern migration, _draft subscription |
| `ThemeSettingsTabs.tsx` | Draft pattern migration, _draft subscription |
| `CardSettingsTabs.tsx` | Draft pattern migration, _draft subscription |
| `ConfigSettingsTabs.tsx` | Draft pattern migration, _draft subscription, remove duplicates |
| `QuickSettings.tsx` | Added _draft subscription for re-renders |
| `SystemSettings.tsx` | Added _draft subscription for re-renders |
| `DraggableCardGrid.tsx` | Pass showDragIcon prop |
| `CardGrid.tsx` | Fixed card flip reset on reorder (sorted IDs for comparison) |
| `Card.tsx` | Render drag handle icon |

## Additional Fixes (Session 2)

### Bug: Settings UI Not Updating After First Selection

**Problem**: Changing a setting in the Settings dialogue would update once, but subsequent changes wouldn't reflect in the UI.

**Root Cause**: Components were subscribing to `getEffective` (a stable function reference) but not to `_draft` state changes. Since `getEffective` uses `get()` internally, Zustand didn't know to re-render when `_draft` changed.

**Solution**: Added `useSettingsStore((s) => s._draft)` subscription to all settings components:
```typescript
// Subscribe to _draft to trigger re-renders when draft changes
useSettingsStore((s) => s._draft);
const getEffective = useSettingsStore((s) => s.getEffective);
```

### Bug: Card Reverting to Default Face After Drag

**Problem**: When dragging a card to reorder, the card would flip back to its default face after being dropped.

**Root Cause**: The flip state initialisation effect compared card IDs as an ordered string. When card order changed from drag-drop, it detected a "new card set" and reinitialised flip states.

**Solution**: Compare card IDs as a sorted set (ignoring order):
```typescript
// Before (broken)
const currentIdsKey = cards.map(c => c.id).join(',');

// After (fixed)
const sortedIds = cards.map(c => c.id).sort();
const currentIdsKey = sortedIds.join(',');
```

## Success Criteria

1. All settings changes preview correctly during editing
2. Cancel discards ALL uncommitted changes
3. Accept commits ALL changes permanently
4. showDragIcon toggle controls drag handle visibility
5. No settings are orphaned (all have consumers)
6. Settings persist correctly across page refreshes

---

**Status**: Implementation complete
