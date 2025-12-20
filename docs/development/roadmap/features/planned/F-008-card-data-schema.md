# F-008: Card Data Schema

## Problem Statement

Cards from different sources may have varying data structures. We need a standardised schema that:

1. Defines required and optional card fields
2. Validates data from any source
3. Provides TypeScript types
4. Supports extensibility for custom fields

## Design Approach

Define a **canonical card schema** using Zod that all data sources must conform to:

### Core Card Schema

```typescript
// src/schemas/card.ts
import { z } from 'zod';

// Base card fields (required)
const CardBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
});

// Optional card fields
const CardOptionalSchema = z.object({
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

// Combined card schema
export const CardDataSchema = CardBaseSchema.merge(CardOptionalSchema);
export type CardData = z.infer<typeof CardDataSchema>;

// Card collection schema (for JSON files)
export const CardCollectionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  cards: z.array(CardDataSchema),
});
export type CardCollection = z.infer<typeof CardCollectionSchema>;
```

### Validation Utilities

```typescript
// src/utils/validation.ts
import { CardDataSchema, CardCollectionSchema } from '../schemas/card';
import type { CardData, CardCollection } from '../schemas/card';

export function validateCard(data: unknown): CardData {
  return CardDataSchema.parse(data);
}

export function validateCards(data: unknown[]): CardData[] {
  return data.map((item) => CardDataSchema.parse(item));
}

export function safeValidateCard(data: unknown): { success: true; data: CardData } | { success: false; error: z.ZodError } {
  const result = CardDataSchema.safeParse(data);
  return result;
}

export function validateCollection(data: unknown): CardCollection {
  return CardCollectionSchema.parse(data);
}

// Partial validation for filtering invalid cards
export function filterValidCards(data: unknown[]): { valid: CardData[]; invalid: unknown[] } {
  const valid: CardData[] = [];
  const invalid: unknown[] = [];

  for (const item of data) {
    const result = CardDataSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push(item);
    }
  }

  return { valid, invalid };
}
```

### Schema Extension Pattern

```typescript
// src/schemas/cardExtensions.ts
import { z } from 'zod';
import { CardDataSchema } from './card';

// Example: Gaming card extension
export const GamingCardSchema = CardDataSchema.extend({
  stats: z.object({
    attack: z.number().min(0),
    defense: z.number().min(0),
    health: z.number().min(0),
  }).optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'legendary']).optional(),
});
export type GamingCard = z.infer<typeof GamingCardSchema>;

// Example: Contact card extension
export const ContactCardSchema = CardDataSchema.extend({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});
export type ContactCard = z.infer<typeof ContactCardSchema>;
```

### JSON File Format

Example `cards.json` file:

```json
{
  "version": "1.0.0",
  "name": "My Card Collection",
  "description": "A collection of cards",
  "cards": [
    {
      "id": "card-001",
      "name": "Example Card",
      "description": "This is an example card",
      "imageUrl": "https://example.com/image.jpg",
      "category": "examples",
      "tags": ["example", "demo"]
    }
  ]
}
```

## Implementation Tasks

- [ ] Create `src/schemas/card.ts` with core schemas
- [ ] Create `src/utils/validation.ts` utilities
- [ ] Create `src/schemas/cardExtensions.ts` for examples
- [ ] Update CardData type usage across codebase
- [ ] Add validation to data fetching hooks
- [ ] Create error messages for validation failures
- [ ] Document JSON file format
- [ ] Create example cards.json file
- [ ] Write unit tests for schema validation
- [ ] Test edge cases (empty strings, missing fields)

## Success Criteria

- [ ] All card data validated before use
- [ ] Invalid data rejected with clear errors
- [ ] TypeScript types match runtime validation
- [ ] Extensions possible without modifying core
- [ ] JSON file format documented
- [ ] filterValidCards allows partial loading
- [ ] Tests cover validation edge cases

## Dependencies

- **Requires**: F-002 Configuration System (Zod already installed)
- **Blocks**: F-007 GitHub Data Source

## Complexity

**Small** - Schema definition is straightforward with Zod.

---

## Related Documentation

- [External Data Sources Research](../../../../research/external-data-sources.md)
- [Configuration Hierarchy Research](../../../../research/configuration-hierarchy.md)
- [ADR-002: Schema Validation](../../../decisions/adrs/ADR-002-schema-validation.md)
- [v0.2.0 Milestone](../../milestones/v0.2.0.md)
