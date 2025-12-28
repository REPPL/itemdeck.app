# v0.11.5 Development Log

## Overview

**Version**: v0.11.5 - UI Refinements & Documentation Sync
**Date**: 28 December 2025
**Theme**: Field mapping flexibility, visual polish, and comprehensive documentation audit

This milestone focused on enhancing user control over card display, improving visual feedback, and ensuring documentation remained synchronised with implementation.

---

## Implementation Narrative

### Phase 1: Top Badge Field Selector

The original "Show Rank Badge" toggle was a binary choice that limited users. The new approach provides full flexibility:

**Problem:**
- Users wanted to display different fields in the top badge (verdict, rating, platform rank)
- Boolean toggle didn't allow field selection
- "Unranked Text" label was confusing when displaying non-rank fields

**Solution:**
```typescript
// Before
showRankBadge: boolean;

// After
topBadgeField: string; // 'order' | 'myRank' | 'myVerdict' | 'none' | custom fields
showRankBadge: boolean; // Derived: topBadgeField !== 'none'
```

**Implementation:**
1. Added `topBadgeField` to `FieldMappingConfig` in settings store
2. Created `topBadgeFields` array in `useAvailableFields` hook
3. Built dropdown selector in `CardSettingsTabs` component
4. Renamed "Unranked Text" to "Text if Empty" for clarity
5. Derived `showRankBadge` from field selection for backwards compatibility

### Phase 2: Collection Toast Redesign

The collection switching toast was easily missed. Users needed clearer feedback.

**Before:**
- Small toast notification in top corner
- 3-second auto-dismiss
- Often overlooked

**After:**
- Full-screen backdrop with blur effect
- Centred modal with larger icon and text
- "Click to dismiss" hint
- Cannot be missed

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Phase 3: Drag Placeholder Visibility

During card drag operations, the placeholder (showing where the card would return) was at 50% opacity, making it hard to see.

**Fix:** Changed placeholder opacity from 50% to 100% during drag. Users can now clearly see where their card originated.

### Phase 4: Bug Fixes

#### App Logo Display

**Problem:** Selecting "itemdeck App Logo" for card backs didn't work.

**Investigation:** The fallback chain in `Card.tsx` was:
1. Check entity logo
2. Check platform logo
3. Use app logo

Issue: When `undefined` was passed, fallback chain used platform logo instead.

**Fix:** Added explicit check at CardBack prop level before fallback chain.

#### High Contrast Mode

**Problem:** Grey text on dark backgrounds became unreadable in high contrast mode.

**Fix:** Added explicit text colour overrides in high contrast CSS:
```css
[data-high-contrast="true"] .text {
  color: var(--colour-high-contrast-text);
}
```

### Phase 5: Settings Panel Cleanup

Removed Edit Mode toggle from Appearance > Interactions tab. This was a developer feature that didn't belong in user-facing settings. Edit Mode remains accessible in System > Developer tab.

### Phase 6: Documentation Synchronisation

Major audit revealed several documentation drift issues:

**Issues Found:**
1. Broken research links in ADRs README (`../../../research/` should be `../../research/`)
2. Missing ADR-013 from ADR index
3. Missing ADR-019 from ADR index
4. Missing R-009 and R-010 from research README
5. Unchecked boxes in completed features (F-069, F-073)

**All Fixed:**
- Corrected 13 research link paths in ADRs README
- Added ADR-013 (External Data Repository) entry
- Added ADR-019 (Configuration-First Mechanics) entry
- Added R-009 (Mechanic App Integration) to research index
- Added R-010 (Settings UX Patterns) to research index
- Marked completed tasks in F-069 and F-073

### Phase 7: Future Planning

Added features and bug fixes to v0.12.0 milestone:

**Bug Fixes:**
- Card Back Logo display issues
- Drag Handle Overlay detachment during drag
- Cache Notification (show collection name)

**Enhancements:**
- Selection Count Default (50% of cards, min 8)

**New Feature:**
- F-091: Entity Auto-Discovery (GitHub API directory listing fallback)

---

