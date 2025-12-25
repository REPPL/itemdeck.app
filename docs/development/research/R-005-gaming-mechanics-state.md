# R-005: Gaming Mechanics State Patterns

## Executive Summary

For Itemdeck's gaming mechanics plugin system, use **isolated Zustand stores per mechanic** with a **finite state machine pattern** for game flow. Each mechanic manages its own state independently, with the core application only tracking which mechanic is active. This provides clean separation, easy testing, and prevents state conflicts.

Key recommendations:
1. One Zustand store per mechanic (memory, collection, competing, quiz, snap ranking)
2. Use state machine pattern for game flow (idle → playing → paused → ended)
3. Persist game progress to localStorage (optional per mechanic)
4. Centralised mechanic registry manages activation/deactivation
5. Mechanics provide read-only view of card data

## Current State in Itemdeck

Itemdeck currently uses:
- **Zustand settingsStore** for user preferences (30+ settings, version 10)
- **TanStack Query** for collection data fetching
- **CardGrid flippedCards** state for which cards are face-up
- **No gaming logic** - purely a viewer application

Adding mechanics requires careful state design to avoid conflicts with existing flip behaviour.

## Research Findings

### State Machine Libraries Comparison

| Library | Bundle Size | TypeScript | React Integration | Use Case |
|---------|-------------|------------|-------------------|----------|
| **XState** | 20KB | Excellent | @xstate/react | Complex flows |
| **Zustand** | 2KB | Excellent | Built-in | Simple to medium |
| **Custom Reducer** | 0KB | Good | useReducer | Simple flows |
| **Robot** | 3KB | Good | Manual | Lightweight FSM |

### State Machine Pattern (Without Library)

For gaming mechanics, a simple state machine without a library:

```typescript
// src/mechanics/types/stateMachine.ts

export type GamePhase = 'idle' | 'ready' | 'playing' | 'paused' | 'ended';

export interface GameStateBase {
  phase: GamePhase;
  score: number;
  startedAt: number | null;
  endedAt: number | null;
}

export type GameTransition =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'END'; reason: 'completed' | 'quit' | 'timeout' }
  | { type: 'RESET' };

export function createGameStateMachine<TState extends GameStateBase>(
  initialState: TState,
  reducer: (state: TState, transition: GameTransition) => TState
) {
  return {
    initialState,
    transition: (state: TState, action: GameTransition): TState => {
      // Common phase transitions
      const baseTransition = handleBaseTransition(state, action);
      if (baseTransition !== state) return baseTransition as TState;

      // Mechanic-specific transitions
      return reducer(state, action);
    },
  };
}

function handleBaseTransition<T extends GameStateBase>(
  state: T,
  action: GameTransition
): T {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'idle' && state.phase !== 'ready') return state;
      return { ...state, phase: 'playing', startedAt: Date.now() };

    case 'PAUSE':
      if (state.phase !== 'playing') return state;
      return { ...state, phase: 'paused' };

    case 'RESUME':
      if (state.phase !== 'paused') return state;
      return { ...state, phase: 'playing' };

    case 'END':
      return { ...state, phase: 'ended', endedAt: Date.now() };

    case 'RESET':
      return { ...state, phase: 'idle', score: 0, startedAt: null, endedAt: null };

    default:
      return state;
  }
}
```

### Memory Game State Pattern

