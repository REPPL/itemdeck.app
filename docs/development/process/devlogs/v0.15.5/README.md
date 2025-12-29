# v0.15.5 Devlog

## Overview

| Metric | Value |
|--------|-------|
| **Version** | v0.15.5 |
| **Theme** | Infrastructure, Accessibility & Documentation |
| **Features** | 7 completed |
| **New Files** | ~55 |
| **Modified Files** | ~24 |
| **Tests** | 722 passing |

---

## Implementation Narrative

v0.15.5 focuses on infrastructure improvements, accessibility compliance, and comprehensive user documentation. This milestone establishes the foundation for quality assurance with automated accessibility testing and visual component documentation.

### Parallel Track Approach

The milestone was structured as four independent tracks that could be implemented in parallel:

1. **Track A: Testing Infrastructure** - Playwright E2E tests and Storybook
2. **Track B: Export/Import** - Settings and theme portability
3. **Track C: Display Preferences** - Mechanic-specific display settings
4. **Track D: User Documentation** - Comprehensive user-facing docs

All four tracks were executed simultaneously by separate agents, demonstrating the effectiveness of the parallel work package pattern.

---

## Features Implemented

### Track A: Accessibility Audit (F-019)

**WCAG 2.2 AA Compliance Testing:**

Implemented comprehensive E2E accessibility testing with Playwright and axe-core:

- `accessibility-audit.spec.ts` - Full WCAG 2.2 AA audits on all pages
- `keyboard-navigation.spec.ts` - Tab order, arrow keys, Enter/Space, Escape
- `screen-reader.spec.ts` - ARIA live regions, labels, roles
- `colour-contrast.spec.ts` - Theme contrast verification
- `reduced-motion.spec.ts` - prefers-reduced-motion compliance

**Accessibility Fixes Applied:**
- Fixed `aria-required-children` violation in CardGrid by moving LoadingSkeleton outside grid role
- Fixed devBadge contrast ratio in CollectionPicker (changed from `var(--colour-warning)` to `#92400e`)

**Dev-Only Component:**
- Created `AccessibilityChecklist` for manual verification during development
- Categorised checklists for keyboard, screen reader, visual, and touch accessibility
- Progress tracking with localStorage persistence

### Track A: Component Storybook (F-026)

**Storybook 10 Configuration:**

- Configured `.storybook/main.ts` with React Vite builder
- Added `@storybook/addon-a11y` for accessibility checks
- Added `@storybook/addon-interactions` for interactive testing
- Created `decorators.tsx` with provider wrappers

**Component Stories Created (12 total):**

1. `Card.stories.tsx` - Default, flipped, loading states
2. `CardGrid.stories.tsx` - Grid layouts with various card counts
3. `CardExpanded.stories.tsx` - Modal expanded card view
4. `ImageWithFallback.stories.tsx` - Image loading states
5. `LazyImage.stories.tsx` - Lazy loaded images
6. `LoadingSkeleton.stories.tsx` - Skeleton variations
7. `LoadingScreen.stories.tsx` - Full-page loading
8. `Modal.stories.tsx` - Modal states and sizes
9. `ConfirmDialog.stories.tsx` - Confirmation dialog variants
10. `Toast.stories.tsx` - Toast notification types
11. `Sidebar.stories.tsx` - Navigation sidebar
12. `NavigationHub.stories.tsx` - Central navigation component

### Track B: Settings Export/Import (F-081)

**Schema and Utilities:**
- Created `settingsExport.schema.ts` with Zod validation
- Schema version: 26 (matching current settings structure)
- Export includes version metadata and timestamp

**Import Modes:**
- **Merge Mode:** Preserves existing settings, only updates values from file
- **Replace Mode:** Resets to defaults first, then applies imported settings

**UI Updates:**
- Added segmented control for import mode selection
- Replaced alert() with Toast notifications
- Added proper error handling with user-friendly messages

### Track B: Theme Export/Import (F-082)

**Smart Export:**
- Only exports customisations (overrides), not defaults
- Reduces file size and improves portability
- Includes base theme reference

**Import Features:**
- Option to switch base theme on import
- Zod validation with hex colour format checking
- Toast feedback for success/failure

### Track B: Auto-Discovery Enhancement (F-091)

**Rate Limit Handling:**
- Added `parseRateLimitHeaders()` function
- Tracks `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers
- Skips API calls when rate limited
- Console warning when rate limit reached
- 36 new tests for rate limit functionality

### Track C: Mechanic Display Preferences (F-102)

**Core Infrastructure:**
- Added `MechanicDisplayPreferences` interface to `src/mechanics/types.ts`
- Extended `MechanicManifest` with optional `displayPreferences`
- Added `_mechanicOverridesBackup` state to settingsStore

**Settings Store Actions:**
- `applyMechanicOverrides()` - Backs up current settings and applies mechanic preferences
- `restoreMechanicOverrides()` - Restores backed up settings

**Lifecycle Integration:**
- Updated `MechanicContext.activateMechanic()` to apply preferences
- Updated `MechanicContext.deactivateMechanic()` to restore
- Added `beforeunload` handler for page refresh resilience

**Mechanic Preferences:**
- Competing: `{ cardSizePreset: "small", hideCardGrid: true, uiMode: "fullscreen" }`
- Quiz: `{ cardSizePreset: "medium", uiMode: "overlay" }`
- Memory: `{ cardSizePreset: "medium", hideCardGrid: true }`
- Snap-Ranking: `{ cardSizePreset: "small", uiMode: "inline" }`

### Track D: User Documentation (F-073)

**Tutorials (3 new):**
- `playing-memory-game.md` - Step-by-step memory game guide
- `customising-themes.md` - Theme customisation walkthrough
- `first-collection.md` - Getting started with collections

**Guides (6 new):**
- `view-modes.md` - Grid, list, and detail view modes
- `edit-mode.md` - Card editing functionality
- `exporting-data.md` - Data export options
- `adding-remote-source.md` - Adding GitHub sources
- `creating-collection.md` - Collection creation process
- `accessibility-options.md` - Accessibility features guide

**Explanation (3 new):**
- `mechanics-system.md` - How mechanics work
- `theme-architecture.md` - Theme system architecture
- `data-sources.md` - Data source concepts

**Reference (2 new):**
- `settings.md` - Complete settings reference
- `keyboard-shortcuts-reference.md` - All keyboard shortcuts

---

## Technical Highlights

### Playwright Configuration

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Storybook Decorators

```typescript
export const withProviders = (Story: React.FC) => (
  <QueryClientProvider client={queryClient}>
    <Story />
  </QueryClientProvider>
);

