# v0.11.2 Implementation Prompt

## Overview

v0.11.2 focuses on **responsive UI polish**, **navigation reorganisation**, **external data loading UX**, and **configuration portability**.

---

## Features

### Phase 1: Navigation Hub

#### F-085: Collapsible Navigation Hub

**Problem**: Too many floating buttons cluttering the UI.

**Solution**:
- Always visible: Help (top), Navigation toggle (bottom)
- Expandable: View, Search, Games, Settings
- Animation: Buttons emerge sequentially (staggered 50ms) with spring animation
- State persisted in settingsStore

**Acceptance Criteria**:
- [ ] Only Help + Navigation visible on startup
- [ ] Click Navigation expands View, Search, Games, Settings buttons
- [ ] Click Navigation again collapses buttons
- [ ] Animation is smooth with staggered emergence
- [ ] `aria-expanded` attribute on Navigation button
- [ ] Hidden buttons have `aria-hidden="true"` when collapsed
- [ ] State persists across page reloads

**Files**:
- Create: `src/components/NavigationHub/NavigationHub.tsx`
- Create: `src/components/NavigationHub/NavigationHub.module.css`
- Modify: `src/App.tsx`
- Modify: `src/App.module.css`
- Modify: `src/stores/settingsStore.ts`

---

#### F-086: View Button with Popover

**Problem**: View mode toggle buried in SearchBar; grouping needs dedicated UI.

**Solution**:
- Round button (48px) in navigation hub
- Click opens popover with:
  - View mode: Grid | List | Compact
  - Group by: None | Decade | Category | Rating | Custom field
- Current view mode shown as small indicator on button

**Acceptance Criteria**:
- [ ] View button displays in expanded navigation hub
- [ ] Popover opens on click with view mode options
- [ ] Popover includes grouping options
- [ ] Current selection indicated visually
- [ ] Popover closes on outside click or selection
- [ ] Keyboard accessible (Enter/Space to open, Escape to close)

**Files**:
- Create: `src/components/ViewPopover/ViewPopover.tsx`
- Create: `src/components/ViewPopover/ViewPopover.module.css`
- Modify: `src/components/SearchBar/SearchBar.tsx` (remove ViewModeToggle)

---

### Phase 2: Responsive Fixes

#### F-075: CardExpanded Responsive Layout

**Problem**: Image gallery dominates detail view at narrow widths.

**Solution**:
- Compact mode (height < 500px or width < 400px):
  - Replace gallery with 80px thumbnail inline with title
  - Thumbnail tappable to open gallery in modal
  - Prioritise: title, summary, links, verdict
- Medium mode (500-700px height):
  - Reduce gallery aspect ratio from 16:10 to 4:3
  - Gallery nav buttons shrink to 36px
- Full mode (height > 700px):
  - Current behaviour

**Acceptance Criteria**:
- [ ] Thumbnail replaces gallery below 500px height or 400px width
- [ ] Thumbnail is 80px and tappable
- [ ] Tapping thumbnail opens full gallery in lightbox
- [ ] Title, summary, links, verdict visible in compact mode
- [ ] Gallery aspect ratio reduces in medium mode
- [ ] Nav buttons shrink appropriately

**Files**:
- Modify: `src/components/CardExpanded/CardExpanded.tsx`
- Modify: `src/components/CardExpanded/CardExpanded.module.css`
- Modify: `src/components/ImageGallery/ImageGallery.tsx`
- Modify: `src/components/ImageGallery/ImageGallery.module.css`

---

#### F-076: Settings Panel Responsive

**Problem**: Settings panel doesn't adapt to very narrow screens.

**Solution**:
- Below 440px: Full-width panel, reduced padding
- Below 360px: Replace tab bar with dropdown selector

**Acceptance Criteria**:
- [ ] Full-width panel below 440px
- [ ] Dropdown selector replaces tabs below 360px
- [ ] All form controls usable at 320px width
- [ ] Dropdown shows current section name + chevron

