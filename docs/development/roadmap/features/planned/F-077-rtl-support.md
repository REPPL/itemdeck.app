# F-077: RTL (Right-to-Left) Language Support

## Problem Statement

Itemdeck aims to support Arabic and Hebrew in v2.0.0. These languages require:
1. Right-to-left text direction
2. Mirrored UI layouts (navigation, sidebars)
3. Flipped directional icons (chevrons, arrows)
4. Proper text alignment and spacing

Currently, Itemdeck's CSS uses directional properties (`margin-left`, `text-align: left`) that don't adapt to RTL contexts.

## Design Approach

Implement RTL support through:

1. **CSS Logical Properties**: Replace directional CSS with logical equivalents
2. **HTML Direction Attribute**: Set `dir="rtl"` on document root
3. **Icon Mirroring**: Automatic via icon registry (F-076)
4. **Flexbox/Grid Adaptation**: Already RTL-aware with logical properties

### No Library Required

RTL support is purely CSS-based. The i18n library (react-i18next) handles language detection; CSS handles layout transformation.

## Files to Modify

### CSS Files (Systematic Audit)

| File Pattern | Estimated Changes |
|--------------|-------------------|
| `src/styles/globals.css` | ~10 properties |
| `src/components/**/*.module.css` | ~100+ properties |
| `src/mechanics/**/*.module.css` | ~20 properties |

### Property Mapping

| Directional (Remove) | Logical (Use Instead) |
|---------------------|----------------------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `float: left` | `float: inline-start` |
| `float: right` | `float: inline-end` |

### JavaScript Changes

| File | Changes |
|------|---------|
| `src/i18n/config.ts` | Add RTL locale detection |
| `src/App.tsx` | Set `dir` attribute on document root |
| `src/hooks/useLocale.ts` | Export `isRTL` boolean |

## Implementation Tasks

### Phase 1: Infrastructure
- [ ] Add RTL detection to i18n config (`ar`, `he` → RTL)
- [ ] Create `useIsRTL()` hook
- [ ] Update App.tsx to set `document.documentElement.dir`
- [ ] Add CSS custom property `--direction: ltr | rtl`

### Phase 2: CSS Audit & Migration
- [ ] Audit `src/styles/globals.css` for directional properties
- [ ] Migrate SettingsPanel CSS modules
- [ ] Migrate Card component CSS modules
- [ ] Migrate Navigation component CSS modules
- [ ] Migrate SearchBar CSS modules
- [ ] Migrate Modal/Overlay CSS modules
- [ ] Migrate remaining component CSS

### Phase 3: Special Cases
- [ ] Handle positioned elements (tooltips, popovers)
- [ ] Handle animations with directional movement
- [ ] Verify icon mirroring works (chevrons, external links)
- [ ] Test scrollbar positioning

### Phase 4: Translations
- [ ] Create Arabic (ar) translation files
- [ ] Create Hebrew (he) translation files
- [ ] Add RTL languages to language selector

### Phase 5: Testing
- [ ] Visual regression tests in RTL mode
- [ ] Manual testing with native RTL speakers
- [ ] Cross-browser RTL testing

## Technical Considerations

### Direction Detection

```typescript
// src/i18n/config.ts
export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

export function isRTLLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale.split('-')[0]);
}
```

### Document Direction

```typescript
// src/App.tsx
import { useTranslation } from 'react-i18next';
import { isRTLLocale } from '@/i18n/config';

function App() {
  const { i18n } = useTranslation();
  const isRTL = isRTLLocale(i18n.language);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRTL]);
}
```

### CSS Pattern Examples

```css
/* Before */
.sidebar {
  margin-left: 20px;
  padding-right: 10px;
  text-align: left;
  border-left: 1px solid var(--border);
}

/* After */
.sidebar {
  margin-inline-start: 20px;
  padding-inline-end: 10px;
  text-align: start;
  border-inline-start: 1px solid var(--border);
}
```

### Flexbox/Grid (Already RTL-Aware)

```css
/* These work in both LTR and RTL automatically */
.container {
  display: flex;
  flex-direction: row; /* Reverses in RTL */
  justify-content: flex-start; /* Adapts to direction */
}
```

### Icon Mirroring (Via F-076)

```css
/* Directional icons flip in RTL */
[dir="rtl"] .icon-chevron-left,
[dir="rtl"] .icon-chevron-right,
[dir="rtl"] .icon-external-link {
  transform: scaleX(-1);
}
```

### Positioned Elements

```css
/* Positioned elements need logical properties */
.tooltip {
  /* Before: left: 100%; */
  inset-inline-start: 100%;
}

.close-button {
  /* Before: right: 10px; */
  inset-inline-end: 10px;
  /* Before: left: auto; */
  inset-inline-start: auto;
}
```

## Browser Support

| Browser | Logical Properties Support |
|---------|---------------------------|
| Chrome | 89+ (March 2021) |
| Firefox | 66+ (March 2019) |
| Safari | 15+ (September 2021) |
| Edge | 89+ (March 2021) |

All target browsers support CSS logical properties.

## Success Criteria

- [ ] All CSS uses logical properties (no `left`/`right`/`margin-left` etc.)
- [ ] Arabic and Hebrew translations complete
- [ ] UI mirrors correctly when switching to RTL language
- [ ] Directional icons flip appropriately
- [ ] Text aligns correctly (start/end, not left/right)
- [ ] Positioned elements (tooltips, modals) appear correctly
- [ ] Scrollbars position correctly
- [ ] Animations work in both directions
- [ ] No visual regressions in LTR mode

## Dependencies

- **Requires**:
  - [F-075 Internationalisation Foundation](./F-075-internationalisation-foundation.md)
  - [F-076 Icon Configuration Registry](./F-076-icon-configuration-registry.md) (for icon mirroring)
- **Blocks**: None

## Complexity

**High** - Systematic CSS audit across entire codebase, requires careful testing to avoid regressions.

---

## Related Documentation

- [State-of-the-Art: Internationalisation](../../../research/state-of-the-art-internationalisation.md)
- [MDN: CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- [RTL Styling 101](https://rtlstyling.com/)
- [v2.0.0 Milestone](../../milestones/v2.0.0.md)

---

**Status**: Planned
