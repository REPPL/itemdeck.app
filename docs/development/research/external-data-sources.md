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

---

# Part 2: CDN Proxies and CORS (December 2025 Research)

## The CORS Problem

When fetching from `raw.githubusercontent.com` in a client-side SPA, browsers block requests:

```
Access to fetch at 'https://raw.githubusercontent.com/...'
from origin 'https://itemdeck.example.com' has been blocked by CORS policy
```

GitHub's raw content service:
- Does not set `Access-Control-Allow-Origin` headers
- Blocks preflight requests (OPTIONS)
- Only allows simple GET/HEAD requests without custom headers

This means **direct fetching from GitHub raw URLs does not work** in browser JavaScript.

## Solution: CDN Proxies

### Recommended: jsDelivr

[jsDelivr](https://www.jsdelivr.com/) is a free, production-ready CDN that serves GitHub files with proper CORS headers.

**URL Format**:
```
https://cdn.jsdelivr.net/gh/{user}/{repo}@{branch}/{path}
```

**Example**:
```
https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games/items.json
```

**Key Benefits**:
- CORS-friendly (`Access-Control-Allow-Origin: *`)
- Multi-CDN infrastructure (Cloudflare, Fastly, Bunny, GCore)
- 99.99%+ uptime with automatic failover
- Permanent caching (files remain even if deleted from source)
- Version pinning with `@tag` or `@commit`

**Caching Behaviour**:
| Reference Type | Cache Duration |
|----------------|----------------|
| Commit SHA | Permanent |
| Tag | Permanent |
| `@latest` | 7 days (purgeable) |
| Branch | 12 hours |

### Alternative: Statically (Multi-Provider)

[Statically](https://statically.io/) supports multiple Git providers with a unified URL pattern.

**URL Formats**:
```
GitHub:    https://cdn.statically.io/gh/{user}/{repo}@{tag}/{file}
GitLab:    https://cdn.statically.io/gl/{user}/{repo}@{tag}/{file}
Bitbucket: https://cdn.statically.io/bb/{user}/{repo}@{tag}/{file}
```

**Use case**: When GitLab support is needed alongside GitHub.

### Comparison Table

| Feature | jsDelivr | Statically | raw.githubusercontent.com |
|---------|----------|------------|---------------------------|
| CORS Support | Yes | Yes | **No** |
| Multi-CDN | Yes (4 providers) | Yes (2 providers) | No |
| Uptime SLA | 99.99%+ | ~99.9% | No SLA |
| Permanent Cache | Yes | No | No |
| GitLab Support | No | Yes | N/A |
| Production Ready | Yes | Yes | No |

## URL Structure Design

itemdeck supports two URL patterns for different use cases:

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Short form** | Sharing, bookmarks, clean links | `/gh/REPPL/retro-games` |
| **Query param** | Power users, arbitrary repos, debugging | `/view?url=https://raw.githubusercontent.com/...` |

---

### Option 1: Short Form (Recommended for Sharing)

```
https://itemdeck.example.com/gh/{user}/{collection}
https://itemdeck.example.com/gl/{user}/{collection}
```

**Examples**:
```
/gh/REPPL/retro-games           → GitHub user REPPL, collection retro-games
/gl/username/favourite-books    → GitLab user username, collection favourite-books
```

**How it works**:
- Repository name is inferred by convention (e.g., always `MyPlausibleMe` or `collections`)
- Path within repo follows standard structure: `data/collections/{collection}/`
- Shortest possible URL for easy sharing

**With explicit repository** (when user has multiple data repos):
```
/gh/REPPL/other-repo/my-collection
```

**Pros**:
- Clean, memorable URLs
- Easy to share verbally ("go to itemdeck.com/gh/REPPL/retro-games")
- Minimal cognitive load for end users

**Cons**:
- Assumes convention-based repository structure
- Less flexible for non-standard setups

---

### Option 2: Query Parameter (Power User Escape Hatch)

```
https://itemdeck.example.com/view?url={encoded-github-url}
```

**Examples**:
```
/view?url=https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/retro-games/items.json
/view?url=https://github.com/REPPL/MyPlausibleMe/blob/main/data/collections/retro-games/items.json
```

**How it works**:
1. User copies any GitHub URL (raw or blob view)
2. App parses the URL to extract: owner, repo, branch, path
3. Converts to CDN URL: `raw.githubusercontent.com` → `cdn.jsdelivr.net`
4. Validates against domain allowlist
5. Fetches and displays collection

**Supported input URL formats**:
```
# Raw content URL
https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}

# GitHub blob view URL
https://github.com/{user}/{repo}/blob/{branch}/{path}

# jsDelivr CDN URL (passed through)
https://cdn.jsdelivr.net/gh/{user}/{repo}@{branch}/{path}
```

**Pros**:
- Users can copy URLs directly from GitHub
- No need to understand itemdeck's URL structure
- Works with any repository path structure
- Useful for debugging and testing

**Cons**:
- Long URLs (typically hidden behind share button)
- Requires URL encoding for special characters

---

### URL Parsing Implementation

```typescript
type Provider = 'github' | 'gitlab';

interface DataSourceConfig {
  provider: Provider;
  user: string;
  repo: string;
  collection: string;
  branch?: string;
}

// Default repository name when not specified
const DEFAULT_REPO = 'MyPlausibleMe';

/**
 * Parse short-form URL: /gh/REPPL/retro-games or /gh/REPPL/other-repo/collection
 */
function parseShortUrl(path: string): DataSourceConfig | null {
  // Match: /gh/user/collection or /gh/user/repo/collection
  const match = path.match(/^\/(gh|gl)\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return null;

  const [, providerCode, user, second, third] = match;
  const provider = providerCode === 'gh' ? 'github' : 'gitlab';

  // If third segment exists: /gh/user/repo/collection
  // Otherwise: /gh/user/collection (infer repo)
  if (third) {
    return { provider, user, repo: second, collection: third };
  } else {
    return { provider, user, repo: DEFAULT_REPO, collection: second };
  }
}

/**
 * Parse GitHub URL from query parameter
 */
function parseGitHubUrl(url: string): DataSourceConfig | null {
  try {
    const parsed = new URL(url);

    // raw.githubusercontent.com/{user}/{repo}/{branch}/{path}
    if (parsed.hostname === 'raw.githubusercontent.com') {
      const [, user, repo, branch, ...pathParts] = parsed.pathname.split('/');
      const collection = extractCollectionFromPath(pathParts.join('/'));
      return { provider: 'github', user, repo, collection, branch };
    }

    // github.com/{user}/{repo}/blob/{branch}/{path}
    if (parsed.hostname === 'github.com') {
      const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
      if (match) {
        const [, user, repo, branch, path] = match;
        const collection = extractCollectionFromPath(path);
        return { provider: 'github', user, repo, collection, branch };
      }
    }

    // cdn.jsdelivr.net/gh/{user}/{repo}@{branch}/{path}
    if (parsed.hostname === 'cdn.jsdelivr.net') {
      const match = parsed.pathname.match(/^\/gh\/([^/]+)\/([^@]+)@([^/]+)\/(.+)/);
      if (match) {
        const [, user, repo, branch, path] = match;
        const collection = extractCollectionFromPath(path);
        return { provider: 'github', user, repo, collection, branch };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract collection name from path like "data/collections/retro-games/items.json"
 */
function extractCollectionFromPath(path: string): string {
  const match = path.match(/data\/collections\/([^/]+)/);
  return match ? match[1] : path.split('/').pop()?.replace('.json', '') ?? '';
}

/**
 * Build CDN URL from config
 */
function buildCdnUrl(config: DataSourceConfig): string {
  const { provider, user, repo, collection, branch = 'main' } = config;
  const path = `data/collections/${collection}`;

  switch (provider) {
    case 'github':
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    case 'gitlab':
      return `https://cdn.statically.io/gl/${user}/${repo}@${branch}/${path}`;
  }
}
```

### React Router Configuration

```typescript
import { Routes, Route, useParams, useSearchParams } from 'react-router-dom';

