# F-008: Card Data Schema

## Problem Statement

Cards from external sources have varying data structures. We need a schema system that:

1. Supports multiple data formats (ranked lists, simple lists, timelines)
2. Validates data from any source at runtime
3. Provides TypeScript types
4. Maps external fields to card display elements
5. Rejects unsupported schemas with clear guidance

## Design Approach

Implement a **schema registry** where itemdeck ships with built-in schemas. External repositories declare which schema they use via `topic.json`, and itemdeck validates and renders accordingly.

### Schema Registry

All schemas use the **CardData format** for direct compatibility:

```typescript
// src/schemas/registry.ts
import { z } from 'zod';

export const schemaRegistry = {
  'ranked-collection': {
    version: '1.0.0',
    description: 'Personal ranked lists with categories',
    items: cardDataSchema,
    categories: categorySchema,
    display: {
      title: 'title',
      subtitle: 'metadata.category',
      description: 'summary',
      image: 'imageUrl',
      link: 'detailUrl',
      badge: 'metadata.rank',
      year: 'year',
    },
  },
  'simple-list': {
    version: '1.0.0',
    description: 'Basic item list without ranking or categories',
    items: cardDataSchema,
    categories: null,
    display: {
      title: 'title',
      description: 'summary',
      image: 'imageUrl',
      link: 'detailUrl',
    },
  },
  'timeline': {
    version: '1.0.0',
    description: 'Chronological events with dates',
    items: cardDataSchema,
    categories: null,
    display: {
      title: 'title',
      subtitle: 'year',
      description: 'summary',
      image: 'imageUrl',
      badge: 'metadata.location',
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

### CardData Schema (Core Format)

All schemas use the **CardData format**, matching the [MyPlausibleMe format](https://github.com/REPPL/MyPlausibleMe):

### CardData Schema

```typescript
// src/schemas/cardData.schema.ts
import { z } from 'zod';

export const cardDataSchema = z.object({
  id: z.string().min(1).describe('Unique identifier'),
  title: z.string().min(1).describe('Display title'),
  year: z.string().optional().describe('Year associated with item'),
  imageUrl: z.string().url().optional().describe('Cover image URL'),
  logoUrl: z.string().url().optional().describe('Custom logo for card back'),
  summary: z.string().optional().describe('Personal notes/description'),
  detailUrl: z.string().url().optional().describe('External reference URL'),
  metadata: z.record(z.string()).optional().describe('Additional key-value data'),
});

export type CardData = z.infer<typeof cardDataSchema>;
```

### Category Schema

```typescript
// src/schemas/category.schema.ts
import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string().min(1).describe('Unique identifier'),
  title: z.string().min(1).describe('Display title'),
  year: z.string().optional().describe('Year associated with category'),
  summary: z.string().optional().describe('Category description'),
  detailUrl: z.string().url().optional().describe('External reference URL'),
});

export type Category = z.infer<typeof categorySchema>;
```

### Collection Schema

```typescript
// src/schemas/collection.schema.ts
import { z } from 'zod';
import { cardDataSchema } from './cardData.schema';
import { categorySchema } from './category.schema';

export const collectionSchema = z.object({
  items: z.array(cardDataSchema),
  categories: z.array(categorySchema),
});

export type Collection = z.infer<typeof collectionSchema>;

// Validation utilities
export function validateCollection(data: unknown): Collection {
  return collectionSchema.parse(data);
}

export function safeValidateCollection(data: unknown) {
  return collectionSchema.safeParse(data);
}
```

### Validation Utilities

```typescript
// src/utils/validation.ts
import { collectionSchema, cardDataSchema, categorySchema } from '../schemas';
import type { Collection, CardData, Category } from '../schemas';

export function validateCard(data: unknown): CardData {
  return cardDataSchema.parse(data);
}

export function validateCategory(data: unknown): Category {
  return categorySchema.parse(data);
}

export function filterValidCards(data: unknown[]): { valid: CardData[]; invalid: unknown[] } {
  const valid: CardData[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    const result = cardDataSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push(item);
    }
  }

  return { valid, invalid };
}

// Join items with categories (for ranked-collection schema)
export function joinCardsWithCategories(
  cards: CardData[],
  categories: Category[]
): Array<CardData & { category: Category }> {
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  return cards.map(card => ({
    ...card,
    category: categoryMap.get(card.metadata?.category?.toLowerCase() ?? '')!,
  })).filter(card => card.category !== undefined);
}
```

### TypeScript Types

```typescript
// src/types/collection.ts
import type { CardData, Category, Collection } from '../schemas';

// Re-export schema types
export type { CardData, Category, Collection };

// Extended types for UI
export interface CardWithCategory extends CardData {
  category: Category;
}

