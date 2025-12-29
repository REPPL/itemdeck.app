# R-006: Plugin State Isolation

## Executive Summary

For Itemdeck's gaming mechanics plugin system, use **scoped Zustand stores with namespace prefixes** and **lazy initialisation** to isolate plugin state. Each mechanic creates its own store on activation, with automatic cleanup on deactivation. The core application only maintains a reference to the active mechanic ID.

Key recommendations:
1. Each mechanic has its own Zustand store (separate file, separate state)
2. Stores are lazily created on first activation
3. Cleanup runs on deactivation (reset state, cancel timers)
4. Persistence uses namespaced keys (e.g., `itemdeck-memory`, `itemdeck-collection`)
5. Mechanics cannot access each other's state directly

## Current State in Itemdeck

Itemdeck currently uses:
- **Single settingsStore** for all user preferences
- **No plugin architecture** - monolithic application
- **TanStack Query** with cache isolation per query key

The mechanic system needs state isolation to prevent:
- State leakage between mechanics
- Memory leaks from abandoned state
- Conflicts between concurrent mechanic development

## Research Findings

### State Isolation Patterns Comparison

| Pattern | Complexity | Isolation | Memory | Testing |
|---------|------------|-----------|--------|---------|
| **Scoped Stores** | Low | Excellent | Good | Excellent |
| **Single Store + Namespaces** | Medium | Good | Excellent | Good |
| **Context Boundaries** | Low | Moderate | Good | Good |
| **Module Federation** | High | Excellent | Varies | Complex |

### Scoped Stores Pattern (Recommended)

Each mechanic has its own store file:

```typescript
// src/mechanics/memory/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MemoryGameState {
  // ... state fields
}

// Store is a singleton, created on first import
export const useMemoryStore = create<MemoryGameState>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    {
      name: 'itemdeck-memory',  // Namespaced key
    }
  )
);
```

```typescript
// src/mechanics/collection/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CollectionState {
  // ... state fields
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    {
      name: 'itemdeck-collection',  // Different namespace
    }
  )
);
```

### Lazy Initialisation Pattern

Delay store creation until mechanic is activated:

```typescript
// src/mechanics/registry.ts
import type { Mechanic } from './types';

type MechanicFactory = () => Promise<Mechanic>;

class MechanicRegistry {
  private factories = new Map<string, MechanicFactory>();
  private instances = new Map<string, Mechanic>();
  private activeMechanicId: string | null = null;

  register(id: string, factory: MechanicFactory) {
    this.factories.set(id, factory);
  }

  async activate(id: string): Promise<Mechanic> {
    // Deactivate current mechanic
    if (this.activeMechanicId) {
      await this.deactivate(this.activeMechanicId);
    }

    // Lazy load mechanic if not already loaded
    if (!this.instances.has(id)) {
      const factory = this.factories.get(id);
      if (!factory) throw new Error(`Unknown mechanic: ${id}`);

      const mechanic = await factory();
      this.instances.set(id, mechanic);
    }

    const mechanic = this.instances.get(id)!;
    mechanic.lifecycle.onActivate();
    this.activeMechanicId = id;

    return mechanic;
  }

  async deactivate(id: string): Promise<void> {
    const mechanic = this.instances.get(id);
    if (mechanic) {
      mechanic.lifecycle.onDeactivate();
    }
    if (this.activeMechanicId === id) {
      this.activeMechanicId = null;
    }
  }

  getActive(): Mechanic | null {
    return this.activeMechanicId
      ? this.instances.get(this.activeMechanicId) ?? null
      : null;
  }
}

export const mechanicRegistry = new MechanicRegistry();
```

### Dynamic Import for Code Splitting

```typescript
// src/mechanics/index.ts
import { mechanicRegistry } from './registry';

// Register mechanic factories (not the mechanics themselves)
mechanicRegistry.register('memory', async () => {
  const { createMemoryMechanic } = await import('./memory');
  return createMemoryMechanic();
});

mechanicRegistry.register('collection', async () => {
  const { createCollectionMechanic } = await import('./collection');
  return createCollectionMechanic();
});

mechanicRegistry.register('competing', async () => {
  const { createCompetingMechanic } = await import('./competing');
  return createCompetingMechanic();
});

mechanicRegistry.register('quiz', async () => {
  const { createQuizMechanic } = await import('./quiz');
  return createQuizMechanic();
});

mechanicRegistry.register('snap-ranking', async () => {
  const { createSnapRankingMechanic } = await import('./snapRanking');
  return createSnapRankingMechanic();
});
```

### Cleanup on Deactivation

Ensure proper cleanup when switching mechanics:

