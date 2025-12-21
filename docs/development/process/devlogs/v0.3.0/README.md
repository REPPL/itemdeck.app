# v0.3.0 Customisation Development Log

## Overview

The v0.3.0 Customisation milestone implements user preferences, theming, and enhanced card interactions. This milestone builds on the solid foundation of v0.1.0 (Animation) and v0.2.0 (External Data) to deliver a fully customisable card deck experience.

## Implementation Narrative

### Phase 1: Technical Debt

Started by addressing technical debt to establish a clean baseline:

- **F-021: ESLint/TypeScript Fixes** - Fixed non-null assertion warnings in the shuffle utility by using proper type assertions
- **F-022: Test Coverage Reporting** - Configured @vitest/coverage-v8 with thresholds targeting 80% statements/lines

### Phase 2: Theme System (F-010)

Implemented a complete theme system with:

- Light, dark, and auto (system preference) modes
- Zustand store with localStorage persistence
- CSS custom properties for all theme colours
- ThemeToggle component with smooth transitions
- System preference detection via matchMedia

### Phase 3: Card Design Enhancements

Enhanced the card visual experience:

- **F-030: Glassmorphism Overlay** - Added backdrop blur effect to card front overlay
- **F-033: Card Elevation System** - Implemented dynamic shadows based on hover/active/dragging states
- **F-034: Card Badges** - Created flexible Badge component with solid/outline/subtle/dot variants
- **F-039: Responsive Typography** - Added fluid font scaling using CSS clamp()

### Phase 4: Card Interactions

Added new card interaction features:

- **F-027: Shuffle by Default** - Implemented Fisher-Yates shuffle algorithm with useShuffledCards hook
- **F-029: Card Info Button** - Added info icon that opens CardDetailModal without triggering flip

### Phase 5: Accessibility

Improved accessibility support:

- **F-023: Manual Refresh Button** - Added RefreshButton with TanStack Query integration
- **F-024: ARIA Live Regions** - Created StatusAnnouncer for screen reader announcements

### Phase 6: Settings & Persistence

Built the settings infrastructure:

- **F-011: Layout Presets** - Added grid/list/compact layout options
- **F-012: State Persistence** - Created Zustand stores with persist middleware
- **F-013: Settings Panel** - Built comprehensive settings UI with all preferences

## Challenges Encountered

### Multiple Button Elements in Card

When adding the info button to the card front, tests started failing because `getByRole("button")` found multiple elements. Resolved by updating test selectors to use more specific queries:

```typescript
const getCardElement = () =>
  screen.getByRole("button", { name: /showing (back|front)/ });
```

### TypeScript Type Extensions

Needed to extend DisplayCard interface to include `categoryTitle` for badge display:

```typescript
export interface DisplayCard extends Omit<CardWithCategory, "imageUrl"> {
  imageUrl: string;
  categoryTitle?: string; // Added for badge display
}
```

### Branch Merging

Work spanned multiple feature branches that needed to be consolidated. Used git merge to combine `feature/card-year-enhancement` into `feature/v0.3.0-customisation`.

## Code Highlights

### Zustand Store with Persistence

Created a clean pattern for persisted state:

```typescript
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "auto",
      setMode: (mode) => set({ mode, resolvedTheme: getInitialResolvedTheme(mode) }),
    }),
    {
      name: "itemdeck-theme",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
```

### Fisher-Yates Shuffle

Implemented proper in-place shuffle algorithm:

```typescript
export function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j] as T;
    array[j] = temp as T;
  }
  return array;
}
```

## Files Created/Modified

### New Components (17 files)
- `src/components/Badge/` - Badge component with variants
- `src/components/Modal/` - Reusable modal with focus trap
- `src/components/RefreshButton/` - Data refresh trigger
- `src/components/SettingsButton/` - Settings panel toggle
- `src/components/SettingsPanel/` - Comprehensive settings UI
- `src/components/StatusAnnouncer/` - ARIA live region wrapper
- `src/components/ThemeToggle/` - Theme mode switcher
- `src/components/Card/CardDetailModal.tsx` - Card detail view

### New Hooks (2 files)
- `src/hooks/useShuffledCards.ts` - Card shuffling hook
- `src/hooks/useTheme.ts` - Theme management hook

### New Stores (2 files)
- `src/stores/themeStore.ts` - Theme state management
- `src/stores/settingsStore.ts` - User preferences

### New Utilities (1 file)
- `src/utils/shuffle.ts` - Shuffle algorithms

### New Styles (1 file)
- `src/styles/theme.css` - Theme CSS variables

## Test Results

All 211 tests passing with the following coverage:

- Statements: 48%+
- Branches: 45%+
- Functions: 49%+
- Lines: 49%+

---

## Related Documentation

- [v0.3.0 Milestone](../../../roadmap/milestones/v0.3.0.md)
- [v0.3.0 Retrospective](../../retrospectives/v0.3.0/README.md)
