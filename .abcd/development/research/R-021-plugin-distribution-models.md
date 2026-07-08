# R-021: Plugin Distribution Models

## Executive Summary

This research compares plugin distribution approaches from established ecosystems (npm, Chrome Web Store, WordPress, VS Code) to inform itemdeck's plugin distribution strategy for v1.5.0. The goal is to design a system that balances security, discoverability, and ease of use.

## Current State in Itemdeck

### Existing Plugin Architecture

1. **Built-in Plugins** (`src/plugins/builtin/`)
   - Bundled with application
   - No loading/distribution concerns
   - 5 mechanics, 3 themes, 1 source

2. **Planned Distribution** (v1.5.0)
   - Curated registry (F-131)
   - Community plugins via GitHub (F-132)
   - Plugin manifest schema (F-122)

3. **Security Model**
   - Sandbox for external plugins (F-124)
   - Permission model (F-125)
   - Trust tiers (ADR-023)

### Design Constraints

- Browser-only application (no server backend)
- Privacy-focused (no analytics/tracking)
- No authentication required
- Must work offline after initial load

## Research Findings

### Distribution Model Comparison

| Aspect | npm | Chrome Web Store | WordPress | VS Code Marketplace |
|--------|-----|------------------|-----------|---------------------|
| **Hosting** | npm registry | Google servers | wordpress.org | Microsoft servers |
| **Review Process** | None | Automated + manual | Manual | Automated + manual |
| **Trust Model** | Package signing (optional) | Developer ID + review | Manual vetting | Publisher verification |
| **Discovery** | CLI + website | Store UI | Admin dashboard | In-app marketplace |
| **Updates** | Manual/automated | Auto-update | Dashboard notification | Auto-update |
| **Monetisation** | None | Paid + free | Freemium | Paid + free |
| **Offline** | After install | After install | After install | After install |

### Model 1: Centralised Registry (npm/VS Code Style)

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Registry Server                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Database: plugins, versions, downloads, reviews        ││
│  │  API: search, details, download                         ││
│  │  CDN: Plugin bundles                                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    itemdeck Application                      │
│  • Browse plugins in-app                                    │
│  • One-click install                                        │
│  • Automatic updates                                        │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Best discoverability
- Consistent quality (review process)
- Simple user experience
- Version management handled

**Cons:**
- Requires hosting infrastructure
- Ongoing maintenance cost
- Centralised point of failure
- Review bottleneck for updates

### Model 2: Decentralised (GitHub-Based)

```
┌─────────────────────────────────────────────────────────────┐
│                    Static Registry JSON                      │
│  (GitHub repo: itemdeck/plugin-registry)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  registry.json: List of approved plugins + URLs         ││
│  │  Updated via PR review process                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Repositories                       │
│  github.com/user/my-plugin                                  │
│  github.com/another/cool-plugin                             │
│  └── Plugin source + releases                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    itemdeck Application                      │
│  • Fetches registry.json                                    │
│  • Downloads from individual repos                          │
│  • Manual update checks                                     │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- No hosting costs
- Community-driven curation
- Git-based review process
- Resilient (distributed)

**Cons:**
- Fragmented discovery
- Rate limits (GitHub API)
- Complex update mechanism
- Requires GitHub account for submissions

### Model 3: Hybrid (Curated + Community)

```
┌─────────────────────────────────────────────────────────────┐
│                      Trust Tiers                             │
├─────────────────────────────────────────────────────────────┤
│  TIER 1: Built-in                                           │
│  • Bundled with app                                         │
│  • No sandbox restrictions                                  │
│  • Full API access                                          │
├─────────────────────────────────────────────────────────────┤
│  TIER 2: Curated Registry                                   │
│  • Reviewed and approved                                    │
│  • Listed in static registry                                │
│  • Sandboxed execution                                      │
│  • jsDelivr CDN delivery                                    │
├─────────────────────────────────────────────────────────────┤
│  TIER 3: Community (URL-based)                              │
│  • User provides GitHub URL                                 │
│  • No review process                                        │
│  • Strict sandbox + permissions                             │
│  • Warning shown on install                                 │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Balance of curation and openness
- Clear security model
- No hosting required (jsDelivr + GitHub)
- Flexible for power users

**Cons:**
- Complex to explain to users
- Different UX per tier
- Community tier security concerns

### Registry Schema Design

#### Static Registry (registry.json)

```json
{
  "version": 1,
  "updated": "2024-01-15T12:00:00Z",
  "plugins": [
    {
      "id": "memory-pro",
      "name": "Memory Game Pro",
      "description": "Enhanced memory game with difficulty levels",
      "author": "itemdeck",
      "type": "mechanic",
      "repository": "github:itemdeck/memory-pro",
      "versions": {
        "1.0.0": {
          "minAppVersion": "1.5.0",
          "released": "2024-01-10",
          "sha256": "abc123...",
          "downloadUrl": "https://cdn.jsdelivr.net/gh/itemdeck/memory-pro@1.0.0/dist/plugin.js"
        }
      },
      "permissions": ["cards:read", "settings:write"],
      "tags": ["game", "memory", "mechanic"],
      "downloads": 1234,
      "rating": 4.5
    }
  ],
  "featured": ["memory-pro", "dark-theme-pack"],
  "categories": [
    { "id": "mechanics", "name": "Game Mechanics" },
    { "id": "themes", "name": "Themes" },
    { "id": "sources", "name": "Data Sources" }
  ]
}
```

#### Plugin Manifest (in plugin repo)

