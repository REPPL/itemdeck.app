# External Data Sources

## Executive Summary

For Itemdeck's external data fetching needs, **TanStack Query** (formerly React Query) is the recommended primary library due to its superior caching, garbage collection, mutation support, and developer tools. For GitHub-specific data, **Octokit** provides type-safe access to the REST and GraphQL APIs.

Key recommendations:
1. Use TanStack Query for all data fetching with automatic caching and revalidation
2. Use Octokit for GitHub repository data integration
3. Design a unified data schema that works across different sources
4. Implement service worker caching for offline support with static card data

## Current State in Itemdeck

Itemdeck currently uses:
- **Mock data** in `src/data/cards.mock.ts` (100 cards)
- **No data fetching** - all data is bundled at build time
- **Settings Context** for configuration (runtime, but not persisted)

No external data integration exists yet.

## Research Findings

### Data Fetching Library Comparison

| Library | Weekly Downloads | GitHub Stars | Bundle Size | Best For |
|---------|-----------------|--------------|-------------|----------|
| [TanStack Query](https://tanstack.com/query) | 13M | 47.9k | ~12KB | Complex apps, mutations |
| [SWR](https://swr.vercel.app/) | 6.4M | 32.2k | ~4KB | Simple fetching, Next.js |
| [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) | Part of Redux | Part of Redux | ~11KB | Redux apps |

### TanStack Query vs SWR

| Feature | TanStack Query | SWR |
|---------|---------------|-----|
| DevTools | ✅ Official | ❌ Community only |
| Garbage Collection | ✅ Auto (5min default) | ❌ Manual |
| Stale Time Config | ✅ Fine-grained | ⚠️ Basic |
| Mutations | ✅ Built-in | ⚠️ useSWRMutation |
| Optimistic Updates | ✅ Excellent | ⚠️ Manual |
| Pagination/Infinite | ✅ Built-in hooks | ⚠️ useSWRInfinite |
| TypeScript | ✅ Excellent | ✅ Excellent |
| Bundle Size | ~12KB | ~4KB |
| Dependent Queries | ✅ Native | ⚠️ Conditional |

**Recommendation:** TanStack Query for Itemdeck's complex data needs (multiple sources, caching, potential offline support).

### GitHub API Integration

#### Octokit Overview

Octokit is the official GitHub SDK for JavaScript:

```bash
npm install octokit
```

```typescript
import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Optional for public repos
});

// Fetch repository info
const { data: repo } = await octokit.rest.repos.get({
  owner: 'anthropics',
  repo: 'claude-code',
});

// Fetch repository contents (e.g., card data file)
const { data: contents } = await octokit.rest.repos.getContent({
  owner: 'user',
  repo: 'card-collection',
  path: 'cards.json',
});
```

#### TypeScript Types

```typescript
import { Endpoints } from '@octokit/types';

type RepoResponse = Endpoints['GET /repos/{owner}/{repo}']['response'];
type ContentsResponse = Endpoints['GET /repos/{owner}/{repo}/contents/{path}']['response'];
```

#### Rate Limiting

| Auth Status | Requests/Hour | Notes |
|-------------|---------------|-------|
| Unauthenticated | 60 | Per IP address |
| Personal Access Token | 5,000 | Per user |
| GitHub App | 5,000 | Per installation |

### Data Schema Design

#### Unified Card Schema

Design a schema that works across sources:

```typescript
// src/types/card.ts

export interface CardSource {
  type: 'local' | 'github' | 'url' | 'api';
  url?: string;
  owner?: string;
  repo?: string;
  path?: string;
  lastFetched?: Date;
}

export interface Card {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  source: CardSource;
  attribution?: Attribution;
}

export interface Attribution {
  author?: string;
  licence?: string;
  sourceUrl?: string;
}

export interface CardCollection {
  id: string;
  name: string;
  description?: string;
  cards: Card[];
  source: CardSource;
  schema_version: string;
}
```

#### External JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CardCollection",
  "type": "object",
  "required": ["id", "name", "cards", "schema_version"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "description": { "type": "string" },
    "schema_version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "cards": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "imageUrl"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "imageUrl": { "type": "string", "format": "uri" },
          "category": { "type": "string" },
          "tags": { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  }
}
```

### Code Examples

#### TanStack Query Setup

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### Fetching Cards from GitHub

```typescript
// src/hooks/useGitHubCards.ts
import { useQuery } from '@tanstack/react-query';
import { Octokit } from 'octokit';
import type { CardCollection } from '../types/card';

const octokit = new Octokit();

interface GitHubSource {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
}

async function fetchGitHubCards(source: GitHubSource): Promise<CardCollection> {
  const { data } = await octokit.rest.repos.getContent({
    owner: source.owner,
    repo: source.repo,
    path: source.path,
    ref: source.branch,
  });

  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error('Expected a file, got a directory or other type');
  }

  const content = atob(data.content);
  const parsed = JSON.parse(content);

  // Validate schema version
  if (!parsed.schema_version) {
    throw new Error('Missing schema_version in card collection');
  }

  return {
    ...parsed,
    source: {
      type: 'github',
      owner: source.owner,
      repo: source.repo,
      path: source.path,
      lastFetched: new Date(),
    },
  };
}

export function useGitHubCards(source: GitHubSource) {
  return useQuery({
    queryKey: ['cards', 'github', source.owner, source.repo, source.path],
    queryFn: () => fetchGitHubCards(source),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
```

#### Fetching Cards from URL

```typescript
// src/hooks/useRemoteCards.ts
import { useQuery } from '@tanstack/react-query';
import type { CardCollection } from '../types/card';

async function fetchRemoteCards(url: string): Promise<CardCollection> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch cards: ${response.status}`);
  }

  const data = await response.json();

  return {
    ...data,
    source: {
      type: 'url',
      url,
      lastFetched: new Date(),
    },
  };
}

export function useRemoteCards(url: string, enabled = true) {
  return useQuery({
    queryKey: ['cards', 'remote', url],
    queryFn: () => fetchRemoteCards(url),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
```

#### Multiple Sources with Query Composition

```typescript
// src/hooks/useAllCards.ts
import { useQueries } from '@tanstack/react-query';
import type { CardSource, Card } from '../types/card';

interface CardSourceConfig {
  id: string;
  source: CardSource;
}

export function useAllCards(sources: CardSourceConfig[]) {
  const results = useQueries({
    queries: sources.map(config => ({
      queryKey: ['cards', config.source.type, config.id],
      queryFn: () => fetchCardsFromSource(config.source),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = results.some(r => r.isLoading);
  const isError = results.some(r => r.isError);
  const errors = results.filter(r => r.error).map(r => r.error);

  // Merge all cards from all sources
  const allCards: Card[] = results
    .filter(r => r.data)
    .flatMap(r => r.data!.cards);

  return {
    cards: allCards,
    isLoading,
    isError,
    errors,
    refetchAll: () => results.forEach(r => r.refetch()),
  };
}
```

### Caching Strategies

#### Service Worker for Offline Support

```typescript
// src/sw.ts (Workbox-based)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache-first for card images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'card-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Stale-while-revalidate for card data
registerRoute(
  ({ url }) => url.pathname.endsWith('.json') || url.pathname.includes('/cards'),
  new StaleWhileRevalidate({
    cacheName: 'card-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);
```

#### Caching Strategy Matrix

| Content Type | Strategy | Cache Duration | Rationale |
|--------------|----------|----------------|-----------|
| Card images | Cache-First | 30 days | Rarely change, large files |
| Card data JSON | Stale-While-Revalidate | 7 days | Balance freshness/speed |
| GitHub API | Network-First | 5 minutes | Respect rate limits |
| App shell | Cache-First | Until update | Static assets |

### Runtime Configuration Loading

```typescript
// src/config/loader.ts
interface RuntimeConfig {
  defaultSource?: {
    type: 'github' | 'url';
    owner?: string;
    repo?: string;
    path?: string;
    url?: string;
  };
  cacheSettings?: {
    staleTime: number;
    gcTime: number;
  };
}

let cachedConfig: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status}`);
    }
    cachedConfig = await response.json();
    return cachedConfig!;
  } catch (error) {
    console.warn('Failed to load runtime config, using defaults');
    return {};
  }
}

