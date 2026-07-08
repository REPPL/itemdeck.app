# v0.6.0 Devlog - Schema Loader

Development narrative for the Schema Loader milestone.

---

## Implementation Narrative

v0.6.0 implements the runtime loader for the v1 schema format designed in v0.5.0. This milestone bridges the gap between schema specification and working code, enabling itemdeck to consume flexible Entity-Relationship collections.

### Phase 1: Type Definitions

Created TypeScript types mirroring the JSON Schema specification:

- **`src/types/schema.ts`** - Core schema types (CollectionDefinition, EntityTypeDefinition, relationships)
- **`src/types/image.ts`** - Image and Attribution types with type guards
- **`src/types/display.ts`** - Display configuration and sort specifications

Design principle: Types closely follow the JSON Schema structure while adding TypeScript-specific utilities like type guards and parser functions.

### Phase 2: Collection Loader

Built the collection loader (`src/loaders/collectionLoader.ts`) with:

- **Format detection** - `isV1Collection()` checks for `entityTypes` property to distinguish v1 from legacy
- **Definition loading** - Fetches and validates `collection.json`
- **Entity loading** - Supports both `{type}.json` and `{type}s.json` naming conventions
- **Parallel loading** - All entity types load concurrently for performance

### Phase 3: Relationship Resolver

Implemented relationship resolution (`src/loaders/relationshipResolver.ts`):

- **Context creation** - Builds lookup maps for O(1) entity access
- **Reference resolution** - Resolves foreign key IDs to full entity objects
- **Ordinal handling** - Extracts scoped rank values
- **Implicit relationships** - Detects when field names match entity type names

### Phase 4: Image Selector

Created an expression-based image selector (`src/loaders/imageSelector.ts`):

```typescript
selectImage(images, "images[type=cover][0] ?? images[0]")
```

Features:
- Index selection (`images[0]`)
- Type filtering (`images[type=cover]`)
- Fallback support (`??` operator)
- Combined expressions

### Phase 5: Field Path Parser

Built a dot-notation field accessor (`src/loaders/fieldPath.ts`):

```typescript
getFieldValue(entity, "platform.title")  // Resolves through relationships
getFieldValue(entity, "images[0].url")   // Array access with property
```

### Phase 6: Data Migration

Created a migration script (`scripts/migrate-collection.ts`) that converts:
- `items.json` + `categories.json` → `entities/games.json` + `entities/platforms.json`
- `metadata.category` → `platform` (lowercase, direct reference)
- `metadata.rank` string → `rank` number
- `imageUrl`/`imageUrls` → `images[]` array with attribution parsing

### Phase 7: Hook Integration

Updated `useCollection.ts` to:
- Auto-detect collection format (v1 vs legacy)
- Use new loader for v1 collections
- Maintain backward compatibility with `DisplayCard` interface
- Create minimal legacy `Collection` object for existing consumers

---

## Challenges Encountered

### 1. TypeScript Strict Mode Compliance

The loaders needed careful handling of potentially undefined values from array operations and object properties. Solved by:
- Adding explicit checks and type guards
- Using nullish coalescing with defined defaults
- Array element checks before assignment

### 2. Backward Compatibility

The existing `DisplayCard` interface expected `metadata: Record<string, string>`. The v1 entities have optional fields. Resolved by filtering undefined values:

```typescript
metadata: Object.fromEntries(
  Object.entries({ category, rank })
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
)
```

### 3. Dual Format Support

Rather than forcing migration, both formats work simultaneously. The hook detects format and routes to appropriate loader, allowing gradual migration.

---

## Code Highlights

### Expression Parser Pattern

The image selector uses a two-stage parsing approach:

```typescript
// Parse expression into token groups (for fallback)
const tokenGroups = parseExpression(expression);

// Apply each token to filter/select
for (const tokens of tokenGroups) {
  const result = applyTokens(images, tokens);
  if (result.length > 0) return result;
}
```

### Resolver Context Pattern

Entity maps enable O(1) lookups for relationship resolution:

```typescript
interface ResolverContext {
  definition: CollectionDefinition;
  entities: Record<string, Entity[]>;
  entityMaps: Record<string, Map<string, Entity>>;
}
```

---

## Files Created

| File | Purpose |
|------|---------|
| `src/types/schema.ts` | Schema type definitions |
| `src/types/image.ts` | Image type definitions |
| `src/types/display.ts` | Display type definitions |
| `src/loaders/collectionLoader.ts` | Load collection definitions |
| `src/loaders/relationshipResolver.ts` | Resolve entity relationships |
| `src/loaders/imageSelector.ts` | Parse image expressions |
| `src/loaders/fieldPath.ts` | Parse field paths |
| `src/loaders/index.ts` | Loader exports |
| `scripts/migrate-collection.ts` | Migration script |
| `tests/loaders/*.test.ts` | Loader tests (46 tests) |

## Files Modified

| File | Changes |
|------|---------|
| `src/hooks/useCollection.ts` | Added v1 format support with auto-detection |
| `public/data/collections/retro-games/collection.json` | Converted to v1 schema format |
| `public/data/collections/retro-games/entities/` | New entity files (games.json, platforms.json) |

---

## Test Results

- **New tests:** 46 (loaders)
- **Total tests:** 257
- **All passing:** Yes
- **Coverage:** Maintained above thresholds

---

## Related Documentation

- [v0.5.0 Devlog](../v0.5.0/README.md) - Schema Design
- [v0.6.0 Retrospective](../../retrospectives/v0.6.0/README.md)
- [v0.6.0 Implementation Prompt](../../../../prompts/implementation/v0.6.0/README.md)
- [v1 Schema Reference](../../../../reference/schemas/v1/README.md)
