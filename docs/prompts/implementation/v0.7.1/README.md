# v0.7.1 Implementation Prompt - Settings Fixes & Visual Polish

**Version:** v0.7.1
**Codename:** Settings & Visual Polish
**Branch:** `main` (patch release)

---

## Overview

Patch release fixing broken settings and implementing visual refinements for the detail view. This addresses issues identified after v0.7.0 release.

---

## Context

- v0.7.0 completed schema flexibility features
- Three theme customisation settings were stored but never read by components
- Visual refinements needed for detail view (logo sizing, image positioning)
- Overlay state persisted incorrectly between views

---

## Scope

### In Scope (v0.7.1)

1. **Settings Fixes** - Wire up moreButtonLabel, autoExpandMore, zoomImage
2. **Logo Standardisation** - Max-bounds sizing for platform logos
3. **Detail View Image Positioning** - 3% zoom with top-centre alignment
4. **Overlay Reset** - Clear overlay state when detail view closes
5. **Rank Badge Width** - Increase placeholder width for long text
6. **Icon Refinements** - Info icon for More button, icon-only Acknowledgement

### Deferred to v0.7.2+

- A.3: Border width setting
- A.6: Platform link primary button style
- A.7: Granular animation settings
- A.8: Platform overlay layout restructure
- A.10: Platform link in image corner
- B.1-B.4: Schema extensions
- D.1-D.4: IndexedDB caching infrastructure

---

## Phase 1: Settings Fixes

**Files Modified:**
- `src/components/CardExpanded/CardExpanded.tsx`
- `src/components/ImageGallery/ImageGallery.tsx`
- `src/stores/settingsStore.ts`

**Implementation:**
```typescript
// CardExpanded.tsx - Wire up settings
const visualTheme = useSettingsStore((state) => state.visualTheme);
const themeCustomisations = useSettingsStore((state) => state.themeCustomisations);
const currentCustomisation = themeCustomisations[visualTheme];
const moreButtonLabel = currentCustomisation.moreButtonLabel;
const autoExpandMore = currentCustomisation.autoExpandMore;
const zoomImage = currentCustomisation.zoomImage;
```

**Default Changes:**
- `moreButtonLabel`: "More" → "Verdict"
- `autoExpandMore`: true → false

---

## Phase 2: Visual Adjustments

### A.1 Logo Standardisation

**File:** `src/components/Card/Card.module.css`

```css
.backLogo {
  max-width: 70%;
  max-height: 45%;
  object-fit: contain;
}
```

### A.2 Detail View Image Positioning

**File:** `src/components/ImageGallery/ImageGallery.module.css`

```css
.imageCover {
  top: 0;
  left: -1.5%;
  width: 103%;
  height: 103%;
  object-fit: cover;
  object-position: top center;
}
```

### A.9 Rank Badge Width

**File:** `src/components/RankBadge/RankBadge.module.css`

```css
.placeholder {
  max-width: 240px; /* Was 120px */
}
```

---

## Phase 3: Overlay Reset

**File:** `src/components/CardExpanded/CardExpanded.tsx`

```typescript
useEffect(() => {
  if (isOpen) {
    if (autoExpandMore && additionalFields.length > 0) {
      setDetailsExpanded(true);
    }
  } else {
    // Reset all overlay states when closing
    setDetailsExpanded(false);
    setShowAttribution(false);
    setPlatformExpanded(false);
  }
}, [isOpen, autoExpandMore, additionalFields.length]);
```

---

## Success Criteria

- [x] moreButtonLabel setting affects UI
- [x] autoExpandMore setting affects UI
- [x] zoomImage setting affects UI
- [x] Platform logos preserve aspect ratio
- [x] First image zooms 3% with top alignment
- [x] Rank placeholder shows full text
- [x] Overlays reset when detail view closes
- [x] Info icon displays on More button
- [x] Acknowledgement uses icon-only button

---

## Post-Implementation

1. Devlog created: `docs/development/process/devlogs/v0.7.1/README.md`
2. Retrospective created: `docs/development/process/retrospectives/v0.7.1/README.md`
3. Git tag created: `v0.7.1`

---

## Related Documentation

- [v0.7.1 Devlog](../../development/process/devlogs/v0.7.1/README.md)
- [v0.7.1 Retrospective](../../development/process/retrospectives/v0.7.1/README.md)
- [v0.7.0 Milestone](../../development/roadmap/milestones/v0.7.0.md)

---

**Status**: Complete