export const withMotion = (Story: React.FC) => (
  <MotionConfig reducedMotion="user">
    <Story />
  </MotionConfig>
);
```

### Settings Export Schema

```typescript
export const SettingsExportSchema = z.object({
  exportVersion: z.number(),
  exportedAt: z.string().datetime(),
  appVersion: z.string().optional(),
  settings: SettingsPayloadSchema,
});
```

---

## Files Created

### E2E Tests
- `playwright.config.ts`
- `e2e/accessibility-audit.spec.ts`
- `e2e/keyboard-navigation.spec.ts`
- `e2e/screen-reader.spec.ts`
- `e2e/colour-contrast.spec.ts`
- `e2e/reduced-motion.spec.ts`

### Storybook
- `.storybook/main.ts`
- `.storybook/preview.ts`
- `.storybook/decorators.tsx`
- `src/components/*/[ComponentName].stories.tsx` (12 files)

### Components
- `src/components/AccessibilityChecklist/AccessibilityChecklist.tsx`
- `src/components/AccessibilityChecklist/AccessibilityChecklist.module.css`
- `src/components/AccessibilityChecklist/index.ts`

### Schemas & Utilities
- `src/schemas/settingsExport.schema.ts`
- `src/schemas/themeExport.schema.ts`
- `src/utils/settingsExport.ts`
- `src/utils/themeExport.ts`

### Tests
- `tests/schemas/settingsExport.test.ts`
- `tests/schemas/themeExport.test.ts`
- `tests/utils/settingsExport.test.ts`
- `tests/utils/themeExport.test.ts`
- `tests/loaders/githubDiscovery.test.ts`

### Documentation
- `docs/tutorials/*.md` (3 files)
- `docs/guides/*.md` (6 files)
- `docs/explanation/*.md` (3 files)
- `docs/reference/*.md` (2 files)

---

## Files Modified

- `package.json` - Added Playwright, Storybook dependencies
- `src/stores/settingsStore.ts` - Mechanic override actions
- `src/mechanics/types.ts` - MechanicDisplayPreferences interface
- `src/mechanics/context.tsx` - Lifecycle hooks
- `src/mechanics/*/index.tsx` - Display preferences (4 files)
- `src/loaders/githubDiscovery.ts` - Rate limit handling
- `src/components/CardGrid/CardGrid.tsx` - Accessibility fix
- `src/components/CollectionPicker/CollectionPicker.module.css` - Contrast fix
- `src/components/SettingsPanel/DataTab/SettingsTab.tsx` - Export/import UI
- `src/components/SettingsPanel/DataTab/ThemesTab.tsx` - Export/import UI
- Documentation index files (4 files)

---

## Challenges Encountered

### ESLint Strict Mode Compliance

The new files required several ESLint fixes:
- Conditional React hooks (moved hooks before early returns)
- Void expression returns (added braces to arrow functions)
- Template literal types (used String() for number interpolation)
- CSS module undefined values (added nullish coalescing)

**Solution:** Applied consistent patterns matching existing codebase standards.

### Storybook Component Isolation

Some components required complex provider setup:
- QueryClientProvider for data-dependent components
- MotionConfig for animation controls
- Mock data for card components

**Solution:** Created reusable decorators in `.storybook/decorators.tsx`.

### Rate Limit State Management

GitHub API rate limiting needed careful handling:
- State persistence across requests
- Reset timestamp tracking
- Clear error messaging

**Solution:** Added module-level state with automatic expiry based on reset timestamp.

---

## Test Coverage

| Component | Tests |
|-----------|-------|
| Settings Export Schema | 20 |
| Theme Export Schema | 25 |
| Settings Export Utils | 23 |
| Theme Export Utils | 23 |
| GitHub Discovery (Rate Limits) | 36 |
| **Total New** | **127** |
| **Total Suite** | **722** |

---

## Documentation Audit Results

**Overall Score: 94/100**

| Standard | Result |
|----------|--------|
| Single Source of Truth | PASS |
| Directory Naming | PASS |
| Complete Coverage | PASS |
| Cross-References | PASS |
| British English | PASS |

---

## Related Documentation

- [v0.15.5 Retrospective](../../retrospectives/v0.15.5/README.md)
- [F-019 Accessibility Audit](../../roadmap/features/completed/F-019-accessibility-audit.md)
- [F-026 Component Storybook](../../roadmap/features/completed/F-026-component-storybook.md)
- [F-073 User Documentation](../../roadmap/features/completed/F-073-user-documentation.md)
- [F-081 Settings Export](../../roadmap/features/completed/F-081-settings-export.md)
- [F-082 Theme Export](../../roadmap/features/completed/F-082-theme-export.md)
- [F-091 Entity Auto-Discovery](../../roadmap/features/completed/F-091-entity-auto-discovery.md)
- [F-102 Display Preferences](../../roadmap/features/completed/F-102-display-preferences.md)
