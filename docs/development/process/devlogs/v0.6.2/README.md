# v0.6.2 Development Log

## Overview

v0.6.2 delivers a comprehensive settings panel restructure with improved visual hierarchy, theme customisation enhancements, and various UI/UX refinements throughout the application.

## Implementation Narrative

### Settings Panel Restructure

The settings panel underwent a complete reorganisation to improve discoverability and logical grouping:

**New Tab Structure:**
- **System** - App-wide settings (Dark Mode, Reduce Motion, High Contrast, button visibility, Refresh Data)
- **Theme** - Visual appearance with prominent theme picker and sub-tabs (Card Style, Colours, Detail View)
- **Config** - Collection-specific field mapping (Display Order, Front Face, Back Face)
- **Cards** - Card display settings (Layout, Front Face, Back Face)

Key changes:
- Renamed "Theme" to "Dark Mode" in System tab for clarity
- Added toggles for showing/hiding Help and Settings buttons
- Moved Refresh Data to bottom of System tab with visual divider
- Created prominent theme selector with larger buttons at top of Theme tab
- Consolidated behaviour settings (Drag to Reorder, Shuffle on Load) into Cards > Layout

### Theme Tab Visual Improvements

The Theme tab received special attention to improve visual hierarchy:

- Created dedicated `ThemeSettingsTabs.module.css` for custom styling
- Theme picker now uses full-width prominent buttons with accent colour active state
- Added decorative separator line between theme picker and sub-tabs
- Improved spacing and visual flow from theme selection to customisation options

### Settings Store Updates

Significant changes to the Zustand settings store:

```typescript
// New types
type DetailTransparencyPreset = "none" | "25" | "50" | "75";

// Expanded ThemeCustomisation interface
interface ThemeCustomisation {
  borderRadius: BorderRadiusPreset;
  shadowIntensity: ShadowIntensity;
  animationStyle: AnimationStyle;
  accentColour: string;
  hoverColour: string;
  cardBackgroundColour: string;
  detailTransparency: DetailTransparencyPreset;
  overlayStyle: OverlayStyle;  // moved from top-level
  moreButtonLabel: string;
  autoExpandMore: boolean;
  zoomImage: boolean;
}

// New settings
showHelpButton: boolean;
showSettingsButton: boolean;
showDragIcon: boolean;
```

Store version bumped to 7 with migration logic for existing users.

### Detailed View Improvements

- Platform now displays full title (`platformTitle`) instead of short name
- Close buttons use accent colour on hover for visual consistency
- Added `platformTitle` field to DisplayCard interface

### UI/UX Enhancements

**Text Selection Disabled:**
- Added global CSS rule to prevent text selection (`user-select: none`)
- Creates game-like experience
- Text input fields remain selectable for usability

**Drag Handle Fix:**
- Front card drag area now uses the existing text overlay (glassmorphism bar)
- Entire overlay is draggable - no separate drag element added
- Small drag grip icon absolutely positioned and centred in footer as visual indicator
- Text remains fully visible and readable
- Subtle background colour change on hover indicates draggability

**Grid Layout Consistency Fix:**
- Removed padding from both CardGrid and DraggableCardGrid CSS
- Main container now provides consistent padding for both modes
- Eliminates layout "hopping" when switching drag mode on/off

## Files Modified

### Components
- `src/components/SettingsPanel/SettingsPanel.tsx` - Tab reorder, System tab restructure
- `src/components/SettingsPanel/ThemeSettingsTabs.tsx` - Complete rewrite with new structure
- `src/components/SettingsPanel/ThemeSettingsTabs.module.css` - New file for custom styling
- `src/components/SettingsPanel/CardSettingsTabs.tsx` - Merged Behaviour into Layout
- `src/components/SettingsPanel/ConfigSettingsTabs.tsx` - New sub-tab structure
- `src/components/CardExpanded/CardExpanded.tsx` - Platform title display
- `src/components/CardExpanded/CardExpanded.module.css` - Close button hover colours
- `src/components/Card/Card.module.css` - Drag handle front fix

### State Management
- `src/stores/settingsStore.ts` - New types, settings, migration to v7

### Hooks
- `src/hooks/useVisualTheme.ts` - Updated for DetailTransparencyPreset type
- `src/hooks/useCollection.ts` - Added platformTitle to DisplayCard

### Styles
- `src/styles/global.css` - Text selection disabled
- `src/App.tsx` - Updated overlayStyle access path

## Technical Decisions

1. **Theme customisation per-theme** - Each visual theme (Minimal, Modern, Retro) stores its own customisation settings, allowing users to configure different appearances for each theme.

2. **Transparency presets vs slider** - Used preset values (None, 25%, 50%, 75%) instead of a slider for simplicity and predictable results.

3. **Overlay as drag area on front** - Reused the existing text overlay as the drag area rather than adding a separate element. This keeps text visible while making the entire overlay draggable, with a small grip icon as visual feedback.

4. **Text selection disabled globally** - Applied to body element with exceptions for input fields, creating a more app-like/game-like experience.

---

## Related Documentation

- [v0.6.2 Retrospective](../../retrospectives/v0.6.2/README.md)
- [Settings Panel Feature](../../../roadmap/features/completed/F-013-settings-panel.md)
- [Theme System Feature](../../../roadmap/features/completed/F-010-theme-system.md)
