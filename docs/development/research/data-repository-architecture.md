# Data Repository Architecture

## Executive Summary

This document defines an extensible architecture for external data repositories that serve itemdeck collections. The architecture supports:

1. **Collection-based organisation** — Collections organised as independent directories (e.g., retro-games, books, films)
2. **Schema-driven validation** — Built-in Zod schemas for data integrity
3. **GitHub as data backend** — Raw URLs for fetching JSON files directly
4. **Hybrid image approach** — Optional `IMAGE_URL` field with placeholder fallback
5. **Convention over configuration** — Predictable file names and structure

The reference implementation is [MyPlausibleMe](https://github.com/REPPL/MyPlausibleMe), a CC0-licensed personal data collection. For creating collections from CSV files, use [plausible-cli](https://github.com/REPPL/plausible-cli).

## Current State

### MyPlausibleMe Repository (Before)

```
MyPlausibleMe/
├── LICENSE           # CC0 1.0 (public domain)
├── README.md
├── categories.csv    # 13 gaming platforms (1981-2018)
└── items.csv         # 80 games with ranks, categories, descriptions
```

**Current CSV Schema:**
- `categories.csv`: `LABEL, YEAR, DESCRIPTION, URL`
- `items.csv`: `LABEL, RANK, CATEGORY, DESCRIPTION, URL`

**Limitations:**
- Flat structure doesn't scale to multiple collections
- No machine-readable schema definition
- No manifest for topic discovery
- CSV format not directly usable by web applications

### itemdeck Requirements

From the [External Data Sources](./external-data-sources.md) research and [Vision Document](../../prompts/vision/README.md):

1. Fetch from GitHub raw URLs or `public/data/`
2. TanStack Query for caching
3. Zod for validation
4. Support `items.json` and `categories.json` format

## Architecture Design

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Collection-based** | Each collection is a directory with its own metadata |
| **Schema-driven** | Zod schemas define and validate data structure |
| **Manifest-driven** | Root manifest enables collection discovery |
| **JSON source of truth** | JSON files are directly edited or generated via plausible-cli |
| **Convention over configuration** | Predictable file names (`items.json`, `categories.json`) |
| **Versioned schemas** | Schema changes don't break existing consumers |

### Repository Structure

```
MyPlausibleMe/
├── README.md                           # Repository overview
├── LICENSE                             # CC0 1.0
├── manifest.json                       # Registry of all collections
│
├── schemas/                            # JSON Schema definitions (reference only)
│   └── ranked-collection.schema.json  # Base schema for ranked lists
│
└── data/
    └── collections/                    # Individual data collections
        └── retro-games/                # Gaming collection
            ├── collection.json         # Collection metadata + display config
            ├── items.json              # Collection items (source of truth)
            └── categories.json         # Categories (source of truth)
```

Note: The `data/` directory is extensible — future non-collection data can be added alongside `collections/`.

### CSV to JSON Conversion

For converting CSV files to the required JSON format, use [plausible-cli](https://github.com/REPPL/plausible-cli):

```bash
plausible create my-collection \
  --items ~/data/items.csv \
  --categories ~/data/categories.csv \
  --schema ranked-collection \
  --repo ~/MyPlausibleMe
```

## File Specifications

### 1. manifest.json (Root Registry)

The manifest enables collection discovery and provides metadata.

```json
{
  "version": "1.0.0",
  "collections": [
    {
      "path": "data/collections/retro-games",
      "name": "My Top Computer & Video Games",
      "description": "A personal ranking of computer & video games",
      "schema": "ranked-collection",
      "schemaVersion": "1.0.0",
      "itemCount": 79,
      "categoryCount": 13,
      "featured": true
    }
  ]
}
```

**Fields:**
- `version` — Manifest format version
- `collections` — Array of available collections
- `path` — Path to collection directory (also serves as ID)
- `schema` — Schema identifier
- `schemaVersion` — Version of the schema used

### 2. collection.json (Per-Collection Metadata)

Each collection has its own configuration file with metadata and display preferences.

```json
{
  "name": "My Top Computer & Video Games",
  "description": "A personal ranking of computer & video games.",
  "version": "1.0.0",
  "schema": "ranked-collection",
  "schemaVersion": "1.0.0",
  "display": {
    "cardBack": {
      "showLogo": true,
      "showCategory": true,
      "showYear": true
    },
    "cardFront": {
      "showImage": true,
      "showTitle": true,
      "showDescription": true,
      "showLink": true
    },
    "theme": "retro",
    "themeVersion": "1.0.0"
  },
  "metadata": {
    "author": "REPPL",
    "licence": "CC0-1.0"
  }
}
```

**Fields:**
- `name` — Human-readable display name
- `description` — Brief description of the collection
- `version` — Collection data version
- `schema` — Schema identifier (must be supported by itemdeck)
- `schemaVersion` — Version of the schema used
- `display` — itemdeck-specific display configuration
  - `theme` — Visual theme identifier (e.g., "retro", "modern")
  - `themeVersion` — Version of the theme for compatibility
- `metadata` — Attribution and licensing

Note: Data files (`items.json`, `categories.json`) are discovered by convention based on the schema — no need to declare them explicitly.

Note: The collection ID is derived from the folder name — no need to declare it separately.

### 3. ranked-collection.schema.json

JSON Schema for validating ranked collection data.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "ranked-collection.schema.json",
  "title": "Ranked Collection Schema",
  "description": "Schema for personal ranked lists with categories",
  "version": "1.0.0",
  "definitions": {
    "item": {
      "type": "object",
      "required": ["LABEL", "RANK", "CATEGORY"],
      "properties": {
        "LABEL": {
          "type": "string",
          "description": "Item title/name"
        },
        "RANK": {
          "type": "integer",
          "minimum": 0,
          "description": "Position within category (0 = top pick/honourable mention)"
        },
        "CATEGORY": {
          "type": "string",
          "description": "Category identifier (must match a category LABEL)"
        },
        "DESCRIPTION": {
          "type": "string",
          "description": "Optional personal notes"
        },
        "URL": {
          "type": "string",
          "format": "uri",
          "description": "External reference (e.g., Wikipedia)"
        },
        "IMAGE_URL": {
          "type": "string",
          "format": "uri",
          "description": "Optional cover image URL"
        }
      },
      "additionalProperties": false
    },
    "category": {
      "type": "object",
      "required": ["LABEL", "YEAR"],
      "properties": {
        "LABEL": {
          "type": "string",
          "description": "Category identifier"
        },
        "YEAR": {
          "type": "integer",
          "description": "Year associated with this category"
        },
        "DESCRIPTION": {
          "type": "string",
          "description": "Optional category description"
        },
        "URL": {
          "type": "string",
          "format": "uri",
          "description": "External reference"
        }
      },
      "additionalProperties": false
    }
  },
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": { "$ref": "#/definitions/item" }
    },
    "categories": {
      "type": "array",
      "items": { "$ref": "#/definitions/category" }
    }
  }
}
```

### 4. Data Files

#### categories.json

```json
[
  {
    "LABEL": "C64",
    "YEAR": 1984,
    "DESCRIPTION": "The family's first computer",
    "URL": "https://en.wikipedia.org/wiki/Commodore_64"
  },
  {
    "LABEL": "NES",
    "YEAR": 1988,
    "DESCRIPTION": "Christmas 1988 - the gift that changed everything",
    "URL": "https://en.wikipedia.org/wiki/Nintendo_Entertainment_System"
  }
]
```

#### items.json

```json
[
  {
    "LABEL": "The Legend of Zelda",
    "RANK": 1,
    "CATEGORY": "NES",
    "DESCRIPTION": "The first true adventure. Still magical.",
    "URL": "https://en.wikipedia.org/wiki/The_Legend_of_Zelda_(video_game)",
    "IMAGE_URL": "https://upload.wikimedia.org/wikipedia/en/4/41/Legend_of_zelda_cover_%28with_samples%29.png"
  },
  {
    "LABEL": "Super Mario Bros.",
    "RANK": 2,
    "CATEGORY": "NES",
    "DESCRIPTION": "Where it all began.",
    "URL": "https://en.wikipedia.org/wiki/Super_Mario_Bros."
  }
]
```

Note: `IMAGE_URL` is optional. Items without images use a themed placeholder in itemdeck.

## Schema Registry (itemdeck)

### Overview

itemdeck uses a **schema registry** to support multiple data formats from external repositories. Rather than dynamically interpreting arbitrary schemas, itemdeck ships with a set of built-in schemas that users can choose from.

### How It Works

1. **itemdeck ships with built-in schemas** — Pre-defined Zod schemas with display mappings
2. **collection.json declares the schema** — `"schema": "ranked-collection"`
3. **itemdeck validates and renders** — Uses the correct schema based on declaration
4. **Unsupported schemas rejected** — Clear error message with supported alternatives

### Supported Schemas

| Schema ID | Description | Has Categories |
|-----------|-------------|----------------|
| `ranked-collection` | Personal ranked lists with categories | Yes |
| `simple-list` | Basic item list without ranking | No |
| `timeline` | Chronological events | No |

### Schema Registry Implementation

```typescript
// src/schemas/registry.ts
import { z } from 'zod';

