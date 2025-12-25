# v0.7.2 Implementation Prompt - Visual Polish & Source Icons

**Version:** v0.7.2
**Codename:** Visual Polish
**Branch:** `feature/v0.7.2-visual-polish`

---

## Overview

Complete the visual adjustments deferred from v0.7.1, add icon-based source links, and extract a shared icon library.

---

## Context

- v0.7.1 fixed settings wiring but deferred visual polish
- Wikipedia/MobyGames links still display as text
- Icons are defined inline in CardExpanded.tsx
- Platform overlay links are in the header (should be footer)

---

## Scope

### In Scope (v0.7.2)

1. **Border Width Setting** - Add UI control for card borders
2. **Platform Link Primary Style** - Match Verdict button style
3. **Granular Animation Settings** - Separate controls for flip, detail, overlays
4. **Platform Overlay Restructure** - Move links to footer
5. **Platform Link in Image Corner** - Overlay on detail view image
6. **Source Icons** - Wikipedia/MobyGames/IGN logo icons
7. **Shared Icon Library** - Extract InfoIcon, CloseIcon, ExternalLinkIcon

### Optional Additions (User to approve)

- F-037: Card Sorting (Small effort)
- Sub-tab keyboard navigation (Accessibility)

---

## Phase 1: Visual Adjustments

### A.3 Border Width Setting

**Files:**
- `src/stores/settingsStore.ts` - Add `borderWidth: "none" | "small" | "medium" | "large"`
- `src/hooks/useVisualTheme.ts` - Apply `--card-border-width` CSS variable
- `src/components/SettingsPanel/ThemeSettingsTabs.tsx` - Add Border Width control

**Implementation:**
```typescript
// settingsStore.ts - Add to ThemeCustomisation
borderWidth: "none" | "small" | "medium" | "large";

// Default values
const borderWidthValues = {
  none: "0",
  small: "1px",
  medium: "2px",
  large: "4px",
};
```

### A.6 Platform Link Primary Style

**Files:**
- `src/components/CardExpanded/CardExpanded.module.css`

**Changes:**
```css
.platformLink {
  /* Match .primaryButton styles */
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--accent-colour);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  cursor: pointer;
}
```

### A.7 Granular Animation Settings

**Files:**
- `src/stores/settingsStore.ts` - Add `flipAnimation`, `detailAnimation`, `overlayAnimation`
- `src/hooks/useVisualTheme.ts` - Apply separate CSS variables
- `src/components/SettingsPanel/ThemeSettingsTabs.tsx` - Add Animations section
- `src/components/Card/Card.tsx` - Apply flipAnimation setting
- `src/components/CardExpanded/CardExpanded.tsx` - Apply detail/overlay settings

**Implementation:**
```typescript
// settingsStore.ts
flipAnimation: boolean;
detailAnimation: boolean;
overlayAnimation: boolean;
```

### A.8 Platform Overlay Restructure

**Files:**
- `src/components/CardExpanded/CardExpanded.tsx` - Move links to footer
- `src/components/CardExpanded/CardExpanded.module.css` - Add footer styles

### A.10 Platform Link in Image Corner

**Files:**
- `src/components/CardExpanded/CardExpanded.tsx` - Position in gallery
- `src/components/CardExpanded/CardExpanded.module.css` - Absolute positioning

---

## Phase 2: Source Icons

**Files to Create:**
- `src/components/SourceIcon/SourceIcon.tsx`
- `src/components/SourceIcon/icons/wikipedia.tsx`
- `src/components/SourceIcon/icons/mobygames.tsx`
- `src/components/SourceIcon/icons/ign.tsx`
- `src/components/SourceIcon/icons/generic.tsx`
- `src/components/SourceIcon/index.ts`

**Pattern Matching:**
```typescript
const SOURCE_ICONS: Record<string, { pattern: RegExp; Icon: ComponentType }> = {
  wikipedia: { pattern: /wikipedia\.org/i, Icon: WikipediaIcon },
  mobygames: { pattern: /mobygames\.com/i, Icon: MobyGamesIcon },
  ign: { pattern: /ign\.com/i, Icon: IGNIcon },
};

export function SourceIcon({ url, source }: { url: string; source?: string }) {
  const match = Object.entries(SOURCE_ICONS).find(([, { pattern }]) =>
    pattern.test(url)
  );
  const Icon = match ? match[1].Icon : GenericIcon;
  return <Icon />;
}
```

---

## Phase 3: Shared Icon Library

**Files to Create:**
- `src/components/Icons/index.ts`
- `src/components/Icons/InfoIcon.tsx`
- `src/components/Icons/CloseIcon.tsx`
- `src/components/Icons/ExternalLinkIcon.tsx`
- `src/components/Icons/ChevronIcon.tsx`

**Files to Modify:**
- `src/components/CardExpanded/CardExpanded.tsx` - Import from Icons
- `src/components/ImageGallery/ImageGallery.tsx` - Import from Icons

---

## Success Criteria

- [ ] Border width setting works
- [ ] Platform link uses primary button style
- [ ] Granular animation controls work
- [ ] Platform overlay has footer with links
- [ ] Platform link appears in image corner
- [ ] Wikipedia/MobyGames URLs show logo icons
- [ ] Shared icon library extracted

---

## Post-Implementation

1. Create devlog: `docs/development/process/devlogs/v0.7.2/README.md`
2. Create retrospective: `docs/development/process/retrospectives/v0.7.2/README.md`
3. Run verification: `/verify-docs`, `/sync-docs`, `/pii-scan`
4. Create git tag: `v0.7.2`

---

## Related Documentation

- [v0.7.1 Devlog - Deferred Items](../../development/process/devlogs/v0.7.1/README.md)
- [v0.7.0 Implementation Prompt](../v0.7.0/README.md)

---

**Status**: Ready for Implementation