```json
{
  "id": "memory-pro",
  "name": "Memory Game Pro",
  "version": "1.0.0",
  "description": "Enhanced memory game with difficulty levels",
  "author": {
    "name": "itemdeck",
    "url": "https://github.com/itemdeck"
  },
  "license": "MIT",
  "repository": "https://github.com/itemdeck/memory-pro",
  "minAppVersion": "1.5.0",
  "type": "mechanic",
  "main": "dist/plugin.js",
  "permissions": [
    "cards:read",
    "settings:write"
  ],
  "contributions": {
    "mechanics": [
      {
        "id": "memory-pro",
        "name": "Memory Pro",
        "icon": "brain"
      }
    ]
  }
}
```

### Version Resolution

#### Semantic Versioning

```typescript
interface VersionConstraint {
  minVersion?: string;  // Minimum app version required
  maxVersion?: string;  // Maximum app version supported (optional)
}

function resolveVersion(
  available: PluginVersion[],
  appVersion: string
): PluginVersion | null {
  const compatible = available
    .filter(v => satisfies(appVersion, v.minAppVersion))
    .sort((a, b) => compare(b.version, a.version)); // Latest first

  return compatible[0] ?? null;
}
```

#### Update Strategy

```typescript
enum UpdateStrategy {
  AUTO = 'auto',        // Update automatically
  NOTIFY = 'notify',    // Show notification, user confirms
  MANUAL = 'manual',    // User initiates update check
}

interface PluginSettings {
  updateStrategy: UpdateStrategy;
  checkInterval: number; // Hours between checks
}
```

### Security Considerations

#### Code Signing (Optional Enhancement)

```typescript
interface SignedPlugin {
  manifest: PluginManifest;
  signature: string;  // Base64-encoded signature
  publicKey: string;  // Author's public key
}

async function verifyPlugin(plugin: SignedPlugin): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(plugin.manifest));

  const key = await crypto.subtle.importKey(
    'spki',
    base64ToArrayBuffer(plugin.publicKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64ToArrayBuffer(plugin.signature),
    data
  );
}
```

#### Hash Verification

```typescript
async function verifyIntegrity(code: string, expectedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHash;
}
```

### Discovery UI Patterns

#### In-App Marketplace

```typescript
interface PluginDiscoveryUI {
  // Search and filter
  search(query: string, filters: PluginFilters): Promise<Plugin[]>;

  // Categories
  getCategories(): Promise<Category[]>;
  getByCategory(categoryId: string): Promise<Plugin[]>;

  // Featured/trending
  getFeatured(): Promise<Plugin[]>;
  getPopular(limit: number): Promise<Plugin[]>;

  // Plugin details
  getDetails(pluginId: string): Promise<PluginDetails>;
  getReviews(pluginId: string): Promise<Review[]>;
}
```

#### Install Flow

```
1. User browses/searches plugins
2. User clicks "Install"
3. Show permissions required
4. User confirms installation
5. Download and verify integrity
6. Load in sandbox
7. Register with app
8. Show success/reload prompt
```

## Recommendations

### 1. Adopt Hybrid Model (Model 3)

Implement three-tier trust model:
- **Tier 1 (Built-in):** Bundled, full access
- **Tier 2 (Curated):** Static registry, reviewed, sandboxed
- **Tier 3 (Community):** URL-based, strict sandbox, user warning

### 2. Static Registry via GitHub

```
github.com/itemdeck/plugin-registry/
├── registry.json      # Plugin listings
├── CONTRIBUTING.md    # Submission guide
└── .github/
    └── workflows/
        └── validate.yml  # Auto-validate submissions
```

- PRs add/update plugins
- CI validates manifest schema
- Maintainers review and merge
- jsDelivr serves registry.json

### 3. Version Pinning with Update Notifications

- Pin installed versions (no auto-update)
- Check for updates on app launch
- Show notification for available updates
- User initiates update

### 4. Integrity Verification

- SHA-256 hash in registry
- Verify on download
- Reject if mismatch

### 5. Clear Permission Display

Before install, show:
```
"Memory Pro" requests access to:
✓ Read card data
✓ Save settings
✗ Network access (not requested)
✗ Execute code (sandboxed)

[Cancel] [Install]
```

## Implementation Considerations

### CDN Strategy

Use jsDelivr for:
- Registry JSON: `cdn.jsdelivr.net/gh/itemdeck/plugin-registry/registry.json`
- Plugin bundles: `cdn.jsdelivr.net/gh/author/plugin@version/dist/plugin.js`

Benefits: Free, fast, GitHub-based, cache headers

### Offline Support

- Cache registry on first load
- Cache installed plugins in IndexedDB
- Work offline with cached plugins
- Update when online

### Rate Limiting

GitHub API limits:
- 60 requests/hour (unauthenticated)
- Use jsDelivr to avoid API calls
- Batch update checks

## References

- [npm Registry API](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md)
- [VS Code Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/manifest/)
- [jsDelivr Documentation](https://www.jsdelivr.com/documentation)

---

## Related Documentation

- [F-131: Curated Registry API](../roadmap/features/planned/F-131-curated-registry-api.md)
- [F-132: Community Plugin Loading](../roadmap/features/planned/F-132-community-plugin-loading.md)
- [ADR-023: Plugin Trust Tiers](../decisions/adrs/ADR-023-plugin-trust-tiers.md)
- [ADR-025: Plugin Distribution Strategy](../decisions/adrs/ADR-025-plugin-distribution-strategy.md)
- [State-of-the-Art Plugin Architecture](./state-of-the-art-plugin-architecture.md)

---

**Status**: Complete