```typescript
// src/mechanics/memory/index.ts
import { useMemoryStore } from './store';
import type { Mechanic } from '../types';

export function createMemoryMechanic(): Mechanic {
  let intervalId: number | null = null;

  return {
    manifest: {
      id: 'memory',
      name: 'Memory Game',
      description: 'Match pairs of cards',
      version: '1.0.0',
    },

    lifecycle: {
      onActivate: () => {
        // Reset to clean state on activation
        useMemoryStore.getState().reset();
        console.log('Memory mechanic activated');
      },

      onDeactivate: () => {
        // Cancel any timers
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }

        // Optionally pause game (don't lose progress)
        const state = useMemoryStore.getState();
        if (state.phase === 'playing') {
          state.pause();
        }

        console.log('Memory mechanic deactivated');
      },

      onReset: () => {
        useMemoryStore.getState().reset();
      },
    },

    getState: () => {
      const store = useMemoryStore.getState();
      return {
        isActive: store.phase !== 'idle',
        score: store.score,
        progress: store.matchedCardIds.size / (store.pairCount * 2),
        custom: {
          phase: store.phase,
          attempts: store.attempts,
          matchedCount: store.matchedCardIds.size,
        },
      };
    },

    // ... rest of mechanic implementation
  };
}
```

### Context Boundary Pattern

Use React Context to provide mechanic state to components:

```typescript
// src/mechanics/context.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Mechanic, MechanicState } from './types';
import { mechanicRegistry } from './registry';

interface MechanicContextValue {
  activeMechanic: Mechanic | null;
  mechanicState: MechanicState | null;
  activateMechanic: (id: string) => Promise<void>;
  deactivateMechanic: () => Promise<void>;
}

const MechanicContext = createContext<MechanicContextValue | null>(null);

export function MechanicProvider({ children }: { children: ReactNode }) {
  const [activeMechanic, setActiveMechanic] = useState<Mechanic | null>(null);
  const [mechanicState, setMechanicState] = useState<MechanicState | null>(null);

  // Subscribe to active mechanic state changes
  useEffect(() => {
    if (!activeMechanic) {
      setMechanicState(null);
      return;
    }

    // Initial state
    setMechanicState(activeMechanic.getState());

    // Subscribe to changes
    const unsubscribe = activeMechanic.subscribe((state) => {
      setMechanicState(state);
    });

    return unsubscribe;
  }, [activeMechanic]);

  const activateMechanic = async (id: string) => {
    const mechanic = await mechanicRegistry.activate(id);
    setActiveMechanic(mechanic);
  };

  const deactivateMechanic = async () => {
    if (activeMechanic) {
      await mechanicRegistry.deactivate(activeMechanic.manifest.id);
      setActiveMechanic(null);
    }
  };

  return (
    <MechanicContext.Provider
      value={{ activeMechanic, mechanicState, activateMechanic, deactivateMechanic }}
    >
      {children}
    </MechanicContext.Provider>
  );
}

export function useMechanic() {
  const context = useContext(MechanicContext);
  if (!context) {
    throw new Error('useMechanic must be used within MechanicProvider');
  }
  return context;
}
```

### Storage Namespace Pattern

Prevent key collisions in localStorage/IndexedDB:

```typescript
// src/mechanics/utils/storage.ts
const MECHANIC_STORAGE_PREFIX = 'itemdeck-mechanic-';

export function getMechanicStorageKey(mechanicId: string): string {
  return `${MECHANIC_STORAGE_PREFIX}${mechanicId}`;
}

export function clearMechanicStorage(mechanicId: string): void {
  const key = getMechanicStorageKey(mechanicId);
  localStorage.removeItem(key);
}

export function clearAllMechanicStorage(): void {
  const keys = Object.keys(localStorage);
  keys
    .filter(key => key.startsWith(MECHANIC_STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
}

// Storage key inventory
export const MECHANIC_STORAGE_KEYS = {
  memory: getMechanicStorageKey('memory'),
  collection: getMechanicStorageKey('collection'),
  competing: getMechanicStorageKey('competing'),
  quiz: getMechanicStorageKey('quiz'),
  snapRanking: getMechanicStorageKey('snap-ranking'),
} as const;
```

### Memory Management

Prevent memory leaks from abandoned mechanic state:

