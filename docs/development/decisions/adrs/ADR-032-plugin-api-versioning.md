# ADR-032: Plugin API Versioning

## Status

Accepted

## Context

itemdeck's plugin system (v1.5.0) needs a versioning strategy for the plugin API that balances:

1. **Stability** - Plugin developers need reliable APIs
2. **Evolution** - The platform must be able to improve
3. **Compatibility** - Multiple plugin versions should coexist
4. **Simplicity** - Avoid excessive complexity

Research findings from [R-022: Plugin Versioning & Breaking Changes](../../research/R-022-plugin-versioning-breaking-changes.md) identified four strategies:

| Strategy | Maintenance | Migration | Complexity |
|----------|-------------|-----------|------------|
| Single API version | Low | Hard | Low |
| Versioned endpoints | High | Easy | Medium |
| Capability-based | Medium | Moderate | High |
| API adapter layer | Medium | Easy | Medium |

### Requirements

- Support plugins built for different API versions
- Provide deprecation warnings before breaking changes
- Enable graceful migration paths
- Maintain reasonable maintenance burden

## Decision

Adopt an **API adapter pattern** with **semver-based versioning**:

### 1. Semantic Versioning for Plugin API

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes (remove methods, change signatures)
MINOR: New features (add methods, new events)
PATCH: Bug fixes (no API changes)
```

### 2. Versioned API Adapters

Internal API can evolve freely. Adapters translate between internal API and versioned plugin APIs:

```
┌──────────────────────────────────────────────────────────────┐
│                     Internal Plugin API                       │
│            (can change between any release)                   │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  v1 Adapter  │      │  v2 Adapter  │      │  v3 Adapter  │
│              │      │              │      │   (current)  │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Plugin v1   │      │  Plugin v2   │      │  Plugin v3   │
└──────────────┘      └──────────────┘      └──────────────┘
```

### 3. Plugin Manifest Version Declaration

```json
{
  "id": "my-plugin",
  "version": "1.0.0",
  "apiVersion": {
    "minimum": "1.0.0",
    "maximum": "2.0.0",
    "tested": ["1.0.0", "1.5.0"]
  }
}
```

### 4. Backwards Compatibility Window

Support **n-1** major versions:

| API Version | Status | Support Until |
|-------------|--------|---------------|
| v1 | Deprecated | v3.0.0 release |
| v2 | Supported | v4.0.0 release |
| v3 (current) | Active | - |

## Implementation

### API Version Registry

```typescript
// src/plugins/api/versions.ts
export const API_VERSIONS = {
  current: '3.0.0',
  supported: ['2.0.0', '3.0.0'],
  deprecated: ['1.0.0'],
};

export function isVersionSupported(version: string): boolean {
  const major = semver.major(version);
  return API_VERSIONS.supported.some(v => semver.major(v) === major) ||
         API_VERSIONS.deprecated.some(v => semver.major(v) === major);
}

export function isVersionDeprecated(version: string): boolean {
  const major = semver.major(version);
  return API_VERSIONS.deprecated.some(v => semver.major(v) === major);
}
```

### Adapter Factory

```typescript
// src/plugins/api/adapters/index.ts
import { createV1Adapter } from './v1';
import { createV2Adapter } from './v2';
import { createV3Adapter } from './v3';
import { InternalPluginAPI } from '../internal';

type Adapter = (internal: InternalPluginAPI) => PluginAPI;

const adapters: Record<number, Adapter> = {
  1: createV1Adapter,
  2: createV2Adapter,
  3: createV3Adapter,
};

export function getPluginAPI(
  requestedVersion: string,
  internal: InternalPluginAPI
): PluginAPI {
  const major = semver.major(requestedVersion);
  const adapter = adapters[major];

  if (!adapter) {
    throw new PluginAPIError(
      `Unsupported API version: ${requestedVersion}. ` +
      `Supported versions: ${API_VERSIONS.supported.join(', ')}`
    );
  }

  if (isVersionDeprecated(requestedVersion)) {
    logger.warn(`Plugin API v${major} is deprecated`, {
      requestedVersion,
      currentVersion: API_VERSIONS.current,
    });
  }

  return adapter(internal);
}
```

### Example Adapter (v2 → Internal)

```typescript
// src/plugins/api/adapters/v2.ts
import { InternalPluginAPI } from '../internal';
import { PluginAPI } from '../types';

export function createV2Adapter(internal: InternalPluginAPI): PluginAPI {
  return {
    version: '2.0.0',

    // v2 API shape
    cards: {
      list: () => internal.getCards().map(cardToV2Format),
      get: (id: string) => cardToV2Format(internal.getCard(id)),
    },

    settings: {
      // v2 used 'get/set', v3 uses 'read/write'
      get: (key: string) => internal.readSetting(key),
      set: (key: string, value: unknown) => internal.writeSetting(key, value),
    },

    events: {
      on: internal.subscribe,
      off: internal.unsubscribe,
    },
  };
}

