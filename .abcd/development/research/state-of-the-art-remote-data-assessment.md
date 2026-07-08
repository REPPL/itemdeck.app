# State of the Art: Remote Data Source Assessment

## Executive Summary

This research document analyses best practices for assessing, validating, and managing remote data sources in web applications, with specific focus on GitHub-hosted collections. The key recommendations for itemdeck are:

1. **Use jsDelivr CDN** for GitHub data fetching (avoids CORS and rate limits)
2. **Implement lightweight health checks** using HEAD requests before full data loads
3. **Cache validation results** with TanStack Query (5-minute stale time for health, 1-hour for manifests)
4. **Adopt RFC-compliant health response format** for internal consistency
5. **Progressive validation** - check accessibility first, then schema compatibility, then data quality

The May 2025 GitHub rate limit changes make CDN proxies essential for production use.

## Current State in itemdeck

### Existing Infrastructure

| Component | Location | Purpose |
|-----------|----------|---------|
| `useGitHubCollection` | `src/hooks/useGitHubCollection.ts` | Fetches collection from GitHub |
| `buildRawUrl` | `src/config/dataSource.ts` | Constructs raw.githubusercontent.com URLs |
| `buildManifestUrl` | `src/config/dataSource.ts` | Constructs manifest.json URL |
| `allowedSources.ts` | `src/config/allowedSources.ts` | CDN and provider allowlists |
| Zod schemas | `src/schemas/` | Runtime validation |
| TanStack Query | Provider in `main.tsx` | Caching and state management |

### Current Gaps

1. **No pre-load validation** - Errors only surface after full fetch attempt
2. **No schema compatibility check** - Mismatched versions cause runtime errors
3. **No manifest discovery UI** - `buildManifestUrl` exists but isn't used
4. **Hardcoded default source** - No user source management
5. **No rate limit awareness** - Basic retry only
6. **No data quality indicators** - Missing images not flagged

## Research Findings

### 1. Repository Health Check Patterns

#### HEAD Request Pattern (Recommended)

Use HTTP HEAD requests for lightweight accessibility checks without downloading content:

```typescript
async function checkSourceAccessibility(url: string): Promise<HealthCheckResult> {
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store' // Always check live status
    });

    const latency = performance.now() - start;

    return {
      accessible: response.ok,
      status: response.status,
      latency,
      headers: {
        etag: response.headers.get('etag'),
        lastModified: response.headers.get('last-modified'),
        cacheControl: response.headers.get('cache-control'),
      },
    };
  } catch (error) {
    return {
      accessible: false,
      status: 0,
      latency: performance.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

#### Multi-File Health Check

For collections with multiple files, check critical files in parallel:

```typescript
async function checkCollectionHealth(
  baseUrl: string
): Promise<CollectionHealthResult> {
  const criticalFiles = ['collection.json', 'items.json'];
  const optionalFiles = ['categories.json', 'manifest.json'];

  const [criticalResults, optionalResults] = await Promise.all([
    Promise.all(criticalFiles.map(f => checkSourceAccessibility(`${baseUrl}/${f}`))),
    Promise.all(optionalFiles.map(f => checkSourceAccessibility(`${baseUrl}/${f}`))),
  ]);

  const allCriticalOk = criticalResults.every(r => r.accessible);
  const avgLatency = criticalResults.reduce((sum, r) => sum + r.latency, 0) / criticalResults.length;

  return {
    status: allCriticalOk ? 'healthy' : 'unavailable',
    criticalFiles: criticalResults,
    optionalFiles: optionalResults,
    averageLatency: avgLatency,
  };
}
```

### 2. Schema Discovery and Introspection

#### Schema Version Detection

Fetch and parse collection.json to determine schema version before loading data:

```typescript
interface SchemaInfo {
  schemaVersion: string;
  entityTypes: string[];
  primaryEntity: string;
}

