# F-122: Plugin Manifest Schema

## Problem Statement

Itemdeck needs a standardised way to describe plugins:

1. **No uniform structure** - Each plugin type (theme, mechanic, source) needs different metadata
2. **No versioning** - No way to express plugin compatibility requirements
3. **No validation** - Invalid plugins could crash the application
4. **No discoverability** - Users cannot browse plugin capabilities before installing

## Design Approach

Define a comprehensive JSON Schema for plugin manifests that:

- Provides consistent metadata across all plugin types
- Enables validation before loading
- Supports semantic versioning for compatibility
- Declares permissions and dependencies

### Manifest Structure

```json
{
  "$schema": "https://itemdeck.app/schemas/plugin.json",
  "id": "unique-plugin-id",
  "version": "1.0.0",
  "name": "Human-Readable Name",
  "description": "What this plugin does",
  "author": {
    "name": "Author Name",
    "url": "https://github.com/author"
  },
  "type": "theme | mechanic | source | settings",
  "permissions": ["theme:write", "settings:read"],
  "main": "./index.js",
  "assets": {
    "css": ["./styles.css"],
    "fonts": ["./fonts/custom.woff2"],
    "images": ["./icon.png"]
  },
  "dependencies": {
    "itemdeck": ">=1.5.0"
  },
  "config": {
    "schema": "./config.schema.json",
    "defaults": {}
  }
}
```

### Type-Specific Fields

```typescript
// Theme plugins
interface ThemeManifest extends BaseManifest {
  type: 'theme';
  theme: {
    mode: 'light' | 'dark' | 'auto';
    preview: string; // Preview image URL
    variables: string[]; // CSS variable overrides
  };
}

// Mechanic plugins
interface MechanicManifest extends BaseManifest {
  type: 'mechanic';
  mechanic: {
    category: 'game' | 'tool' | 'utility';
    minCards: number;
    maxCards?: number;
    requirements: string[];
  };
}

// Source plugins
interface SourceManifest extends BaseManifest {
  type: 'source';
  source: {
    urlPatterns: string[];
    authentication?: 'none' | 'token' | 'oauth';
  };
}
```

## Implementation Tasks

### Phase 1: Schema Definition

- [ ] Create `src/schemas/plugin-manifest.schema.ts` using Zod
- [ ] Define base manifest schema (common fields)
- [ ] Define theme-specific schema extension
- [ ] Define mechanic-specific schema extension
- [ ] Define source-specific schema extension
- [ ] Define settings-specific schema extension

### Phase 2: Validation

- [ ] Create `src/plugins/validation/manifestValidator.ts`
- [ ] Implement schema validation with detailed error messages
- [ ] Validate semantic version compatibility
- [ ] Validate permission declarations
- [ ] Validate asset path existence

### Phase 3: JSON Schema Export

- [ ] Generate JSON Schema from Zod for external tooling
- [ ] Publish schema at `https://itemdeck.app/schemas/plugin.json`
- [ ] Create schema versioning strategy (v1, v2, etc.)

### Phase 4: Documentation

- [ ] Document all manifest fields
- [ ] Provide examples for each plugin type
- [ ] Create validation error reference

## Success Criteria

- [ ] Schema validates all current built-in plugins
- [ ] Invalid manifests produce clear error messages
- [ ] TypeScript types generated from schema
- [ ] JSON Schema published for IDE support
- [ ] Documentation complete with examples

## Dependencies

- **Zod 4**: Schema validation library (already in project)
- **F-123**: Plugin Loader uses manifest schema for validation

## Complexity

**Medium** - Schema design requires careful consideration of all plugin types and future extensibility.

## Estimated Effort

**8-12 hours**

---

## Related Documentation

- [Plugin Architecture Research](../../research/state-of-the-art-plugin-architecture.md)
- [ADR-026: Plugin Manifest Schema](../../decisions/adrs/ADR-026-plugin-manifest-schema.md)
- [F-123: Plugin Loader & Registry](./F-123-plugin-loader-registry.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
