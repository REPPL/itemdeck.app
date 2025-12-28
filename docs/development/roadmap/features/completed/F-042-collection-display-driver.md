# F-042: Collection Display Driver

## Problem Statement

Cards currently have hardcoded field mappings (title, year, summary, etc.). The new v1 schema includes a `display.card` configuration section that specifies which fields to show and where, but this is not yet wired into the UI components.

Users cannot customise which fields appear on cards without modifying code.

## Design Approach

Create a configurable card rendering system that reads field mappings from `collection.json`'s `display` section:

```json
{
  "display": {
    "card": {
      "front": {
        "title": "title",
        "subtitle": "playedSince",
        "image": { "source": "images[type=cover][0] ?? images[0]" },
        "badge": "rank",
        "secondaryBadge": "rating",
        "footer": ["platform.title", "status"]
      },
      "back": {
        "logo": "platform.logoUrl",
        "title": "verdict",
        "text": "year"
      }
    }
  }
}
```

### Key Components

1. **Field Path Parser** - Parse expressions like `platform.title`, `images[type=cover][0]`
2. **Display Config Types** - TypeScript types for `display.card` configuration
3. **Configurable Card** - Card component that uses config instead of hardcoded fields
4. **Fallback System** - Handle missing fields gracefully

### Field Path Expression Language

```
path        = segment ("." segment)*
segment     = identifier | filter
identifier  = [a-zA-Z_][a-zA-Z0-9_]*
filter      = identifier "[" condition "]" ("[" index "]")?
condition   = identifier "=" value
index       = number
fallback    = path (" ?? " path)*
```

Examples:
- `title` → Simple field access
- `platform.title` → Nested via resolved relationship
- `images[type=cover][0]` → Array filter with index
- `verdict ?? summary` → Fallback if first is missing

## Implementation Tasks

- [ ] Create `parseFieldPath` utility in `src/loaders/`
- [ ] Add TypeScript types for `DisplayCardConfig` in `src/types/`
- [ ] Extend `collection.json` schema with display validation
- [ ] Modify `Card` component to accept display config
- [ ] Create `FieldValue` component for rendering arbitrary field types
- [ ] Add fallback handling for missing/undefined fields
- [ ] Update `useCollection` to pass display config to components
- [ ] Add comprehensive tests for field path parser
- [ ] Document field path expression syntax

## Success Criteria

- [ ] Cards render title from configured path (e.g., `title` or `name`)
- [ ] Cards render subtitle from configured path (e.g., `playedSince` or `year`)
- [ ] Badges render from configured paths
- [ ] Nested paths work (`platform.title`)
- [ ] Array filter paths work (`images[type=cover][0].url`)
- [ ] Fallbacks work (`verdict ?? summary`)
- [ ] Missing fields show placeholder or hide element
- [ ] Existing collections work without modification

## Dependencies

- **Requires**: v0.6.0 Schema Loader (for resolver context and relationship resolution)
- **Blocks**: None

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex expressions slow down rendering | Low | Medium | Parser optimisation, caching |
| Breaking existing card layouts | Medium | High | Keep default values for backward compatibility |

---

## Related Documentation

- [v0.6.1 Milestone](../../milestones/v0.6.1.md)
- [v1 Schema Reference](../../../../reference/schemas/v1/README.md)
- [F-043 Settings Panel Sub-tabs](./F-043-settings-panel-subtabs.md)

---

**Status**: Completed
