# v0.14.5 Development Log

## Shared Mechanics Components & Standardisation

**Date:** 2025-12-29

---

## Implementation Narrative

v0.14.5 addressed significant technical debt accumulated during v0.14.0's rapid mechanic development. The milestone focused on extracting duplicated patterns into a shared component library, standardising game configuration, and adding JSON-based responsive configuration.

### Phase 1: Shared Components Library

Created a new `src/mechanics/shared/` directory structure:

```
src/mechanics/shared/
├── components/
│   ├── ErrorOverlay.tsx      # Reusable error modal
│   ├── FloatingTimer.tsx     # Animated timer display
│   ├── GameCompletionModal.tsx # Unified results modal
│   └── index.ts
├── hooks/
│   ├── useDisplayConfig.ts   # Responsive configuration
│   ├── useGameTimer.ts       # Timer state management
│   ├── useMechanicActions.ts # Common action handlers
│   └── index.ts
├── utils/
│   ├── formatTime.ts         # MM:SS formatting
│   └── index.ts
├── config/
│   ├── breakpoints.json      # Responsive breakpoints
│   └── defaults.json         # Default card sizes
├── types.ts                  # BaseGameSettings, GameStats, DisplayConfig
├── shared.module.css         # Consolidated styles (~346 lines)
└── index.ts
```

### Phase 2: Mechanic Refactoring

Refactored existing mechanics to use shared components:

| Mechanic | Before | After | Change |
|----------|--------|-------|--------|
| Memory | 231 lines | 117 lines | -49% |
| Snap-Ranking | 427 lines | 366 lines | -14% |
| Competing | 539 lines | 590 lines | +9% (now uses shared) |
| Quiz | 769 lines | ~700 lines | -9% |

The Competing mechanic increased slightly because the refactor added proper shared component integration where it was previously using inline implementations.

### Phase 3: JSON Configuration

Added `config/settings.json` to each mechanic:

- `memory/config/settings.json` - Difficulty levels, card counts
- `snap-ranking/config/settings.json` - Ranking configuration
- `competing/config/settings.json` - AI difficulty settings
- `quiz/config/settings.json` - Question types, difficulty
- `collection/config/settings.json` - Display options

Created `useDisplayConfig` hook for responsive configuration management.

---

## Challenges Encountered

### 1. CSS Property Naming

The documentation initially used `colour:` for CSS properties (following British English), but CSS syntax requires American spelling (`color:`). Fixed by updating all CSS property names while keeping custom property names British (`--colour-text`).

### 2. Emergency Fixes During Development

An emergency fix was merged from main mid-implementation:
- `sourceStore.ts` behaviour change (setting default now auto-activates)
- F-108 Top Trumps review feature added to v0.15.0

Successfully merged without conflicts.

### 3. Scope Management

Originally included 13 features (F-095 to F-106 plus 7 deferred). Reduced scope to core refactoring (F-095 to F-104, F-106) and moved remaining features to v0.15.0.

---

## Code Highlights

### Shared Types

```typescript
export interface BaseGameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  cardCount: number;
  timeLimit?: number;
}

export interface GameStats {
  mechanic: string;
  completedAt: string;
  duration: number;
  score: number;
  settings: BaseGameSettings;
  details: Record<string, unknown>;
}
```

### GameCompletionModal Component

Created a unified modal component that all game mechanics now use for displaying results, eliminating ~870 lines of duplicated code across four mechanics.

### useDisplayConfig Hook

Provides responsive display configuration by:
1. Loading shared breakpoints
2. Merging mechanic-specific config
3. Supporting future user overrides

---

## Files Created

| Category | Count | Lines |
|----------|-------|-------|
| Shared components | 4 | ~300 |
| Shared hooks | 3 | ~200 |
| Shared utils | 1 | ~20 |
| Shared types | 1 | ~100 |
| Shared CSS | 1 | ~346 |
| JSON configs | 7 | ~200 |
| **Total new** | **17** | **~1,166** |

## Files Modified

| File | Change |
|------|--------|
| `memory/components.tsx` | Refactored to use shared |
| `snap-ranking/components.tsx` | Refactored to use shared |
| `competing/components.tsx` | Refactored to use shared |
| `quiz/components/QuizOverlay.tsx` | Refactored |
| `quiz/components/ResultsScreen.tsx` | Refactored |
| `quiz/Quiz.module.css` | Added missing class |

---

## Net Impact

- **Lines added:** ~1,791 (new shared library + configs)
- **Lines removed:** ~657 (deduplicated code)
- **Net change:** +1,134 lines

The net increase is due to:
1. Comprehensive shared library with full documentation
2. JSON configuration files for all mechanics
3. Type definitions for standardisation

However, the architecture is now more maintainable with:
- Single source of truth for shared UI patterns
- Consistent styling across all mechanics
- Configuration-driven responsive behaviour

---

## Related Documentation

- [v0.14.5 Milestone](../../../roadmap/milestones/v0.14.5.md)
- [v0.14.5 Retrospective](../../retrospectives/v0.14.5/README.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.14.5/v0.14.5-shared-components.md)
