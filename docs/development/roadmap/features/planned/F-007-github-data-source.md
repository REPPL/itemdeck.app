# F-007: GitHub Data Source

## Problem Statement

Users want to display card collections from GitHub repositories. This requires:

1. Fetching data from GitHub API
2. Parsing repository content (JSON/YAML files)
3. Handling rate limits and authentication
4. Mapping repository data to card schema

## Design Approach

Implement a **GitHub data source adapter** using **Octokit** (official GitHub SDK):

### Octokit Setup

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

### GitHub Data Source Hook

```typescript
// src/hooks/useGitHubCards.ts
import { useQuery } from '@tanstack/react-query';
import { octokit } from '../lib/github';
import { CardDataSchema } from '../schemas/card';
import type { CardData } from '../types/card';

interface GitHubSourceConfig {
  owner: string;
  repo: string;
  path: string;  // e.g., 'data/cards.json'
  branch?: string;
}

async function fetchGitHubCards(config: GitHubSourceConfig): Promise<CardData[]> {
  const { owner, repo, path, branch = 'main' } = config;

  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });

  if (Array.isArray(response.data) || response.data.type !== 'file') {
    throw new Error('Expected a file, got directory');
  }

  const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
  const parsed = JSON.parse(content);

  // Validate each card
  const cards = Array.isArray(parsed) ? parsed : parsed.cards;
  return cards.map((card: unknown) => CardDataSchema.parse(card));
}

export function useGitHubCards(
  config: GitHubSourceConfig,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['github', config.owner, config.repo, config.path, config.branch],
    queryFn: () => fetchGitHubCards(config),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}
```

### Rate Limit Handling

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

export function RateLimitIndicator() {
  const { data: rateLimit } = useGitHubRateLimit();

  if (!rateLimit) return null;

  const percentUsed = ((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100;

  if (percentUsed < 50) return null;

  return (
    <div role="status" aria-live="polite">
      GitHub API: {rateLimit.remaining}/{rateLimit.limit} requests remaining
    </div>
  );
}
```

### Repository Configuration UI

```tsx
// src/components/GitHubSourceConfig.tsx
interface GitHubSourceFormData {
  owner: string;
  repo: string;
  path: string;
  branch: string;
}

export function GitHubSourceConfig({ onSubmit }: { onSubmit: (data: GitHubSourceFormData) => void }) {
  const [formData, setFormData] = useState<GitHubSourceFormData>({
    owner: '',
    repo: '',
    path: 'cards.json',
    branch: 'main',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
      <label>
        Owner:
        <input
          value={formData.owner}
          onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          placeholder="username or org"
          required
        />
      </label>
      <label>
        Repository:
        <input
          value={formData.repo}
          onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
          placeholder="repository-name"
          required
        />
      </label>
      <label>
        Path:
        <input
          value={formData.path}
          onChange={(e) => setFormData({ ...formData, path: e.target.value })}
          placeholder="path/to/cards.json"
        />
      </label>
      <button type="submit">Load Cards</button>
    </form>
  );
}
```

## Implementation Tasks

- [ ] Install Octokit: `npm install octokit`
- [ ] Create `src/lib/github.ts` with Octokit setup
- [ ] Create `useGitHubCards` hook
- [ ] Implement base64 content decoding
- [ ] Add Zod validation for fetched data
- [ ] Implement rate limit checking
- [ ] Create rate limit indicator component
- [ ] Create repository configuration UI
- [ ] Add error handling for 404, rate limits
- [ ] Support optional authentication token
- [ ] Write integration tests with mocked responses

## Success Criteria

- [ ] Can fetch cards.json from public GitHub repo
- [ ] Data validated against card schema
- [ ] Rate limits displayed when low
- [ ] 404 errors handled gracefully
- [ ] Rate limit errors handled with retry guidance
- [ ] Works without authentication (limited)
- [ ] Works with authentication (higher limits)
- [ ] Tests pass

## Dependencies

- **Requires**: F-006 TanStack Query Setup, F-008 Card Data Schema
- **Blocks**: None

## Complexity

**Medium** - External API integration with error handling.

---

## Related Documentation

- [External Data Sources Research](../../../../research/external-data-sources.md)
- [v0.2.0 Milestone](../../milestones/v0.2.md)
