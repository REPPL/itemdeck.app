# R-022: Plugin Versioning & Breaking Changes

## Executive Summary

This research examines strategies for versioning plugin APIs and managing breaking changes in plugin ecosystems. The goal is to establish a versioning policy that balances stability for plugin developers with the ability to evolve the itemdeck platform.

## Current State in Itemdeck

### Plugin API Surface

The plugin API (as designed in F-122, F-124) includes:

1. **Mechanic API**
   - Card access (read-only)
   - Overlay rendering
   - Score reporting
   - State persistence

2. **Theme API**
   - CSS variable access
   - Theme metadata

3. **Settings API**
   - Scoped settings access
   - Setting registration

4. **Source API**
   - Data provider registration
   - Fetch helpers

### Versioning Considerations

- Application version: `0.15.6` (pre-1.0)
- Plugin system: Planned for v1.5.0
- No existing plugins to maintain compatibility with

## Research Findings

### Semantic Versioning for APIs

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backwards compatible)
PATCH: Bug fixes (backwards compatible)
```

#### What Constitutes a Breaking Change?

| Change Type | Breaking? | Example |
|-------------|-----------|---------|
| Remove method | Yes | Remove `api.getCards()` |
| Change return type | Yes | `string` → `string[]` |
| Add required parameter | Yes | `fn()` → `fn(required: string)` |
| Change method signature | Yes | `fn(a, b)` → `fn(b, a)` |
| Remove event | Yes | Remove `onCardFlip` event |
| Change event payload | Yes | `{ id }` → `{ cardId }` |
| Add optional parameter | No | `fn(a?)` → `fn(a?, b?)` |
| Add new method | No | Add `api.getCard(id)` |
| Add new event | No | Add `onCardSelect` event |
| Deprecate (with fallback) | No | Mark as deprecated, keep working |

### Versioning Strategies

#### Strategy 1: Single API Version

```typescript
// Plugin declares minimum API version
{
  "minApiVersion": "1.0.0"
}

// App exports single API version
const pluginAPI = {
  version: '1.2.0',
  // ... methods
};
```

**Pros:** Simple, one API to maintain
**Cons:** Breaking changes break all plugins

#### Strategy 2: Versioned API Endpoints

```typescript
// Multiple API versions available
const pluginAPI = {
  v1: { /* original API */ },
  v2: { /* updated API with breaking changes */ },
};

// Plugin requests specific version
const api = host.getAPI('v1');
```

**Pros:** Gradual migration, multiple versions coexist
**Cons:** Maintenance burden, code duplication

#### Strategy 3: Capability-Based API

```typescript
// Plugin requests capabilities
{
  "capabilities": ["cards:read", "settings:write"]
}

// API provides requested capabilities
const api = host.getCapabilities([
  'cards:read',
  'settings:write'
]);
```

**Pros:** Fine-grained, evolves per capability
**Cons:** Complex version matrix

#### Strategy 4: API Adapter Layer

```typescript
// Internal API (can change)
class InternalAPI {
  getCards(): Card[] { /* current implementation */ }
}

// Versioned adapters
const v1Adapter = (internal: InternalAPI) => ({
  getCards: () => internal.getCards().map(card => ({
    // Transform to v1 format
    id: card.id,
    title: card.title,
  })),
});

const v2Adapter = (internal: InternalAPI) => ({
  getCards: () => internal.getCards(), // v2 format unchanged
});
```

**Pros:** Internal changes don't break plugins, clean separation
**Cons:** Adapter maintenance, performance overhead

### Deprecation Patterns

#### Pattern 1: Deprecation Warnings

```typescript
function deprecatedMethod() {
  console.warn(
    '[itemdeck] api.oldMethod() is deprecated. ' +
    'Use api.newMethod() instead. ' +
    'This will be removed in API v2.'
  );
  return newMethod();
}
```

#### Pattern 2: Runtime Detection

```typescript
const api = {
  get oldMethod() {
    logDeprecation('oldMethod', 'newMethod', '2.0.0');
    return this.newMethod;
  },
  newMethod() {
    // Implementation
  },
};
```

#### Pattern 3: Plugin Compatibility Check

```typescript
interface PluginCompatibility {
  compatible: boolean;
  warnings: DeprecationWarning[];
  errors: CompatibilityError[];
}

function checkPluginCompatibility(
  manifest: PluginManifest,
  currentApiVersion: string
): PluginCompatibility {
  const warnings: DeprecationWarning[] = [];
  const errors: CompatibilityError[] = [];

  // Check API version
  if (!satisfies(currentApiVersion, manifest.minApiVersion)) {
    errors.push({
      type: 'api_version_mismatch',
      required: manifest.minApiVersion,
      current: currentApiVersion,
    });
  }

  // Check deprecated features
  for (const capability of manifest.capabilities) {
    if (isDeprecated(capability)) {
      warnings.push({
        feature: capability,
        replacedBy: getReplacement(capability),
        removeInVersion: getRemovalVersion(capability),
      });
    }
  }

  return {
    compatible: errors.length === 0,
    warnings,
    errors,
  };
}
```

### Migration Strategies

#### Phased Deprecation

```
v1.5.0: Introduce new API, old API works
v1.6.0: Old API shows deprecation warnings
v1.7.0: Old API shows console errors
v2.0.0: Old API removed
```

#### Migration Guide Template

```markdown
# Migrating from API v1 to v2

## Breaking Changes