function cardToV2Format(card: InternalCard): V2Card {
  return {
    id: card.id,
    name: card.title,     // v2 used 'name', v3 uses 'title'
    data: card.metadata,  // v2 used 'data', v3 uses 'metadata'
    year: card.year,
    category: card.category?.id,
  };
}
```

### Compatibility Check

```typescript
// src/plugins/validation/compatibility.ts
interface CompatibilityResult {
  compatible: boolean;
  warnings: string[];
  errors: string[];
}

export function checkPluginCompatibility(
  manifest: PluginManifest
): CompatibilityResult {
  const result: CompatibilityResult = {
    compatible: true,
    warnings: [],
    errors: [],
  };

  const { minimum, maximum } = manifest.apiVersion;

  // Check minimum version
  if (!semver.satisfies(API_VERSIONS.current, `>=${minimum}`)) {
    result.errors.push(
      `Plugin requires API ${minimum}+, current is ${API_VERSIONS.current}`
    );
    result.compatible = false;
  }

  // Check maximum version (if specified)
  if (maximum && !semver.satisfies(API_VERSIONS.current, `<=${maximum}`)) {
    result.warnings.push(
      `Plugin was tested with API up to ${maximum}, ` +
      `current is ${API_VERSIONS.current}. May have compatibility issues.`
    );
  }

  // Check deprecation
  if (isVersionDeprecated(minimum)) {
    result.warnings.push(
      `Plugin uses deprecated API v${semver.major(minimum)}. ` +
      `Support will be removed in a future release.`
    );
  }

  return result;
}
```

### Deprecation Warnings

```typescript
// src/plugins/api/deprecation.ts
const deprecationWarnings = new Set<string>();

export function warnDeprecation(
  feature: string,
  replacement: string,
  removeInVersion: string
): void {
  const key = `${feature}:${replacement}`;
  if (deprecationWarnings.has(key)) return;

  deprecationWarnings.add(key);
  logger.warn(
    `[Deprecated] ${feature} is deprecated. Use ${replacement} instead. ` +
    `Will be removed in API v${removeInVersion}.`
  );
}

// Usage in adapter
const v2Api = {
  settings: {
    get(key: string) {
      warnDeprecation('settings.get()', 'settings.read()', '4.0.0');
      return internal.readSetting(key);
    },
  },
};
```

### Migration Guide Location

```
docs/development/guides/plugin-api-migration/
├── README.md                # Overview of migration guides
├── v1-to-v2.md              # v1 → v2 migration
└── v2-to-v3.md              # v2 → v3 migration
```

## Consequences

### Positive

- **Stability** - Plugins work across multiple app versions
- **Clean migration** - Adapters handle version differences
- **Clear deprecation** - Developers have time to update
- **Internal freedom** - App can refactor without breaking plugins

### Negative

- **Adapter maintenance** - Must maintain adapters for supported versions
- **Testing overhead** - Test plugins against all supported versions
- **Documentation** - Must maintain migration guides

### Mitigations

- Automated adapter testing in CI
- Tooling to generate adapter stubs
- Clear deprecation timeline in release notes

## Breaking Change Policy

### What Requires MAJOR Version Bump

- Removing API methods
- Changing method signatures (parameters, return types)
- Removing events
- Changing event payload shapes
- Changing permission scopes

### What Requires MINOR Version Bump

- Adding new API methods
- Adding new events
- Adding optional parameters
- Expanding event payloads (additive)

### Deprecation Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| Introduction | 0 months | New API released, old API works |
| Deprecation | 6 months | Console warnings, migration guide |
| Hard Deprecation | 3 months | Console errors, UI warnings |
| Removal | 0 months | Old API removed in next major |

## Alternatives Considered

### Single Version (Breaking Changes)

- Update API, all plugins must update
- **Rejected**: Poor developer experience, forces immediate updates

### GraphQL-Style Introspection

- Self-documenting API with type introspection
- **Rejected**: Overkill for plugin system, complexity too high

### Feature Flags

- Toggle features instead of versioning
- **Rejected**: Doesn't handle structural API changes

### No Versioning (Pre-1.0)

- Don't worry about compatibility during early development
- **Partially accepted**: Plugin system launches at v1.5.0, so versioning is appropriate

---

## Related Documentation

- [R-022: Plugin Versioning & Breaking Changes](../../research/R-022-plugin-versioning-breaking-changes.md)
- [F-122: Plugin Manifest Schema](../../roadmap/features/planned/F-122-plugin-manifest-schema.md)
- [ADR-026: Plugin Manifest Schema](./ADR-026-plugin-manifest-schema.md)
- [ADR-023: Plugin Trust Tiers](./ADR-023-plugin-trust-tiers.md)
- [Plugin API Migration Guides](../../guides/plugin-api-migration/)