**Files**:
- Modify: `src/components/SettingsPanel/SettingsPanel.tsx`
- Modify: `src/components/SettingsPanel/SettingsPanel.module.css`

---

### Phase 3: Links Consolidation

#### F-084: Consolidated Sources Overlay

**Problem**: Multiple source buttons aren't sustainable with many links.

**Solution**:
- Single "Sources" button (or "Source" if only one)
- Opens overlay listing all detail URLs
- Groups by type if categories exist
- Footer layout: `[ⓘ] [Sources ↗]        [Verdict]`

**Acceptance Criteria**:
- [ ] Single Sources button replaces multiple source buttons
- [ ] Button label is "Source" for 1 link, "Sources" for multiple
- [ ] Overlay shows all links with icons and labels
- [ ] Links grouped by type if categories exist
- [ ] Same overlay style as attribution overlay
- [ ] Acknowledgement (ⓘ) button remains separate

**Files**:
- Create: `src/components/SourcesOverlay/SourcesOverlay.tsx`
- Create: `src/components/SourcesOverlay/SourcesOverlay.module.css`
- Modify: `src/components/CardExpanded/CardExpanded.tsx`
- Modify: `src/components/CardExpanded/CardExpanded.module.css`

---

#### F-077: Button Differentiation

**Problem**: Navigation buttons look similar to card info buttons.

**Solution**:
| Button Type | Position | Style |
|-------------|----------|-------|
| Navigation | Floating (bottom-right) | Filled, accent, 48px |
| Card info | On card | Outlined, muted, 36px |
| Detail actions | Footer row | Outlined secondary, filled primary |

**Acceptance Criteria**:
- [ ] Navigation buttons use filled style with accent colours
- [ ] Card info buttons use outlined muted style
- [ ] Platform info button in gallery uses outline style
- [ ] Verdict button remains filled primary

**Files**:
- Modify: `src/components/CardExpanded/CardExpanded.module.css`
- Modify: `src/components/Card/Card.module.css` (if applicable)

---

### Phase 4: External Data UX

#### F-078: GitHub-Aware Loading Screen

**Problem**: Generic loading screen when loading from GitHub.

**Solution**:
- Detect GitHub source from URL
- Extract username from MyPlausibleMe URL pattern
- Fetch user's GitHub avatar: `https://github.com/{user}.png`
- Show avatar (64px, circular) + username + "Loading collection from GitHub..."
- Progress: "Fetching manifest..." → "Loading items..." → "Validating images..."

**Acceptance Criteria**:
- [ ] GitHub source detected from URL
- [ ] Username extracted from MyPlausibleMe URL
- [ ] GitHub avatar fetched and displayed (64px circular)
- [ ] Username shown with loading message
- [ ] Progress stages shown during load
- [ ] Fallback to generic loading if not GitHub source

**Files**:
- Modify: `src/components/LoadingScreen/LoadingScreen.tsx`
- Modify: `src/components/LoadingScreen/LoadingScreen.module.css`
- Modify: `src/hooks/useCollection.ts`

---

#### F-079: Image Validation IndexedDB Persistence

**Problem**: Image validation cache is in-memory only.

**Solution**:
- Persist validation results to IndexedDB
- Filter invalid images before displaying gallery
- Show "Image unavailable" placeholder for cards with no valid images
- Add setting: "Skip cards with no valid images" (default: off)

**Acceptance Criteria**:
- [ ] Validation results cached in IndexedDB
- [ ] Cache survives page reload
- [ ] Invalid images filtered from gallery
- [ ] Placeholder shown for cards with no valid images
- [ ] Setting to skip cards with no valid images
- [ ] Cache invalidation strategy (TTL or manual)

**Files**:
- Modify: `src/hooks/useImageValidation.ts`
- Modify: `src/components/ImageGallery/ImageGallery.tsx`
- Modify: `src/stores/settingsStore.ts`

