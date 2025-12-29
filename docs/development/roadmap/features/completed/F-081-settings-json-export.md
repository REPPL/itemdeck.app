# F-081: Settings JSON Export/Import

## Problem Statement

User settings are stored only in localStorage, making them:

1. **Non-portable** - Cannot share preferences between devices
2. **Non-recoverable** - Lost if browser data is cleared
3. **Non-shareable** - Cannot share preferred configuration with others

## Design Approach

Add export/import functionality for user settings as JSON files.

### Export Format

```json
{
  "version": 25,
  "exportedAt": "2024-12-28T10:00:00Z",
  "settings": {
    "layout": "grid",
    "visualTheme": "modern",
    "cardSizePreset": "medium",
    "themeCustomisations": { ... }
  }
}
```

### Export Flow

1. User clicks "Export Settings" in Storage settings tab
2. System generates settings.json with current state
3. Browser downloads file

### Import Flow

1. User clicks "Import Settings" in Storage settings tab
2. File picker opens for .json selection
3. System validates JSON structure and version
4. Options presented: "Replace all" or "Merge with existing"
5. Settings applied and saved to localStorage

### Version Handling

- Export includes store version number
- Import migrates settings through the same migration chain as persistence
- Incompatible versions show clear error with options

## Implementation Tasks

- [ ] Add `exportSettings()` function to settingsStore
- [ ] Add `importSettings(json, mode)` function to settingsStore
- [ ] Create file download utility
- [ ] Create file upload utility with validation
- [ ] Add UI controls to StorageSettingsTabs

## Success Criteria

- [ ] Settings can be exported to JSON file
- [ ] Exported JSON is human-readable
- [ ] Settings can be imported from valid JSON
- [ ] Invalid JSON shows helpful error message
- [ ] Version mismatch is handled gracefully

## Dependencies

- F-080: Cache consent (completed in v0.11.2)

## Target Milestone

v0.12.0

---

## Related Documentation

- [SettingsStore](../../../implementation/stores.md)
- [v0.12.0 Milestone](../../milestones/v0.12.0.md)
