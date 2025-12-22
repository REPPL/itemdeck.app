# v0.6.0 Implementation Prompt - Schema Loader & Data Migration

**Version:** v0.6.0
**Codename:** Schema Loader
**Branch:** `feature/v0.6.0-schema-loader`

---

## Overview

Implement the schema loader to read and validate collections using the v1 schema format. Migrate the retro-games demo collection from the legacy format to the new Entity-Relationship schema.

---

## Context

- v0.5.0 established the schema specification (JSON Schema files)
- Example collection exists at `docs/reference/schemas/examples/retro-games/`
- Current app reads legacy format from `public/data/collections/retro-games/`
- Need to implement loader that understands new format
- Need to migrate demo data to new format

---

## Scope

### In Scope (v0.6.0)

1. **Schema Loader** - TypeScript module to load and parse new format
2. **Entity Resolution** - Resolve relationships between entities
3. **Image Handling** - Support new image array structure
4. **Data Migration** - Convert retro-games to new format
5. **Backward Compatibility** - Optional support for legacy format
6. **Settings Review** - Audit and reorganise settings for schema-driven customisation

### Out of Scope (future)

- Schema validation at runtime (use TypeScript types)
- Multiple collection support
- Collection editor UI
- Remote collection loading

---

## Phase 1: Collection Loader

### 1.1 Create Collection Loader

**New File:** `src/loaders/collectionLoader.ts`

```typescript
interface CollectionLoader {
  loadCollection(path: string): Promise<LoadedCollection>;
  loadEntities<T>(collectionPath: string, entityType: string): Promise<T[]>;
}

interface LoadedCollection {
  metadata: CollectionMetadata;
  entityTypes: Record<string, EntityTypeDefinition>;
  relationships: Record<string, RelationshipDefinition>;
  display: DisplayConfig;
}
```

### 1.2 Entity Loader

**New File:** `src/loaders/entityLoader.ts`

- Load entities from `entities/{type}.json` or `entities/{type}/*.json`
- Support both single file and directory patterns
- Parse and validate entity structure

### 1.3 Relationship Resolver

**New File:** `src/loaders/relationshipResolver.ts`

- Resolve foreign key references (e.g., `platform: "snes"` → platform object)
- Handle scoped ordinals (rank within platform)
- Build relationship graph for traversal

---

## Phase 2: Type Definitions

### 2.1 Schema Types

**New File:** `src/types/schema.ts`

```typescript
// Collection definition
interface CollectionDefinition {
  $schema: string;
  id: string;
  name: string;
  description?: string;
  version?: string;
  metadata?: CollectionMetadata;
  entityTypes: Record<string, EntityTypeDefinition>;
  relationships?: Record<string, RelationshipDefinition>;
  display?: DisplayConfig;
}

// Entity type definition
interface EntityTypeDefinition {
  primary?: boolean;
  label?: string;
  labelPlural?: string;
  description?: string;
  fields: Record<string, FieldDefinition>;
  computed?: Record<string, string>;
}

// Field definition
interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  description?: string;
  default?: unknown;
  enum?: string[];
  // ... other field properties
}

type FieldType = 'string' | 'text' | 'number' | 'boolean' | 'date' | 'url' | 'enum' | 'array' | 'object' | 'images';
```

### 2.2 Image Types

**New File:** `src/types/image.ts`

```typescript
interface Image {
  url: string;
  type?: ImageType;
  alt?: string;
  width?: number;
  height?: number;
  attribution?: Attribution;
}

interface Attribution {
  source?: string;
  author?: string;
  licence?: string;
  url?: string;
}

type ImageType = 'cover' | 'screenshot' | 'title-screen' | 'logo' | 'promotional' | 'fan-art' | 'photo' | 'artwork';
```

### 2.3 Display Types

**New File:** `src/types/display.ts`

```typescript
interface DisplayConfig {
  primaryEntity?: string;
  groupBy?: string;
  sortBy?: SortSpec;
  sortWithinGroup?: SortSpec;
  card?: CardDisplayConfig;
  expanded?: ExpandedDisplayConfig;
  theme?: string;
}

type SortSpec = string | [string, 'asc' | 'desc'];
```

---

## Phase 3: Image Expression Parser

### 3.1 Image Selector

