# v0.12.0 Development Log

## Overview

**Version**: v0.12.0 - UI Polish & Statistics
**Date**: 28 December 2025
**Theme**: Comprehensive UI fixes, dark mode consistency, responsive scaling, and statistics visualisation

This milestone focused on polishing the user interface, fixing dark mode issues across multiple components, implementing responsive card scaling, and enhancing the statistics dashboard with bar charts.

---

## Implementation Narrative

### Phase 1: Cmd-R Soft Refresh Interception

**Problem:** Browser's Cmd-R/Ctrl-R immediately reloaded the page, losing user state.

**Solution:** Early keyboard interception in `main.tsx` before React mounts:
```typescript
window.addEventListener("keydown", (event) => {
  if (event.code === "KeyR" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("app:reload-request"));
  }
}, true); // Capture phase - runs before React
```

This allows a confirmation dialogue instead of immediate reload.

### Phase 2: Dark Mode CSS Fixes

**Problem:** Multiple components showed black text on black background in dark mode.

**Root Cause:** CSS used non-existent variable `--colour-text-primary` instead of `--colour-text`. CSS Modules require explicit dark mode selectors for each element.

**Fixes Applied:**

1. **CollectionPicker.module.css**: Changed to use `--colour-text`
2. **CollectionToast.module.css**: Added explicit dark mode overrides:
```css
[data-theme="dark"] .title,
[data-colour-scheme="dark"] .title {
  color: #f9fafb;
}

[data-theme="dark"] .message,
[data-colour-scheme="dark"] .message {
  color: #9ca3af;
}

[data-theme="dark"] .hint,
[data-colour-scheme="dark"] .hint {
  color: #6b7280;
}
```

### Phase 3: Card Back Logo (Inline SVG)

**Problem:** App logo SVG wasn't showing on card backs.

**Root Cause:** When importing SVG as a URL (not component), `currentColor` doesn't work because `<img>` tags can't inherit CSS colours.

**Solution:** Converted to inline SVG component in CardBack.tsx:
```tsx
function AppLogoIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" className={className}>
      <g opacity="0.9">
        <rect x="18" y="12" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.4"/>
        <rect x="24" y="18" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.6"/>
        <rect x="30" y="24" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="3"/>
        <path d="M55 44 L65 59 L55 74 L45 59 Z" fill="currentColor" opacity="0.8"/>
      </g>
    </svg>
  );
}
```

Also added explicit dimensions to `.logo` class (inline SVGs need dimensions when parent uses `width: auto`).

### Phase 4: Responsive Card Scaling

**Border Width Scaling:**
```css
.card {
  --card-border-width-scale: 1;
}
.card[data-card-size="small"] { --card-border-width-scale: 0.5; }
.card[data-card-size="large"] { --card-border-width-scale: 1.5; }

.cardFace {
  border: calc(var(--card-border-width, 0) * var(--card-border-width-scale, 1)) solid var(--card-border-colour);
}
```

**Rank Badge Scaling:**
- Small cards: 4px/8px padding, 0.75rem font, stars hidden
- Medium cards: 6px/10px padding, 0.9rem font
- Large cards: 8px/14px padding, 1.1rem font

### Phase 5: iPhone-Specific Fixes

1. **Large card size disabled** on screens < 600px
2. **Game overlay z-index**: Completion modal now z-index: 120 (above stats bar at 110)
3. **Settings footer**: Removed Reset button, moved Cancel/Accept to right

### Phase 6: Drag Handle During Flip

**Problem:** Drag handle disappeared during card flip, causing visual discontinuity.

**Solution:** Keep drag handle visible but inactive during flip:
```typescript
const shouldShowDragHandle = showDragHandle;
const isDragHandleActive = showDragHandle && !isFlipping;
```

Added `.dragHandleInactive` class with `pointer-events: none; opacity: 0.5`.

### Phase 7: Background Image Zoom

Changed full-mode background from `cover` to `110%` to ensure no edge gaps.

### Phase 8: Hardcoded Sources Removed

Removed `RETRO_GAMES_SOURCE` from `sourceStore.ts`. Collections are now discovered dynamically via CollectionPicker from REPPL/MyPlausibleMe.

### Phase 9: Compact Mode YouTube Thumbnails

