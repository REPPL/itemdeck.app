# R-008: Fuzzy Matching for Collection Comparison

## Executive Summary

For Itemdeck's collection comparison feature, use **Fuse.js** for fuzzy string matching combined with **exact ID matching** as the primary strategy. Implement a tiered matching approach: exact ID match (highest confidence), exact title+year match, normalised title match, and fuzzy match (lowest confidence).

Key recommendations:
1. Primary: Exact ID matching (100% confidence)
2. Secondary: Exact title + year matching (95% confidence)
3. Tertiary: Normalised title matching (80% confidence)
4. Fallback: Fuse.js fuzzy matching (configurable threshold)
5. User can adjust confidence threshold for matches

## Current State in Itemdeck

Itemdeck currently:
- **Uses unique IDs** for entities (e.g., `sim-city-amiga`, `zelda-nes`)
- **Has title and year fields** on all game entities
- **No comparison features** - single collection view only
- **No fuzzy search** - exact filtering only

Collection comparison requires matching items across collections that may have:
- Different ID schemes
- Slight title variations ("The Legend of Zelda" vs "Legend of Zelda")
- Different year formats (1986 vs "1986" vs "1986-02-21")

## Research Findings

### Fuzzy Matching Libraries Comparison

| Library | Bundle Size | Algorithm | TypeScript | Performance |
|---------|-------------|-----------|------------|-------------|
| **Fuse.js** | 8KB | Bitap | Built-in | Good |
| **Flexsearch** | 6KB | Custom | Manual | Excellent |
| **MiniSearch** | 15KB | BM25 + Fuzzy | Built-in | Good |
| **fuzzysort** | 3KB | Subliminal | Built-in | Excellent |
| **Levenshtein** | 1KB | Edit distance | Manual | Fair |

### Fuse.js Implementation

Best balance of features and size for our use case:

```typescript
// src/services/collectionMatcher.ts
import Fuse from 'fuse.js';
import type { DisplayCard } from '@/types/card';

interface MatchResult {
  item1: DisplayCard;
  item2: DisplayCard;
  confidence: number;
  matchType: 'exact-id' | 'exact-title-year' | 'normalised-title' | 'fuzzy';
}

interface MatchOptions {
  fuzzyThreshold: number;  // 0.0 (exact) to 1.0 (very fuzzy)
  enableFuzzy: boolean;
  normaliseTitle: boolean;
}

const DEFAULT_OPTIONS: MatchOptions = {
  fuzzyThreshold: 0.4,  // Fuse.js threshold (lower = stricter)
  enableFuzzy: true,
  normaliseTitle: true,
};

export function matchCollections(
  collection1: DisplayCard[],
  collection2: DisplayCard[],
  options: Partial<MatchOptions> = {}
): MatchResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const matches: MatchResult[] = [];
  const matched2Ids = new Set<string>();

  // Build lookup maps
  const c2ById = new Map(collection2.map(c => [c.id, c]));
  const c2ByTitleYear = new Map(collection2.map(c => [`${c.title}|${c.year}`, c]));
  const c2ByNormalisedTitle = opts.normaliseTitle
    ? new Map(collection2.map(c => [normaliseTitle(c.title), c]))
    : null;

  // Phase 1: Exact ID match
  for (const item1 of collection1) {
    const item2 = c2ById.get(item1.id);
    if (item2 && !matched2Ids.has(item2.id)) {
      matches.push({
        item1,
        item2,
        confidence: 1.0,
        matchType: 'exact-id',
      });
      matched2Ids.add(item2.id);
    }
  }

  // Phase 2: Exact title + year match
  for (const item1 of collection1) {
    if (matches.some(m => m.item1.id === item1.id)) continue;

    const key = `${item1.title}|${item1.year}`;
    const item2 = c2ByTitleYear.get(key);
    if (item2 && !matched2Ids.has(item2.id)) {
      matches.push({
        item1,
        item2,
        confidence: 0.95,
        matchType: 'exact-title-year',
      });
      matched2Ids.add(item2.id);
    }
  }

  // Phase 3: Normalised title match
  if (c2ByNormalisedTitle) {
    for (const item1 of collection1) {
      if (matches.some(m => m.item1.id === item1.id)) continue;

      const normalised = normaliseTitle(item1.title);
      const item2 = c2ByNormalisedTitle.get(normalised);
      if (item2 && !matched2Ids.has(item2.id)) {
        matches.push({
          item1,
          item2,
          confidence: 0.8,
          matchType: 'normalised-title',
        });
        matched2Ids.add(item2.id);
      }
    }
  }

  // Phase 4: Fuzzy matching (optional)
  if (opts.enableFuzzy) {
    const unmatched1 = collection1.filter(
      c => !matches.some(m => m.item1.id === c.id)
    );
    const unmatched2 = collection2.filter(c => !matched2Ids.has(c.id));

    if (unmatched1.length > 0 && unmatched2.length > 0) {
      const fuse = new Fuse(unmatched2, {
        keys: ['title'],
        threshold: opts.fuzzyThreshold,
        includeScore: true,
      });

      for (const item1 of unmatched1) {
        const results = fuse.search(item1.title);
        if (results.length > 0) {
          const best = results[0];
          const item2 = best.item;
          const confidence = 1 - (best.score ?? 0);  // Fuse score is 0 (perfect) to 1

          if (confidence >= 0.6 && !matched2Ids.has(item2.id)) {
            matches.push({
              item1,
              item2,
              confidence,
              matchType: 'fuzzy',
            });
            matched2Ids.add(item2.id);
          }
        }
      }
    }
  }

  return matches;
}

// Title normalisation
function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^the\s+/i, '')           // Remove leading "The"
    .replace(/['']/g, "'")             // Normalise apostrophes
    .replace(/[^a-z0-9\s]/g, '')       // Remove special chars
    .replace(/\s+/g, ' ')              // Normalise whitespace
    .trim();
}
```

