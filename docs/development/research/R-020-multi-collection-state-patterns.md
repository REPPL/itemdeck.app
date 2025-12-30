# R-020: Multi-Collection State Patterns

## Executive Summary

This research examines React state management patterns for handling multiple data collections simultaneously, focusing on memory efficiency, performance, and user experience. This directly supports F-064 (Collection Comparison) which requires loading and comparing multiple collections.

## Current State in Itemdeck

### Single Collection Architecture

The current implementation is optimised for single-collection viewing:

1. **Data Loading** (`useCollection` hook)
   - Fetches one collection at a time
   - TanStack Query caches collection data
   - Cards held in memory during session

2. **State Management**
   - `settingsStore` - global settings
   - `sourceStore` - list of available sources
   - `editsStore` - user edits for current collection

3. **Memory Usage**
   - ~1-2KB per card (metadata only)
   - Images loaded on-demand (lazy)
   - Virtual scrolling limits rendered DOM nodes

### Challenges for Multi-Collection

1. **Memory Pressure**
   - Two 500-card collections = ~1-2MB metadata
   - Image cache could grow significantly
   - Mobile devices have stricter limits

2. **State Isolation**
   - Edits must be tracked per-collection
   - Settings may differ per collection
   - Comparison state is new concept

3. **Performance**
   - Matching algorithms may be expensive
   - UI must remain responsive during comparison
   - Network requests should be parallelised

## Research Findings

### Memory Management Patterns

#### Pattern 1: Eager Loading

```typescript
// Load all collections fully upfront
function useMultiCollection(ids: string[]) {
  const queries = useQueries({
    queries: ids.map(id => ({
      queryKey: ['collection', id],
      queryFn: () => fetchCollection(id),
    })),
  });

  return {
    collections: queries.map(q => q.data).filter(Boolean),
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  };
}
```

**Pros:** Simple, all data available
**Cons:** High memory, slow initial load for large collections

#### Pattern 2: Lazy Loading with Windowing

```typescript
// Only load cards visible in comparison view
function useComparisonWindow(collections: Collection[], windowSize = 50) {
  const [offset, setOffset] = useState(0);

  const windowedCards = useMemo(() => {
    return collections.map(collection => ({
      ...collection,
      cards: collection.cards.slice(offset, offset + windowSize),
    }));
  }, [collections, offset, windowSize]);

  return {
    collections: windowedCards,
    loadMore: () => setOffset(o => o + windowSize),
    hasMore: collections.some(c => c.cards.length > offset + windowSize),
  };
}
```

**Pros:** Lower memory, progressive loading
**Cons:** Comparison logic must handle windowing

#### Pattern 3: Reference-Based Loading

```typescript
// Load metadata first, full cards on demand
interface CollectionRef {
  id: string;
  name: string;
  cardCount: number;
  loadedCards: Map<string, Card>;
}

function useCollectionRef(id: string): CollectionRef {
  const metadata = useCollectionMetadata(id);

  const loadCard = useCallback(async (cardId: string) => {
    if (ref.current.loadedCards.has(cardId)) return;
    const card = await fetchCard(id, cardId);
    ref.current.loadedCards.set(cardId, card);
  }, [id]);

  return { ...metadata, loadCard };
}
```

**Pros:** Minimal initial memory, load as needed
**Cons:** Complex, many small requests

### State Isolation Patterns

#### Pattern 1: Scoped Stores

```typescript
// Create isolated store per collection context
const createCollectionStore = (collectionId: string) =>
  create<CollectionState>((set) => ({
    collectionId,
    edits: {},
    setEdit: (cardId, field, value) =>
      set((state) => ({
        edits: {
          ...state.edits,
          [cardId]: { ...state.edits[cardId], [field]: value },
        },
      })),
  }));

// Store registry
const collectionStores = new Map<string, ReturnType<typeof createCollectionStore>>();

function getCollectionStore(id: string) {
  if (!collectionStores.has(id)) {
    collectionStores.set(id, createCollectionStore(id));
  }
  return collectionStores.get(id)!;
}
```

