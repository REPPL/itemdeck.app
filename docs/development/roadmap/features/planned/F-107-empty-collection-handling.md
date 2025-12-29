# F-107: Empty Collection Handling

## Problem Statement

When no collections exist (either at startup or after deleting the last collection), the user experience is poor:

1. Settings > Collections > Sources tab is active but empty/useless
2. The main browser window shows an error message ("Invalid content...")
3. There's no guidance directing users to add a collection

## Design Approach

Automatically redirect focus to the "Add Source" functionality when no collections exist.

### Trigger Conditions

1. **App startup** - If no collections are configured
2. **Last collection deleted** - When user deletes the final remaining collection in Settings > Collections > Sources
3. **Invalid collection state** - When browser shows "Error: Invalid content..." due to missing/invalid source

### Behaviour

When any trigger condition is met:

1. **Deactivate** Settings > Collections > Sources tab (greyed out, not clickable)
2. **Activate** Settings > Collections > Add Source tab automatically
3. **Focus** the Add Source input/interface
4. **Optional**: Show a helpful message like "Add a collection to get started"

### Visual Indicators

- Sources tab: Greyed out with "(none)" indicator when empty
- Add Source tab: Highlighted/pulsing to draw attention
- Main window: Replace error message with "No collections configured" + button to open Settings

## Implementation Tasks

### Phase 1: Detection

- [ ] Add `hasCollections` selector to sources store
- [ ] Add listener for collection deletion events
- [ ] Detect empty state on app startup

### Phase 2: Settings Panel Behaviour

- [ ] Disable Sources tab when no collections exist
- [ ] Auto-switch to Add Source tab when last collection deleted
- [ ] Add visual indicator for empty state

### Phase 3: Main Window Behaviour

- [ ] Replace error overlay with friendly "No collections" message
- [ ] Add "Add Collection" button that opens Settings to Add Source
- [ ] Ensure graceful handling of edge cases

### Phase 4: Onboarding Enhancement

- [ ] First-time user detection (no collections ever added)
- [ ] Welcome message with clear call-to-action
- [ ] Optional: Quick-start with example collection

## Success Criteria

- [ ] Empty collections state is handled gracefully
- [ ] User is automatically guided to Add Source
- [ ] No error messages shown for expected empty state
- [ ] Sources tab disabled when empty
- [ ] Deleting last collection triggers redirect
- [ ] Clear visual feedback throughout

## Dependencies

- None (uses existing Settings Panel and Sources infrastructure)

## Complexity

**Small** - UI state management and conditional rendering.

## Target Version

**v0.15.0**

---

## Related Documentation

- [Settings Panel](../completed/F-013-settings-panel.md)
- [Remote Source Management](../completed/F-047-remote-source-management.md)
- [Collection Discovery UI](../completed/F-046-collection-discovery-ui.md)

---

**Status**: Planned
