# F-007: GitHub Data Source

## Problem Statement

Users want to display card collections from GitHub repositories. This requires:

1. Fetching data from GitHub (raw URLs or API)
2. Parsing repository content (JSON files)
3. Handling rate limits (for API approach)
4. Supporting collection-based data structure from external repositories

## Design Approach

Support two fetching strategies for GitHub-hosted data:

### Strategy 1: Raw URL (Recommended)

For public repositories, fetch JSON directly via raw URLs. This avoids API rate limits and is simpler.

```typescript
// src/hooks/useGitHubRawData.ts
import { useQuery } from '@tanstack/react-query';
import { collectionSchema } from '../schemas/collection';
import type { Collection } from '../types/collection';

interface GitHubRawConfig {
  owner: string;
  repo: string;
  collection: string;
  branch?: string;
}

function buildRawUrl(config: GitHubRawConfig, file: string): string {
  const { owner, repo, collection, branch = 'main' } = config;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data/collections/${collection}/${file}`;
}

async function fetchGitHubRaw(config: GitHubRawConfig): Promise<Collection> {
  // 1. Fetch collection.json to get schema info
  const collectionMetaResponse = await fetch(buildRawUrl(config, 'collection.json'));
  if (!collectionMetaResponse.ok) {
    throw new Error(`Failed to fetch collection metadata: ${collectionMetaResponse.status}`);
  }
  const collectionMeta = await collectionMetaResponse.json();

  // 2. Fetch data files (discovered by convention based on schema)
  const [itemsResponse, categoriesResponse] = await Promise.all([
    fetch(buildRawUrl(config, 'items.json')),
    fetch(buildRawUrl(config, 'categories.json')),
  ]);

  if (!itemsResponse.ok) {
    throw new Error(`Failed to fetch items: ${itemsResponse.status}`);
  }
  if (!categoriesResponse.ok) {
    throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
  }

  const [items, categories] = await Promise.all([
    itemsResponse.json(),
    categoriesResponse.json(),
  ]);

  return collectionSchema.parse({ items, categories, meta: collectionMeta });
}

export function useGitHubCollection(
  config: GitHubRawConfig,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['github', 'raw', config.owner, config.repo, config.collection, config.branch],
    queryFn: () => fetchGitHubRaw(config),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}
```

### Strategy 2: Octokit API

For private repositories or when needing additional GitHub features (e.g., file metadata):

```typescript
// src/lib/github.ts
import { Octokit } from 'octokit';

// Unauthenticated client (60 requests/hour)
export const octokit = new Octokit();

// Authenticated client (5000 requests/hour)
export function createAuthenticatedClient(token: string) {
  return new Octokit({ auth: token });
}
```

### Collection Discovery

Fetch the repository manifest to discover available collections:

```typescript
// src/hooks/useGitHubManifest.ts
interface ManifestCollection {
  path: string;
  name: string;
  description: string;
  schema: string;
  schemaVersion: string;
  itemCount: number;
  categoryCount: number;
  featured: boolean;
}

interface Manifest {
  version: string;
  collections: ManifestCollection[];
}

async function fetchManifest(owner: string, repo: string, branch = 'main'): Promise<Manifest> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/manifest.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Manifest not found');
  return response.json();
}

export function useGitHubManifest(owner: string, repo: string, branch?: string) {
  return useQuery({
    queryKey: ['github', 'manifest', owner, repo, branch],
    queryFn: () => fetchManifest(owner, repo, branch),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
```

### Default Data Source

Configure the default data source for the demo:

```typescript
// src/config/dataSource.ts
export const defaultDataSource: GitHubRawConfig = {
  owner: 'REPPL',
  repo: 'MyPlausibleMe',
  collection: 'retro-games',
  branch: 'main',
};
```

### Rate Limit Handling (API Strategy)

```typescript
// src/lib/githubRateLimit.ts
import { useQuery } from '@tanstack/react-query';
import { octokit } from './github';

export function useGitHubRateLimit() {
  return useQuery({
    queryKey: ['github', 'rate-limit'],
    queryFn: async () => {
      const response = await octokit.rest.rateLimit.get();
      return response.data.rate;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
```

## Implementation Tasks

- [ ] Create `src/hooks/useGitHubCollection.ts` with raw URL fetching
- [ ] Create `src/hooks/useGitHubManifest.ts` for collection discovery
- [ ] Create `src/config/dataSource.ts` with default configuration
- [ ] Add Zod validation for fetched data (use collection schema)
- [ ] Implement error handling for 404, network errors
- [ ] Create loading and error states in UI
- [ ] (Optional) Install Octokit for API strategy: `npm install octokit`
- [ ] (Optional) Implement rate limit checking for API strategy
- [ ] Write integration tests with mocked responses

## Success Criteria

- [ ] Can fetch items.json and categories.json from GitHub raw URLs
- [ ] Data validated against collection schema
- [ ] 404 errors handled gracefully with user feedback
- [ ] Network errors handled with retry option
- [ ] Default data source loads on app start
- [ ] (Optional) Manifest discovery works for collection switching
- [ ] Tests pass

## Dependencies

- **Requires**: F-006 TanStack Query Setup, F-008 Card Data Schema
- **Blocks**: None

## Complexity

**Medium** - External data fetching with error handling and validation.

---

## Related Documentation

- [Data Repository Architecture](../../research/data-repository-architecture.md)
- [External Data Sources Research](../../research/external-data-sources.md)
- [v0.2.0 Milestone](../milestones/v0.2.0.md)
