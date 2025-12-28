# F-082: Theme Customisation JSON Export/Import

## Problem Statement

Theme customisations (per visual theme overrides) are stored within settings:

1. **Not separately exportable** - Tied to full settings export
2. **Not shareable** - Cannot share a custom theme with others
3. **Not reusable** - Cannot apply a theme to a different browser/device

## Design Approach

Add export/import functionality for individual theme customisations as JSON files.

### Export Format

```json
{
  "version": 1,
  "exportedAt": "2024-12-28T10:00:00Z",
  "baseTheme": "modern",
  "name": "My Custom Modern",
  "customisation": {
    "borderRadius": "large",
    "borderWidth": "small",
    "shadowIntensity": "medium",
    "animationStyle": "bouncy",
    "overlayStyle": "dark",
    "verdictAnimationStyle": "flip"
  }
}
```

### Export Flow

1. User navigates to Appearance settings tab
2. User clicks "Export Theme" button for current theme
3. System generates `theme-{themeName}.json` with customisation
4. Browser downloads file

### Import Flow

1. User clicks "Import Theme" in Appearance settings tab
2. File picker opens for .json selection
3. System validates JSON structure
4. Theme customisation is merged into current settings
5. Visual theme automatically switches to the imported base theme

### Features

- Export only customisation overrides (not base theme defaults)
- Import applies to existing base theme
- Name field for identification
- Timestamps for version tracking

## Implementation Tasks

- [ ] Add `exportThemeCustomisation(theme)` function
- [ ] Add `importThemeCustomisation(json)` function
- [ ] Create theme export button in AppearanceSettingsTabs
- [ ] Create theme import button in AppearanceSettingsTabs
- [ ] Add validation for theme JSON structure

## Success Criteria

- [ ] Theme customisations can be exported to JSON file
- [ ] Exported JSON includes only overrides (not defaults)
- [ ] Theme can be imported from valid JSON
- [ ] Invalid JSON shows helpful error message
- [ ] Importing a theme switches to its base theme

## Dependencies

- F-081: Settings JSON export/import (shared utilities)

## Target Milestone

v0.12.0

---

## Related Documentation

- [Theme Customisation](../../../explanation/theming.md)
- [v0.12.0 Milestone](../../milestones/v0.12.0.md)