```typescript
// src/mechanics/memory/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GamePhase } from '../types/stateMachine';

interface MemoryGameState {
  // Game phase
  phase: GamePhase;

  // Current state
  flippedCardIds: string[];  // Currently flipped (max 2)
  matchedCardIds: Set<string>;  // Successfully matched
  attempts: number;
  score: number;

  // Timing
  startedAt: number | null;
  endedAt: number | null;
  lastMatchTime: number | null;

  // Settings
  pairCount: number;  // How many pairs to match (subset of collection)

  // Actions
  flipCard: (cardId: string) => void;
  checkMatch: () => Promise<boolean>;  // Returns true if match
  start: (cardIds: string[]) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export const useMemoryStore = create<MemoryGameState>()(
  persist(
    (set, get) => ({
      // Initial state
      phase: 'idle',
      flippedCardIds: [],
      matchedCardIds: new Set(),
      attempts: 0,
      score: 0,
      startedAt: null,
      endedAt: null,
      lastMatchTime: null,
      pairCount: 6,

      flipCard: (cardId) => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.matchedCardIds.has(cardId)) return;
        if (state.flippedCardIds.includes(cardId)) return;
        if (state.flippedCardIds.length >= 2) return;

        set({ flippedCardIds: [...state.flippedCardIds, cardId] });
      },

      checkMatch: async () => {
        const state = get();
        if (state.flippedCardIds.length !== 2) return false;

        const [card1, card2] = state.flippedCardIds;

        // Check if cards match (implement matching logic)
        const isMatch = checkCardsMatch(card1, card2);

        if (isMatch) {
          const newMatched = new Set(state.matchedCardIds);
          newMatched.add(card1);
          newMatched.add(card2);

          const newScore = state.score + calculateMatchScore(state);

          set({
            matchedCardIds: newMatched,
            flippedCardIds: [],
            attempts: state.attempts + 1,
            score: newScore,
            lastMatchTime: Date.now(),
          });

          // Check win condition
          if (newMatched.size >= state.pairCount * 2) {
            set({ phase: 'ended', endedAt: Date.now() });
          }

          return true;
        } else {
          // Wait briefly then flip back
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({
            flippedCardIds: [],
            attempts: state.attempts + 1,
          });
          return false;
        }
      },

      start: (cardIds) => {
        set({
          phase: 'playing',
          flippedCardIds: [],
          matchedCardIds: new Set(),
          attempts: 0,
          score: 0,
          startedAt: Date.now(),
          endedAt: null,
          // Shuffle and select pairs
          // ...
        });
      },

      pause: () => {
        if (get().phase === 'playing') {
          set({ phase: 'paused' });
        }
      },

      resume: () => {
        if (get().phase === 'paused') {
          set({ phase: 'playing' });
        }
      },

      reset: () => {
        set({
          phase: 'idle',
          flippedCardIds: [],
          matchedCardIds: new Set(),
          attempts: 0,
          score: 0,
          startedAt: null,
          endedAt: null,
          lastMatchTime: null,
        });
      },
    }),
    {
      name: 'itemdeck-memory-game',
      partialize: (state) => ({
        // Only persist completed game stats, not in-progress state
        pairCount: state.pairCount,
      }),
    }
  )
);

// Scoring helpers
function calculateMatchScore(state: MemoryGameState): number {
  const baseScore = 100;
  const timeSinceStart = Date.now() - (state.startedAt ?? Date.now());
  const attemptPenalty = Math.max(0, (state.attempts - state.matchedCardIds.size / 2) * 10);
  return Math.max(10, baseScore - attemptPenalty);
}

function checkCardsMatch(card1: string, card2: string): boolean {
  // Implementation depends on matching strategy
  // e.g., same image, same category, etc.
  return card1.split('-')[0] === card2.split('-')[0];
}
```

### Collection (Owned/Wishlist) State Pattern

```typescript
// src/mechanics/collection/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CollectionStatus = 'unowned' | 'owned' | 'wishlist';

interface CollectionState {
  // Card status map
  cardStatus: Record<string, CollectionStatus>;

  // Statistics
  stats: {
    owned: number;
    wishlist: number;
    total: number;
  };

  // Actions
  setStatus: (cardId: string, status: CollectionStatus) => void;
  toggleOwned: (cardId: string) => void;
  toggleWishlist: (cardId: string) => void;
  clearAll: () => void;
  importCollection: (statuses: Record<string, CollectionStatus>) => void;
  exportCollection: () => Record<string, CollectionStatus>;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      cardStatus: {},
      stats: { owned: 0, wishlist: 0, total: 0 },

      setStatus: (cardId, status) => {
        const current = get().cardStatus;
        const newStatus = status === 'unowned'
          ? (() => { const { [cardId]: _, ...rest } = current; return rest; })()
          : { ...current, [cardId]: status };

        set({
          cardStatus: newStatus,
          stats: calculateStats(newStatus),
        });
      },

      toggleOwned: (cardId) => {
        const current = get().cardStatus[cardId];
        get().setStatus(cardId, current === 'owned' ? 'unowned' : 'owned');
      },

      toggleWishlist: (cardId) => {
        const current = get().cardStatus[cardId];
        get().setStatus(cardId, current === 'wishlist' ? 'unowned' : 'wishlist');
      },

      clearAll: () => set({ cardStatus: {}, stats: { owned: 0, wishlist: 0, total: 0 } }),

      importCollection: (statuses) => set({
        cardStatus: statuses,
        stats: calculateStats(statuses),
      }),

      exportCollection: () => get().cardStatus,
    }),
    {
      name: 'itemdeck-collection',
      // Persist everything - this is the user's collection
    }
  )
);

function calculateStats(cardStatus: Record<string, CollectionStatus>) {
  let owned = 0;
  let wishlist = 0;
  for (const status of Object.values(cardStatus)) {
    if (status === 'owned') owned++;
    if (status === 'wishlist') wishlist++;
  }
  return { owned, wishlist, total: owned + wishlist };
}
```