**New File:** `src/loaders/imageSelector.ts`

Parse expressions like:
- `images[0]` → First image
- `images[type=cover][0]` → First cover image
- `images[type=cover][0] ?? images[0]` → Cover or fallback to first

```typescript
function selectImage(images: Image[], expression: string): Image | undefined;
function selectImages(images: Image[], expression: string): Image[];
```

### 3.2 Field Path Parser

**New File:** `src/loaders/fieldPath.ts`

Parse dot-notation field paths:
- `title` → entity.title
- `platform.title` → resolved platform entity's title
- `images[0].url` → first image URL

```typescript
function getFieldValue(entity: Entity, path: string, context: ResolverContext): unknown;
```

---

## Phase 4: Data Migration

### 4.1 Migrate Retro-Games Collection

**Source:** `public/data/collections/retro-games/` (legacy)
**Target:** `public/data/collections/retro-games/` (new format)

**Steps:**
1. Create `collection.json` with schema definition
2. Create `entities/platforms.json` from `categories.json`
3. Create `entities/games.json` from `items.json`
4. Convert `imageUrl`/`imageUrls` to `images[]` array
5. Convert `imageAttribution` string to structured `attribution` object
6. Convert `metadata.category` to `platform` reference
7. Convert `metadata.rank` string to `rank` number

### 4.2 Migration Script

**New File:** `scripts/migrate-collection.ts`

```typescript
// Usage: npx ts-node scripts/migrate-collection.ts retro-games
async function migrateCollection(collectionId: string): Promise<void>;
```

### 4.3 Attribution Parser

Parse legacy attribution strings:
- `"Image from Wikimedia Commons. File:Example.jpg"` →
  ```json
  {
    "source": "Wikimedia Commons",
    "url": "https://commons.wikimedia.org/wiki/File:Example.jpg"
  }
  ```

---

## Phase 5: Hook Integration

### 5.1 Update useCollection Hook

**File:** `src/hooks/useCollection.ts`

- Use new collection loader
- Map loaded entities to DisplayCard format
- Handle image array → single imageUrl for backward compat
- Resolve platform relationships

### 5.2 DisplayCard Adapter

Adapt loaded entities to existing DisplayCard interface:

```typescript
function entityToDisplayCard(
  entity: GameEntity,
  context: CollectionContext
): DisplayCard {
  return {
    id: entity.id,
    title: entity.title,
    year: String(entity.year),
    imageUrl: entity.images?.[0]?.url ?? '',
    imageUrls: entity.images?.map(img => img.url),
    // ... other mappings
  };
}
```

---

## Phase 6: Testing

### 6.1 Loader Tests

**New File:** `src/loaders/__tests__/collectionLoader.test.ts`

- Load collection definition
- Validate required fields
- Handle missing optional fields

### 6.2 Entity Tests

**New File:** `src/loaders/__tests__/entityLoader.test.ts`

- Load entities from file
- Load entities from directory
- Handle empty entity files

### 6.3 Relationship Tests

**New File:** `src/loaders/__tests__/relationshipResolver.test.ts`

- Resolve many-to-one relationships
- Handle missing references
- Resolve scoped ordinals

### 6.4 Image Selector Tests

**New File:** `src/loaders/__tests__/imageSelector.test.ts`

- Select by index
- Select by type
- Handle fallback expressions
- Handle empty arrays

---

## Phase 7: Integration

### 7.1 Update Data Fetching

**File:** `src/hooks/useCollection.ts`

Switch from legacy format to new format:

```typescript
// Before
const data = await fetch('/data/collections/retro-games/items.json');

// After
const loader = new CollectionLoader();
const collection = await loader.loadCollection('/data/collections/retro-games');
const games = await loader.loadEntities(collection, 'game');
```

### 7.2 Update Card Components

Ensure Card components work with new image structure:

