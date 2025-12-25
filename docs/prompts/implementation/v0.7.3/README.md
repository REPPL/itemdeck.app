# v0.7.3 Implementation Prompt - Settings Audit & Quick Wins

**Version:** v0.7.3
**Codename:** Settings Audit
**Branch:** `feature/v0.7.3-settings-audit`

---

## Overview

Systematically verify all settings work end-to-end, wire up FieldOptionsContext, and complete quick wins from retrospectives.

---

## Context

- v0.7.2 completed visual polish and source icons
- Some settings may still be stored but not read by components
- FieldOptionsContext exists but isn't fully wired to settings panel
- Display config lacks comprehensive documentation

---

## Scope

### In Scope (v0.7.3)

1. **Full Settings Audit** - Verify ALL settings affect the UI
2. **Wire up FieldOptionsContext** - Dynamic field options in settings
3. **Display Config Documentation** - Document schema with examples
4. **Sub-tab keyboard navigation** (from v0.6.1 retro)

### Optional Additions (User to approve)

- F-036: Card Filtering (Medium effort)
- Visual tests/screenshots

---

## Phase 1: Settings Audit

**Process:**
1. List all settings in settingsStore.ts
2. For each setting, verify:
   - Setting is read by component
   - Changing setting affects UI immediately
   - Setting persists across page reload
3. Document any broken settings
4. Fix or defer with justification

**Settings to Audit:**

### Layout Settings
| Setting | Component | Status |
|---------|-----------|--------|
| layout | CardGrid | [ ] Verified |
| cardSize | Card | [ ] Verified |
| cardAspectRatio | Card | [ ] Verified |
| maxVisibleCards | useShuffledCards | [ ] Verified |

### Card Back Settings
| Setting | Component | Status |
|---------|-----------|--------|
| cardBackDisplay | CardBack | [ ] Verified |
| cardBackStyle | CardBack | [ ] Verified |
| dragFace | DraggableCardGrid | [ ] Verified |
| showDragIcon | Card | [ ] Verified |

### Theme Customisations (per theme)
| Setting | Component | Status |
|---------|-----------|--------|
| borderRadius | useVisualTheme | [ ] Verified |
| shadowIntensity | useVisualTheme | [ ] Verified |
| animationStyle | Card, CardExpanded | [ ] Verified |
| accentColour | useVisualTheme | [ ] Verified |
| hoverColour | useVisualTheme | [ ] Verified |
| cardBackgroundColour | useVisualTheme | [ ] Verified |
| detailViewTransparency | CardExpanded | [ ] Verified |
| footerOverlayStyle | CardExpanded | [ ] Verified |
| moreButtonLabel | CardExpanded | [ ] Verified |
| autoExpandMore | CardExpanded | [ ] Verified |
| zoomImage | ImageGallery | [ ] Verified |

### Field Mapping Settings
| Setting | Component | Status |
|---------|-----------|--------|
| titleField | useCollection | [ ] Verified |
| subtitleField | useCollection | [ ] Verified |
| footerBadgeField | Card | [ ] Verified |
| logoField | CardBack | [ ] Verified |
| sortField | useShuffledCards | [ ] Verified |
| sortDirection | useShuffledCards | [ ] Verified |
| rankPlaceholder | RankBadge | [ ] Verified |

---

## Phase 2: FieldOptionsContext

**Current State:**
- `src/contexts/FieldOptionsContext.tsx` exists
- May not be wired to all settings dropdowns

**Files to Modify:**
- `src/contexts/FieldOptionsContext.tsx` - Verify complete implementation
- `src/components/SettingsPanel/ConfigSettingsTabs.tsx` - Use `useFieldOptions()` hook
- `src/App.tsx` - Ensure wrapped with `FieldOptionsProvider`

**Verification:**
```typescript
// ConfigSettingsTabs.tsx should use:
const { titleOptions, subtitleOptions, badgeOptions } = useFieldOptions();

// Instead of hardcoded arrays
```

---

## Phase 3: Sub-tab Keyboard Navigation

**Files:**
- `src/components/SettingsPanel/ThemeSettingsTabs.tsx`
- `src/components/SettingsPanel/ConfigSettingsTabs.tsx`

**Implementation:**
- Arrow left/right to navigate between sub-tabs
- Home/End to jump to first/last sub-tab
- Follow WAI-ARIA tabs pattern

---

## Phase 4: Documentation

**Files to Create:**
- `docs/reference/display-config.md` - Display configuration reference

**Contents:**
1. Field path syntax (`entity.field`, `entity[filter].field`)
2. Fallback expressions (`field1 ?? field2`)
3. Available field types per context
4. Examples for common use cases

---

## Success Criteria

- [ ] All settings verified to work (with documentation)
- [ ] Broken settings fixed or explicitly deferred
- [ ] FieldOptionsContext wired to settings UI
- [ ] Display config documented with examples
- [ ] Sub-tab keyboard navigation works
- [ ] Audit report produced

---

## Post-Implementation

1. Create devlog: `docs/development/process/devlogs/v0.7.3/README.md`
2. Create retrospective: `docs/development/process/retrospectives/v0.7.3/README.md`
3. Create settings audit report: `docs/reference/settings-audit.md`
4. Run verification: `/verify-docs`, `/sync-docs`, `/pii-scan`
5. Create git tag: `v0.7.3`

---

## Related Documentation

- [v0.7.2 Implementation Prompt](../v0.7.2/README.md)
- [v0.6.1 Retrospective - Follow-ups](../../development/process/retrospectives/v0.6.1/README.md)
- [v0.7.0 Retrospective - FieldOptionsContext](../../development/process/retrospectives/v0.7.0/README.md)

---

**Status**: Ready for Implementation
