# v0.4.1 Settings & Themes Development Log

## Overview

The v0.4.1 release is a patch release addressing Settings Panel enhancements and fixing the visual theme system. This release adds two new user-configurable settings and makes the visual themes functional.

## Implementation Narrative

### Phase 1: New Settings Controls

Added two missing settings to the Settings Panel:

#### Max Visible Cards (Behaviour Tab)

Implemented a number control allowing users to limit how many cards can be flipped face-up simultaneously:

- Added `maxVisibleCards` state to settings store (range 1-10, default 2)
- Created number control UI with +/- buttons and current value display
- Wired to CardGrid's flip logic to enforce the limit
- When limit exceeded, oldest flipped card automatically unflips

```typescript
// handleFlip in CardGrid.tsx
while (newList.length > maxVisibleCards) {
  newList.shift(); // Remove oldest (first)
}
```

#### Card Back Display (Card Tab)

Added control for what appears on the card back:

- Created `CardBackDisplay` type: `"year" | "logo" | "both" | "none"`
- Updated CardBack component to use `display` prop instead of boolean
- Added segmented control under new "Back" subsection

```typescript
const showLogo = display === "logo" || display === "both";
const showYear = (display === "year" || display === "both") && Boolean(year);
```

### Phase 2: Visual Theme System Fix

Investigated why visual themes had no visible effect:

1. **Root cause identified**: Retro theme referenced "Press Start 2P" and "VT323" fonts that weren't loaded
2. **Theme CSS was correct**: `[data-visual-theme="retro"]` selectors were properly included in build
3. **Fonts fell back silently**: Without the pixel fonts, retro theme fell back to Courier New

**Solution**: Added Google Fonts to index.html:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
```

### Phase 3: Theme Tab UI Improvement

Replaced the simple segmented control with descriptive theme cards:

- Each theme now shows what it controls
- **Retro**: "Pixel fonts, sharp corners, CRT shadows, neon accents"
- **Modern**: "Rounded corners, soft shadows, smooth animations"
- **Minimal**: "Subtle styling, reduced shadows, clean typography"

Added informational text explaining theme properties.

## Challenges Encountered

### Props Drilling for CardBackDisplay

The `cardBackDisplay` setting needed to flow from settings store through multiple components:

```
SettingsStore → CardGrid → DraggableCardGrid → SortableCard → Card → CardBack
```

Updated interfaces in DraggableCardGrid to accept the new prop.

### Store Migration

Bumped settings store version from 3 to 4 to handle new state fields:

- `maxVisibleCards: number`
- `cardBackDisplay: CardBackDisplay`

### Unused Variable Cleanup

TypeScript flagged an unused `collection` variable in CardGrid after refactoring. Removed it to pass lint.

## Code Highlights

### Number Control Component

Added reusable number control pattern in SettingsPanel:

```tsx
<div className={styles.numberControl}>
  <button onClick={() => { setMaxVisibleCards(Math.max(1, maxVisibleCards - 1)); }}>−</button>
  <span className={styles.numberValue}>{maxVisibleCards}</span>
  <button onClick={() => { setMaxVisibleCards(Math.min(10, maxVisibleCards + 1)); }}>+</button>
</div>
```

### Theme Card UI

New pattern for settings that benefit from descriptions:

```tsx
const visualThemeOptions: { value: VisualTheme; label: string; description: string }[] = [
  { value: "retro", label: "Retro", description: "Pixel fonts, sharp corners, CRT shadows, neon accents" },
  // ...
];
```

## Files Created/Modified

### Modified Files (10 files)
- `src/stores/settingsStore.ts` - Added CardBackDisplay type, maxVisibleCards, cardBackDisplay state
- `src/components/SettingsPanel/SettingsPanel.tsx` - New controls, theme cards UI
- `src/components/SettingsPanel/SettingsPanel.module.css` - Number control, theme card styles
- `src/components/Card/CardBack.tsx` - Changed from showYear to display prop
- `src/components/Card/Card.tsx` - Pass cardBackDisplay prop
- `src/components/CardGrid/CardGrid.tsx` - Wire new settings from store
- `src/components/DraggableCardGrid/DraggableCardGrid.tsx` - Accept cardBackDisplay prop
- `index.html` - Added Google Fonts for visual themes

## Test Results

All existing tests continue to pass. Build succeeds with no TypeScript errors.

---

## Related Documentation

- [v0.4.1 Retrospective](../../retrospectives/v0.4.1/README.md)
