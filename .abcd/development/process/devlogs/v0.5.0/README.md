# v0.5.0 Development Log - Schema Design

## Overview

v0.5.0 focused on designing a flexible, extensible JSON schema for itemdeck collections. This establishes the data architecture foundation that will power all future collection types beyond the current retro-games demo.

## Implementation Narrative

### The Problem

The existing data format in `public/data/collections/retro-games/` was rigid and domain-specific:
- `categories.json` assumed "platforms" (hardcoded concept)
- `items.json` used `metadata.category` and `metadata.rank` (domain-specific fields)
- `imageUrl` was a simple string with no attribution support
- `imageAttribution` was an unstructured text field

This made itemdeck unsuitable for other collection types (recipes, books, wine, etc.).

### Design Process

We evaluated three schema approaches:

1. **Tag-Based** - Flat items with faceted tags
2. **Entity-Relationship** - Normalised entities with typed relationships
3. **Document-Based** - Self-describing flexible documents

**Decision:** Entity-Relationship was chosen for its robustness and flexibility in handling complex collections with natural groupings.

### Schema Architecture

The final schema structure uses a versioned namespace:

```
docs/reference/schemas/
├── v1/
│   ├── collection.schema.json     # Main collection schema
│   ├── entity.schema.json         # Entity schema
│   └── components/
│       ├── display.schema.json    # Display/layout config
│       ├── fields.schema.json     # Field type definitions
│       └── image.schema.json      # Image + attribution
└── examples/
    └── retro-games/               # Example collection
```

### Key Design Decisions

#### 1. First-Class Images

Images became structured objects with attribution:

```json
{
  "images": [
    {
      "url": "https://...",
      "type": "cover",
      "alt": "Box art",
      "attribution": {
        "source": "Wikimedia Commons",
        "author": "Nintendo",
        "licence": "Fair use",
        "url": "https://commons.wikimedia.org/..."
      }
    }
  ]
}
```

#### 2. Scoped Ordinals

Rank is now explicitly scoped to its parent entity:

```json
{
  "game.rank": {
    "type": "ordinal",
    "scope": "platform"
  }
}
```

#### 3. Display Configuration

Card rendering is driven by the schema's display config:

```json
{
  "card": {
    "front": {
      "image": {
        "source": "images[0]",
        "fallback": "images[type=screenshot][0]"
      }
    }
  }
}
```

### Bug Fixes

Fixed an issue where the DragOverlay component wasn't passing the `cardBackDisplay` prop, causing the year to show during drag even when configured to be hidden.

## Challenges Encountered

### Schema Complexity Balance

Finding the right balance between flexibility and simplicity was challenging. We wanted a schema powerful enough for complex collections but simple enough for basic use cases. The solution was modular component schemas that can be referenced as needed.

### Image Expression Syntax

Designing the image selection expression syntax (e.g., `images[type=cover][0] ?? images[0]`) required careful consideration of edge cases and fallback behaviour.

## Files Created

| File | Purpose |
|------|---------|
| `docs/reference/schemas/v1/collection.schema.json` | Main collection schema |
| `docs/reference/schemas/v1/entity.schema.json` | Entity schema |
| `docs/reference/schemas/v1/components/image.schema.json` | Image + attribution |
| `docs/reference/schemas/v1/components/display.schema.json` | Display config |
| `docs/reference/schemas/v1/components/fields.schema.json` | Field types |
| `docs/reference/schemas/examples/retro-games/collection.json` | Example collection |
| `docs/reference/schemas/examples/retro-games/entities/platforms.json` | Example platforms |
| `docs/reference/schemas/examples/retro-games/entities/games.json` | Example games |
| `docs/prompts/implementation/v0.5.0/README.md` | Implementation prompt |
| `docs/prompts/implementation/v0.6.0/README.md` | v0.6.0 implementation prompt |

## Files Modified

| File | Changes |
|------|---------|
| `src/components/DraggableCardGrid/DraggableCardGrid.tsx` | Added cardBackDisplay to DragOverlay |

## Code Highlights

### Schema URL Pattern

```
https://itemdeck.app/schemas/v1/collection.json
https://itemdeck.app/schemas/v1/entity.json
https://itemdeck.app/schemas/v1/components/image.json
```

### Component References

Schemas reference each other using `$ref`:

```json
{
  "display": {
    "$ref": "components/display.json#/definitions/displayConfig"
  }
}
```

## Metrics

| Metric | Value |
|--------|-------|
| Schema files created | 5 |
| Example files created | 3 |
| Tests passing | 211 |
| TypeScript errors | 0 |
| ESLint errors | 0 |

---

## Related Documentation

- [v0.5.0 Implementation Prompt](../../../prompts/implementation/v0.5.0/README.md)
- [Collection Schema](../../../reference/schemas/v1/collection.schema.json)
- [v0.5.0 Retrospective](../../retrospectives/v0.5.0/README.md)