// Schema definitions
const rankedItemSchema = z.object({
  LABEL: z.string().min(1),
  RANK: z.number().int().min(0),
  CATEGORY: z.string().min(1),
  DESCRIPTION: z.string().optional(),
  URL: z.string().url().optional().or(z.literal('')),
  IMAGE_URL: z.string().url().optional(),
});

const rankedCategorySchema = z.object({
  LABEL: z.string().min(1),
  YEAR: z.number().int(),
  DESCRIPTION: z.string().optional(),
  URL: z.string().url().optional().or(z.literal('')),
});

const simpleItemSchema = z.object({
  LABEL: z.string().min(1),
  DESCRIPTION: z.string().optional(),
  URL: z.string().url().optional(),
  IMAGE_URL: z.string().url().optional(),
});

const timelineEventSchema = z.object({
  LABEL: z.string().min(1),
  DATE: z.string(), // ISO date string
  DESCRIPTION: z.string().optional(),
  LOCATION: z.string().optional(),
  IMAGE_URL: z.string().url().optional(),
});

// Registry with display mappings
export const schemaRegistry = {
  'ranked-collection': {
    version: '1.0.0',
    description: 'Personal ranked lists with categories',
    items: rankedItemSchema,
    categories: rankedCategorySchema,
    display: {
      title: 'LABEL',
      subtitle: 'CATEGORY',
      description: 'DESCRIPTION',
      image: 'IMAGE_URL',
      link: 'URL',
      badge: 'RANK',
      year: 'YEAR', // From joined category
    },
  },
  'simple-list': {
    version: '1.0.0',
    description: 'Basic item list without ranking or categories',
    items: simpleItemSchema,
    categories: null,
    display: {
      title: 'LABEL',
      description: 'DESCRIPTION',
      image: 'IMAGE_URL',
      link: 'URL',
    },
  },
  'timeline': {
    version: '1.0.0',
    description: 'Chronological events with dates',
    items: timelineEventSchema,
    categories: null,
    display: {
      title: 'LABEL',
      subtitle: 'DATE',
      description: 'DESCRIPTION',
      image: 'IMAGE_URL',
      badge: 'LOCATION',
    },
  },
} as const;