// Usage in app initialisation
export async function initializeApp() {
  const config = await loadRuntimeConfig();
  // Apply config to query client, etc.
}
```

### Error Handling Patterns

```typescript
// src/components/CardSourceError.tsx
import type { UseQueryResult } from '@tanstack/react-query';

interface CardSourceErrorProps {
  query: UseQueryResult<unknown, Error>;
  sourceName: string;
  onRetry: () => void;
}

export function CardSourceError({ query, sourceName, onRetry }: CardSourceErrorProps) {
  if (!query.isError) return null;

  const errorMessage = getErrorMessage(query.error);

  return (
    <div className="error-banner" role="alert">
      <h3>Failed to load {sourceName}</h3>
      <p>{errorMessage}</p>
      <button onClick={onRetry} disabled={query.isFetching}>
        {query.isFetching ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  );
}

function getErrorMessage(error: Error): string {
  if (error.message.includes('404')) {
    return 'Card collection not found. Check the source configuration.';
  }
  if (error.message.includes('rate limit')) {
    return 'GitHub API rate limit reached. Try again later.';
  }
  if (error.message.includes('network')) {
    return 'Network error. Check your connection.';
  }
  return error.message;
}
```

## Recommendations for Itemdeck

### Priority 1: TanStack Query Setup

1. **Install dependencies**: `npm install @tanstack/react-query @tanstack/react-query-devtools`
2. **Create QueryProvider** wrapper component
3. **Configure sensible defaults** (staleTime, gcTime, retry)
4. **Enable DevTools** in development

### Priority 2: Unified Data Schema

1. **Define Card and CardCollection types** with source tracking
2. **Create JSON Schema** for external validation
3. **Implement schema version checking** for backwards compatibility
4. **Add attribution fields** for image sources

### Priority 3: GitHub Integration

1. **Install Octokit**: `npm install octokit`
2. **Create useGitHubCards hook** for fetching from repos
3. **Handle rate limiting** gracefully
4. **Support public repos** (no auth required)

### Priority 4: Offline Support

1. **Add Workbox** for service worker generation
2. **Implement image caching** (cache-first)
3. **Cache card data** (stale-while-revalidate)
4. **Handle offline state** in UI

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "octokit": "^4.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.x",
    "workbox-precaching": "^7.x",
    "workbox-routing": "^7.x",
    "workbox-strategies": "^7.x"
  }
}
```

### Bundle Size Impact

- TanStack Query: ~12KB gzipped
- Octokit: ~15KB gzipped
- Workbox: ~5KB per strategy

### Security Considerations

- **Never expose API tokens** in client-side code
- **Validate external data** with Zod or similar
- **Sanitise URLs** before fetching
- **Use CSP headers** for allowed data sources

See [System Security](./system-security.md) for detailed security requirements.

### Breaking Changes

None - additive features to existing mock data system.

### Migration Path

1. Keep mock data as fallback/development source
2. Add TanStack Query provider to app root
3. Create hooks for each source type
4. Update CardGrid to use hooks
5. Add source selection UI in settings

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Query vs SWR Comparison](https://tanstack.com/query/latest/docs/react/comparison)
- [SWR Documentation](https://swr.vercel.app/)
- [Octokit REST.js](https://octokit.github.io/rest.js/v22/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [PWA Caching Strategies](https://web.dev/articles/offline-cookbook)
- [npm Trends Comparison](https://npmtrends.com/@tanstack/react-query-vs-swr)

---

## Related Documentation

- [Configuration Hierarchy](./configuration-hierarchy.md) - How to structure external config
- [System Security](./system-security.md) - Secure data fetching
- [State Persistence](./state-persistence.md) - Caching and offline storage

---

**Applies to**: Itemdeck v0.1.0+
