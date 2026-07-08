# v0.7.1 Devlog - Settings Fixes & Visual Polish

## Summary

v0.7.1 focuses on fixing broken settings and visual refinements for the detail view. This is a patch release addressing issues identified after v0.7.0.

## Implementation Narrative

### Phase 1: Settings Fixes

Three theme customisation settings were stored in the settings store but never read by the components:

1. **moreButtonLabel** - CardExpanded.tsx hardcoded "More" instead of reading from settings
2. **autoExpandMore** - No useEffect to auto-expand the overlay when opening
3. **zoomImage** - ImageGallery ignored this prop entirely

**Solution:** Added `useSettingsStore` import to CardExpanded.tsx and wired up all three settings to their respective controls.

### Phase 2: Visual Adjustments

Several visual issues were addressed:

1. **Logo Standardisation (A.1)** - Changed from fixed width (60%) to max-bounds sizing (max-width: 70%, max-height: 45%) to preserve aspect ratios across different platform logos

2. **Detail View Image Positioning (A.2)** - First image now zooms 3% beyond frame and aligns to top centre. This eliminates white artefacts at edges and positions content optimally.

3. **Default Label Change (A.4)** - Changed default `moreButtonLabel` from "Details" to "Verdict" across all theme presets

4. **Info Icon for More Button (A.5)** - Replaced ChevronIcon with InfoIcon for the Verdict button

5. **Rank Badge Width (A.9)** - Increased `.placeholder` max-width from 120px to 240px to show full "The one that got away!" text

6. **Overlay Reset on Close** - All overlays (Verdict, Attribution, Platform) now reset to closed state when the detail view closes

7. **Acknowledgement Info Icon** - Changed from button with text to icon-only circular button

## Files Modified

| File | Changes |
|------|---------|
| `src/components/CardExpanded/CardExpanded.tsx` | Settings store integration, overlay reset, icon-only acknowledgement button |
| `src/components/CardExpanded/CardExpanded.module.css` | Added `.iconButton` style |
| `src/components/ImageGallery/ImageGallery.tsx` | Added `zoomImage` prop |
| `src/components/ImageGallery/ImageGallery.module.css` | 3% zoom for first image, top alignment |
| `src/components/Card/Card.module.css` | Max-bounds logo sizing |
| `src/components/RankBadge/RankBadge.module.css` | Increased placeholder width |
| `src/stores/settingsStore.ts` | Changed defaults: moreButtonLabel="Verdict", autoExpandMore=false |

## Code Highlights

### Settings Store Integration

```typescript
// Get settings from store
const visualTheme = useSettingsStore((state) => state.visualTheme);
const themeCustomisations = useSettingsStore((state) => state.themeCustomisations);
const currentCustomisation = themeCustomisations[visualTheme];
const moreButtonLabel = currentCustomisation.moreButtonLabel;
const autoExpandMore = currentCustomisation.autoExpandMore;
const zoomImage = currentCustomisation.zoomImage;
```

### Overlay Reset on Close

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

### First Image Zoom

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

## Deferred Items

The following v0.7.1 plan items were deferred to future releases:

- **A.3** - Border width setting (requires UI controls)
- **A.6** - Platform link primary button style
- **A.7** - Granular animation settings (flip, detail, overlays)
- **A.8** - Platform overlay layout restructure
- **A.10** - Platform link in image corner
- **B.1-B.4** - Schema extensions (collection.json configuration)
- **D.1-D.4** - IndexedDB caching infrastructure
- **Wikipedia/MobyGames icons** - Icon-based links for source URLs

---

## Related Documentation

- [v0.7.1 Retrospective](../../retrospectives/v0.7.1/README.md)
- [v0.7.0 Milestone](../../../roadmap/milestones/v0.7.0.md)
