# v0.13.0 Revision: Ranking Guess Mechanic

## Overview

Transform the Snap Ranking mechanic from a tier-list style game (S/A/B/C/D/F) into a **field value guessing game** where players guess the value of a hidden field for each card.

## Key Insight: Dynamic Field-Based Guessing

The game uses **whatever field is configured as `topBadgeField`** in settings. This could be:

| topBadgeField | Example Values | Guess Type |
|---------------|----------------|------------|
| `myRank` | 1, 2, 3, 4, 5 | Numeric (distance scoring) |
| `year` | 1985, 1990, 1995, 2000 | Numeric (distance scoring) |
| `tier` | "S", "A", "B", "C" | Categorical (exact match only) |
| `platform` | "PC", "PS5", "Switch" | Categorical (exact match only) |
| `order` | (auto-generated) | **Not playable** |
| `none` | (disabled) | **Not playable** |

**The rating buttons are dynamically generated** from the unique values in the collection for that field.

---

## Game Flow

1. **Check playability** - Verify `topBadgeField` is set and not `"order"` or `"none"`
2. **Extract unique values** - Get all unique values for `topBadgeField` across cards
3. **Filter cards** - Only include cards that have a value for the badge field
4. **Cards start face-down** - player cannot see which card they're about to guess
5. **Click to flip** - reveal one random card at a time
6. **Guess the value** - select from the unique values extracted in step 2
7. **See result** - compare guess to actual value
8. **Scoring** - distance-based for numeric, exact-match for categorical
9. **Results screen** - total score, breakdown of guesses vs actual

---

## Key Requirements

### Determining Playability

```typescript
function canPlayGame(topBadgeField: string, cards: DisplayCard[]): {
  playable: boolean;
  reason?: string;
  uniqueValues?: Array<string | number>;
  valueType?: "numeric" | "categorical";
} {
  // Cannot play if no badge field configured
  if (!topBadgeField || topBadgeField === "none") {
    return { playable: false, reason: "No badge field configured. Set a Top Badge field in Settings." };
  }

  // Cannot play with auto-generated order field
  if (topBadgeField === "order") {
    return { playable: false, reason: "Cannot play with 'order' field. Choose a different Top Badge field." };
  }

  // Extract values from cards
  const values = cards
    .map(c => resolveFieldPath(c, topBadgeField))
    .filter(v => v !== undefined && v !== null && v !== "");

  if (values.length === 0) {
    return { playable: false, reason: `No cards have values for "${topBadgeField}".` };
  }

  // Get unique values
  const uniqueValues = [...new Set(values)].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });

  // Need at least 2 unique values for a meaningful game
  if (uniqueValues.length < 2) {
    return { playable: false, reason: "All cards have the same value. Need variety to play." };
  }

  // Determine value type
  const valueType = uniqueValues.every(v => typeof v === "number") ? "numeric" : "categorical";

  return { playable: true, uniqueValues, valueType };
}
```

### Dynamic Scoring

```typescript
interface ScoringConfig {
  exactMatch: number;
  offByOne?: number;   // Only for numeric
  offByTwo?: number;   // Only for numeric
  wrong: number;
}

const NUMERIC_SCORING: ScoringConfig = {
  exactMatch: 10,
  offByOne: 5,
  offByTwo: 2,
  wrong: 0,
};

const CATEGORICAL_SCORING: ScoringConfig = {
  exactMatch: 10,
  wrong: 0,
};

function calculateScore(
  guess: string | number,
  actual: string | number,
  valueType: "numeric" | "categorical",
  allValues: Array<string | number>
): number {
  if (guess === actual) {
    return valueType === "numeric" ? NUMERIC_SCORING.exactMatch : CATEGORICAL_SCORING.exactMatch;
  }

  if (valueType === "categorical") {
    return CATEGORICAL_SCORING.wrong;
  }

  // Numeric: calculate distance based on position in sorted values
  const guessIndex = allValues.indexOf(guess);
  const actualIndex = allValues.indexOf(actual);
  const distance = Math.abs(guessIndex - actualIndex);

  if (distance === 1) return NUMERIC_SCORING.offByOne!;
  if (distance === 2) return NUMERIC_SCORING.offByTwo!;
  return NUMERIC_SCORING.wrong;
}
```

### During Game

- **Hide badges** - temporarily disable `topBadgeField` display during game
- **Cards face-down by default** - each card shows back until player clicks to flip
- **One card at a time** - only the current card can be flipped
- **Dynamic buttons** - generate from unique values (max ~10-12 for usability)
- **Timer optional** - show elapsed time if enabled

---

## Updated State Interface