Fixed thumbnail display when first media item is YouTube video - now fetches YouTube thumbnail instead of trying to load video URL as image.

### Phase 10: Statistics Bar Chart Component

Created `BarChart.tsx` component for visualising distribution data:
- Horizontal bar display with labels and values
- Configurable max bars with "Other" aggregation
- Support for decade and platform distributions
- Expandable statistics panel

---

## Key Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `src/components/Statistics/BarChart.tsx` | Distribution bar chart component |
| `src/components/Statistics/BarChart.module.css` | Bar chart styles |
| `src/mechanics/memory/Settings.tsx` | Memory game settings component |
| `src/mechanics/memory/Settings.module.css` | Memory settings styles |
| `src/mechanics/memory/types.ts` | Memory mechanic type definitions |
| `src/loaders/githubDiscovery.ts` | GitHub API entity discovery |
| `docs/development/process/devlogs/v0.12.0/README.md` | This devlog |

### Modified Components

| File | Changes |
|------|---------|
| `CollectionToast.module.css` | Dark mode colour fixes |
| `CollectionPicker.module.css` | CSS variable fix |
| `Card.module.css` | Border width scaling, drag handle inactive state |
| `CardBack.tsx` | Inline SVG logo, drag handle visibility |
| `RankBadge.module.css` | Size-responsive scaling |
| `SettingsPanel.tsx` | Removed Reset button |
| `SettingsPanel.module.css` | Footer button positioning |
| `StatisticsBar.tsx` | Expanded with bar charts |
| `memory.module.css` | Game overlay z-index fix |

### Modified Store/Hooks

| File | Changes |
|------|---------|
| `sourceStore.ts` | Removed hardcoded sources |
| `settingsStore.ts` | Changed cardBackDisplay default to "logo" |
| `useVisualTheme.ts` | Background size 110% |
| `main.tsx` | Early Cmd-R interception |

---

## Challenges Encountered

### 1. CSS Variable Naming Inconsistency

**Problem:** Components used `--colour-text-primary` which doesn't exist.

**Root Cause:** No single source of truth for CSS variable names.

**Solution:** Audited and fixed to use `--colour-text`. Added to process: document CSS variables.

### 2. Dark Mode Selector Cascading

**Problem:** Parent dark mode selectors weren't affecting child elements.

**Root Cause:** CSS Modules create unique class names; parent selectors like `[data-theme="dark"] .parent` don't cascade to `.child` because `.child` gets a different hash.

**Solution:** Added explicit dark mode selectors for each class that needs styling.

### 3. SVG currentColor in img Tags

**Problem:** SVG used `fill="currentColor"` but rendered as black.

**Root Cause:** `<img>` tags create a new document context and cannot inherit CSS properties from the parent page.

**Solution:** Converted to inline SVG React component.

### 4. z-index Layer Conflicts

**Problem:** Game completion modal was hidden behind stats bar on iPhone.

**Root Cause:** No documented z-index hierarchy.

**Solution:** Set completion modal to z-index: 120, documented layer ordering.

---

## Code Highlights

### Early Keyboard Interception

```typescript
// main.tsx - before React mounts
window.addEventListener("keydown", (event) => {
  if (event.code === "KeyR" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("app:reload-request"));
  }
}, true); // Capture phase
```

### Responsive Border Scaling

```css
.card {
  --card-border-width-scale: 1;
}

.card[data-card-size="small"] {
  --card-border-width-scale: 0.5;
}

.card[data-card-size="large"] {
  --card-border-width-scale: 1.5;
}

.cardFace {
  border: calc(var(--card-border-width, 0) * var(--card-border-width-scale, 1)) solid var(--card-border-colour);
}
```

### Inline SVG with currentColor

```tsx
function AppLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
      {/* SVG paths inherit colour from CSS */}
    </svg>
  );
}
```

---

## Statistics

| Metric | Value |
|--------|-------|
| Files changed | 50+ |
| New components | 3 |
| Bug fixes | 12 |
| UI improvements | 10 |
| Dark mode fixes | 4 |

---

## Related Documentation

- [v0.12.0 Milestone](../../roadmap/milestones/v0.12.0.md)
- [v0.12.0 Retrospective](../../retrospectives/v0.12.0/README.md)
- [v0.11.5 Devlog](../v0.11.5/README.md)
