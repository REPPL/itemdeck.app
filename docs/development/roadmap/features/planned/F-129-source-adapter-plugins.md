# F-129: Source Adapter Plugins

## Problem Statement

Data sources are limited to GitHub:

1. **Single source type** - Only GitHub repositories supported
2. **No custom sources** - Cannot load from other platforms
3. **Fixed URL patterns** - Cannot adapt to different URL formats
4. **No authentication variety** - Limited to GitHub token auth

## Design Approach

Create a plugin system for data source adapters:

- Source plugins define URL patterns and fetching logic
- Support various authentication methods
- Handle rate limiting and caching
- Transform external data to Itemdeck format

### Source Adapter Structure

```
gitlab-source/
├── manifest.json           # Plugin manifest
├── index.ts                # Source adapter implementation
├── auth.ts                 # Authentication handling
├── transformer.ts          # Data transformation
└── icon.svg                # Source icon
```

### Source Manifest

```json
{
  "$schema": "https://itemdeck.app/schemas/plugin.json",
  "id": "gitlab-source",
  "type": "source",
  "name": "GitLab",
  "description": "Load collections from GitLab repositories",
  "permissions": ["network:fetch"],
  "source": {
    "urlPatterns": [
      "https://gitlab.com/{owner}/{repo}",
      "https://gitlab.com/{owner}/{repo}/-/tree/{branch}/{path}"
    ],
    "authentication": {
      "type": "token",
      "optional": true,
      "instructions": "Create a Personal Access Token with read_api scope"
    },
    "rateLimit": {
      "requests": 60,
      "window": 60000
    },
    "icon": "./icon.svg"
  }
}
```

### Source Adapter API

```typescript
interface SourceAdapterAPI {
  // URL handling
  parseUrl(url: string): ParsedSource | null;
  buildUrl(source: ParsedSource): string;

  // Discovery
  discoverCollections(source: ParsedSource): Promise<CollectionInfo[]>;

  // Data fetching
  fetchCollection(source: ParsedSource): Promise<RawCollection>;
  fetchEntity(source: ParsedSource, entityId: string): Promise<RawEntity>;

  // Transformation
  transformCollection(raw: RawCollection): Collection;
  transformEntity(raw: RawEntity): Entity;

  // Health
  checkHealth(source: ParsedSource): Promise<HealthStatus>;

  // Updates
  checkForUpdates(source: ParsedSource, lastCheck: Date): Promise<UpdateInfo>;
}

interface ParsedSource {
  adapter: string;
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  auth?: AuthInfo;
}
```

### Potential Source Adapters

| Adapter | Platform | Status |
|---------|----------|--------|
| `github` | GitHub | Built-in |
| `gitlab` | GitLab | Planned |
| `bitbucket` | Bitbucket | Future |
| `gist` | GitHub Gists | Future |
| `dropbox` | Dropbox | Future |
| `gdrive` | Google Drive | Future |
| `url` | Direct URL | Future |

## Implementation Tasks

### Phase 1: Source Adapter Interface

- [ ] Create `src/plugins/sources/types.ts`
- [ ] Define SourceAdapterAPI interface
- [ ] Create source adapter base class
- [ ] Define ParsedSource schema

### Phase 2: Adapter Registration

- [ ] Create `src/plugins/sources/registry.ts`
- [ ] Register adapters by URL pattern
- [ ] Implement URL pattern matching
- [ ] Handle ambiguous URLs

### Phase 3: Convert GitHub Adapter

- [ ] Refactor existing GitHub loader to adapter format
- [ ] Extract URL parsing logic
- [ ] Extract authentication handling
- [ ] Create as built-in plugin

### Phase 4: Source Integration

- [ ] Update source picker for multiple adapters
- [ ] Display adapter icons
- [ ] Handle adapter-specific authentication
- [ ] Show adapter status in Sources panel

### Phase 5: Caching & Rate Limiting

- [ ] Implement per-adapter caching
- [ ] Respect adapter rate limits
- [ ] Queue requests across adapters
- [ ] Display rate limit status

## Success Criteria

- [ ] GitHub source works as plugin adapter
- [ ] Multiple adapters registerable
- [ ] URL patterns correctly matched
- [ ] Authentication works per adapter
- [ ] Caching respects adapter settings
- [ ] Rate limits enforced

## Dependencies

- **F-122**: Plugin Manifest Schema - Source manifest structure
- **F-123**: Plugin Loader & Registry - Source loading
- **F-124**: Plugin Security Sandbox - Network access control

## Complexity

**High** - Network handling, authentication, and transformation require robust implementation.

## Estimated Effort

**14-18 hours**

---

## Related Documentation

- [GitHub Data Source](../completed/F-007-github-data-source.md)
- [Remote Source Management](../completed/F-047-remote-source-management.md)
- [F-122: Plugin Manifest Schema](./F-122-plugin-manifest-schema.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