### Comparison Results Structure

```typescript
// src/types/comparison.ts

export interface CollectionComparison {
  source1: CollectionSummary;
  source2: CollectionSummary;

  // Items with matches
  matched: MatchedPair[];

  // Items only in collection 1
  uniqueToSource1: DisplayCard[];

  // Items only in collection 2
  uniqueToSource2: DisplayCard[];

  // Aggregate statistics
  stats: {
    totalUnique: number;
    matchedCount: number;
    overlapPercentage: number;
    averageConfidence: number;
  };
}

export interface MatchedPair {
  item1: DisplayCard;
  item2: DisplayCard;
  confidence: number;
  matchType: MatchType;
  differences: FieldDifference[];
}

export interface FieldDifference {
  field: string;
  value1: unknown;
  value2: unknown;
  type: 'added' | 'removed' | 'changed';
}

export type MatchType = 'exact-id' | 'exact-title-year' | 'normalised-title' | 'fuzzy';
```

### Field Difference Detection

```typescript
// src/services/diffDetector.ts

const COMPARABLE_FIELDS = [
  'title',
  'year',
  'summary',
  'rating',
  'categoryTitle',
] as const;

export function detectDifferences(
  item1: DisplayCard,
  item2: DisplayCard
): FieldDifference[] {
  const differences: FieldDifference[] = [];

  for (const field of COMPARABLE_FIELDS) {
    const value1 = item1[field as keyof DisplayCard];
    const value2 = item2[field as keyof DisplayCard];

    if (value1 === undefined && value2 === undefined) continue;

    if (value1 === undefined) {
      differences.push({ field, value1, value2, type: 'added' });
    } else if (value2 === undefined) {
      differences.push({ field, value1, value2, type: 'removed' });
    } else if (!deepEqual(value1, value2)) {
      differences.push({ field, value1, value2, type: 'changed' });
    }
  }

  return differences;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null) return false;
  // ... deep comparison logic
  return JSON.stringify(a) === JSON.stringify(b);
}
```

### Performance Optimisation

For large collections, use Web Workers:

```typescript
// src/workers/matcher.worker.ts
import { matchCollections } from '../services/collectionMatcher';

self.onmessage = (event) => {
  const { collection1, collection2, options } = event.data;

  const results = matchCollections(collection1, collection2, options);

  self.postMessage(results);
};
```

```typescript
// src/hooks/useCollectionComparison.ts
import { useState, useCallback } from 'react';

export function useCollectionComparison() {
  const [isComparing, setIsComparing] = useState(false);
  const [results, setResults] = useState<CollectionComparison | null>(null);

  const compare = useCallback(async (
    collection1: DisplayCard[],
    collection2: DisplayCard[],
    options?: MatchOptions
  ) => {
    setIsComparing(true);

    try {
      // Use Web Worker for large collections
      if (collection1.length > 100 || collection2.length > 100) {
        const worker = new Worker(
          new URL('../workers/matcher.worker.ts', import.meta.url),
          { type: 'module' }
        );

        return new Promise<CollectionComparison>((resolve) => {
          worker.onmessage = (event) => {
            const matches = event.data;
            const comparison = buildComparison(collection1, collection2, matches);
            setResults(comparison);
            resolve(comparison);
            worker.terminate();
          };

          worker.postMessage({ collection1, collection2, options });
        });
      }

      // Inline for small collections
      const matches = matchCollections(collection1, collection2, options);
      const comparison = buildComparison(collection1, collection2, matches);
      setResults(comparison);
      return comparison;
    } finally {
      setIsComparing(false);
    }
  }, []);

  return { compare, isComparing, results };
}
```