function App() {
  return (
    <Routes>
      {/* Short form: /gh/user/collection or /gh/user/repo/collection */}
      <Route path="/:provider/:user/:collection" element={<CollectionView />} />
      <Route path="/:provider/:user/:repo/:collection" element={<CollectionView />} />

      {/* Query param form: /view?url=... */}
      <Route path="/view" element={<CollectionViewFromUrl />} />

      {/* Home/demo */}
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

function CollectionView() {
  const { provider, user, repo, collection } = useParams();
  const config = {
    provider: provider === 'gh' ? 'github' : 'gitlab',
    user: user!,
    repo: repo ?? DEFAULT_REPO,
    collection: collection!,
  };
  return <CollectionDisplay config={config} />;
}

function CollectionViewFromUrl() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');

  if (!url) {
    return <Error message="Missing url parameter" />;
  }

  const config = parseGitHubUrl(url);
  if (!config) {
    return <Error message="Could not parse URL" />;
  }

  return <CollectionDisplay config={config} />;
}
```

### URL Conversion Examples

| User Input | Resolved CDN URL |
|------------|------------------|
| `/gh/REPPL/retro-games` | `cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games/items.json` |
| `/gh/REPPL/other-repo/games` | `cdn.jsdelivr.net/gh/REPPL/other-repo@main/data/collections/games/items.json` |
| `/view?url=https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/retro-games/items.json` | `cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games/items.json` |
| `/view?url=https://github.com/REPPL/MyPlausibleMe/blob/main/data/collections/retro-games/items.json` | `cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games/items.json` |

## Security: Domain Allowlisting

### Application-Level Allowlist

Since CSP headers cannot be configured on static hosting without build-time decisions, implement allowlisting in application code:

```typescript
// src/config/allowedSources.ts
export const ALLOWED_CDN_DOMAINS = [
  'cdn.jsdelivr.net',
  'cdn.statically.io',
] as const;

export const ALLOWED_PROVIDERS = ['github', 'gitlab'] as const;

export function isAllowedSource(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_CDN_DOMAINS.some(domain => hostname === domain);
  } catch {
    return false;
  }
}
```

### Error Handling for Unauthorised Sources

```typescript
class UnsupportedSourceError extends Error {
  constructor(provider: string) {
    super(
      `Data source "${provider}" is not yet supported. ` +
      `Supported providers: ${ALLOWED_PROVIDERS.join(', ')}. ` +
      `Request new providers at: https://github.com/REPPL/itemdeck/issues`
    );
    this.name = 'UnsupportedSourceError';
  }
}
```

**Best Practice**: Show clear error message with:
1. What went wrong
2. List of supported providers
3. Link to request new providers

### Future: Content Security Policy

When hosting on a platform with header control (Netlify, Vercel), add CSP:

```
Content-Security-Policy:
  default-src 'self';
  connect-src 'self' https://cdn.jsdelivr.net https://cdn.statically.io;
  img-src 'self' https: data:;