export type SchemaId = keyof typeof schemaRegistry;

export function isValidSchema(id: string): id is SchemaId {
  return id in schemaRegistry;
}

export function getSupportedSchemas(): string[] {
  return Object.keys(schemaRegistry);
}
```

### Validation Flow

```typescript
// src/hooks/useCollection.ts
async function fetchAndValidate(config: DataSourceConfig): Promise<Collection> {
  // 1. Fetch collection.json to discover schema
  const collectionMeta = await fetchCollectionJson(config);

  // 2. Check if schema is supported
  if (!isValidSchema(collectionMeta.schema)) {
    throw new SchemaNotSupportedError(collectionMeta.schema, getSupportedSchemas());
  }

  // 3. Get schema definition
  const schemaDef = schemaRegistry[collectionMeta.schema];

  // 4. Fetch data files
  const [itemsData, categoriesData] = await Promise.all([
    fetchItems(config),
    schemaDef.categories ? fetchCategories(config) : Promise.resolve(null),
  ]);

  // 5. Validate against schema
  const items = z.array(schemaDef.items).parse(itemsData);
  const categories = schemaDef.categories && categoriesData
    ? z.array(schemaDef.categories).parse(categoriesData)
    : [];

  return {
    items,
    categories,
    schema: collectionMeta.schema,
    display: schemaDef.display,
  };
}
```

### Error Handling

```typescript
// src/errors/SchemaNotSupportedError.ts
export class SchemaNotSupportedError extends Error {
  constructor(
    public readonly requestedSchema: string,
    public readonly supportedSchemas: string[]
  ) {
    super(
      `Unsupported schema: "${requestedSchema}". ` +
      `Supported schemas: ${supportedSchemas.join(', ')}. ` +
      `To request a new schema, open an issue at: ` +
      `https://github.com/REPPL/itemdeck/issues`
    );
    this.name = 'SchemaNotSupportedError';
  }
}
```

### User Workflow

When creating a new collection:

1. **Choose a schema** from itemdeck's supported list
2. **Create collection directory** with `collection.json` declaring the schema
3. **Add data** conforming to the chosen schema's field requirements
4. **Point itemdeck** at the repository

### Adding New Schemas (Development)

To add a new schema to itemdeck:

1. Define Zod schema in `src/schemas/{schema-name}.schema.ts`
2. Add to `schemaRegistry` with display mapping
3. Update user documentation
4. Users can now declare `"schema": "new-schema"` in their topics

## Integration with itemdeck

### GitHub Raw URL Pattern

itemdeck fetches data from GitHub raw URLs:

```
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/data/collections/{collection}/items.json
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/data/collections/{collection}/categories.json
```

Example:
```
https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/retro-games/items.json
```

### Configuration Options

itemdeck supports two configuration patterns:

#### Option A: Structured Source

```typescript
// itemdeck config
{
  dataSource: {
    type: "github",
    owner: "REPPL",
    repo: "MyPlausibleMe",
    collection: "retro-games",
    branch: "main"
  }
}
```

This pattern:
- Allows collection switching in UI
- Enables manifest discovery
- Supports collection metadata loading

#### Option B: Direct URLs

```typescript
// itemdeck config
{
  dataSource: {
    itemsUrl: "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/retro-games/items.json",
    categoriesUrl: "https://raw.githubusercontent.com/REPPL/MyPlausibleMe/main/data/collections/retro-games/categories.json"
  }
}
```

This pattern:
- Simpler configuration
- Works with any JSON endpoint
- No manifest discovery

### Data Flow

```
[JSON Files] → [GitHub Raw] → [itemdeck]
      ↓              ↓              ↓
   Source        Fetched       Validated
   of truth      via URL       with Zod
