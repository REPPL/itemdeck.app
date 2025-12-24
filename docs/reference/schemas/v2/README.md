# Schema v2 Reference

This document describes the ItemDeck Schema v2 format for defining collections.

## Overview

Schema v2 introduces:
- Enhanced image structures with attribution metadata
- Structured ratings with source information
- Multiple detail URLs per entity
- Directory-based entity storage
- Runtime validation with Zod

## Collection Structure

A v2 collection consists of:

```
my-collection/
├── collection.json           # Collection definition
├── games/                    # Entity directory (plural)
│   ├── index.json            # Entity ID listing
│   ├── game-one.json         # Individual entity
│   └── game-two.json
└── platforms/                # Related entity directory
    ├── index.json
    ├── platform-a.json
    └── platform-b.json
```

### Index Files

Each entity directory contains an `index.json` listing all entity IDs:

```json
[
  "game-one",
  "game-two",
  "game-three"
]
```

The loader fetches individual entity files based on this index.

---

## Collection Definition

### Root Structure

```json
{
  "$schema": "https://itemdeck.app/schemas/v2/collection.json",
  "id": "my-collection",
  "name": "My Collection",
  "description": "Collection description",
  "schemaVersion": "v2",
  "version": "1.0.0",
  "entityTypes": { ... },
  "relationships": { ... },
  "display": { ... }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | No | JSON Schema reference |
| `id` | string | Yes | Unique collection identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Collection description |
| `schemaVersion` | `"v1"` \| `"v2"` | Yes | Schema version |
| `version` | string | No | Collection data version |
| `entityTypes` | object | Yes | Entity type definitions |
| `relationships` | object | No | Relationship definitions |
| `display` | object | Yes | Display configuration |

---

## Entity Types

### Definition

```json
{
  "entityTypes": {
    "game": {
      "primary": true,
      "label": "Game",
      "labelPlural": "Games",
      "description": "A video game",
      "fields": { ... }
    },
    "platform": {
      "label": "Platform",
      "labelPlural": "Platforms",
      "fields": { ... }
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `primary` | boolean | No | Mark as primary entity type (one per collection) |
| `label` | string | Yes | Singular display label |
| `labelPlural` | string | Yes | Plural display label |
| `description` | string | No | Entity type description |
| `fields` | object | Yes | Field definitions |

---

## Field Types

### Basic Types

| Type | Description | Example Value |
|------|-------------|---------------|
| `string` | Short text | `"Super Mario Bros"` |
| `text` | Long text | `"A classic platforming adventure..."` |
| `number` | Numeric value | `1985` |
| `boolean` | True/false | `true` |
| `url` | URL string | `"https://example.com"` |
| `enum` | Enumerated values | `"easy"` |

### Complex Types

| Type | Description |
|------|-------------|
| `images` | Array of Image objects |
| `rating` | Number or RatingValue object |
| `detailUrls` | String, DetailLink, or array of DetailLink |

### Field Definition

```json
{
  "title": {
    "type": "string",
    "required": true
  },
  "year": {
    "type": "number",
    "description": "Release year"
  },
  "platform": {
    "type": "string",
    "ref": "platform"
  },
  "images": {
    "type": "images"
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Field type (required) |
| `required` | boolean | Whether field is required |
| `description` | string | Field description |
| `ref` | string | Reference to another entity type |
| `enum` | string[] | Allowed values for enum type |

---

## Image Structure

### Full Image Object

```json
{
  "url": "https://example.com/image.jpg",
  "type": "cover",
  "isPrimary": true,
  "alt": "Game cover art",
  "width": 800,
  "height": 600,
  "attribution": {
    "source": "Wikimedia Commons",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Example.jpg",
    "author": "John Doe",
    "licence": "CC BY-SA 4.0",
    "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Image URL |
| `type` | string | No | Image type (cover, logo, screenshot, etc.) |
| `isPrimary` | boolean | No | Mark as primary image |
| `alt` | string | No | Alt text for accessibility |
| `width` | number | No | Image width in pixels |
| `height` | number | No | Image height in pixels |
| `attribution` | Attribution | No | Image attribution data |

### Attribution Object

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Source name (e.g., "Wikimedia Commons") |
| `sourceUrl` | string | URL to source page |
| `author` | string | Author/creator name |
| `licence` | string | Licence type (e.g., "CC BY-SA 4.0") |
| `licenceUrl` | string | URL to licence text |

### Image Selection Expression

The display configuration uses expressions to select images:

```
images[isPrimary=true][0] ?? images[type=cover][0] ?? images[0]
```

This expression:
1. First tries to find an image with `isPrimary: true`
2. Falls back to the first image with `type: "cover"`
3. Finally falls back to the first image in the array

---

## Rating Structure

Ratings can be simple numbers or structured objects:

### Simple Rating

```json
{
  "rating": 4.5
}
```

### Structured Rating

```json
{
  "rating": {
    "score": 4.5,
    "max": 5,
    "sourceCount": 128,
    "source": "Wikipedia",
    "sourceUrl": "https://en.wikipedia.org/wiki/Example#Reception"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `score` | number | Yes | Rating score |
| `max` | number | No | Maximum score (default: 5) |
| `sourceCount` | number | No | Number of ratings/reviews |
| `source` | string | No | Rating source name |
| `sourceUrl` | string | No | URL to rating source |

---

## Detail URLs Structure

Detail URLs can be specified in three formats:

### Simple String

```json
{
  "detailUrl": "https://en.wikipedia.org/wiki/Example"
}
```

### Single Object

```json
{
  "detailUrls": {
    "url": "https://en.wikipedia.org/wiki/Example",
    "source": "Wikipedia",
    "label": "Wikipedia article",
    "isPrimary": true
  }
}
```

### Array of Objects

```json
{
  "detailUrls": [
    {
      "url": "https://en.wikipedia.org/wiki/Example",
      "source": "Wikipedia",
      "isPrimary": true
    },
    {
      "url": "https://www.mobygames.com/game/example",
      "source": "MobyGames"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Detail page URL |
| `source` | string | No | Source name |
| `label` | string | No | Custom link label |
| `isPrimary` | boolean | No | Mark as primary link |

---

## Relationships

### Many-to-One

```json
{
  "relationships": {
    "game.platform": {
      "target": "platform",
      "cardinality": "many-to-one",
      "required": true
    }
  }
}
```

### Ordinal (Ranking within Scope)

```json
{
  "relationships": {
    "game.rank": {
      "type": "ordinal",
      "scope": "platform"
    }
  }
}
```

---

## Display Configuration

```json
{
  "display": {
    "primaryEntity": "game",
    "groupBy": "platform",
    "sortWithinGroup": ["rank", "asc"],
    "card": {
      "front": {
        "title": "title",
        "subtitle": "year",
        "image": {
          "source": "images[isPrimary=true][0] ?? images[type=cover][0] ?? images[0]"
        },
        "badge": "rank",
        "footer": ["platform.shortTitle"]
      },
      "back": {
        "logo": "platform.images[type=logo][0]"
      }
    }
  }
}
```

### Card Front

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Field for card title |
| `subtitle` | string | Field for subtitle |
| `image` | object | Image selection configuration |
| `badge` | string | Field for primary badge |
| `secondaryBadge` | string | Field for secondary badge |
| `footer` | string[] | Fields for footer display |

### Card Back

| Field | Type | Description |
|-------|------|-------------|
| `logo` | string | Expression for back logo image |

---

## Entity File Format

Individual entity files contain a single entity object:

```json
{
  "id": "super-mario-bros-nes",
  "title": "Super Mario Bros.",
  "platform": "nes",
  "year": 1985,
  "rank": 1,
  "summary": "A classic side-scrolling platformer...",
  "images": [
    {
      "url": "https://example.com/smb-cover.jpg",
      "type": "cover",
      "isPrimary": true,
      "attribution": {
        "source": "Wikimedia Commons",
        "licence": "fair-use"
      }
    }
  ],
  "detailUrls": [
    {
      "url": "https://en.wikipedia.org/wiki/Super_Mario_Bros.",
      "source": "Wikipedia",
      "isPrimary": true
    }
  ]
}
```

---

## Validation

Schema v2 uses Zod for runtime validation. Invalid data produces helpful error messages:

```
Invalid collection definition:
  entityTypes.game.fields.title.type: Expected 'string' | 'text' | 'number' | ...
```

---

## Migration from v1

Key changes from v1:
1. Add `schemaVersion: "v2"` to collection.json
2. Move from single entity files to directory structure
3. Create index.json in each entity directory
4. Enhance image objects with `isPrimary` and attribution
5. Use structured `detailUrls` arrays

---

## Related Documentation

- [Collection Loader](../../../src/loaders/collectionLoader.ts) - Loading implementation
- [Zod Schemas](../../../src/schemas/v2/) - Validation schemas
- [Image Types](../../../src/types/image.ts) - TypeScript definitions