## Key Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `docs/development/roadmap/milestones/v0.11.5.md` | Milestone documentation |
| `docs/development/roadmap/features/planned/F-091-entity-auto-discovery.md` | New feature spec |
| `docs/development/process/devlogs/v0.11.5/README.md` | This devlog |
| `docs/development/process/retrospectives/v0.11.5/README.md` | Retrospective |

### Modified Components

| File | Changes |
|------|---------|
| `CollectionToast.tsx` | Modal-style display with backdrop |
| `CollectionToast.module.css` | Backdrop, centering, blur |
| `DraggableCardGrid.tsx` | Placeholder opacity fix |
| `AppearanceSettingsTabs.tsx` | Remove Edit Mode toggle |
| `CardSettingsTabs.tsx` | Top Badge Field selector |
| `Card.tsx` | App logo fallback fix |
| `CardGrid.tsx` | Derive showRankBadge |

### Modified Store/Hooks

| File | Changes |
|------|---------|
| `settingsStore.ts` | Added `topBadgeField` to FieldMappingConfig |
| `useAvailableFields.ts` | Added `topBadgeFields` return value |

### Documentation Fixes

| File | Changes |
|------|---------|
| `decisions/adrs/README.md` | Fixed research links, added ADR-013, ADR-019 |
| `decisions/README.md` | Added ADR-014 to ADR-019 |
| `research/README.md` | Added R-009, R-010 |
| `F-069-youtube-video-support.md` | Marked tasks complete |
| `F-073-user-documentation.md` | Marked tasks complete |
| `R-010-settings-ux-patterns.md` | Updated tab recommendation |
| `schemas/v1/components/README.md` | Added field mapping docs |
| `milestones/v0.12.0.md` | Added bugs and enhancements |

---

## Challenges Encountered

### 1. Documentation Index Drift

**Problem:** Multiple documentation indices were out of sync:
- ADR index missing entries despite files existing
- Research index incomplete
- Feature checkboxes not reflecting completion

**Root Cause:** Documentation updates weren't consistently made when adding new files.

**Solution:** Comprehensive audit and bulk fix. Added to process: always update index when adding new files.

### 2. Fallback Chain Logic

**Problem:** The CardBack logo fallback chain had subtle bugs.

**Investigation:** Props were passed as `undefined` which triggered fallback logic when they shouldn't have.

**Fix:** Added explicit truthy checks before entering fallback chain.

### 3. High Contrast Readability

**Problem:** Users reported grey text becoming invisible in high contrast mode.

**Root Cause:** Base styles used mid-grey text, high contrast mode didn't override.

**Fix:** Added explicit colour overrides for high contrast mode.

---

## Code Highlights

### Top Badge Field Configuration

```typescript
// useAvailableFields.ts
const topBadgeFields = useMemo(() => {
  const fields: FieldOption[] = [
    { value: 'none', label: 'None (Hide Badge)' },
    { value: 'order', label: 'Order / Rank' },
    { value: 'myRank', label: 'My Rank' },
    { value: 'myVerdict', label: 'My Verdict' },
  ];

  // Add any numeric/rating fields from entity
  if (entity) {
    Object.entries(entity).forEach(([key, value]) => {
      if (typeof value === 'number' && !fields.some(f => f.value === key)) {
        fields.push({ value: key, label: formatFieldLabel(key) });
      }
    });
  }

  return fields;
}, [entity]);
```

### Modal Toast with Backdrop

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal {
  background: var(--colour-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  box-shadow: var(--shadow-xl);
}
```

### Derived showRankBadge

```typescript
// CardGrid.tsx
const showRankBadge = useMemo(() => {
  return fieldMapping.topBadgeField !== 'none';
}, [fieldMapping.topBadgeField]);
```

---

## Statistics

| Metric | Value |
|--------|-------|
| Files changed | 18 |
| Documentation files fixed | 9 |
| ADR entries added | 3 |
| Research entries added | 2 |
| Bug fixes | 2 |
| UI improvements | 4 |
| New feature specs | 1 |

---

## Related Documentation

- [v0.11.5 Milestone](../../roadmap/milestones/v0.11.5.md)
- [v0.11.5 Retrospective](../../retrospectives/v0.11.5/README.md)
- [v0.11.1 Devlog](../v0.11.1/README.md)
- [v0.12.0 Milestone](../../roadmap/milestones/v0.12.0.md)
