# v0.14.0 Devlog

## Overview

| Metric | Value |
|--------|-------|
| **Version** | v0.14.0 |
| **Theme** | Advanced Mechanics (Plugin-Based) |
| **Features** | 7 completed |
| **New Files** | ~40 |
| **Modified Files** | ~15 |
| **Tests** | 595 passing |

---

## Implementation Narrative

v0.14.0 represents the first major validation of the plugin architecture introduced in v0.13.0. This milestone implemented three new game mechanics (Competing, Quiz, Collection) plus significant UI improvements including the settings draft state pattern.

### Parallel Work Package Approach

The milestone was structured as four independent work packages that could be implemented in parallel:

1. **WP-A: Settings Draft State + UI Polish** - Store architecture changes
2. **WP-B: Competing Mechanic** - Top Trumps-style card battle game
3. **WP-C: Quiz Mechanic** - Knowledge testing with auto-generated questions
4. **WP-D: Collection Mechanic** - Ownership tracking with persistence

All four packages were executed simultaneously by separate agents, demonstrating the effectiveness of the parallel work package pattern established in v0.13.0.

---

## Features Implemented

### WP-A: Settings Draft State + UI Polish

**F-090: Settings Draft State Pattern**

Implemented a draft/commit pattern for settings:
- `startEditing()` creates a draft copy when settings panel opens
- `updateDraft()` modifies only the draft state
- `commitDraft()` applies changes on "Accept"
- `discardDraft()` reverts on "Cancel"
- `getEffective()` returns draft while editing, committed otherwise

Key design decision: Dark Mode and High Contrast apply immediately (accessibility requirement).

**F-092: Cache Consent Dialogue UX**

Improved clarity for non-expert users:
- Updated text: "Cached data is stored only in this browser on this device"
- Restructured buttons: Primary "Allow" + outline "Not now"

**F-093: Mechanic Panel Fix**

Fixed duplicate display - active mechanic no longer appears in alternatives list.

**F-094: Button Style Consistency Audit**

Standardised button hierarchy across all modals:
- Primary (filled) - Main action
- Secondary (outline) - Alternative action
- Tertiary (text) - Low-emphasis action

### WP-B: Competing Mechanic (Top Trumps)

Full card-vs-card stat comparison game:

**Core Features:**
- Automatic numeric field detection
- Card dealing and deck management
- Battle overlay with player vs CPU cards
- Stat selection with visual feedback
- Win/lose animations

**AI Opponent (3 levels):**
- Simple: Random stat selection
- Medium: Selects highest stat
- Hard: Pattern tracking

**Game Completion:**
- Final score display
- Play again functionality
- Different game option

### WP-C: Quiz Mechanic

Knowledge testing mechanic with auto-generated questions:

**Question Types:**
- Image-to-Name: Show image, guess the title
- Name-to-Image: Show title, pick correct image
- Fill-the-Blank: Complete a fact about the card

**Features:**
- Plausible wrong answers from same collection
- Score tracking with streaks
- Timer mode (optional)
- Best score comparison
- Configurable question count and types

### WP-D: Collection Mechanic

Persistent ownership tracking:

**Core Features:**
- Mark cards as owned or wishlisted
- Progress bar showing completion percentage
- Per-source isolation (each collection tracked separately)
- localStorage persistence

**Export/Import:**
- JSON export with merge/replace options
- Collection state portable between browsers

**Keyboard Shortcuts:**
- `O` - Toggle owned
- `W` - Toggle wishlist

---

## Technical Highlights

### Settings Draft State Architecture

```typescript
interface SettingsStore {
  // Committed state (persisted)
  committed: SettingsState;

  // Draft state (temporary)
  _draft: DraftSettings | null;
  isDirty: boolean;

  // Draft lifecycle
  startEditing: () => void;
  updateDraft: (partial: Partial<DraftSettings>) => void;
  commitDraft: () => void;
  discardDraft: () => void;

  // Effective value selector
  getEffective: <K extends DraftableSettingsKeys>(key: K) => SettingsState[K];
}
```