```typescript
interface SnapRankingState extends MechanicState {
  /** Whether the game is active */
  isActive: boolean;

  /** The field being guessed (from topBadgeField) */
  guessField: string;

  /** All unique values for the guess field */
  uniqueValues: Array<string | number>;

  /** Whether values are numeric (distance scoring) or categorical (exact match) */
  valueType: "numeric" | "categorical";

  /** All card IDs to guess (shuffled order) - only cards with the field */
  cardIds: string[];

  /** Mapping of card IDs to their actual values */
  cardValues: Record<string, string | number>;

  /** Current card index being guessed */
  currentIndex: number;

  /** Guesses made so far */
  guesses: CardGuess[];

  /** When the current card was shown (after flip) */
  cardShownAt: number;

  /** Game start time */
  gameStartedAt: number;

  /** Game end time (null if not finished) */
  gameEndedAt: number | null;

  /** Reset counter for re-shuffling */
  resetCount: number;

  /** Whether the current card has been flipped (revealed) */
  isCurrentCardFlipped: boolean;

  /** Error message if game cannot be played */
  errorMessage: string | null;
}

interface CardGuess {
  cardId: string;
  guess: string | number;
  actualValue: string | number;
  score: number;
  guessedAt: number;
  timeToGuess: number;
}
```

---

## Files to Modify

### 1. `src/mechanics/snap-ranking/types.ts`

**Complete rewrite:**
- Remove tier-based types
- Add dynamic value types
- Add scoring functions for both numeric and categorical

### 2. `src/mechanics/snap-ranking/store.ts`

**Complete rewrite:**

```typescript
interface SnapRankingStore extends SnapRankingState, SnapRankingSettings {
  // Lifecycle
  activate: () => void;
  deactivate: () => void;
  resetGame: () => void;
  initGame: (config: {
    guessField: string;
    cards: Array<{ id: string; value: string | number }>;
    valueType: "numeric" | "categorical";
    uniqueValues: Array<string | number>;
  }) => void;

  // Game actions
  flipCurrentCard: () => void;
  submitGuess: (guess: string | number) => void;
  getCurrentCardId: () => string | null;
  isGameComplete: () => boolean;
  getProgress: () => { current: number; total: number };

  // Results
  getTotalScore: () => number;
  getMaxPossibleScore: () => number;
  getScoreBreakdown: () => { exact: number; close: number; wrong: number };
  getAverageGuessTime: () => number;
  getTotalTime: () => number;

  // Settings
  setShowTimer: (value: boolean) => void;
}
```

### 3. `src/mechanics/snap-ranking/components.tsx`

**Complete rewrite of UI:**

#### GuessButtons (replaces RatingButtons)
- **Dynamic generation** from `uniqueValues`
- For numeric with many values: show slider or grouped buttons
- For categorical: show all options as buttons
- Keyboard shortcuts: numbers for first 10, letters for rest

```tsx
function GuessButtons() {
  const uniqueValues = useSnapRankingStore((s) => s.uniqueValues);
  const valueType = useSnapRankingStore((s) => s.valueType);
  const submitGuess = useSnapRankingStore((s) => s.submitGuess);
  const isFlipped = useSnapRankingStore((s) => s.isCurrentCardFlipped);

  if (!isFlipped) return null;

  // For many numeric values, consider grouping or slider
  if (valueType === "numeric" && uniqueValues.length > 10) {
    return <NumericSlider values={uniqueValues} onSelect={submitGuess} />;
  }

  return (
    <div className={styles.guessButtons}>
      {uniqueValues.map((value, i) => (
        <button
          key={String(value)}
          onClick={() => submitGuess(value)}
          className={styles.guessButton}
        >
          {String(value)}
          <span className={styles.shortcut}>
            {i < 9 ? i + 1 : i === 9 ? "0" : ""}
          </span>
        </button>
      ))}
    </div>
  );
}
```

#### ResultsModal
- Show field name: "Guessing: Year"
- Show score breakdown appropriate to value type
- For numeric: "5 exact, 3 close (±1), 2 wrong"
- For categorical: "5 correct, 5 wrong"

#### ErrorOverlay
- Show specific reason why game cannot be played
- Suggestions for how to fix

### 4. `src/mechanics/snap-ranking/SnapRanking.module.css`

**Update styles:**
- Flexible button layout (wrap for many values)
- Slider component styles (for many numeric values)
- Different styling for numeric vs categorical

### 5. `src/mechanics/snap-ranking/manifest.json`

**Update metadata:**

```json
{
  "id": "snap-ranking",
  "name": "Guess the Value",
  "version": "2.0.0",
  "description": "Test your knowledge! Cards appear face-down - flip and guess the value of the badge field. Works with any field: ranks, years, tiers, categories, and more.",
  "entrypoint": "./index.tsx",
  "minCards": 5,
  "author": {
    "name": "itemdeck",
    "url": "https://github.com/itemdeck"
  },
  "keywords": ["guessing", "memory", "quiz", "self-knowledge", "game"],
  "licence": "GPL-3.0"
}
```

### 6. `src/components/CardGrid/CardGrid.tsx`

**Modifications needed:**

#### a) Pass field config to initGame

