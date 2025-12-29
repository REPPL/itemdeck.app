# ADR-023: Plugin Trust Tiers

## Status

Accepted

## Context

Itemdeck is evolving from a built-in mechanic system (ADR-016) to a full plugin ecosystem (v1.5.0) that supports:

1. **Built-in plugins** - Bundled with the application (mechanics, themes)
2. **Curated plugins** - Downloaded from an official registry
3. **Community plugins** - Loaded from user-provided URLs (initially GitHub-only)

Each category has different trust implications:

| Source | Trust Level | Risk | Example |
|--------|-------------|------|---------|
| Built-in | Full | None | Memory game mechanic |
| Curated | High | Low | Reviewed before listing |
| Community | Low | Medium-High | Unreviewed third-party code |

### Current State

The existing mechanic plugin system (v0.13.0+) uses dynamic imports with full trust:

```typescript
// All mechanics run in the same context as the host application
const mechanicLoaders: Record<string, () => Promise<MechanicPlugin>> = {
  'memory-game': () => import('./mechanics/memory-game'),
  'quiz': () => import('./mechanics/quiz'),
};
```

This pattern works for built-in code but cannot safely extend to external plugins.

### Requirements

1. **Built-in plugins** must have full API access (performance, development velocity)
2. **External plugins** must be sandboxed (security)
3. **Trust levels** must map to specific technical capabilities
4. **Users** must understand what they're installing

## Decision

Implement a **three-tier trust model** with distinct technical implementations for each tier.

### Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   itemdeck Plugin System                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 1: Built-in Plugins (Full Trust)                 │  │
│  │                                                        │  │
│  │  • Dynamic imports (current pattern)                   │  │
│  │  • Same JavaScript context as host                     │  │
│  │  • Full API access                                     │  │
│  │  • Code reviewed, bundled with app                     │  │
│  │                                                        │  │
│  │  Examples: Memory, Quiz, Collection, Competing         │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                    Plugin API                                │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 2: Curated Plugins (Verified Trust)              │  │
│  │                                                        │  │
│  │  • Loaded from official registry                       │  │
│  │  • Reviewed before listing                             │  │
│  │  • iframe sandbox with messaging (ADR-024)            │  │
│  │  • Permission-based API access                         │  │
│  │  • Checksum verification                               │  │
│  │                                                        │  │
│  │  Source: https://plugins.itemdeck.app/registry.json    │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                    Sandbox API                               │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 3: Community Plugins (Minimal Trust)             │  │
│  │                                                        │  │
│  │  • Loaded from GitHub raw URLs                         │  │
│  │  • Strict iframe sandbox (ADR-024)                    │  │
│  │  • Restricted API surface                              │  │
│  │  • User must explicitly approve                        │  │
│  │  • Warning displayed before activation                 │  │
│  │                                                        │  │
│  │  Source: raw.githubusercontent.com/{user}/{repo}/...   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Trust Tier Definitions

```typescript
// src/plugins/core/types.ts

export type PluginTrustTier = 'builtin' | 'curated' | 'community';

export interface PluginTrustConfig {
  tier: PluginTrustTier;
  source: PluginSource;
  permissions: Permission[];
  restrictions: PluginRestrictions;
}

export interface PluginRestrictions {
  /** Maximum API calls per minute */
  maxApiCallsPerMinute: number;
  /** Maximum storage in bytes */
  maxStorageBytes: number;
  /** Allowed external domains for network requests */
  allowedDomains: string[];
  /** Whether plugin can modify card data */
  canWriteCards: boolean;
  /** Whether plugin can access other plugin's data */
  canAccessOtherPlugins: boolean;
}

export const TIER_DEFAULTS: Record<PluginTrustTier, PluginRestrictions> = {
  builtin: {
    maxApiCallsPerMinute: Infinity,
    maxStorageBytes: Infinity,
    allowedDomains: ['*'],
    canWriteCards: true,
    canAccessOtherPlugins: true,
  },
  curated: {
    maxApiCallsPerMinute: 100,
    maxStorageBytes: 5 * 1024 * 1024, // 5MB
    allowedDomains: ['api.itemdeck.app'],
    canWriteCards: true,
    canAccessOtherPlugins: false,
  },
  community: {
    maxApiCallsPerMinute: 30,
    maxStorageBytes: 1 * 1024 * 1024, // 1MB
    allowedDomains: [],
    canWriteCards: false,
    canAccessOtherPlugins: false,
  },
};
```

### Permission Mapping by Tier

| Permission | Built-in | Curated | Community |
|------------|----------|---------|-----------|
| `cards:read` | ✅ | ✅ | ✅ |
| `cards:write` | ✅ | ✅ | ❌ |
| `collection:read` | ✅ | ✅ | ✅ |
| `collection:write` | ✅ | ❌ | ❌ |
| `settings:read` | ✅ | ✅ | ✅ |
| `settings:write` | ✅ | ✅ (scoped) | ❌ |
| `ui:toast` | ✅ | ✅ | ✅ |
| `ui:modal` | ✅ | ✅ | ❌ |
| `ui:panel` | ✅ | ❌ | ❌ |
| `network:fetch` | ✅ | ✅ (proxied) | ❌ |
| `storage:local` | ✅ | ✅ (scoped) | ✅ (scoped) |