```

For creating collections from CSV, use [plausible-cli](https://github.com/REPPL/plausible-cli).

### Zod Schema (itemdeck)

```typescript
// src/schemas/collection.schema.ts
import { z } from 'zod';

export const itemSchema = z.object({
  LABEL: z.string(),
  RANK: z.number().int().min(0),
  CATEGORY: z.string(),
  DESCRIPTION: z.string().optional(),
  URL: z.string().url().optional(),
  IMAGE_URL: z.string().url().optional(),
});

export const categorySchema = z.object({
  LABEL: z.string(),
  YEAR: z.number().int(),
  DESCRIPTION: z.string().optional(),
  URL: z.string().url().optional(),
});

export const collectionSchema = z.object({
  items: z.array(itemSchema),
  categories: z.array(categorySchema),
});

export type Item = z.infer<typeof itemSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Collection = z.infer<typeof collectionSchema>;
```

## Image Handling Strategy

### Hybrid Approach

The architecture supports a hybrid approach to images:

| Scenario | Handling |
|----------|----------|
| `IMAGE_URL` provided | Use the URL directly |
| `IMAGE_URL` missing | itemdeck shows themed placeholder |
| `IMAGE_URL` invalid | Fallback to placeholder with error icon |

### Image Sourcing (Manual Process)

For the retro-games collection:
1. Use item's `URL` field (Wikipedia) as sourcing hint
2. Find cover images on Wikipedia/Wikimedia Commons
3. Verify licensing (prefer public domain or CC)
4. Add `IMAGE_URL` to the item in `items.json`

### Placeholder Design

itemdeck provides themed placeholders based on:
- Category/platform (for games: console-specific design)
- Theme setting (modern vs retro style)
- Card size (different detail levels)

## Extensibility Examples

### New Collection: Favourite Books

```
data/collections/favourite-books/
├── collection.json      # Uses "ranked-collection" schema
├── categories.json      # Genres: Fiction, Non-Fiction, etc.
└── items.json           # Books with author, year, rating
```

### New Schema: Timeline Collection

For chronological data without ranking:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "timeline-collection.schema.json",
  "title": "Timeline Collection",
  "definitions": {
    "event": {
      "required": ["LABEL", "DATE"],
      "properties": {
        "LABEL": { "type": "string" },
        "DATE": { "type": "string", "format": "date" },
        "DESCRIPTION": { "type": "string" },
        "LOCATION": { "type": "string" },
        "IMAGE_URL": { "type": "string", "format": "uri" }
      }
    }
  }
}
```