```typescript
// src/mechanics/registry.ts
class MechanicRegistry {
  // ... previous implementation

  // Unload inactive mechanics to free memory
  unload(id: string): void {
    if (this.activeMechanicId === id) {
      throw new Error('Cannot unload active mechanic');
    }

    const mechanic = this.instances.get(id);
    if (mechanic) {
      mechanic.lifecycle.onReset();
      this.instances.delete(id);
    }
  }

  // Unload all inactive mechanics
  unloadInactive(): void {
    for (const [id] of this.instances) {
      if (id !== this.activeMechanicId) {
        this.unload(id);
      }
    }
  }

  // Memory usage estimation
  getMemoryEstimate(): number {
    let bytes = 0;
    for (const [, mechanic] of this.instances) {
      const state = mechanic.getState();
      bytes += JSON.stringify(state).length * 2; // Rough estimate
    }
    return bytes;
  }
}
```

### Testing Isolated Stores

Each store can be tested independently:

```typescript
// src/mechanics/memory/store.test.ts
import { useMemoryStore } from './store';

describe('useMemoryStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useMemoryStore.getState().reset();
    // Clear persisted state
    localStorage.removeItem('itemdeck-memory');
  });

  it('initialises with idle phase', () => {
    expect(useMemoryStore.getState().phase).toBe('idle');
  });

  it('starts game with shuffled cards', () => {
    const cardIds = ['a', 'b', 'c', 'd'];
    useMemoryStore.getState().start(cardIds);

    expect(useMemoryStore.getState().phase).toBe('playing');
    expect(useMemoryStore.getState().matchedCardIds.size).toBe(0);
  });

  it('does not affect other stores', () => {
    // Import collection store
    const { useCollectionStore } = require('../collection/store');

    // Modify memory store
    useMemoryStore.getState().start(['a', 'b']);

    // Collection store should be unaffected
    expect(useCollectionStore.getState().stats.owned).toBe(0);
  });
});
```

## Recommendations for Itemdeck

### Priority 1: Scoped Store Architecture

1. **One file per mechanic** in `src/mechanics/{name}/store.ts`
2. **Namespaced storage keys** to prevent collisions
3. **Export typed hooks** (e.g., `useMemoryStore`)
4. **No cross-store imports** - mechanics are islands

### Priority 2: Lazy Loading

1. **Register factories**, not instances
2. **Dynamic import** on first activation
3. **Code split** each mechanic into its own chunk
4. **Preload** likely-to-be-used mechanics

### Priority 3: Cleanup Protocol

1. **Pause on deactivate** (preserve progress if appropriate)
2. **Clear timers** and intervals
3. **Unsubscribe** from external events
4. **Optional memory unload** for inactive mechanics

### Priority 4: Testing Strategy

1. **Test stores in isolation** - no app context needed
2. **Mock mechanics** for integration tests
3. **Clear storage** in beforeEach
4. **Test cleanup** explicitly

## Implementation Considerations

### Dependencies

No additional dependencies - uses Zustand patterns already in project.

### Bundle Size Impact

| Approach | Impact |
|----------|--------|
| Eager loading all mechanics | +50-100KB initial |
| Lazy loading with code splitting | +2KB initial, per-mechanic on demand |
| Recommended: Lazy loading | Minimal initial impact |

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Each mechanic in its own chunk
          'mechanic-memory': ['./src/mechanics/memory/index.ts'],
          'mechanic-collection': ['./src/mechanics/collection/index.ts'],
          'mechanic-competing': ['./src/mechanics/competing/index.ts'],
          'mechanic-quiz': ['./src/mechanics/quiz/index.ts'],
          'mechanic-snap-ranking': ['./src/mechanics/snapRanking/index.ts'],
        },
      },
    },
  },
});
```

### DevTools Integration

```typescript
// Debug helper for development
if (import.meta.env.DEV) {
  (window as any).__ITEMDECK_MECHANICS__ = {
    registry: mechanicRegistry,
    stores: {
      memory: () => import('./memory/store'),
      collection: () => import('./collection/store'),
      // ...
    },
  };
}
```

## References

- [Zustand Slices Pattern](https://docs.pmnd.rs/zustand/guides/slices-pattern)
- [React Context Boundaries](https://react.dev/learn/passing-data-deeply-with-context)
- [Code Splitting with Vite](https://vitejs.dev/guide/features.html#async-chunk-loading-optimization)
- [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)

---

## Related Documentation

- [ADR-016: Gaming Mechanics Plugin Architecture](../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md) - Plugin architecture decision
- [R-005: Gaming Mechanics State Patterns](./R-005-gaming-mechanics-state.md) - State patterns for mechanics
- [ADR-017: Mechanic State Management](../decisions/adrs/ADR-017-mechanic-state-management.md) - State management decision
- [Modular Architecture Research](./modular-architecture.md) - Modular architecture patterns

---

**Applies to**: Itemdeck v0.11.0+