### Snap Ranking State Pattern

```typescript
// src/mechanics/snapRanking/store.ts
import { create } from 'zustand';
import type { GamePhase } from '../types/stateMachine';

interface SnapRankingState {
  // Game phase
  phase: GamePhase;

  // Card queue
  cardQueue: string[];  // Remaining cards to rate
  currentCardId: string | null;
  ratedCards: Map<string, number>;  // cardId -> rating (1-10)

  // Progress
  progress: number;  // 0 to 1
  totalCards: number;

  // Timer (optional pressure)
  timerEnabled: boolean;
  timePerCard: number;  // seconds
  timeRemaining: number;

  // Actions
  start: (cardIds: string[], options?: { timerEnabled?: boolean; timePerCard?: number }) => void;
  rate: (rating: number) => void;
  skip: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;

  // Results
  getResults: () => { cardId: string; rating: number }[];
  getTierList: () => Record<string, string[]>;  // tier -> cardIds
}

export const useSnapRankingStore = create<SnapRankingState>()((set, get) => ({
  phase: 'idle',
  cardQueue: [],
  currentCardId: null,
  ratedCards: new Map(),
  progress: 0,
  totalCards: 0,
  timerEnabled: false,
  timePerCard: 10,
  timeRemaining: 0,

  start: (cardIds, options = {}) => {
    const shuffled = [...cardIds].sort(() => Math.random() - 0.5);
    set({
      phase: 'playing',
      cardQueue: shuffled.slice(1),
      currentCardId: shuffled[0],
      ratedCards: new Map(),
      progress: 0,
      totalCards: shuffled.length,
      timerEnabled: options.timerEnabled ?? false,
      timePerCard: options.timePerCard ?? 10,
      timeRemaining: options.timePerCard ?? 10,
    });
  },

  rate: (rating) => {
    const state = get();
    if (state.phase !== 'playing' || !state.currentCardId) return;

    const newRated = new Map(state.ratedCards);
    newRated.set(state.currentCardId, rating);

    const nextCard = state.cardQueue[0];
    const remainingQueue = state.cardQueue.slice(1);
    const progress = newRated.size / state.totalCards;

    if (!nextCard) {
      // All cards rated - game complete
      set({
        phase: 'ended',
        ratedCards: newRated,
        currentCardId: null,
        cardQueue: [],
        progress: 1,
      });
    } else {
      set({
        ratedCards: newRated,
        currentCardId: nextCard,
        cardQueue: remainingQueue,
        progress,
        timeRemaining: state.timePerCard,
      });
    }
  },

  skip: () => {
    const state = get();
    if (state.phase !== 'playing') return;

    const nextCard = state.cardQueue[0];
    const remainingQueue = state.cardQueue.slice(1);

    if (!nextCard) {
      set({ phase: 'ended', currentCardId: null, cardQueue: [], progress: 1 });
    } else {
      // Put skipped card at end of queue
      set({
        currentCardId: nextCard,
        cardQueue: state.currentCardId
          ? [...remainingQueue, state.currentCardId]
          : remainingQueue,
        timeRemaining: state.timePerCard,
      });
    }
  },

  pause: () => { if (get().phase === 'playing') set({ phase: 'paused' }); },
  resume: () => { if (get().phase === 'paused') set({ phase: 'playing' }); },

  reset: () => set({
    phase: 'idle',
    cardQueue: [],
    currentCardId: null,
    ratedCards: new Map(),
    progress: 0,
    totalCards: 0,
    timeRemaining: 0,
  }),

  getResults: () => {
    const results: { cardId: string; rating: number }[] = [];
    get().ratedCards.forEach((rating, cardId) => {
      results.push({ cardId, rating });
    });
    return results.sort((a, b) => b.rating - a.rating);
  },

  getTierList: () => {
    const tiers: Record<string, string[]> = {
      S: [],  // 10
      A: [],  // 8-9
      B: [],  // 6-7
      C: [],  // 4-5
      D: [],  // 2-3
      F: [],  // 1
    };

    get().ratedCards.forEach((rating, cardId) => {
      if (rating === 10) tiers.S.push(cardId);
      else if (rating >= 8) tiers.A.push(cardId);
      else if (rating >= 6) tiers.B.push(cardId);
      else if (rating >= 4) tiers.C.push(cardId);
      else if (rating >= 2) tiers.D.push(cardId);
      else tiers.F.push(cardId);
    });

    return tiers;
  },
}));
```