#### Pattern 2: Composite Store

```typescript
// Single store with collection-keyed state
interface MultiCollectionState {
  collections: Record<string, CollectionState>;
  setEdit: (collectionId: string, cardId: string, field: string, value: unknown) => void;
  getCollection: (id: string) => CollectionState | undefined;
}

const useMultiCollectionStore = create<MultiCollectionState>((set, get) => ({
  collections: {},

  setEdit: (collectionId, cardId, field, value) =>
    set((state) => ({
      collections: {
        ...state.collections,
        [collectionId]: {
          ...state.collections[collectionId],
          edits: {
            ...state.collections[collectionId]?.edits,
            [cardId]: {
              ...state.collections[collectionId]?.edits?.[cardId],
              [field]: value,
            },
          },
        },
      },
    })),

  getCollection: (id) => get().collections[id],
}));
```

#### Pattern 3: Context-Based Isolation

```typescript
// Provide collection context to subtree
const CollectionContext = createContext<CollectionContextValue | null>(null);

function CollectionProvider({ id, children }: { id: string; children: ReactNode }) {
  const collection = useCollection(id);
  const editsStore = useMemo(() => createEditsStore(id), [id]);

  return (
    <CollectionContext.Provider value={{ collection, editsStore }}>
      {children}
    </CollectionContext.Provider>
  );
}

// Comparison view wraps each collection
function ComparisonView({ ids }: { ids: [string, string] }) {
  return (
    <div className="comparison">
      <CollectionProvider id={ids[0]}>
        <CollectionPanel side="left" />
      </CollectionProvider>
      <CollectionProvider id={ids[1]}>
        <CollectionPanel side="right" />
      </CollectionProvider>
    </div>
  );
}
```

### Comparison State Management

#### Comparison Store Structure

```typescript
interface ComparisonState {
  // Active collections
  leftCollectionId: string | null;
  rightCollectionId: string | null;

  // Matching results
  matches: Match[];
  matchingInProgress: boolean;

  // User decisions
  confirmedMatches: Set<string>;
  rejectedMatches: Set<string>;

  // View state
  filter: 'all' | 'matched' | 'unmatched' | 'conflicts';
  sortBy: 'confidence' | 'title' | 'manual';

  // Actions
  setCollections: (left: string, right: string) => void;
  runMatching: () => Promise<void>;
  confirmMatch: (matchId: string) => void;
  rejectMatch: (matchId: string) => void;
}

interface Match {
  id: string;
  leftCardId: string;
  rightCardId: string;
  matchType: 'exact' | 'title' | 'fuzzy' | 'field';
  confidence: number; // 0-1
  matchedFields: string[];
}
```

### Memory Pressure Handling

#### Detection

```typescript
function useMemoryPressure() {
  const [pressure, setPressure] = useState<'low' | 'medium' | 'high'>('low');

  useEffect(() => {
    if (!('memory' in performance)) return;

    const check = () => {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (usage > 0.8) setPressure('high');
      else if (usage > 0.6) setPressure('medium');
      else setPressure('low');
    };

    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return pressure;
}
```

#### Response Strategies

```typescript
function useAdaptiveLoading() {
  const pressure = useMemoryPressure();

  const config = useMemo(() => {
    switch (pressure) {
      case 'high':
        return { maxCards: 100, imageQuality: 'low', cacheSize: 10 };
      case 'medium':
        return { maxCards: 250, imageQuality: 'medium', cacheSize: 25 };
      default:
        return { maxCards: 500, imageQuality: 'high', cacheSize: 50 };
    }
  }, [pressure]);

  return config;
}
```

#### Cleanup on Memory Pressure

```typescript
function useMemoryCleanup() {
  const pressure = useMemoryPressure();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pressure === 'high') {
      // Evict stale queries
      queryClient.getQueryCache().findAll({ stale: true }).forEach(query => {
        queryClient.removeQueries({ queryKey: query.queryKey });
      });

      // Clear image cache
      imageCache.evictLRU(50);

      // Force garbage collection hint
      if ('gc' in window) (window as any).gc();
    }
  }, [pressure, queryClient]);
}
```

