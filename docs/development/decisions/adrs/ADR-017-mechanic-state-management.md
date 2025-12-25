# ADR-017: Mechanic State Management

## Status

Accepted

## Context

Each gaming mechanic in Itemdeck needs its own state management. We need to decide how mechanics store and manage their game state (scores, progress, card states, etc.).

Key requirements:
1. Mechanics should have isolated state (no interference)
2. Some state should persist (collection ownership, high scores)
3. Some state is session-only (current game progress)
4. State must be accessible to mechanic UI components
5. State updates should trigger re-renders efficiently

We evaluated several approaches:

| Approach | Isolation | Persistence | Sharing | Bundle Size |
|----------|-----------|-------------|---------|-------------|
| **Scoped Zustand Stores** | Excellent | Built-in | None | Low |
| **Single Store + Slices** | Moderate | Built-in | Possible | Low |
| **Context per Mechanic** | Excellent | Manual | None | Minimal |
| **Redux Toolkit Slices** | Moderate | Manual | Built-in | Higher |

## Decision

Use **Scoped Zustand Stores** - one store per mechanic.

Each mechanic creates its own Zustand store in a separate file. Stores are independent with no shared state between mechanics.

```
src/mechanics/
├── memory/
│   └── store.ts       // useMemoryStore
├── collection/
│   └── store.ts       // useCollectionStore
├── competing/
│   └── store.ts       // useCompetingStore
├── quiz/
│   └── store.ts       // useQuizStore
└── snapRanking/
    └── store.ts       // useSnapRankingStore
```

## Consequences

### Positive

- **Complete isolation** - Mechanics cannot accidentally affect each other
- **Independent testing** - Test each store without app context
- **Lazy loading** - Store code only loaded when mechanic activated
- **Simple mental model** - One store = one mechanic
- **Persistence per mechanic** - Each store controls its own persistence

### Negative

- **No cross-mechanic data** - Can't share state between mechanics
- **Multiple stores to manage** - More files, more patterns to maintain
- **Context bridging** - Need `MechanicProvider` to expose active state

### Mitigations

- **Shared types** - Common type definitions in `src/mechanics/types/`
- **Store helpers** - Utility functions for common patterns
- **Clear documentation** - Each store documents its interface

## Store Pattern

```typescript
// src/mechanics/memory/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MemoryGameState {
  // Game state (session-only)
  phase: 'idle' | 'playing' | 'paused' | 'ended';
  flippedCardIds: string[];
  matchedCardIds: Set<string>;
  attempts: number;
  score: number;

  // Settings (persisted)
  pairCount: number;

  // Actions
  start: (cardIds: string[]) => void;
  flipCard: (cardId: string) => void;
  checkMatch: () => Promise<boolean>;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export const useMemoryStore = create<MemoryGameState>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    {
      name: 'itemdeck-mechanic-memory',
      partialize: (state) => ({
        // Only persist settings, not game state
        pairCount: state.pairCount,
      }),
    }
  )
);
```

## Persistence Strategy

| Mechanic | What to Persist | Storage Key |
|----------|-----------------|-------------|
| Memory | Settings only | `itemdeck-mechanic-memory` |
| Collection | All card statuses | `itemdeck-mechanic-collection` |
| Competing | High scores | `itemdeck-mechanic-competing` |
| Quiz | Stats (accuracy, streak) | `itemdeck-mechanic-quiz` |
| Snap Ranking | Past results | `itemdeck-mechanic-snap-ranking` |

## Mechanic Context Bridge

The `MechanicProvider` exposes active mechanic state to components:

```typescript
// src/mechanics/context.tsx
function MechanicProvider({ children }: { children: ReactNode }) {
  const activeMechanicId = useSettingsStore((s) => s.activeMechanicId);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [state, setState] = useState<MechanicState | null>(null);

  useEffect(() => {
    if (!activeMechanicId) {
      setMechanic(null);
      setState(null);
      return;
    }

    mechanicRegistry.activate(activeMechanicId).then((m) => {
      setMechanic(m);
      setState(m.getState());

      // Subscribe to state changes
      const unsubscribe = m.subscribe(setState);
      return unsubscribe;
    });
  }, [activeMechanicId]);

  return (
    <MechanicContext.Provider value={{ mechanic, state }}>
      {children}
    </MechanicContext.Provider>
  );
}
```

## State Machine Pattern

Mechanics use a common phase pattern:

```typescript
type GamePhase = 'idle' | 'ready' | 'playing' | 'paused' | 'ended';

// Valid transitions
const transitions: Record<GamePhase, GamePhase[]> = {
  idle: ['ready'],
  ready: ['playing', 'idle'],
  playing: ['paused', 'ended'],
  paused: ['playing', 'ended'],
  ended: ['idle'],
};

function canTransition(from: GamePhase, to: GamePhase): boolean {
  return transitions[from]?.includes(to) ?? false;
}
```

## Alternatives Considered

### Single Zustand Store with Slices

- All mechanics in one store with slice pattern
- **Rejected**: No true isolation, one mechanic's bug affects all

### Context per Mechanic

- Each mechanic creates and manages its own Context
- **Rejected**: More boilerplate, harder to persist, no DevTools

### Redux Toolkit

- Create slices for each mechanic
- **Rejected**: Larger bundle, more boilerplate, already using Zustand

### Jotai Atoms

- Use atoms for fine-grained state
- **Rejected**: Different paradigm, learning curve, less intuitive for game state

---

## Related Documentation

- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)
- [R-006: Plugin State Isolation](../../research/R-006-plugin-state-isolation.md)
- [ADR-004: State Management](./ADR-004-state-management.md)
- [ADR-016: Gaming Mechanics Plugin Architecture](./ADR-016-gaming-mechanics-plugin-architecture.md)

---

**Applies to**: Itemdeck v0.11.0+