---

#### F-080: Per-Collection Cache Consent

**Problem**: Users should consent before caching collections locally.

**Solution**:
- First external load triggers permission dialog
- Options: "Allow", "Allow for this collection", "Don't cache"
- Store per-source consent in settingsStore

**Acceptance Criteria**:
- [ ] Dialog appears on first external collection load
- [ ] Three options: Allow, Allow for this collection, Don't cache
- [ ] Consent stored per-source
- [ ] Dialog doesn't appear for consented sources
- [ ] User can revoke consent in settings

**Files**:
- Create: `src/components/CacheConsentDialog/CacheConsentDialog.tsx`
- Create: `src/components/CacheConsentDialog/CacheConsentDialog.module.css`
- Modify: `src/stores/settingsStore.ts`
- Modify: `src/hooks/useCollection.ts`

---

### Phase 5: Configuration Portability

#### F-081: Settings JSON Export/Import

**Problem**: Settings stored in localStorage only; not portable.

**Solution**:
- Export: Download `settings.json`
- Import: Upload and merge/replace
- JSON structure mirrors settingsStore shape

**Acceptance Criteria**:
- [ ] Export button downloads settings.json
- [ ] JSON contains all persisted settings
- [ ] Import button accepts settings.json file
- [ ] Option to merge or replace existing settings
- [ ] Validation on import (reject malformed JSON)
- [ ] Success/error feedback

**Files**:
- Modify: `src/stores/settingsStore.ts`
- Modify: `src/components/SettingsPanel/StorageSettingsTabs.tsx`

---

#### F-082: Theme JSON Export/Import

**Problem**: Theme customisations not portable.

**Solution**:
- Export: Download `theme-{name}.json`
- Import: Merge customisations into themeStore
- JSON contains customisation overrides only

**Acceptance Criteria**:
- [ ] Export button downloads theme-{themeName}.json
- [ ] JSON contains only customisation overrides
- [ ] Import merges customisations for specified theme
- [ ] Validation on import
- [ ] Success/error feedback

**Files**:
- Modify: `src/stores/themeStore.ts`
- Modify: `src/components/SettingsPanel/ThemeSettingsTabs.tsx`

---

## Deferred to v0.12.0

### F-083: Mechanics JSON Config

- Extract mechanic settings to `mechanic-{id}.json`
- Settings: difficulty, pair count, etc.
- Dynamic loading from URL
- Document plugin interface for external mechanics

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Gallery compact mode | 80px thumbnail | Preserves content visibility while maintaining image access |
| Navigation hub | Help + Nav always visible | Ensures accessibility to support and navigation |
| Cache consent | Per-collection | Gives users granular control |
| Settings panel narrow | Dropdown selector | Saves vertical space on small screens |
| GitHub loading | Show user avatar | Personalises the loading experience |

---

## Implementation Order

1. F-085: Navigation Hub
2. F-086: View Popover
3. F-075: CardExpanded responsive
4. F-076: Settings panel responsive
5. F-084: Sources Overlay
6. F-077: Button differentiation
7. F-078: GitHub loading screen
8. F-079: Image validation persistence
9. F-080: Cache consent
10. F-081: Settings export/import
11. F-082: Theme export/import

---

## Success Criteria

- [ ] Navigation hub with expand/collapse animation working
- [ ] View popover with mode + grouping options
- [ ] CardExpanded shows thumbnail at narrow widths
- [ ] Thumbnail tappable to open full gallery
- [ ] Settings panel usable at 320px width
- [ ] Single "Sources" button opens overlay with all links
- [ ] Loading screen shows GitHub context when loading external
- [ ] Invalid images filtered from gallery with IndexedDB cache
- [ ] Per-collection cache consent dialog
- [ ] User can export/import settings as JSON
- [ ] User can export/import theme customisations as JSON