### Mechanic Plugin Pattern

Each mechanic follows the established pattern:
```
mechanic/
├── manifest.json         # Plugin metadata
├── index.tsx             # Factory function
├── store.ts              # Zustand state
├── types.ts              # TypeScript types
├── components/           # UI components
├── Settings.tsx          # Configuration panel
└── *.module.css          # Scoped styles
```

### Question Generation Strategy

Quiz mechanic generates plausible wrong answers by:
1. Selecting cards from same collection
2. Filtering out the correct answer
3. Shuffling and taking N-1 options
4. Randomising answer positions

---

## Files Created

### New Mechanics

**Collection Mechanic:**
- `src/mechanics/collection/index.tsx`
- `src/mechanics/collection/store.ts`
- `src/mechanics/collection/types.ts`
- `src/mechanics/collection/Settings.tsx`
- `src/mechanics/collection/manifest.json`
- `src/mechanics/collection/collection.module.css`
- `src/mechanics/collection/components/CollectionCardOverlay.tsx`
- `src/mechanics/collection/components/CollectionGridOverlay.tsx`
- `src/mechanics/collection/components/CollectionExport.tsx`

**Competing Mechanic:**
- `src/mechanics/competing/index.tsx`
- `src/mechanics/competing/store.ts`
- `src/mechanics/competing/types.ts`
- `src/mechanics/competing/Settings.tsx`
- `src/mechanics/competing/manifest.json`
- `src/mechanics/competing/Competing.module.css`
- `src/mechanics/competing/components.tsx`
- `src/mechanics/competing/ai/simple.ts`
- `src/mechanics/competing/ai/medium.ts`
- `src/mechanics/competing/ai/hard.ts`
- `src/mechanics/competing/utils/numericFields.ts`

**Quiz Mechanic:**
- `src/mechanics/quiz/index.tsx`
- `src/mechanics/quiz/store.ts`
- `src/mechanics/quiz/types.ts`
- `src/mechanics/quiz/Settings.tsx`
- `src/mechanics/quiz/manifest.json`
- `src/mechanics/quiz/Quiz.module.css`
- `src/mechanics/quiz/generators/imageToName.ts`
- `src/mechanics/quiz/generators/nameToImage.ts`
- `src/mechanics/quiz/generators/fillTheBlank.ts`
- `src/mechanics/quiz/components/QuizOverlay.tsx`
- `src/mechanics/quiz/components/QuestionDisplay.tsx`
- `src/mechanics/quiz/components/AnswerOptions.tsx`
- `src/mechanics/quiz/components/FeedbackOverlay.tsx`
- `src/mechanics/quiz/components/ResultsScreen.tsx`
- `src/mechanics/quiz/components/ProgressIndicator.tsx`

### Tests

- `tests/stores/settingsStore.draft.test.ts`
- `tests/mechanics/collection/store.test.ts`
- `tests/mechanics/collection/components.test.tsx`
- `tests/mechanics/collection/types.test.ts`
- `tests/mechanics/competing/store.test.ts`
- `tests/mechanics/competing/ai.test.ts`

---

## Files Modified

- `src/stores/settingsStore.ts` - Draft state management
- `src/components/SettingsPanel/SettingsPanel.tsx` - Accept/Cancel workflow
- `src/components/SettingsPanel/QuickSettings.tsx` - Draft updates
- `src/components/SettingsPanel/SystemSettings.tsx` - Draft updates
- `src/components/CacheConsentDialog/CacheConsentDialog.tsx` - UX improvements
- `src/components/MechanicPanel/MechanicPanel.tsx` - Hide active from list
- `src/mechanics/index.ts` - Register new mechanics
- `src/mechanics/memory/components.tsx` - Remove unused variable
- `src/mechanics/snap-ranking/components.tsx` - Remove unused variables

---

## Challenges Encountered

### Draft State Complexity

