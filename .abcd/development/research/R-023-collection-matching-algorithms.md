# R-023: Collection Matching Algorithms

## Executive Summary

This research examines algorithms and strategies for matching cards across collections, supporting F-064 (Collection Comparison). The goal is to identify duplicate, similar, and unique cards when comparing two or more collections.

## Current State in Itemdeck

### Card Data Structure

```typescript
interface Card {
  id: string;
  title: string;
  year?: number;
  category?: { id: string; title: string };
  platform?: { shortTitle: string };
  description?: string;
  // Additional metadata fields...
}
```

### Matching Requirements (from F-064)

1. **Exact Match:** Same ID across collections
2. **Title Match:** Same title, different IDs
3. **Fuzzy Match:** Similar titles (typos, variations)
4. **Field Match:** Same values in key fields (year, platform)

## Research Findings

### Match Types

| Type | Confidence | Criteria |
|------|------------|----------|
| **Exact** | 100% | Identical ID |
| **Title Exact** | 95% | Identical title (case-insensitive) |
| **Title Fuzzy** | 70-90% | Similar title (Levenshtein distance) |
| **Multi-Field** | 50-85% | Multiple fields match |
| **Potential** | 30-50% | Some similarity, needs review |

### String Similarity Algorithms

#### Levenshtein Distance

Minimum edits (insert, delete, substitute) to transform one string to another.

```typescript
function levenshtein(a: string, b: string): number {
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function levenshteinSimilarity(a: string, b: string): number {
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}
```

**Use case:** Detecting typos, minor variations
**Performance:** O(n×m) where n, m are string lengths

#### Jaro-Winkler Distance

Optimised for short strings, gives higher scores to strings matching from the beginning.

```typescript
function jaroWinkler(s1: string, s2: string): number {
  const jaro = jaroSimilarity(s1, s2);

  // Common prefix up to 4 characters
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  // Winkler modification
  const p = 0.1; // Scaling factor
  return jaro + prefix * p * (1 - jaro);
}
```

**Use case:** Names, titles with common prefixes
**Performance:** O(n×m)

#### Trigram Similarity

Compare sets of 3-character substrings.

```typescript
function trigrams(str: string): Set<string> {
  const s = `  ${str.toLowerCase()}  `;
  const result = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) {
    result.add(s.substring(i, i + 3));
  }
  return result;
}

function trigramSimilarity(a: string, b: string): number {
  const trigramsA = trigrams(a);
  const trigramsB = trigrams(b);

  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) intersection++;
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}
```

**Use case:** Longer strings, different word orders
**Performance:** O(n + m)

### Token-Based Matching

For titles with multiple words, token-based approaches work better.

```typescript
function tokenize(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(t => t.length > 1); // Remove single chars
}

function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  // Jaccard similarity
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}
```

**Use case:** "Super Mario Bros" vs "Mario Bros Super"
**Performance:** O(n + m)

### Multi-Field Matching

```typescript
interface FieldWeight {
  field: keyof Card;
  weight: number;
  matcher: 'exact' | 'fuzzy' | 'numeric';
}

const fieldWeights: FieldWeight[] = [
  { field: 'id', weight: 1.0, matcher: 'exact' },
  { field: 'title', weight: 0.6, matcher: 'fuzzy' },
  { field: 'year', weight: 0.2, matcher: 'numeric' },
  { field: 'platform', weight: 0.1, matcher: 'exact' },
  { field: 'category', weight: 0.1, matcher: 'exact' },
];

function multiFieldMatch(cardA: Card, cardB: Card): number {
  let score = 0;
  let totalWeight = 0;

  for (const { field, weight, matcher } of fieldWeights) {
    const valueA = cardA[field];
    const valueB = cardB[field];

    if (valueA == null || valueB == null) continue;

    totalWeight += weight;

    switch (matcher) {
      case 'exact':
        if (String(valueA).toLowerCase() === String(valueB).toLowerCase()) {
          score += weight;
        }
        break;
      case 'fuzzy':
        score += weight * levenshteinSimilarity(String(valueA), String(valueB));
        break;
      case 'numeric':
        if (valueA === valueB) {
          score += weight;
        }
        break;
    }
  }

  return totalWeight === 0 ? 0 : score / totalWeight;
}
```

### Matching Algorithm