### Performance Optimisation

#### Web Worker for Matching

```typescript
// comparison.worker.ts
self.onmessage = (event: MessageEvent<{
  leftCards: Card[];
  rightCards: Card[];
  options: MatchingOptions;
}>) => {
  const { leftCards, rightCards, options } = event.data;
  const matches = runMatchingAlgorithm(leftCards, rightCards, options);
  self.postMessage({ matches });
};

// In component
const worker = useMemo(() => new Worker(
  new URL('./comparison.worker.ts', import.meta.url),
  { type: 'module' }
), []);

async function runMatching() {
  setMatchingInProgress(true);

  worker.postMessage({
    leftCards: leftCollection.cards,
    rightCards: rightCollection.cards,
    options: matchingOptions,
  });

  return new Promise<Match[]>((resolve) => {
    worker.onmessage = (e) => {
      setMatchingInProgress(false);
      resolve(e.data.matches);
    };
  });
}
```

#### Virtualised Comparison List

```typescript
function ComparisonList({ matches }: { matches: Match[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualiser = useVirtualizer({
    count: matches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Match row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="comparison-list">
      <div style={{ height: virtualiser.getTotalSize() }}>
        {virtualiser.getVirtualItems().map((virtualRow) => (
          <MatchRow
            key={virtualRow.key}
            match={matches[virtualRow.index]}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

## Recommendations

### 1. Composite Store with Lazy Loading

```typescript
// Recommended architecture
const useComparisonStore = create<ComparisonState>((set, get) => ({
  // State
  collections: {}, // Lazy-loaded collection data
  matches: [],

  // Load collection on demand
  loadCollection: async (id: string) => {
    if (get().collections[id]) return;
    const data = await queryClient.fetchQuery(['collection', id]);
    set((s) => ({ collections: { ...s.collections, [id]: data } }));
  },

  // Unload to free memory
  unloadCollection: (id: string) => {
    set((s) => {
      const { [id]: _, ...rest } = s.collections;
      return { collections: rest };
    });
  },
}));
```

### 2. Memory Limits

- Maximum 2 collections loaded simultaneously
- Show warning at 500+ cards per collection
- Automatically unload when navigating away

### 3. Progressive Matching

```typescript
// Match in batches to keep UI responsive
async function* matchProgressively(left: Card[], right: Card[], batchSize = 50) {
  for (let i = 0; i < left.length; i += batchSize) {
    const batch = left.slice(i, i + batchSize);
    const matches = matchBatch(batch, right);
    yield { progress: (i + batchSize) / left.length, matches };
    await new Promise(r => setTimeout(r, 0)); // Yield to UI
  }
}
```

### 4. Cleanup on Navigation

```typescript
// Clean up comparison state when leaving
useEffect(() => {
  return () => {
    comparisonStore.getState().reset();
    queryClient.removeQueries({ queryKey: ['comparison'] });
  };
}, []);
```

## Implementation Considerations

### Testing at Scale

- Test with 2x 1000-card collections
- Monitor memory in Chrome DevTools
- Profile matching algorithm performance
- Test on mobile devices (limited memory)

### Error Handling

- Handle partial load failures gracefully
- Allow comparison of loaded portions
- Clear error states on retry

### User Experience

- Show loading progress for large collections
- Indicate memory pressure to user
- Provide "lite" comparison mode for low-memory devices

## References

- [React Query Parallel Queries](https://tanstack.com/query/latest/docs/react/guides/parallel-queries)
- [Zustand Recipes](https://docs.pmnd.rs/zustand/recipes/recipes)
- [Memory Management in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

---

## Related Documentation

- [F-064: Collection Comparison](../roadmap/features/planned/F-064-collection-comparison.md)
- [R-023: Collection Matching Algorithms](./R-023-collection-matching-algorithms.md)
- [ADR-004: State Management](../decisions/adrs/ADR-004-state-management.md)
- [Performance & Virtualisation Research](./performance-virtualisation.md)

---

**Status**: Complete