The settings draft state pattern required careful handling of:
- Which settings to include (excluding accessibility)
- Dirty state calculation
- Preview vs committed value resolution

**Solution:** Used `getEffective()` selector pattern that returns draft value while editing, committed otherwise.

### Question Generator Edge Cases

Quiz mechanic needed to handle:
- Collections with too few cards for wrong answers
- Missing image fields
- Empty or null values

**Solution:** Added minimum card checks and graceful fallbacks.

### AI Difficulty Balancing

Competing mechanic AI needed to be:
- Challenging but fair
- Predictable at easy levels
- Pattern-aware at hard level

**Solution:** Three distinct AI strategies with clear behavioural differences.

---

## Test Coverage

| Component | Tests |
|-----------|-------|
| Settings Draft State | 18 |
| Collection Store | 21 |
| Collection Components | 8 |
| Collection Types | 14 |
| Competing Store | 28 |
| Competing AI | 18 |
| **Total New** | **107** |
| **Total Suite** | **595** |

---

## Post-Implementation Polish

### Top Trumps Refinements (REV-010, REV-011)

**Card Position Stability:**
- Fixed issue where card layout shifted on stat selection
- Added min-height to stat buttons and hidden stats
- Ensured consistent card dimensions throughout gameplay

**CPU Card Back Display (Hard Mode):**
- Added `shouldShowCpuCardBack()` function
- Created `CardBackLogo` SVG component for card back
- CPU cards now show back during player's turn in Hard difficulty
- Cards flip to reveal values when battle begins
- Easy/Medium difficulties show CPU card front throughout

**Duplicate Overlay Fix:**
- Fixed bug where "You Win" overlay appeared twice
- Root cause: overlay shown during `reveal`, `collecting`, AND `round_end` phases
- Solution: restricted to `round_end` phase only
- Added `animation-fill-mode: forwards` to prevent animation replay
- Added `min-width: 280px` to prevent size changes when hint appears

**Mobile Responsive Layouts:**
- Added side-by-side layout for battle cards on small screens
- Card image reduced to 35% width on mobile
- Title hidden on mobile for space efficiency
- Stats list expands to fill remaining space

### Quiz Refinements (REV-011)

**Similar Distractors for Expert/Extreme:**
- Added `calculateSimilarity()` function in quiz generators
- Scores similarity based on: category (40pts), year proximity (up to 30pts), shared fields (10pts each)
- `useSimilarDistractors` option added to difficulty settings
- Expert and Extreme difficulties now select wrong answers from most similar cards
- Makes higher difficulties genuinely more challenging

### Collection Component Fix

**showUnownedBadge Setting:**
- Fixed `CollectionCardOverlay` to respect `showUnownedBadge` setting
- When disabled, heart button hidden for unowned cards
- Updated tests to match actual component title attributes
- All 7 affected tests now passing

### New Feature Specification

**F-102: Mechanic Display Preferences (v0.14.5)**
- Documented hybrid approach for mechanic-specific display settings
- `MechanicDisplayPreferences` interface for card size, aspect ratio, UI mode
- Optional per-mechanic settings.json and theme.json files
- Applied on mechanic activation, restored on deactivation

---

## Related Documentation

- [v0.14.0 Milestone](../../roadmap/milestones/v0.14.0.md)
- [v0.14.0 Retrospective](../../retrospectives/v0.14.0/README.md)
- [F-058 Collection Mechanic](../../roadmap/features/completed/F-058-collection-mechanic.md)
- [F-059 Competing Mechanic](../../roadmap/features/completed/F-059-competing-mechanic.md)
- [F-060 Quiz Mechanic](../../roadmap/features/completed/F-060-quiz-mechanic.md)
- [F-090 Settings Draft State](../../roadmap/features/completed/F-090-settings-draft-state.md)
- [F-102 Mechanic Display Preferences](../../roadmap/features/planned/F-102-mechanic-display-preferences.md)
- [Implementation Prompts](../../../prompts/implementation/v0.14.0/)