```typescript
interface Match {
  cardA: Card;
  cardB: Card;
  matchType: 'exact' | 'title' | 'fuzzy' | 'field';
  confidence: number;
  matchedFields: string[];
}

interface MatchingOptions {
  fuzzyThreshold: number;     // Minimum similarity for fuzzy match (0.7-0.9)
  fieldThreshold: number;      // Minimum for multi-field match (0.5-0.7)
  maxMatches: number;          // Max matches per card
}

function findMatches(
  collectionA: Card[],
  collectionB: Card[],
  options: MatchingOptions
): Match[] {
  const matches: Match[] = [];
  const matchedB = new Set<string>();

  for (const cardA of collectionA) {
    // 1. Check exact ID match
    const exactMatch = collectionB.find(b => b.id === cardA.id);
    if (exactMatch && !matchedB.has(exactMatch.id)) {
      matches.push({
        cardA,
        cardB: exactMatch,
        matchType: 'exact',
        confidence: 1.0,
        matchedFields: ['id'],
      });
      matchedB.add(exactMatch.id);
      continue;
    }

    // 2. Check title matches
    const candidates: Array<{ card: Card; score: number; type: Match['matchType'] }> = [];

    for (const cardB of collectionB) {
      if (matchedB.has(cardB.id)) continue;

      // Exact title match
      if (cardA.title.toLowerCase() === cardB.title.toLowerCase()) {
        candidates.push({ card: cardB, score: 0.95, type: 'title' });
        continue;
      }

      // Fuzzy title match
      const titleSim = levenshteinSimilarity(cardA.title, cardB.title);
      if (titleSim >= options.fuzzyThreshold) {
        candidates.push({ card: cardB, score: titleSim * 0.9, type: 'fuzzy' });
        continue;
      }

      // Multi-field match
      const fieldScore = multiFieldMatch(cardA, cardB);
      if (fieldScore >= options.fieldThreshold) {
        candidates.push({ card: cardB, score: fieldScore * 0.85, type: 'field' });
      }
    }

    // Take best match
    if (candidates.length > 0) {
      const best = candidates.sort((a, b) => b.score - a.score)[0];
      matches.push({
        cardA,
        cardB: best.card,
        matchType: best.type,
        confidence: best.score,
        matchedFields: getMatchedFields(cardA, best.card),
      });
      matchedB.add(best.card.id);
    }
  }

  return matches;
}
```

### Performance Optimisation

#### Blocking / Indexing

Reduce comparison space by grouping similar cards.

```typescript
// Group by first letter of title
function createTitleIndex(cards: Card[]): Map<string, Card[]> {
  const index = new Map<string, Card[]>();

  for (const card of cards) {
    const key = card.title[0]?.toLowerCase() ?? '';
    if (!index.has(key)) index.set(key, []);
    index.get(key)!.push(card);
  }

  return index;
}

// Only compare cards in same block
function findMatchesWithBlocking(
  collectionA: Card[],
  collectionB: Card[],
  options: MatchingOptions
): Match[] {
  const indexB = createTitleIndex(collectionB);
  const matches: Match[] = [];

  for (const cardA of collectionA) {
    const key = cardA.title[0]?.toLowerCase() ?? '';
    const candidates = indexB.get(key) ?? [];

    // Compare only within block
    for (const cardB of candidates) {
      // ... matching logic
    }
  }

  return matches;
}
```

**Improvement:** Reduces O(n×m) to O(n×(m/26)) for alphabetical blocking

#### Early Termination

```typescript
function quickReject(cardA: Card, cardB: Card): boolean {
  // Year must be within 5 years
  if (cardA.year && cardB.year && Math.abs(cardA.year - cardB.year) > 5) {
    return true;
  }

  // Title length must be within 50%
  const lenA = cardA.title.length;
  const lenB = cardB.title.length;
  if (Math.abs(lenA - lenB) > Math.max(lenA, lenB) * 0.5) {
    return true;
  }

  return false;
}
```

### Threshold Tuning

| Scenario | Fuzzy Threshold | Field Threshold |
|----------|-----------------|-----------------|
| High precision (few false positives) | 0.90 | 0.80 |
| Balanced | 0.80 | 0.60 |
| High recall (find more matches) | 0.70 | 0.50 |

#### User-Configurable Thresholds