```typescript
// Support both legacy and new format
const imageUrl = card.images?.[0]?.url ?? card.imageUrl ?? '';
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/loaders/collectionLoader.ts` | Load collection definitions |
| `src/loaders/entityLoader.ts` | Load entity files |
| `src/loaders/relationshipResolver.ts` | Resolve entity relationships |
| `src/loaders/imageSelector.ts` | Parse image expressions |
| `src/loaders/fieldPath.ts` | Parse field paths |
| `src/types/schema.ts` | Schema type definitions |
| `src/types/image.ts` | Image type definitions |
| `src/types/display.ts` | Display type definitions |
| `scripts/migrate-collection.ts` | Migration script |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCollection.ts` | Use new loader |
| `public/data/collections/retro-games/*` | Migrate to new format |

---

## Success Criteria

- [ ] Collection loader reads new schema format
- [ ] Entity loader supports file and directory patterns
- [ ] Relationships resolved correctly
- [ ] Image expressions parsed and evaluated
- [ ] Retro-games migrated to new format
- [ ] App works with migrated data
- [ ] All existing tests pass
- [ ] New loader tests pass
- [ ] Build succeeds
- [ ] TypeScript/ESLint clean

---

## Implementation Order

1. Create type definitions
2. Implement collection loader
3. Implement entity loader
4. Implement relationship resolver
5. Implement image selector
6. Write loader tests
7. Migrate retro-games data
8. Update useCollection hook
9. Integration testing
10. Write devlog and retrospective
11. Run verification suite
12. Commit, tag, push

---

## Phase 8: Settings Audit & Reorganisation

### 8.1 Review Current Settings

**File:** `src/stores/settingsStore.ts`

Audit all settings to ensure collection-level customisation is accessible:

**Current settings to review:**
- Card dimensions (width, height)
- Card back display (logo, year, none)
- Rank badge visibility
- Device badge visibility
- Rank placeholder text
- Shuffle on load
- Drag face setting
- Max visible cards

### 8.2 Schema-Driven Settings

Ensure settings align with schema's `display` configuration:

| Schema Display Config | Settings Equivalent |
|-----------------------|---------------------|
| `card.front.badge` | `showRankBadge` |
| `card.back.text` | `cardBackDisplay` |
| `groupBy` | (future: grouping setting) |
| `sortWithinGroup` | (future: sorting setting) |
| `theme` | (future: visual theme) |

### 8.3 Settings Tab Reorganisation

Consider reorganising settings into logical groups:

**Tab 1: Display**
- Card size (width slider)
- Max visible cards
- Card back display (year/logo/none)

**Tab 2: Badges**
- Show rank badge toggle
- Show device badge toggle
- Rank placeholder text

**Tab 3: Behaviour**
- Shuffle on load toggle
- Drag face setting (back/front/both)

**Tab 4: System**
- Logo URL
- Debug/dev options

### 8.4 New Settings to Consider

Based on schema capabilities, consider adding:
- Group by selector (platform/year/none)
- Sort order selector (rank/title/year)
- Image display preference (cover/screenshot/first)

---

## Files to Modify (Updated)

| File | Changes |
|------|---------|
| `src/hooks/useCollection.ts` | Use new loader |
| `src/stores/settingsStore.ts` | Reorganise settings, add new options |
| `src/components/SettingsPanel/` | Update UI for reorganised settings |
| `public/data/collections/retro-games/*` | Migrate to new format |

---

## Success Criteria (Updated)

- [ ] Collection loader reads new schema format
- [ ] Entity loader supports file and directory patterns
- [ ] Relationships resolved correctly
- [ ] Image expressions parsed and evaluated
- [ ] Retro-games migrated to new format
- [ ] App works with migrated data
- [ ] Settings reviewed and reorganised
- [ ] All collection customisations accessible via settings
- [ ] All existing tests pass
- [ ] New loader tests pass
- [ ] Build succeeds
- [ ] TypeScript/ESLint clean

---

## Implementation Order (Updated)

1. Create type definitions
2. Implement collection loader
3. Implement entity loader
4. Implement relationship resolver
5. Implement image selector
6. Write loader tests
7. Migrate retro-games data
8. Update useCollection hook
9. **Audit and reorganise settings**
10. **Update SettingsPanel UI**
11. Integration testing
12. Write devlog and retrospective
13. Run verification suite
14. Commit, tag, push

---

## Related Documentation

- [v0.6.0 Milestone](../../development/roadmap/milestones/v0.6.0.md)
- [v0.5.0 Schema Design](../v0.5.0/README.md)
- [Collection Schema](../../reference/schemas/v1/collection.schema.json)

---

**Status**: Ready for Implementation