### Undo/Redo Pattern

For mechanics that need undo:

```typescript
// src/mechanics/utils/undoable.ts
import { StateCreator } from 'zustand';

interface UndoableState<T> {
  past: T[];
  future: T[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function undoable<T extends object>(
  config: StateCreator<T>,
  getSnapshot: (state: T) => Partial<T>
): StateCreator<T & UndoableState<Partial<T>>> {
  return (set, get, api) => {
    const baseState = config(
      (partial) => {
        const currentSnapshot = getSnapshot(get() as T);
        set((state) => ({
          ...partial,
          past: [...state.past, currentSnapshot],
          future: [],
        }));
      },
      get as () => T,
      api as any
    );

    return {
      ...baseState,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,

      undo: () => {
        const { past, future } = get() as UndoableState<Partial<T>>;
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, -1);
        const current = getSnapshot(get() as T);

        set({
          ...previous,
          past: newPast,
          future: [current, ...future],
          canUndo: newPast.length > 0,
          canRedo: true,
        } as Partial<T & UndoableState<Partial<T>>>);
      },

      redo: () => {
        const { past, future } = get() as UndoableState<Partial<T>>;
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);
        const current = getSnapshot(get() as T);

        set({
          ...next,
          past: [...past, current],
          future: newFuture,
          canUndo: true,
          canRedo: newFuture.length > 0,
        } as Partial<T & UndoableState<Partial<T>>>);
      },
    };
  };
}
```

## Recommendations for Itemdeck

### Priority 1: Isolated Stores per Mechanic

1. **Create store per mechanic** (memory, collection, competing, quiz, snap ranking)
2. **Use Zustand persist** for state that should survive refresh
3. **Define clear state interfaces** with TypeScript
4. **Keep mechanics independent** - no shared state between them

### Priority 2: State Machine for Game Flow

1. **Use simple FSM pattern** without additional libraries
2. **Common phases**: idle → playing → paused → ended
3. **Mechanic-specific actions** extend base transitions
4. **Validate transitions** to prevent invalid states

### Priority 3: Mechanic Registry Integration

1. **Registry tracks active mechanic** only
2. **Mechanics self-register** on import
3. **Activation triggers** store initialisation
4. **Deactivation triggers** cleanup/pause

### Priority 4: Persistence Strategy

| Mechanic | Persistence |
|----------|-------------|
| Memory Game | Settings only (pair count), not in-progress |
| Collection | Full state (user's collection) |
| Competing | High scores only |
| Quiz | Stats only (streak, accuracy) |
| Snap Ranking | Results only (after completion) |

## Implementation Considerations

### Dependencies

No additional dependencies needed - Zustand already in project.

### Bundle Size Impact

- Each mechanic store: ~1-2KB
- State machine utilities: ~1KB
- Total additional: ~10-15KB for all mechanics

### Performance Considerations

1. **Memoise selectors** for derived state
2. **Batch updates** for rapid state changes
3. **Use immer middleware** if mutations get complex
4. **Virtualise** card lists in mechanics

### Testing Strategy

```typescript
// Store testing pattern
describe('useMemoryStore', () => {
  beforeEach(() => {
    useMemoryStore.getState().reset();
  });

  it('starts in idle phase', () => {
    expect(useMemoryStore.getState().phase).toBe('idle');
  });

  it('transitions to playing on start', () => {
    useMemoryStore.getState().start(['card-1', 'card-2']);
    expect(useMemoryStore.getState().phase).toBe('playing');
  });

  it('allows flipping two cards', () => {
    // ...
  });

  it('detects matches correctly', async () => {
    // ...
  });
});
```

## References

- [XState Documentation](https://xstate.js.org/docs/)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [Game State Management Patterns](https://gameprogrammingpatterns.com/state.html)
- [Finite State Machines in React](https://blog.logrocket.com/finite-state-machines-in-react/)

---

## Related Documentation

- [R-006: Plugin State Isolation](./R-006-plugin-state-isolation.md)
- [ADR-017: Mechanic State Management](../decisions/adrs/ADR-017-mechanic-state-management.md)
- [Modular Architecture Research](./modular-architecture.md)
- [State Persistence Research](./state-persistence.md)

---

**Applies to**: Itemdeck v0.11.0+