```

## Authentication: Public vs Private Repos

### Current Scope: Public Only

For public repositories, no authentication is needed. CDN proxies (jsDelivr, Statically) work directly.

### Future: Private Repository Support

**Challenge**: SPAs cannot securely store secrets (OAuth client secrets, access tokens).

**Recommended Approach: Backend for Frontend (BFF)**

Add a lightweight backend proxy (Cloudflare Worker, Vercel Edge Function):
- Backend handles OAuth flow and token storage
- SPA uses HTTP-only cookies
- Tokens never exposed to JavaScript

**Alternative for Personal Use: User-Provided PAT**
- User pastes their Personal Access Token into settings
- Token stored in localStorage (with clear security warnings)
- Only suitable for personal/trusted deployments

**Recommendation**: Start with public repos only. Implement BFF pattern when private repo support is needed.

## Complete Fetch Implementation

```typescript
import { z } from 'zod';

// Schemas
const cardDataSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  year: z.string().optional(),
  imageUrl: z.string().url().optional(),
  summary: z.string().optional(),
  detailUrl: z.string().url().optional(),
  metadata: z.record(z.string()).optional(),
});

const categorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  year: z.string().optional(),
  summary: z.string().optional(),
  detailUrl: z.string().url().optional(),
});

// Fetch with validation
async function fetchCollection(config: DataSourceConfig) {
  // 1. Validate provider
  if (!ALLOWED_PROVIDERS.includes(config.provider)) {
    throw new UnsupportedSourceError(config.provider);
  }

  // 2. Build CDN URL
  const baseUrl = buildCdnUrl(config);
  const itemsUrl = `${baseUrl}/items.json`;
  const categoriesUrl = `${baseUrl}/categories.json`;

  // 3. Validate allowlist
  if (!isAllowedSource(itemsUrl)) {
    throw new Error('Data source not on allowlist');
  }

  // 4. Fetch with error handling
  const [itemsRes, categoriesRes] = await Promise.all([
    fetch(itemsUrl),
    fetch(categoriesUrl).catch(() => null),
  ]);

  if (!itemsRes.ok) {
    throw new Error(`Collection not found: ${itemsRes.status}`);
  }

  // 5. Parse and validate
  const items = z.array(cardDataSchema).parse(await itemsRes.json());
  const categories = categoriesRes?.ok
    ? z.array(categorySchema).parse(await categoriesRes.json())
    : [];

  return { items, categories };
}
```

## Error Handling Matrix

| Error Type | User Message | Action |
|------------|--------------|--------|
| Network error | "Unable to reach data source" | Retry button |
| 404 Not Found | "Collection not found" | Check URL guidance |
| Invalid JSON | "Data format error" | Link to schema docs |
| Schema validation | "Data doesn't match expected format" | Show field errors |
| Unsupported provider | "Provider not yet supported" | List alternatives |

## Implementation Recommendations

### Immediate (v0.2.0)

1. **Use jsDelivr for GitHub** - Best reliability and caching
2. **Application-level allowlist** - Validate URLs before fetching
3. **Clear error messages** - Guide users to supported providers
4. **Pin to branches** - Use `@main` for development flexibility

### Near-term

1. **Add Statically for GitLab** - Unified multi-provider approach
2. **TanStack Query caching** - Reduce CDN hits
3. **Offline support** - Service worker for cached collections

### Future

1. **Private repo support via BFF** - Cloudflare Worker or Vercel Edge
2. **Custom domain allowlist** - Let users add their own CDN sources
3. **Collection discovery** - Fetch manifest.json for available collections

## Sources

- [CORS and raw.githubusercontent.com - GitHub Community](https://github.com/orgs/community/discussions/69281)
- [jsDelivr - Migrate from GitHub](https://www.jsdelivr.com/github)
- [jsDelivr GitHub Repository](https://github.com/jsdelivr/jsdelivr)
- [Statically CDN](https://statically.io/)
- [Content Security Policy - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [Content Security Policy - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [GitLab Repository Files API](https://docs.gitlab.com/api/repository_files/)
- [OAuth for SPAs - Curity](https://curity.io/resources/learn/spa-best-practices/)
- [React Router Dynamic Segments](https://reactrouter.com/how-to/spa)
- [jsDelivr CDN Performance](https://www.cdnperf.com/cdn-provider/jsdelivr-cdn/)