### User Consent Flow

**Curated plugins:**
```
┌─────────────────────────────────────────┐
│ Install "Quiz Pro"?                     │
│                                         │
│ This plugin requests:                   │
│ • Read your cards                       │
│ • Create quizzes                        │
│ • Store game progress                   │
│                                         │
│ Source: Official Registry               │
│ Verified: ✓                             │
│                                         │
│     [Cancel]        [Install]           │
└─────────────────────────────────────────┘
```

**Community plugins:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Install Community Plugin?            │
│                                         │
│ "Custom Mechanic" from:                 │
│ github.com/user/custom-mechanic         │
│                                         │
│ ⚠️ This plugin is NOT verified          │
│ ⚠️ Only install if you trust the author │
│                                         │
│ Permissions (limited):                  │
│ • Read your cards                       │
│ • Display notifications                 │
│                                         │
│     [Cancel]   [I understand, Install]  │
└─────────────────────────────────────────┘
```

### Implementation Approach

```typescript
// src/plugins/core/loader.ts

export class PluginLoader {
  async loadPlugin(source: PluginSource): Promise<LoadedPlugin> {
    const tier = this.determineTier(source);
    const manifest = await this.fetchManifest(source);

    // Validate manifest against tier permissions
    this.validatePermissions(manifest, tier);

    switch (tier) {
      case 'builtin':
        return this.loadBuiltinPlugin(manifest);

      case 'curated':
        // Verify checksum against registry
        await this.verifyChecksum(source, manifest);
        return this.loadSandboxedPlugin(manifest, TIER_DEFAULTS.curated);

      case 'community':
        // Show warning, require explicit consent
        await this.requireUserConsent(manifest, 'community');
        return this.loadSandboxedPlugin(manifest, TIER_DEFAULTS.community);
    }
  }

  private determineTier(source: PluginSource): PluginTrustTier {
    if (source.type === 'builtin') return 'builtin';
    if (source.origin === 'https://plugins.itemdeck.app') return 'curated';
    return 'community';
  }

  private async loadBuiltinPlugin(manifest: PluginManifest): Promise<LoadedPlugin> {
    // Use dynamic import - full trust, no sandbox
    const module = await import(`./builtins/${manifest.id}/index.ts`);
    return {
      manifest,
      tier: 'builtin',
      instance: module.default,
      sandbox: null, // No sandbox for built-in
    };
  }

  private async loadSandboxedPlugin(
    manifest: PluginManifest,
    restrictions: PluginRestrictions
  ): Promise<LoadedPlugin> {
    // Create sandboxed iframe (see ADR-024)
    const sandbox = new PluginSandbox(manifest, restrictions);
    await sandbox.load();

    return {
      manifest,
      tier: manifest.tier,
      instance: sandbox.createProxy(),
      sandbox,
    };
  }
}
```

## Consequences

### Positive

- **Clear security model** - Users understand trust implications
- **Flexibility** - Different levels for different needs
- **Backwards compatible** - Existing mechanics become Tier 1
- **Extensible** - Community can contribute safely
- **Defence in depth** - Multiple layers of protection

### Negative

- **Complexity** - Three code paths to maintain
- **UX friction** - Community plugins require extra consent
- **Feature gap** - Community plugins have limited capabilities
- **Development overhead** - Must test all tiers

### Mitigations

- **Shared base** - Common `PluginManifest` schema across tiers
- **Clear documentation** - Explain limitations upfront
- **Graduation path** - Community plugins can become curated
- **E2E tests** - Automated testing for each tier

## Alternatives Considered

### Single Trust Level (Sandbox All)

Sandbox all plugins, including built-in.

**Rejected because:**
- Performance overhead for built-in plugins
- Increased complexity for first-party development
- No benefit for code we already control

### Two Tiers (Trusted / Untrusted)

Only distinguish between built-in and external.

**Rejected because:**
- No graduation path for community plugins
- No recognition of curated/reviewed status
- All external treated equally despite verification

### No External Plugins

Only support built-in plugins.

**Rejected because:**
- Limits ecosystem growth
- Prevents community contribution
- Contradicts v1.5.0 goals

---

## Related Documentation

- [ADR-016: Gaming Mechanics Plugin Architecture](./ADR-016-gaming-mechanics-plugin-architecture.md)
- [ADR-024: Plugin Sandbox Implementation](./ADR-024-plugin-sandbox-implementation.md)
- [ADR-025: Plugin Distribution Strategy](./ADR-025-plugin-distribution-strategy.md)
- [State-of-the-Art: Plugin Architecture](../../research/state-of-the-art-plugin-architecture.md)
- [State-of-the-Art: Web Security Sandboxing](../../research/state-of-the-art-web-security-sandbox.md)
- [v1.5.0 Milestone](../../roadmap/milestones/v1.5.0.md)

---

**Applies to**: itemdeck v1.5.0+