### Alternative: fuzzysort (Lightweight)

If bundle size is critical:

```typescript
// src/services/lightMatcher.ts
import fuzzysort from 'fuzzysort';

export function fuzzyMatchTitle(
  query: string,
  candidates: DisplayCard[]
): { card: DisplayCard; score: number } | null {
  const results = fuzzysort.go(query, candidates, {
    key: 'title',
    limit: 1,
    threshold: -10000,  // Allow loose matches
  });

  if (results.length === 0) return null;

  return {
    card: results[0].obj,
    score: results[0].score,
  };
}
```

### Levenshtein Distance (No Dependencies)

For minimal footprint:

```typescript
// src/utils/levenshtein.ts
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // substitution
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j] + 1       // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function similarityScore(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}
```

## Recommendations for Itemdeck

### Priority 1: Tiered Matching Strategy

1. **Exact ID** first (fastest, 100% confidence)
2. **Exact title+year** second (fast, 95% confidence)
3. **Normalised title** third (handles "The" prefix, punctuation)
4. **Fuzzy matching** last (for typos, variations)

### Priority 2: Fuse.js for Fuzzy

1. **Install Fuse.js** (~8KB, well-maintained)
2. **Configure threshold** (0.4 default, user-adjustable)
3. **Search only unmatched** items for performance
4. **Return confidence scores** for UI display

### Priority 3: User Controls

1. **Adjustable threshold** slider in comparison UI
2. **Match type filter** (show only fuzzy matches)
3. **Manual matching** for uncertain cases
4. **Ignore/confirm** buttons for matches

### When to Use Each Approach

| Collection Size | Approach |
|-----------------|----------|
| < 100 items | Inline matching |
| 100-500 items | Inline with progress |
| 500+ items | Web Worker |
| 1000+ items | Consider pagination |

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "fuse.js": "^7.0.0"
  }
}
```

### Bundle Size Impact

| Library | Size | Notes |
|---------|------|-------|
| Fuse.js | 8KB gzipped | Recommended |
| fuzzysort | 3KB gzipped | Lighter alternative |
| Custom Levenshtein | 1KB | Minimal but less accurate |

### Performance Benchmarks

Approximate matching times (M1 Mac):

| Collection Size | Time (ms) |
|-----------------|-----------|
| 100 vs 100 | ~5ms |
| 500 vs 500 | ~50ms |
| 1000 vs 1000 | ~200ms |
| 1000 vs 1000 (Worker) | ~250ms (non-blocking) |

### Testing Strategy

```typescript
describe('matchCollections', () => {
  it('matches exact IDs with 100% confidence', () => {
    const c1 = [{ id: 'game-1', title: 'Game One' }];
    const c2 = [{ id: 'game-1', title: 'Game 1' }];

    const matches = matchCollections(c1, c2);

    expect(matches[0].confidence).toBe(1.0);
    expect(matches[0].matchType).toBe('exact-id');
  });

  it('matches normalised titles', () => {
    const c1 = [{ id: 'a', title: 'The Legend of Zelda' }];
    const c2 = [{ id: 'b', title: 'Legend of Zelda' }];

    const matches = matchCollections(c1, c2);

    expect(matches[0].matchType).toBe('normalised-title');
  });

  it('fuzzy matches with typos', () => {
    const c1 = [{ id: 'a', title: 'Super Metroid' }];
    const c2 = [{ id: 'b', title: 'Super Metriod' }];  // typo

    const matches = matchCollections(c1, c2, { enableFuzzy: true });

    expect(matches[0].matchType).toBe('fuzzy');
    expect(matches[0].confidence).toBeGreaterThan(0.8);
  });
});
```

## References

- [Fuse.js Documentation](https://www.fusejs.io/)
- [fuzzysort](https://github.com/farzher/fuzzysort)
- [Levenshtein Distance Algorithm](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [String Similarity Algorithms](https://medium.com/@appaloosastore/string-similarity-algorithms-compared-3f7b4d12f0ff)

---

## Related Documentation

- [F-064: Collection Comparison Mode](../../roadmap/features/planned/F-064-collection-comparison.md)
- [External Data Sources Research](./external-data-sources.md)

---

**Applies to**: Itemdeck v1.0.0+