```typescript
interface MatchingPreferences {
  sensitivity: 'strict' | 'balanced' | 'loose';
  // OR explicit thresholds:
  fuzzyThreshold?: number;
  fieldThreshold?: number;
}

const presets: Record<string, MatchingOptions> = {
  strict: { fuzzyThreshold: 0.90, fieldThreshold: 0.80, maxMatches: 1 },
  balanced: { fuzzyThreshold: 0.80, fieldThreshold: 0.60, maxMatches: 3 },
  loose: { fuzzyThreshold: 0.70, fieldThreshold: 0.50, maxMatches: 5 },
};
```

### Conflict Resolution

When a card matches multiple candidates:

```typescript
interface MatchCandidate {
  card: Card;
  confidence: number;
  matchType: Match['matchType'];
}

function resolveConflicts(
  cardA: Card,
  candidates: MatchCandidate[]
): MatchCandidate | 'ambiguous' | 'none' {
  if (candidates.length === 0) return 'none';

  // Sort by confidence
  const sorted = candidates.sort((a, b) => b.confidence - a.confidence);

  // If top match is significantly better, use it
  if (sorted.length === 1 || sorted[0].confidence - sorted[1].confidence > 0.15) {
    return sorted[0];
  }

  // Otherwise, mark as ambiguous for user review
  return 'ambiguous';
}
```

### User Confirmation UX

```typescript
interface MatchReview {
  match: Match;
  status: 'confirmed' | 'rejected' | 'pending';
  reviewedAt?: Date;
}

// Show ambiguous matches for user confirmation
function getMatchesForReview(matches: Match[]): Match[] {
  return matches.filter(m =>
    m.matchType !== 'exact' &&
    (m.confidence < 0.9 || m.matchType === 'field')
  );
}
```

## Recommendations

### 1. Implement Tiered Matching

```typescript
const matchingPipeline = [
  { type: 'exact', matcher: exactIdMatch },
  { type: 'title', matcher: exactTitleMatch },
  { type: 'fuzzy', matcher: fuzzyTitleMatch, threshold: 0.80 },
  { type: 'field', matcher: multiFieldMatch, threshold: 0.60 },
];
```

### 2. Use Levenshtein for Short Strings, Trigrams for Long

```typescript
function selectMatcher(a: string, b: string): (a: string, b: string) => number {
  const avgLength = (a.length + b.length) / 2;
  return avgLength < 20 ? levenshteinSimilarity : trigramSimilarity;
}
```

### 3. Default Thresholds

- **Fuzzy:** 0.80 (balanced)
- **Field:** 0.60 (balanced)
- **Confidence display:** Show percentage to user

### 4. User Controls

- Sensitivity slider (strict/balanced/loose)
- Manual match/unmatch buttons
- "Review ambiguous" workflow

### 5. Performance Targets

- < 1 second for 500 vs 500 cards
- < 5 seconds for 1000 vs 1000 cards
- Use Web Worker for > 500 cards

## Implementation Considerations

### Testing

```typescript
const testCases = [
  // Exact matches
  { a: { id: '1', title: 'Pac-Man' }, b: { id: '1', title: 'Pac-Man' }, expected: 1.0 },

  // Title variations
  { a: { title: 'Super Mario Bros.' }, b: { title: 'Super Mario Bros' }, expected: 0.95 },
  { a: { title: 'Pac-Man' }, b: { title: 'Pacman' }, expected: 0.85 },

  // Near misses (should NOT match)
  { a: { title: 'Super Mario Bros' }, b: { title: 'Super Mario World' }, expected: 0.5 },
];
```

### Edge Cases

- Empty titles
- Very short titles (< 3 chars)
- Non-ASCII characters
- Numbers only (e.g., "1942")
- Subtitles and editions ("Doom (2016)" vs "Doom")

## References

- [Levenshtein Distance Algorithm](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [Jaro-Winkler Similarity](https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance)
- [Record Linkage](https://en.wikipedia.org/wiki/Record_linkage)
- [Dedupe Python Library](https://dedupe.io/)

---

## Related Documentation

- [F-064: Collection Comparison](../roadmap/features/planned/F-064-collection-comparison.md)
- [R-008: Fuzzy Matching](./R-008-fuzzy-matching.md)
- [R-020: Multi-Collection State Patterns](./R-020-multi-collection-state-patterns.md)

---

**Status**: Complete