async function discoverSchema(collectionUrl: string): Promise<SchemaInfo> {
  const response = await fetch(`${collectionUrl}/collection.json`);
  if (!response.ok) {
    throw new Error(`Collection metadata not found: ${response.status}`);
  }

  const data = await response.json();

  return {
    schemaVersion: data.schemaVersion ?? 'v1',
    entityTypes: Object.keys(data.entityTypes ?? {}),
    primaryEntity: data.display?.primaryEntity ?? 'item',
  };
}
```

#### Compatibility Matrix

```typescript
const SUPPORTED_SCHEMA_VERSIONS = ['v1', 'v2'] as const;
type SupportedVersion = typeof SUPPORTED_SCHEMA_VERSIONS[number];

function isSchemaCompatible(version: string): version is SupportedVersion {
  return SUPPORTED_SCHEMA_VERSIONS.includes(version as SupportedVersion);
}

function getCompatibilityMessage(version: string): string {
  if (isSchemaCompatible(version)) {
    return `Schema ${version} is fully supported`;
  }

  const majorVersion = version.match(/^v?(\d+)/)?.[1];
  if (majorVersion && parseInt(majorVersion) > 2) {
    return `Schema ${version} is newer than supported. Some features may not work.`;
  }

  return `Schema ${version} is not supported. Please upgrade the collection.`;
}
```

### 3. Progressive Loading Strategies

#### Three-Phase Validation

```
Phase 1: Accessibility Check (HEAD request)
    ↓ Pass
Phase 2: Schema Discovery (collection.json)
    ↓ Compatible
