# v0.10.5 Development Log - Field Descriptions & Demo Data Enhancement

## Overview

**Version**: v0.10.5
**Theme**: Field Descriptions & Demo Data Enhancement
**Development Period**: December 2025

This intermediate release enhances the user experience by adding descriptive tooltips to field labels and improving the quality of demo data.

---

## Implementation Narrative

### Phase 1: Field Description Infrastructure

The core task was extending the existing field display system to include descriptions. The `entityFields.ts` utility already provided a well-structured `FIELD_DEFINITIONS` record with labels and formatting hints. Adding descriptions was a natural extension.

**Key changes to `src/utils/entityFields.ts`**:

1. Extended `FieldDefinition` interface with optional `description` property
2. Added meaningful descriptions to all 16 field definitions
3. Created `getFieldDescription()` utility function
4. Updated `DisplayableField` interface to include description
5. Modified `getDisplayableFields()` to populate descriptions automatically

The descriptions focus on clarity and context:
- "Personal ranking within this category (1 = favourite)" for `myRank`
- "Aggregate review score from external sources" for `averageRating`
- "Year I first experienced this" for `myStartYear`

### Phase 2: InfoTooltip Component

Created a new reusable `InfoTooltip` component with CSS-only tooltip behaviour:

**Files created**:
- `src/components/InfoTooltip/InfoTooltip.tsx`
- `src/components/InfoTooltip/InfoTooltip.module.css`
- `src/components/InfoTooltip/index.ts`

**Design decisions**:
- **CSS-only**: No JavaScript library required; uses `:hover` and `:focus-within`
- **Accessible**: Includes `role="tooltip"`, `aria-label`, and `tabIndex={0}` for keyboard navigation
- **Responsive**: Positions to the right on desktop, below on mobile (< 640px)
- **Theme-aware**: Uses CSS custom properties for colours
- **Subtle**: Small "i" icon at 60% opacity, brightens on hover

The icon design uses a simple serif "i" in a circular border, inspired by information icons in encyclopaedic interfaces.

### Phase 3: CardExpanded Integration

The `CardExpanded` component was updated to render `InfoTooltip` next to each field label in the Verdict overlay:

```tsx
{additionalFields.map(({ key, label, value, description }) => (
  <div key={key} className={styles.metadataItem}>
    <dt className={styles.metadataKey}>
      {label}
      {description && <InfoTooltip text={description} />}
    </dt>
    <dd className={styles.metadataValue}>{value}</dd>
  </div>
))}
```

This approach ensures tooltips only appear when a description is defined, gracefully handling dynamically discovered fields.

### Phase 4: Platform Data Enhancement

Added MobyGames links to all 13 platform entities. MobyGames is a comprehensive video game database, complementing Wikipedia's encyclopaedic approach with detailed game metadata.

**Platforms updated**:
- amiga, arcade, c64, gameboy, gba, mac, ms-dos, n64, nes, snes, switch, vcs2600, vic20

Each platform now has two external links displayed with source icons in the platform overlay.

### Phase 5: Data Consistency Audit

Verified all 81 games in the retro-games collection have:
- Required fields: title, year, summary, platform (✅ all present)
- Personal fields: myRank, myVerdict, myStartYear (✅ all present)
- External links: detailUrls (✅ all present)
- Image attribution: attribution object (⚠️ 3 VIC-20 games without images)

The 3 VIC-20 games (Black Jack, Skramble, Slot) don't have images - the application handles this gracefully with a fallback.

### Phase 6: Sort Controls UX Fix

**Problem**: The "Sort By" and "Sort Direction" controls in the Display tab appeared active even when "Shuffle on Load" was enabled in the Behaviour tab. This was confusing because sorting doesn't apply when shuffle is on.

**Solution**: Added disabled state to Sort controls when `shuffleOnLoad` is true:

```tsx
<select
  disabled={shuffleOnLoad}
  className={styles.select}
  value={fieldMapping.sortField}
  ...
>
```

**Additional changes**:
- Created `.labelDisabled` CSS class with reduced opacity
- Added help text: "Sorting is disabled when Shuffle on Load is enabled (see Behaviour tab)"
- Applied `disabled` attribute to both Asc/Desc segmented buttons

This provides clear visual feedback that sorting only applies when shuffle is turned off.

---

## Challenges Encountered

### 1. clsx Dependency

Initially implemented `InfoTooltip` using `clsx` for class name composition, but the project doesn't have this dependency installed. Switched to simple string concatenation:

```typescript
// Before (caused import error)
import clsx from "clsx";
className={clsx(styles.tooltipWrapper, className)}

// After (works without dependency)
const wrapperClass = className
  ? `${styles.tooltipWrapper} ${className}`
  : styles.tooltipWrapper;
```

### 2. Tooltip Positioning

CSS-only tooltips need careful positioning to avoid viewport overflow. Implemented responsive positioning:
- Desktop: Tooltip appears to the right of the icon
- Mobile: Tooltip appears below the icon (using media query at 640px breakpoint)

Arrow pointers use `::before`/`::after` pseudo-elements with transparent borders.

---

## Code Highlights

### Field Description Pattern

The description system follows the existing pattern of FIELD_DEFINITIONS:

```typescript
myRank: {
  label: "My rank",
  type: "number",
  description: "Personal ranking within this category (1 = favourite)",
},
```

This keeps field metadata centralised and makes it easy to add new fields with consistent descriptions.

### CSS-Only Tooltip

The tooltip uses a simple but effective pattern:

```css
.tooltipWrapper:hover .tooltip,
.tooltipWrapper:focus-within .tooltip {
  opacity: 1;
  visibility: visible;
}
```

The combination of `opacity` and `visibility` transitions provides smooth fading while ensuring proper accessibility (invisible tooltips are not read by screen readers).

---

## Files Created/Modified

### New Files (4)

| File | Purpose |
|------|---------|
| `src/components/InfoTooltip/InfoTooltip.tsx` | Tooltip component |
| `src/components/InfoTooltip/InfoTooltip.module.css` | Tooltip styles |
| `src/components/InfoTooltip/index.ts` | Module exports |
| `docs/prompts/implementation/v0.10.5/README.md` | Implementation plan |

### Modified Files (17)

| File | Changes |
|------|---------|
| `src/utils/entityFields.ts` | Added descriptions, getFieldDescription(), updated interfaces |
| `src/components/CardExpanded/CardExpanded.tsx` | Integrated InfoTooltip |
| `src/components/SettingsPanel/ConfigSettingsTabs.tsx` | Disabled Sort controls when shuffle enabled |
| `src/components/SettingsPanel/SettingsPanel.module.css` | Added `.labelDisabled` style |
| 13 platform JSON files | Added MobyGames detailUrls |

---

## Related Documentation

- [v0.10.5 Implementation Prompt](../../../../prompts/implementation/v0.10.5/README.md)
- [v0.10.5 Retrospective](../../retrospectives/v0.10.5/README.md)

---

**Status**: Complete