```typescript
useEffect(() => {
  if (!mechanic || cards.length === 0) return;

  if (mechanic.manifest.id === "snap-ranking") {
    // Check if game is playable with current topBadgeField
    const playability = canPlayGame(topBadgeField, cards);

    const state = mechanic.getState() as unknown as {
      initGame?: (config: {
        guessField: string;
        cards: Array<{ id: string; value: string | number }>;
        valueType: "numeric" | "categorical";
        uniqueValues: Array<string | number>;
        errorMessage?: string;
      }) => void;
    };

    if (!playability.playable) {
      // Initialize with error state
      state.initGame?.({
        guessField: topBadgeField,
        cards: [],
        valueType: "categorical",
        uniqueValues: [],
        errorMessage: playability.reason,
      });
      return;
    }

    // Extract cards with values
    const cardsWithValues = cards
      .map(c => ({
        id: c.id,
        value: resolveFieldPath(c, topBadgeField) as string | number | undefined,
      }))
      .filter((c): c is { id: string; value: string | number } =>
        c.value !== undefined && c.value !== null && c.value !== ""
      );

    state.initGame?.({
      guessField: topBadgeField,
      cards: cardsWithValues,
      valueType: playability.valueType!,
      uniqueValues: playability.uniqueValues!,
    });
    return;
  }

  // Other mechanics...
}, [mechanic, cards, mechanicResetCount, topBadgeField]);
```

#### b) Hide badges during game

```typescript
const effectiveTopBadgeField = useMemo(() => {
  if (mechanic?.manifest.id === "snap-ranking" && mechanicState?.isActive) {
    return "none";
  }
  return topBadgeField;
}, [mechanic, mechanicState?.isActive, topBadgeField]);
```

#### c) Card flip state integration

Same as before - track which cards are flipped.

### 7. `src/components/Card/Card.tsx`

**Add prop for mechanic-controlled flip:**

```typescript
interface CardProps {
  // ... existing props
  mechanicFlipped?: boolean;
}
```

---

## Implementation Order

1. **Update types** (`types.ts`) - New dynamic value interfaces
2. **Update store** (`store.ts`) - New game logic with dynamic values
3. **Update components** (`components.tsx`) - Dynamic button generation
4. **Update styles** (`SnapRanking.module.css`) - Flexible layouts
5. **Update CardGrid** (`CardGrid.tsx`) - Pass field config
6. **Update Card** (`Card.tsx`) - Mechanic flip override
7. **Update manifest** (`manifest.json`) - New metadata
8. **Test** - Verify with different field types

---

## Testing Checklist

### Playability Checks
- [ ] Error shown when `topBadgeField` is `"none"`
- [ ] Error shown when `topBadgeField` is `"order"`
- [ ] Error shown when no cards have values for the field
- [ ] Error shown when all cards have the same value

### Numeric Fields (e.g., year, rank)
- [ ] Buttons show sorted unique values
- [ ] Distance-based scoring works (exact, ±1, ±2, wrong)
- [ ] Results show distance breakdown

### Categorical Fields (e.g., tier, platform)
- [ ] Buttons show all unique values
- [ ] Exact-match-only scoring works
- [ ] Results show correct/wrong breakdown

### Core Game Flow
- [ ] Cards start face-down
- [ ] Clicking current card flips it
- [ ] Guess buttons appear after flip
- [ ] Keyboard shortcuts work
- [ ] Score calculated correctly
- [ ] Progress updates correctly
- [ ] "Play Again" works
- [ ] Badges hidden during game
- [ ] Badges restored after game ends

---

## Edge Cases

1. **Many unique values (>10)** - Show slider or scrollable button list
2. **Mixed types in field** - Treat as categorical (strings)
3. **Only 2 unique values** - Game still works (binary choice)
4. **Field with special characters** - Display correctly in buttons
5. **Very long value strings** - Truncate in buttons with tooltip
6. **User changes topBadgeField during game** - Ignore, use original

---

## UI/UX Considerations

### Button Layout for Different Value Counts

| Count | Layout |
|-------|--------|
| 2-4 | Large buttons in a row |
| 5-8 | Medium buttons, 2 rows |
| 9-12 | Small buttons, 3-4 rows |
| 13+ | Scrollable list or slider |

### Feedback After Guess

Show immediate feedback:
- ✓ Correct! (green)
- ✗ Wrong - was [actual] (red)
- ~ Close! Was [actual] (yellow) - numeric only

---

## Related Documentation

- [Snap Ranking Store](../../../../src/mechanics/snap-ranking/store.ts)
- [Snap Ranking Types](../../../../src/mechanics/snap-ranking/types.ts)
- [CardGrid Component](../../../../src/components/CardGrid/CardGrid.tsx)
- [Settings Store](../../../../src/stores/settingsStore.ts) - `topBadgeField`
- [Field Path Resolver](../../../../src/utils/fieldPathResolver.ts)
