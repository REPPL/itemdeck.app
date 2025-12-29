# Track B: Entity Auto-Discovery Enhancement (F-091)

## Features

- F-091: Entity Auto-Discovery

## Implementation Prompt

```
Enhance Entity Auto-Discovery with GitHub API rate limit handling.

## Context

The core auto-discovery is ALREADY IMPLEMENTED in:
- src/loaders/githubDiscovery.ts - GitHub API integration
- src/loaders/collectionLoader.ts - Integration at lines 163-181

Current loading order (already works):
1. Try {type}s/index.json
2. Try {type}s/_index.json
3. GitHub API auto-discovery (discoverEntitiesViaGitHub)
4. Fall back to {type}s.json
5. Fall back to {type}.json

This enhancement adds rate limit tracking to prevent failed API calls.

## Phase 1: Add Rate Limit Handling

Modify src/loaders/githubDiscovery.ts:

```typescript
/**
 * GitHub API rate limit info.
 */
interface RateLimitInfo {
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Track rate limit state.
 */
let lastRateLimitReset: number | null = null;

/**
 * Parse GitHub API rate limit headers.
 */
export function parseRateLimitHeaders(response: Response): RateLimitInfo | null {
  const remaining = response.headers.get("X-RateLimit-Remaining");
  const reset = response.headers.get("X-RateLimit-Reset");

  if (remaining && reset) {
    return {
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
    };
  }
  return null;
}

/**
 * Check if we should skip GitHub API due to rate limiting.
 */
export function isRateLimited(): boolean {
  if (!lastRateLimitReset) return false;
  return Date.now() / 1000 < lastRateLimitReset;
}

/**
 * Clear rate limit state (e.g., after reset time passes).
 */
export function clearRateLimitState(): void {
  lastRateLimitReset = null;
}
```

## Phase 2: Update discoverEntitiesViaGitHub

Modify the existing discoverEntitiesViaGitHub function:

```typescript
export async function discoverEntitiesViaGitHub(cdnUrl: string): Promise<string[] | null> {
  // Skip if currently rate limited
  if (isRateLimited()) {
    console.warn("[GitHub Discovery] Skipping due to rate limit");
    return null;
  }

  // ... existing URL parsing and API call logic ...

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      // User-Agent is required by GitHub API
      "User-Agent": "itemdeck-app",
    },
  });

  // Handle rate limiting
  if (!response.ok) {
    if (response.status === 403) {
      const rateLimit = parseRateLimitHeaders(response);
      if (rateLimit?.remaining === 0) {
        lastRateLimitReset = rateLimit.reset;
        const resetDate = new Date(rateLimit.reset * 1000);
        console.warn(
          `[GitHub Discovery] Rate limited until ${resetDate.toISOString()}`
        );
      }
    }
    return null;
  }

  // ... existing response parsing logic ...
}
```

## Phase 3: Add Tests

Create or update tests/loaders/githubDiscovery.test.ts:

```typescript
describe("GitHub Discovery Rate Limiting", () => {
  describe("parseRateLimitHeaders", () => {
    it("parses valid rate limit headers", () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Remaining", "42");
      headers.set("X-RateLimit-Reset", "1735500000");

      const response = new Response(null, { headers });
      const result = parseRateLimitHeaders(response);

      expect(result).toEqual({
        remaining: 42,
        reset: 1735500000,
      });
    });

    it("returns null for missing headers", () => {
      const response = new Response(null);
      const result = parseRateLimitHeaders(response);
      expect(result).toBeNull();
    });
  });

  describe("isRateLimited", () => {
    beforeEach(() => {
      clearRateLimitState();
    });

    it("returns false when no rate limit recorded", () => {
      expect(isRateLimited()).toBe(false);
    });

    it("returns true when rate limited and not expired", () => {
      // Set rate limit to future
      const futureReset = Math.floor(Date.now() / 1000) + 3600;
      // Would need to expose lastRateLimitReset for testing
    });
  });
});
```

## Files to Modify

- src/loaders/githubDiscovery.ts

## Files to Create (Optional)

- tests/loaders/githubDiscovery.test.ts (if not exists)

## Success Criteria

- [ ] parseRateLimitHeaders() extracts X-RateLimit-* headers
- [ ] isRateLimited() correctly checks rate limit state
- [ ] discoverEntitiesViaGitHub() skips API call when rate limited
- [ ] 403 responses with rate limit headers are handled
- [ ] Console warning shows when rate limited
- [ ] Existing auto-discovery functionality still works
- [ ] Tests pass
```

---

## Related Documentation

- [F-091 Feature Spec](../../../development/roadmap/features/planned/F-091-entity-auto-discovery.md)
- [GitHub Discovery Source](../../../../src/loaders/githubDiscovery.ts)
- [Collection Loader Source](../../../../src/loaders/collectionLoader.ts)