### `api.getCards()` → `api.cards.list()`

**Before (v1):**
```js
const cards = api.getCards();
```

**After (v2):**
```js
const cards = api.cards.list();
```

### Card object shape change

**Before (v1):**
```js
{ id, name, data }
```

**After (v2):**
```js
{ id, title, metadata }
```

**Migration:**
```js
// Compatibility shim
const cards = api.cards.list().map(card => ({
  id: card.id,
  name: card.title,  // renamed
  data: card.metadata,  // renamed
}));
```
```

### Version Constraint Syntax

```typescript
// Semantic version ranges (npm-style)
type VersionConstraint = string;

// Examples:
"1.0.0"       // Exact version
"^1.0.0"      // Compatible with 1.x.x
"~1.0.0"      // Compatible with 1.0.x
">=1.0.0"     // 1.0.0 or higher
">=1.0.0 <2.0.0"  // Range
```

### Backwards Compatibility Windows

| API Version | Support Status | End of Life |
|-------------|----------------|-------------|
| v1 | Full support | v3.0.0 release |
| v2 | Full support | v4.0.0 release |
| v3 (current) | Active | - |

**Policy:** Support previous major version until next major release (n-1).

### Testing Plugin Compatibility

```typescript
// Test plugin against multiple API versions
describe('Plugin Compatibility', () => {
  const apiVersions = ['1.0.0', '1.5.0', '2.0.0'];

  for (const version of apiVersions) {
    describe(`API v${version}`, () => {
      let api: PluginAPI;

      beforeEach(() => {
        api = createAPIVersion(version);
      });

      it('should initialise without errors', async () => {
        await expect(plugin.activate(api)).resolves.not.toThrow();
      });

      it('should handle card access', () => {
        const cards = api.cards.list();
        expect(cards).toBeDefined();
      });
    });
  }
});
```

### Plugin Manifest Version Fields

```json
{
  "id": "my-plugin",
  "version": "1.0.0",
  "apiVersion": {
    "minimum": "1.0.0",
    "maximum": "2.0.0",
    "tested": ["1.0.0", "1.5.0", "2.0.0"]
  },
  "deprecations": {
    "acknowledged": ["cards:read:v1"],
    "migrationComplete": false
  }
}
```

## Recommendations

### 1. Adopt API Adapter Pattern

```typescript
// src/plugins/api/adapters/index.ts
export const apiAdapters = {
  '1': createV1Adapter,
  '2': createV2Adapter,
};

export function getPluginAPI(
  requestedVersion: string,
  internal: InternalPluginAPI
): PluginAPI {
  const majorVersion = major(requestedVersion);
  const adapter = apiAdapters[majorVersion];

  if (!adapter) {
    throw new Error(`Unsupported API version: ${requestedVersion}`);
  }

  return adapter(internal);
}
```

### 2. Version Constraint in Manifest

```json
{
  "minApiVersion": "^1.0.0"
}
```

- Use semver ranges
- Plugins specify minimum, app provides latest compatible

### 3. Deprecation Timeline

1. **Introduction:** New API introduced, old API unchanged
2. **Deprecation (6 months):** Console warnings, migration guide published
3. **Hard Deprecation (3 months):** Console errors, warnings in UI
4. **Removal:** Old API removed in next major version

### 4. Changelog for Plugin Developers

Maintain `PLUGIN_API_CHANGELOG.md`:

```markdown
# Plugin API Changelog

## [2.0.0] - 2025-06-01

### Breaking Changes
- Renamed `api.getCards()` to `api.cards.list()`
- Changed card object shape (see migration guide)

### Deprecated
- `api.settings.get()` - use `api.settings.read()` instead

### Added
- `api.cards.find(predicate)` for filtering cards

## [1.5.0] - 2025-03-01

### Added
- `api.events.on('cardSelect')` event
- `api.ui.showToast()` for notifications

### Fixed
- `api.cards.list()` now returns readonly array
```

### 5. Compatibility Matrix in Documentation

| Plugin API | itemdeck 1.5.x | itemdeck 2.0.x | itemdeck 2.1.x |
|------------|----------------|----------------|----------------|
| v1.0 | ✅ | ✅ | ❌ (removed) |
| v1.5 | ✅ | ✅ | ✅ |
| v2.0 | ❌ | ✅ | ✅ |

## Implementation Considerations

### Testing

- Test plugins against all supported API versions
- Automated compatibility checks in CI
- Warn plugin developers of upcoming breaking changes

### Documentation

- Maintain versioned API documentation
- Provide migration guides for each major version
- Publish deprecation announcements 6+ months ahead

### Communication

- Announce breaking changes in release notes
- Email/notify plugin developers (if contact available)
- Provide codemods for common migrations

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [npm Semver Calculator](https://semver.npmjs.com/)
- [VS Code Extension API Versioning](https://code.visualstudio.com/api/references/vscode-api)
- [Chrome Extension API Versioning](https://developer.chrome.com/docs/extensions/reference/)

---

## Related Documentation

- [F-122: Plugin Manifest Schema](../roadmap/features/planned/F-122-plugin-manifest-schema.md)
- [ADR-026: Plugin Manifest Schema](../decisions/adrs/ADR-026-plugin-manifest-schema.md)
- [ADR-032: Plugin API Versioning](../decisions/adrs/ADR-032-plugin-api-versioning.md)
- [R-021: Plugin Distribution Models](./R-021-plugin-distribution-models.md)

---

**Status**: Complete
