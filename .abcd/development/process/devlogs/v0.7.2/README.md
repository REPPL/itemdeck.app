# v0.7.2 Development Log

**Version:** 0.7.2
**Codename:** Visual Polish & Animation Refinements
**Date:** 2025-12-25

---

## Overview

v0.7.2 delivers visual polish, animation refinements, and robustness improvements to the expanded card view. This release focuses on consistency across UI elements, introduces a new "card flip" animation style for the Verdict overlay, and adds defensive fallback behaviour for image loading failures.

---

## Implementation Narrative

### Phase 1: Close Button Unification

The session began by addressing visual inconsistency across overlay close buttons. The gallery navigation buttons had a consistent 48px circular style with backdrop blur, but the close buttons on various overlays (main panel, Verdict, Attribution, Platform) each had slightly different sizes and hover states.

**Solution:** Unified all close button styles to match the gallery navigation pattern:
- Standardised dimensions to 48px × 48px
- Consistent SVG icon size of 24px
- Matching background (`rgba(0, 0, 0, 0.5)`), backdrop blur, and border styles
- Unified hover state (`rgba(0, 0, 0, 0.7)`)

### Phase 2: Card Back Logo Positioning

When drag handles are enabled on card backs, the platform logo was centred across the entire card height, making it appear off-centre relative to the non-draggable area.

**Solution:** Implemented conditional CSS class `.hasDragHandle` that shifts the logo container upward by half the drag handle height (28px), ensuring the logo appears centred within the non-draggable portion of the card.

### Phase 3: Verdict Animation Style Setting

Introduced a new theme customisation option allowing users to choose between two animation styles for the Verdict overlay:

1. **Slide** (default for modern/minimal): The existing slide-up animation
2. **Flip** (default for retro): A 3D card-flip effect simulating turning the detailed view card over

**Implementation details:**
- Added `VerdictAnimationStyle` type (`"slide" | "flip"`)
- Extended `ThemeCustomisation` interface
- Added store migration (v9 → v10)
- Implemented conditional Framer Motion animations with `rotateY` transforms
- Added perspective to the panel container for 3D effect
- Created `.moreOverlayFlip` CSS class for flip-specific styling

### Phase 4: Verdict Overlay Height Refinement

The Verdict overlay was covering the full panel regardless of content. Users requested it expand only as needed.

**Solution:** Changed CSS from `top: 0; bottom: 0` (full height) to `bottom: 0; max-height: 100%`, allowing content-driven height expansion while capping at full panel height.

### Phase 5: Rating Display System Overhaul

The star rating display had several issues:
1. Half-star character (⯨) wasn't rendering correctly in all fonts
2. Scores were being interpreted incorrectly due to inconsistent scale assumptions
3. No normalisation between 5-point and 10-point rating scales

**Solution:**
- Removed half-star characters in favour of rounding to nearest whole star
- Changed default `max` from 10 to 5 (most review scores use 5-point scales)
- Added score normalisation: `(score / max) * 10` for consistent 10-star display
- Scores like 4.4/5 now correctly display as 9 stars (not 4 stars)

### Phase 6: Text Baseline Alignment

Metadata labels and values in the Verdict overlay were vertically misaligned due to different font sizes.

**Solution:** Added `align-items: baseline` to `.metadataItem` flex container.

### Phase 7: Image Fallback Robustness

Platform logos that failed to load (404, CORS issues, etc.) displayed broken image placeholders instead of gracefully falling back to the app logo.

**Solution:** Added `onError` handler to the logo `<img>` element that sets a `hasError` state, triggering fallback to the bundled app logo.

### Phase 8: Detail Panel Border Consistency

Card borders use the `--card-border-width` CSS variable, but the expanded detail panel didn't inherit this styling.

**Solution:** Added `border: var(--card-border-width, 0) solid rgba(255, 255, 255, 0.2)` to `.panel` class.

---

## Files Modified

### Core Components
- `src/components/Card/Card.module.css` - Logo positioning for drag handle state
- `src/components/Card/CardBack.tsx` - Image error handling with fallback
- `src/components/CardExpanded/CardExpanded.tsx` - Verdict flip animation logic
- `src/components/CardExpanded/CardExpanded.module.css` - Close button unification, overlay height, panel border

### Settings & Configuration
- `src/stores/settingsStore.ts` - `verdictAnimationStyle` setting, migration v10
- `src/hooks/useVisualTheme.ts` - Theme variable application

### Utilities
- `src/utils/entityFields.ts` - Rating normalisation and display logic

---

## Technical Decisions

### Why Round Instead of Half-Stars?

The half-star character (⯨) rendered inconsistently across different system fonts and platforms. Rather than implementing custom SVG half-stars (which would add complexity), rounding to the nearest whole star provides a clean, universally-compatible display while maintaining reasonable precision.

### Why Default Max 5 Instead of 10?

Analysis of the existing data revealed most review scores were entered on a 5-point scale. Changing the default from 10 to 5 and adding explicit normalisation ensures correct display without requiring data migration.

### Why State-Based Image Fallback?

Using `onError` with React state rather than CSS `onerror` attribute provides:
- Clean integration with React's rendering model
- Ability to trigger re-render with fallback source
- Consistent behaviour across browsers

---

## Related Documentation

- [v0.7.1 Devlog](../v0.7.1/README.md) - Previous release
- [v0.7.2 Retrospective](../../retrospectives/v0.7.2/README.md) - Lessons learned

---

**Status**: Complete