### Different itemdeck Instance

Each collection's `collection.json` can specify display preferences, allowing:
- Different themes per collection
- Custom card layouts
- Collection-specific branding

## Caching Strategy

### TanStack Query Settings

| Content | staleTime | gcTime | Rationale |
|---------|-----------|--------|-----------|
| manifest.json | 1 hour | 24 hours | Rarely changes |
| collection.json | 30 min | 1 hour | Infrequent updates |
| items.json | 10 min | 30 min | Main data, balance freshness |
| categories.json | 10 min | 30 min | Same as items |
| Images | Cache-first | 30 days | Large, static |

### Service Worker Strategy

```typescript
// Card data: stale-while-revalidate
registerRoute(
  ({ url }) => url.hostname === 'raw.githubusercontent.com'
    && url.pathname.endsWith('.json'),
  new StaleWhileRevalidate({
    cacheName: 'collection-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);
```

## Security Considerations

### Data Validation

All external data MUST be validated:
1. **Schema validation** — JSON Schema in repository
2. **Runtime validation** — Zod schemas in itemdeck
3. **URL sanitisation** — Validate URL formats before use

### CORS and CSP

GitHub raw URLs (`raw.githubusercontent.com`) are CORS-enabled. For other sources:
- Configure appropriate CORS headers
- Add to Content Security Policy allowlist

### Rate Limiting

| Source | Limit | Mitigation |
|--------|-------|------------|
| GitHub raw | None | N/A |
| GitHub API | 60/hour (unauth) | Use raw URLs instead |
| GitHub API | 5000/hour (auth) | Cache aggressively |

## References

- [External Data Sources](./external-data-sources.md) — TanStack Query setup, caching
- [Configuration Hierarchy](./configuration-hierarchy.md) — Config loading patterns
- [JSON Schema Specification](https://json-schema.org/)
- [GitHub Raw Content](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files)
- [plausible-cli](https://github.com/REPPL/plausible-cli) — CSV to JSON conversion tool

---

## Related Documentation

- [Vision Document](../../prompts/vision/README.md) — Product vision and scope
- [F-007: GitHub Data Source](../roadmap/features/planned/F-007-github-data-source.md)
- [F-008: Card Data Schema](../roadmap/features/planned/F-008-card-data-schema.md)
- [External Data Sources](./external-data-sources.md) — Data fetching patterns