// Card state (includes flip state, position, etc.)
export interface CardState {
  card: CardWithCategory;
  isFlipped: boolean;
  order: number;
}
```

### Schema-Specific Metadata

All schemas use the unified **CardData format**. Schema-specific data is stored in the `metadata` field:

#### Ranked Collection

```json
{
  "id": "cosmic-ark-vcs2600",
  "title": "Cosmic Ark",
  "year": "1981",
  "summary": "Space rescue game...",
  "detailUrl": "https://en.wikipedia.org/wiki/Cosmic_Ark",
  "metadata": {
    "category": "VCS2600",
    "rank": "1"
  }
}
```

#### Simple List

```json
{
  "id": "item-1",
  "title": "Item Title",
  "summary": "Description",
  "detailUrl": "https://example.com",
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Timeline

```json
{
  "id": "event-1",
  "title": "Event Title",
  "year": "2024-03-15",
  "summary": "Event description",
  "imageUrl": "https://example.com/image.jpg",
  "metadata": {
    "location": "London, UK"
  }
}
```

### Schema Validation Flow

```typescript
// src/hooks/useCollection.ts
async function fetchAndValidate(config: DataSourceConfig): Promise<Collection> {
  // 1. Fetch topic.json to discover schema
  const topic = await fetchTopicJson(config);

  // 2. Check if schema is supported
  if (!isValidSchema(topic.schema)) {
    throw new SchemaNotSupportedError(topic.schema, getSupportedSchemas());
  }

  // 3. Get schema definition and validate
  const schemaDef = schemaRegistry[topic.schema];
  const items = z.array(schemaDef.items).parse(await fetchItems(config));
  const categories = schemaDef.categories
    ? z.array(schemaDef.categories).parse(await fetchCategories(config))
    : [];

  return { items, categories, schema: topic.schema, display: schemaDef.display };
}
```

### Error Handling

```typescript
// src/errors/SchemaNotSupportedError.ts
export class SchemaNotSupportedError extends Error {
  constructor(requestedSchema: string, supportedSchemas: string[]) {
    super(
      `Unsupported schema: "${requestedSchema}". ` +
      `Supported: ${supportedSchemas.join(', ')}. ` +
      `Request new schemas at: https://github.com/REPPL/itemdeck/issues`
    );
  }
}
```

### Sample Data Format (CardData)

Items JSON (from `data/collections/retro-games/items.json`):

```json
[
  {
    "id": "legend-of-zelda-nes",
    "title": "Legend of Zelda",
    "year": "1989",
    "summary": "Legendary action-adventure; explore Hyrule and save Princess Zelda.",
    "detailUrl": "https://en.wikipedia.org/wiki/The_Legend_of_Zelda_(video_game)",
    "metadata": {
      "category": "NES",
      "rank": "2"
    }
  }
]
```

Categories JSON (from `data/collections/retro-games/categories.json`):

```json
[
  {
    "id": "nes",
    "title": "NES",
    "year": "1989",
    "summary": "Less powerful than the Amiga, yet a much better gaming experience.",
    "detailUrl": "https://en.wikipedia.org/wiki/Nintendo_Entertainment_System"
  }
]
```

## Implementation Tasks

- [ ] Create `src/schemas/registry.ts` with schema registry
- [ ] Create `src/schemas/cardData.schema.ts` (CardData format)
- [ ] Create `src/schemas/category.schema.ts` (Category format)
- [ ] Create `src/schemas/index.ts` barrel export
- [ ] Create `src/errors/SchemaNotSupportedError.ts`
- [ ] Create `src/utils/validation.ts` utilities
- [ ] Create `src/types/collection.ts` type definitions
- [ ] Update data fetching hooks to use registry
- [ ] Write unit tests for CardData schema
- [ ] Test with actual MyPlausibleMe data (CardData format)

## Success Criteria

- [ ] Schema registry correctly identifies supported schemas
- [ ] Unsupported schemas rejected with clear error message
- [ ] All external data validated before use
- [ ] Invalid data rejected with field-level errors
- [ ] TypeScript types match runtime validation
- [ ] Items correctly joined with categories (when applicable)
- [ ] Empty URL strings handled (legacy data)
- [ ] Display mapping correctly extracts fields for cards
- [ ] Tests cover all three schemas

## Dependencies

- **Requires**: F-002 Configuration System (Zod already installed)
- **Blocks**: F-007 GitHub Data Source

## Complexity

**Small** - Schema definition is straightforward with Zod.

---

## Related Documentation

- [Data Repository Architecture](../../research/data-repository-architecture.md)
- [External Data Sources Research](../../research/external-data-sources.md)
- [ADR-002: Schema Validation](../../decisions/adrs/ADR-002-schema-validation.md)
- [v0.2.0 Milestone](../milestones/v0.2.0.md)
