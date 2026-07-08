# v0.15.0 Development Log

## Overview

**Milestone:** v0.15.0 - User Experience & Polish
**Theme:** First impressions, visual consistency, user understanding
**Focus:** Clearing the backlog of UX features and adding polish for non-expert users

---

## Implementation Narrative

### Phase 0: Pre-existing Lint Errors

Before starting the main implementation, addressed existing lint errors in the codebase to ensure a clean baseline.

### Phase 1: Documentation and Research

Created research documents to guide implementation decisions:
- **R-011**: Button Component Strategy
- **R-012**: Caching UX Patterns
- **State-of-the-Art Visual Consistency**: Analysis of UI consistency patterns

### Phase 2: Parallel Track Implementation

Implemented features across three parallel tracks:

#### Track A: Onboarding & First Impressions

**F-107: Empty Collection Handling**
- Auto-switches to "Add Source" tab when no collections exist
- Disables "Sources" tab when empty to guide users

**F-109: Launch Screen with Logo**
- Updated `LoadingScreen.tsx` to display itemdeck logo
- Added fade-in animation for polished appearance

**F-112: MyPlausibleMe Example Loading**
- Created `src/config/devSources.ts` with hard-coded example collection references
- Added "Example Collections" section in Settings > Collections > Sources
- Two collections available: "100 Highest-Grossing Films" and "100 Best-Selling Singles"
- Users can add examples with one click; shows "Added" indicator if already present

#### Track B: UX Consistency

**F-110: Keyboard Shortcuts Review**
- Created `src/config/keyboardShortcuts.ts` with centralised configuration
- Added vim-style navigation (j/k/h/l)
- Separated navigation shortcuts (single keys) from actions (Ctrl+X modifiers)
- Organised shortcuts by category

**F-111: Overlay Consistency Review**
- Created `src/hooks/useOverlay.ts` for consistent overlay behaviour
- Created `src/hooks/useFocusTrap.ts` for accessibility
- Ensures all overlays respond to Escape key consistently

#### Track C: Data & Caching

**F-113: Lazy Loading Visual Indicator**
- Created `src/components/CacheIndicator/` component
- Shows cache status with colour coding

**F-114: Remote Collection Update Checking**
- Created `src/services/updateChecker.ts` for GitHub API integration
- Created `src/hooks/useUpdateChecker.ts` hook
- Created `src/components/UpdateBadge/` component
- Blue dot indicator when remote source has updates

**F-115: Caching Policy Transparency**
- Created `src/hooks/useCacheState.ts` hook
- Simple indicators: Fresh (green), Stale (yellow), None (grey)
- Tooltips with human-readable cache age

### Phase 3: Visual Polish (Track D)

**F-037: Card Sorting (Expanded)**
- Added platform, category, and rating to sort field options
- Updated `src/utils/fieldPathResolver.ts` with new SORT_FIELD_OPTIONS
- Verified nested field path resolution works correctly

**F-041: Card Animation Polish**
- Created `src/config/animationPresets.ts` with spring physics presets
- Added staggered grid entrance animations
- Enhanced card flip with spring overshoot
- Added scale + shadow spring on hover
- Full `prefers-reduced-motion` support

**F-067: Statistics Dashboard**
- Expandable dashboard component
- CSS-only bar charts for distributions
- Platform and year/decade distribution views

---

## Bug Fixes

### Top Trumps iPad Layout
- **Issue:** Layout didn't fit iPad screens properly
- **Fix:** Added responsive breakpoint for 768px-1024px in `Competing.module.css`
- Reduced card container width and stat button sizes

### Redundant Rank Fields in Top Trumps
- **Issue:** Showed order, rank, AND myRank when data only has myRank
- **Fix:** Added `/^order$/i` and `/^rank$/i` to excluded patterns in `numericFields.ts`
- Specific variants like `myRank` still detected

### Example Collections Location
- **Issue:** Example collections weren't visible in Settings
- **Fix:** Added to correct component (`CollectionsTab/SourcesTab.tsx`) instead of deprecated `SourceSettingsTabs.tsx`

---

## Files Created

### Configuration
- `src/config/keyboardShortcuts.ts` - Centralised keyboard shortcut definitions
- `src/config/animationPresets.ts` - Spring physics and animation presets
- `src/config/devSources.ts` - Example collection references (updated)

### Components
- `src/components/CacheIndicator/` - Cache status indicator
- `src/components/UpdateBadge/` - Remote update notification

### Hooks
- `src/hooks/useOverlay.ts` - Consistent overlay behaviour
- `src/hooks/useFocusTrap.ts` - Accessibility focus management
- `src/hooks/useCacheState.ts` - Cache state management
- `src/hooks/useUpdateChecker.ts` - Remote update detection

### Services
- `src/services/updateChecker.ts` - GitHub API update checking

---

## Files Modified

### Components
- `src/components/LoadingScreen/LoadingScreen.tsx` - Added logo
- `src/components/SettingsPanel/CollectionsTab/SourcesTab.tsx` - Added example collections section
- `src/components/SettingsPanel/SettingsPanel.module.css` - Added example collection styles
- `src/components/Card/Card.tsx` - Spring animation on hover/tap
- `src/components/Card/CardInner.tsx` - Spring flip animation
- `src/components/CardGrid/CardGrid.tsx` - Staggered entrance animation

### Mechanics
- `src/mechanics/competing/Competing.module.css` - iPad responsive breakpoint
- `src/mechanics/competing/utils/numericFields.ts` - Excluded generic rank/order fields

### Utilities
- `src/utils/fieldPathResolver.ts` - Expanded sort field options

---

## Quality Metrics

| Metric | Value |
|--------|-------|
| Tests | 595 passing |
| TypeScript | No errors |
| Documentation Audit | 94/100 |
| PII Scan | Passed |

---

## Related Documentation

- [v0.15.0 Milestone](../../roadmap/milestones/v0.15.0.md)
- [v0.15.0 Retrospective](../../process/retrospectives/v0.15.0/README.md)
- [R-011 Button Component Strategy](../../research/R-011-button-component-strategy.md)
- [R-012 Caching UX Patterns](../../research/R-012-caching-ux-patterns.md)

---