Phase 3: Data Loading (items.json, etc.)
```

```typescript
async function progressiveLoad(
  source: GitHubRawConfig,
  onProgress: (phase: string, status: 'loading' | 'success' | 'error') => void
): Promise<Collection> {
  // Phase 1: Accessibility
  onProgress('accessibility', 'loading');
  const health = await checkSourceAccessibility(buildRawUrl(source, 'collection.json'));
  if (!health.accessible) {
    onProgress('accessibility', 'error');
    throw new SourceUnavailableError(source, health.error);
  }
  onProgress('accessibility', 'success');

  // Phase 2: Schema Discovery
  onProgress('schema', 'loading');
  const schema = await discoverSchema(buildCollectionUrl(source));
  if (!isSchemaCompatible(schema.schemaVersion)) {
    onProgress('schema', 'error');
    throw new SchemaIncompatibleError(schema.schemaVersion, SUPPORTED_SCHEMA_VERSIONS);
  }
  onProgress('schema', 'success');

  // Phase 3: Data Loading
  onProgress('data', 'loading');
  const collection = await loadCollection(source);
  onProgress('data', 'success');

  return collection;
}
```

### 4. GitHub Rate Limits (2025 Changes)

#### May 2025 Update Impact

GitHub significantly reduced unauthenticated rate limits in May 2025:

| Metric | Before May 2025 | After May 2025 |
|--------|-----------------|----------------|
| API requests/minute | ~83 | ~1 |
| Raw content/hour | ~5000 | ~5000 (unchanged) |
| Behaviour | Predictable | Aggressive limiting |

**Key insight**: `raw.githubusercontent.com` is less affected than the REST API, but still subject to IP-based throttling.

#### CDN Proxy Strategy (Essential)

Use CDN proxies to avoid rate limits entirely:

| CDN | GitHub URL | CDN URL |
|-----|------------|---------|
| jsDelivr | `raw.githubusercontent.com/{user}/{repo}/{branch}/{path}` | `cdn.jsdelivr.net/gh/{user}/{repo}@{branch}/{path}` |
| Statically | Same | `cdn.statically.io/gh/{user}/{repo}@{branch}/{path}` |

```typescript
function buildCdnUrl(source: GitHubRawConfig, file: string): string {
  const { owner, repo, collection, branch = 'main' } = source;
  // jsDelivr CDN - CORS-friendly, no rate limits
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/data/collections/${collection}/${file}`;
}

function buildRawUrl(source: GitHubRawConfig, file: string): string {
  const { owner, repo, collection, branch = 'main' } = source;
  // Direct GitHub - for fallback only
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data/collections/${collection}/${file}`;
}
```

#### Fallback Strategy

```typescript
async function fetchWithFallback<T>(
  source: GitHubRawConfig,
  file: string
): Promise<T> {
  const cdnUrl = buildCdnUrl(source, file);
  const rawUrl = buildRawUrl(source, file);

  try {
    const response = await fetch(cdnUrl);
    if (response.ok) {
      return response.json();
    }
  } catch {
    // CDN failed, try direct
  }

  // Fallback to raw GitHub
  const response = await fetch(rawUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${file}: ${response.status}`);
  }
  return response.json();
}
```

### 5. CDN Proxy Patterns

#### jsDelivr (Recommended for GitHub)

**Features**:
- CORS headers included (`Access-Control-Allow-Origin: *`)
- Multi-CDN infrastructure (Cloudflare, Fastly, Bunny, GCore)
- 99.99%+ uptime with automatic failover
- Permanent caching for tags/commits
- Branch caching: 12 hours

**Caching behaviour**:

| Reference | Cache Duration | Purgeable |
|-----------|----------------|-----------|
| Commit SHA | Permanent | No |
| Git tag | Permanent | No |
| `@latest` | 7 days | Yes |
| Branch | 12 hours | Yes |

#### Statically (Multi-Provider)

**Features**:
- Supports GitHub, GitLab, Bitbucket
- Unified URL pattern across providers
- ~99.9% uptime

**URL patterns**:
```
GitHub:    https://cdn.statically.io/gh/{user}/{repo}@{tag}/{file}
GitLab:    https://cdn.statically.io/gl/{user}/{repo}@{tag}/{file}
Bitbucket: https://cdn.statically.io/bb/{user}/{repo}@{tag}/{file}
```

#### Comparison Matrix

| Feature | jsDelivr | Statically | raw.githubusercontent.com |
|---------|----------|------------|---------------------------|
| CORS | Yes | Yes | **No** |
| Multi-CDN | 4 providers | 2 providers | No |
| Permanent cache | Yes | No | No |
| GitLab support | No | Yes | N/A |
| Rate limits | None | None | IP-based |

### 6. Manifest Standards

#### IIIF Collection Manifest

The International Image Interoperability Framework defines a collection manifest pattern:

```json
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/collection.json",
  "type": "Collection",
  "label": { "en": ["My Collections"] },
  "items": [
    {
      "id": "https://example.org/collections/retro-games/manifest.json",
      "type": "Manifest",
      "label": { "en": ["Retro Games Collection"] }
    }
  ]
}
```

**Key patterns**:
- Collections contain Manifests (hierarchical)
- Manifests may appear in multiple collections
- URL pattern: `{host}/collection.json` for root

#### W3C Publication Manifest

The W3C defines a publication manifest standard:

```json
{
  "@context": "https://www.w3.org/ns/pub-context",
  "type": "PublicationManifest",
  "id": "https://example.org/manifest.json",
  "name": "My Collection Repository",
  "resources": [
    {
      "type": "Collection",
      "url": "data/collections/retro-games/",
      "name": "Retro Games"
    }
  ]
}
```

**Key patterns**:
- Embedded in HTML or linked
- Resources listed with types
- Supports discovery via `<link rel="publication">`

#### itemdeck Manifest Pattern (Current)

```json
{
  "version": "1.0.0",
  "collections": [
    {
      "path": "data/collections/retro-games",
      "name": "My Top Computer & Video Games",
      "description": "A personal ranking of games",
      "schema": "ranked-collection",
      "schemaVersion": "1.0.0",
      "itemCount": 79,
      "categoryCount": 13,
      "featured": true
    }
  ]
}
```

### 7. Health Endpoint RFC Patterns

#### RFC draft-inadarei-api-health-check-06

The IETF draft defines a standard health check response format:

```json
{
  "status": "pass",
  "version": "1",
  "releaseId": "1.0.0",
  "notes": [""],
  "output": "",
  "checks": {
    "collection:responseTime": [
      {
        "componentType": "datastore",
        "observedValue": 250,
        "observedUnit": "ms",
        "status": "pass",
        "time": "2025-01-01T12:00:00Z"
      }
    ]
  },
  "links": {
    "about": "https://example.org/about"
  }
}
```

**Status values**:
- `pass` - All checks passed, system healthy
- `warn` - System functional but degraded
- `fail` - System unavailable or erroring

**HTTP status codes**:
- 2xx-3xx for `pass`
- 4xx-5xx for `fail`

#### Adapted for itemdeck

```typescript
interface SourceHealthResponse {
  status: 'pass' | 'warn' | 'fail';
  checks: {
    accessibility: CheckResult;
    schemaCompatibility: CheckResult;
    dataQuality?: CheckResult;
  };
  timestamp: string;
  source: {
    owner: string;
    repo: string;
    collection: string;
  };
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  observedValue?: number | string;
  message?: string;
}
```

### 8. Error Classification

#### Error Taxonomy

| Category | HTTP Status | User Message | Action |
|----------|-------------|--------------|--------|
| Network | 0 | "Unable to connect" | Retry with backoff |
| Not Found | 404 | "Collection not found" | Check URL, suggest alternatives |
| Rate Limited | 429 | "Too many requests" | Wait and retry, suggest CDN |
| Server Error | 5xx | "Server temporarily unavailable" | Retry with backoff |
| Schema Mismatch | - | "Incompatible schema version" | Link to migration guide |
| Validation | - | "Data format error" | Show specific field errors |

#### Error Handling Pattern

```typescript
class SourceError extends Error {
  constructor(
    public readonly code: SourceErrorCode,
    public readonly source: GitHubRawConfig,
    message: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'SourceError';
  }
}

enum SourceErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  SCHEMA_INCOMPATIBLE = 'SCHEMA_INCOMPATIBLE',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CORS_BLOCKED = 'CORS_BLOCKED',
}

function classifyError(error: unknown, response?: Response): SourceErrorCode {
  if (response) {
    switch (response.status) {
      case 404: return SourceErrorCode.NOT_FOUND;
      case 429: return SourceErrorCode.RATE_LIMITED;
      case 403: return SourceErrorCode.CORS_BLOCKED;
      default:
        if (response.status >= 500) return SourceErrorCode.SERVER_ERROR;
    }
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return SourceErrorCode.NETWORK_ERROR;
  }

  return SourceErrorCode.NETWORK_ERROR;
}
```

## Library Comparison

### JSON Schema Validation

| Library | Bundle Size | TypeScript | Features |
|---------|-------------|------------|----------|
| **Zod** (current) | ~12KB | Excellent | Runtime + static types |
| Ajv | ~50KB | Good | JSON Schema draft support |
| Yup | ~15KB | Good | Object schema focus |
| json-schema-library | ~20KB | Good | Remote $ref resolution |

**Recommendation**: Continue with Zod - already integrated, excellent TypeScript support, smaller bundle.

### Data Fetching

| Library | Bundle Size | Features |
|---------|-------------|----------|
| **TanStack Query** (current) | ~12KB | Caching, devtools, mutations |
| SWR | ~4KB | Simple stale-while-revalidate |
| RTK Query | ~11KB | Redux integration |

**Recommendation**: Continue with TanStack Query - already integrated, superior caching control.

## Code Examples

### TanStack Query Health Check Hook

```typescript
// src/hooks/useSourceHealth.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { sourceKeys } from './queryKeys';
import type { GitHubRawConfig } from '@/config/dataSource';

interface SourceHealthResult {
  status: 'healthy' | 'degraded' | 'unavailable';
  schemaVersion?: string;
  schemaCompatible: boolean;
  latency: number;
  lastChecked: Date;
  issues: HealthIssue[];
}

interface HealthIssue {
  severity: 'warning' | 'error';
  code: string;
  message: string;
}

async function checkSourceHealth(source: GitHubRawConfig): Promise<SourceHealthResult> {
  const baseUrl = buildCdnUrl(source, '');
  const issues: HealthIssue[] = [];
  const start = performance.now();

  // Check accessibility
  const accessCheck = await checkSourceAccessibility(`${baseUrl}collection.json`);
  if (!accessCheck.accessible) {
    return {
      status: 'unavailable',
      schemaCompatible: false,
      latency: performance.now() - start,
      lastChecked: new Date(),
      issues: [{
        severity: 'error',
        code: 'SOURCE_UNAVAILABLE',
        message: accessCheck.error ?? 'Unable to reach data source',
      }],
    };
  }

  // Check schema
  const schema = await discoverSchema(baseUrl);
  const compatible = isSchemaCompatible(schema.schemaVersion);
  if (!compatible) {
    issues.push({
      severity: 'warning',
      code: 'SCHEMA_INCOMPATIBLE',
      message: getCompatibilityMessage(schema.schemaVersion),
    });
  }

  return {
    status: issues.length === 0 ? 'healthy' : 'degraded',
    schemaVersion: schema.schemaVersion,
    schemaCompatible: compatible,
    latency: performance.now() - start,
    lastChecked: new Date(),
    issues,
  };
}

export function useSourceHealth(
  source: GitHubRawConfig,
  options?: { enabled?: boolean }
): UseQueryResult<SourceHealthResult> {
  return useQuery({
    queryKey: sourceKeys.health(source),
    queryFn: () => checkSourceHealth(source),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    retry: 1, // Only retry once for health checks
    enabled: options?.enabled ?? true,
  });
}
```

### Manifest Discovery Hook

```typescript
// src/hooks/useManifest.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { sourceKeys } from './queryKeys';

interface CollectionMeta {
  path: string;
  name: string;
  description?: string;
  schema: string;
  schemaVersion: string;
  itemCount?: number;
  categoryCount?: number;
  featured?: boolean;
}

interface ManifestResult {
  version: string;
  collections: CollectionMeta[];
}

async function fetchManifest(owner: string, repo: string): Promise<ManifestResult> {
  // Try CDN first
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/manifest.json`;

  try {
    const response = await fetch(cdnUrl);
    if (response.ok) {
      return response.json();
    }
  } catch {
    // Fallback to raw GitHub
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/manifest.json`;
  const response = await fetch(rawUrl);

  if (!response.ok) {
    throw new Error(`Manifest not found: ${response.status}`);
  }

  return response.json();
}

export function useManifest(
  owner: string,
  repo: string,
  options?: { enabled?: boolean }
): UseQueryResult<ManifestResult> {
  return useQuery({
    queryKey: sourceKeys.manifest(owner, repo),
    queryFn: () => fetchManifest(owner, repo),
    staleTime: 60 * 60 * 1000, // 1 hour (manifests change infrequently)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled ?? true,
  });
}
```

### Source Manager Store

```typescript
// src/stores/sourceStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GitHubRawConfig } from '@/config/dataSource';

interface SourceState {
  sources: GitHubRawConfig[];
  activeSourceId: string | null;

  // Actions
  addSource: (source: GitHubRawConfig) => void;
  removeSource: (id: string) => void;
  setActive: (id: string) => void;
  getActive: () => GitHubRawConfig | null;
}

function getSourceId(source: GitHubRawConfig): string {
  return `${source.owner}/${source.repo}/${source.collection}`;
}

export const useSourceStore = create<SourceState>()(
  persist(
    (set, get) => ({
      sources: [],
      activeSourceId: null,

      addSource: (source) => {
        const id = getSourceId(source);
        set((state) => {
          if (state.sources.some(s => getSourceId(s) === id)) {
            return state; // Already exists
          }
          return {
            sources: [...state.sources, source],
            activeSourceId: state.activeSourceId ?? id,
          };
        });
      },

      removeSource: (id) => {
        set((state) => {
          const newSources = state.sources.filter(s => getSourceId(s) !== id);
          return {
            sources: newSources,
            activeSourceId: state.activeSourceId === id
              ? (newSources[0] ? getSourceId(newSources[0]) : null)
              : state.activeSourceId,
          };
        });
      },

      setActive: (id) => {
        set({ activeSourceId: id });
      },

      getActive: () => {
        const state = get();
        if (!state.activeSourceId) return null;
        return state.sources.find(s => getSourceId(s) === state.activeSourceId) ?? null;
      },
    }),
    {
      name: 'itemdeck-sources',
      version: 1,
    }
  )
);
```

## Recommendations for itemdeck

### Priority 1: CDN Migration (Essential)

1. **Switch to jsDelivr** for all GitHub fetches
2. **Keep raw.githubusercontent.com as fallback** only
3. **Update `buildRawUrl`** to return CDN URLs by default

### Priority 2: Health Check Hook

1. **Create `useSourceHealth` hook** with HEAD request pattern
2. **Check before loading** - validate accessibility first
3. **Cache health results** for 5 minutes

### Priority 3: Schema Compatibility

1. **Add schema version check** before data loading
2. **Support schema migration** with clear error messages
3. **Maintain compatibility matrix** of supported versions

### Priority 4: Manifest Discovery

1. **Create `useManifest` hook** to fetch repository manifest
2. **Build collection browser component** to list available collections
3. **Cache manifests** for 1 hour (rarely change)

### Priority 5: Source Management

1. **Create Zustand store** for source list persistence
2. **Add source management UI** in settings panel
3. **Validate sources on add** with health check

## Implementation Considerations

### Bundle Size Impact

| Addition | Size | Notes |
|----------|------|-------|
| useSourceHealth | ~1KB | New hook |
| useManifest | ~0.5KB | New hook |
| sourceStore | ~1KB | Zustand store |
| SourceManager UI | ~3KB | New components |
| **Total** | ~5.5KB | Minimal impact |

### Performance Considerations

- **Parallel health checks** for multiple sources
- **Debounce health polling** to avoid excessive requests
- **Cache aggressively** - manifests rarely change
- **Progressive loading** - show UI while checking

### Security Considerations

- **Maintain allowlist** for CDN domains
- **Validate source URLs** before fetching
- **Sanitise manifest data** before rendering
- **Rate limit source additions** to prevent abuse

### Breaking Changes

None - additive features to existing infrastructure.

### Migration Path

1. **Phase 1**: Add CDN support alongside raw URLs
2. **Phase 2**: Add health check hooks
3. **Phase 3**: Add manifest discovery
4. **Phase 4**: Add source management UI
5. **Phase 5**: Switch default to CDN URLs

## References

### Standards and RFCs
- [RFC draft-inadarei-api-health-check-06](https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-06)
- [IIIF Presentation API - Collections](https://iiif.io/api/presentation/3.0/#51-collection)
- [W3C Publication Manifest](https://w3c.github.io/pub-manifest/)

### GitHub Documentation
- [REST API Best Practices](https://docs.github.com/rest/guides/best-practices-for-using-the-rest-api)
- [Rate Limit Updates May 2025](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/)
- [Repository Contents API](https://docs.github.com/en/rest/repos/contents)

### CDN Documentation
- [jsDelivr GitHub Integration](https://www.jsdelivr.com/github)
- [Statically CDN](https://statically.io/)

### Libraries
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

### Web Standards
- [MDN: PWA Caching Strategies](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching)
- [web.dev: Offline Cookbook](https://web.dev/articles/offline-cookbook)

---

## Related Documentation

- [ADR-018: Mechanic UI Overlay](../decisions/adrs/ADR-018-mechanic-ui-overlay.md) - Related architecture decision
- [External Data Sources](./external-data-sources.md) - TanStack Query setup, caching
- [Data Repository Architecture](./data-repository-architecture.md) - Collection structure
- [Configuration Hierarchy](./configuration-hierarchy.md) - Config loading patterns
- [System Security](./system-security.md) - Security considerations

---

**Applies to**: itemdeck v0.9.0+
