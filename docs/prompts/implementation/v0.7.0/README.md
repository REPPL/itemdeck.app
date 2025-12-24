# v0.7.0 Implementation Prompt - Schema Flexibility

**Version:** v0.7.0
**Codename:** Schema Flexibility
**Branch:** `feature/v0.7.0-schema-flexibility`

---

## Overview

Generalise the ItemDeck schema to support any collection domain (not just games), add rich metadata structures (images with attribution, structured ratings, multiple detail URLs), implement Zod validation, and enable dynamic field discovery for the UI.

---

## Context

- v0.6.0 established the schema loader for v1 format
- Gemini-enriched data (81 games) available with structured ratings and attribution
- Current schema is game-specific (platform, rank terminology)
- Field dropdowns in settings are hardcoded

---

## Key Decisions

- Use Gemini-enriched data (81 games) as the primary demo collection
- Add a second non-game collection (recipes) to prove generalisation
- Generalise game-specific terminology (platform → category, rank → order)
- No backward compatibility needed (private repo)
- Implement Zod validation for runtime schema checking

---

## Scope

### In Scope (v0.7.0)

1. **Schema Type Definitions** - New types for Rating, DetailLink with normalisation helpers
2. **Zod Validation** - Runtime validation with helpful error messages
3. **Loader Updates** - Support isPrimary, structured ratings, detailUrls
4. **Dynamic Field Discovery** - Replace hardcoded dropdown options
5. **Terminology Generalisation** - Generic terms in core types
6. **UI Attribution Display** - Show source links, licences
7. **Demo Data Migration** - Gemini games + recipes collection
8. **Documentation** - Schema v2 reference

### Out of Scope (future)

- Multiple collection switching UI
- Collection editor
- Remote collection loading
- Backward compatibility with v1 data

---

## Schema Changes Summary

### Current v1 → New v2

| Feature | v1 (Current) | v2 (New) |
|---------|--------------|----------|
| Images | `imageUrls: string[]` | Structured with `isPrimary`, `type`, `attribution` |
| Attribution | `imageAttribution?: string` | Per-image object with `source`, `sourceUrl`, `licence` |
| Ratings | `rating?: number` | `rating: number \| RatingValue` with source metadata |
| Detail URLs | `detailUrl?: string` | `detailUrls: DetailLink[]` array with sources |
| Field Discovery | Hardcoded dropdown options | Dynamic from schema |
| Validation | Manual type assertions | Zod schemas with helpful errors |
| Schema Version | Implicit | Explicit `schemaVersion: "v2"` |

---

## Phase 1: Schema Type Definitions

**Objective:** Define v2 TypeScript types for new structures.

### Files to Create

| File | Purpose |
|------|---------|
| `src/types/rating.ts` | RatingValue interface, normalisation helpers |
| `src/types/links.ts` | DetailLink interface, normalisation helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/image.ts` | Add `isPrimary`, `sourceUrl`, `licenceUrl` to Attribution |
| `src/types/schema.ts` | Add `schemaVersion`, new field types (`rating`, `detailUrls`) |

### New Type Definitions

```typescript
// src/types/rating.ts
export interface RatingValue {
  score: number;
  max?: number;              // Default 5
  sourceCount?: number;
  source?: string;           // e.g., "Wikipedia", "MobyGames"
  sourceUrl?: string;
}

export type Rating = number | RatingValue;

// Type guard
export function isStructuredRating(rating: Rating): rating is RatingValue {
  return typeof rating === 'object' && 'score' in rating;
}

// Normalisation
export function normaliseRating(rating: Rating): RatingValue {
  if (isStructuredRating(rating)) return rating;
  return { score: rating, max: 5 };
}
```

```typescript
// src/types/links.ts
export interface DetailLink {
  url: string;
  source?: string;           // e.g., "Wikipedia"
  label?: string;
  isPrimary?: boolean;
}

export type DetailUrls = string | DetailLink | DetailLink[];

// Normalisation
export function normaliseDetailUrls(urls: DetailUrls | undefined): DetailLink[] {
  if (!urls) return [];
  if (typeof urls === 'string') return [{ url: urls }];
  if (Array.isArray(urls)) return urls;
  return [urls];
}
```

```typescript
// src/types/image.ts - Enhanced Attribution
export interface Attribution {
  source?: string;
  sourceUrl?: string;        // NEW: Direct link to source page
  author?: string;
  licence?: string;
  licenceUrl?: string;       // NEW: Link to licence text
}

// src/types/image.ts - Enhanced Image
export interface Image {
  url: string;
  type?: ImageType;
  isPrimary?: boolean;       // NEW: Explicit primary flag
  alt?: string;
  width?: number;
  height?: number;
  attribution?: Attribution;
}
```

### Success Criteria

- [ ] All new types compile without errors
- [ ] Type guards work correctly (`isStructuredRating`)
- [ ] Normalisation functions handle all edge cases

---

## Phase 2: Zod Validation Schemas

**Objective:** Create Zod schemas for runtime validation with helpful error messages.

### Files to Create

| File | Purpose |
|------|---------|
| `src/schemas/v2/collection.schema.ts` | Main Zod schema |
| `src/schemas/v2/index.ts` | Re-exports |

### Key Schemas

```typescript
// src/schemas/v2/collection.schema.ts
import { z } from "zod";

export const attributionSchema = z.object({
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  author: z.string().optional(),
  licence: z.string().optional(),
  licenceUrl: z.string().url().optional(),
});

export const imageSchema = z.object({
  url: z.string().url(),
  type: z.string().optional(),
  isPrimary: z.boolean().optional(),
  alt: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  attribution: attributionSchema.optional(),
});

export const ratingValueSchema = z.object({
  score: z.number(),
  max: z.number().positive().optional(),
  sourceCount: z.number().nonnegative().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

export const ratingSchema = z.union([z.number(), ratingValueSchema]);

export const detailLinkSchema = z.object({
  url: z.string().url(),
  source: z.string().optional(),
  label: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const detailUrlsSchema = z.union([
  z.string().url(),
  detailLinkSchema,
  z.array(detailLinkSchema),
]);
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/loaders/collectionLoader.ts` | Add Zod validation on load |

### Success Criteria

- [ ] Valid collections pass validation
- [ ] Invalid collections produce helpful path-based errors
- [ ] Performance impact < 50ms

---

## Phase 3: Loader Updates

**Objective:** Update loaders to handle new field types and enhanced images.

### Files to Modify

| File | Changes |
|------|---------|
| `src/loaders/imageSelector.ts` | Support `isPrimary` flag in expressions |
| `src/loaders/collectionLoader.ts` | Integrate Zod validation |
| `src/hooks/useCollection.ts` | Normalise ratings, detailUrls in DisplayCard |

### Files to Create

| File | Purpose |
|------|---------|
| `src/loaders/ratingResolver.ts` | Rating normalisation and formatting |

### DisplayCard Updates

```typescript
// src/hooks/useCollection.ts
export interface DisplayCard extends CardWithCategory {
  // Existing fields...

  // NEW: Structured rating with source metadata
  rating?: RatingValue;

  // NEW: Multiple detail URLs with source info
  detailUrls?: DetailLink[];

  // NEW: Full primary image for attribution display
  primaryImage?: Image;
}
```

### Image Selection Enhancement

```typescript
// Support isPrimary flag
// Expression: "images[isPrimary=true] ?? images[type=cover][0] ?? images[0]"

export function getPrimaryImage(images: Image[]): Image | undefined {
  // 1. Explicit isPrimary flag
  const primary = images.find(img => img.isPrimary);
  if (primary) return primary;

  // 2. Type-based fallback
  const cover = images.find(img => img.type === "cover" || img.type === "boxart");
  if (cover) return cover;

  // 3. First image
  return images[0];
}
```

### Success Criteria

- [ ] Old collections with `rating: number` still work
- [ ] New structured ratings display correctly
- [ ] `isPrimary` image selection works
- [ ] Multiple detailUrls accessible

---

## Phase 4: Dynamic Field Discovery

**Objective:** Replace hardcoded field options with dynamic discovery from schema.

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/fieldDiscovery.ts` | Schema introspection service |
| `src/contexts/FieldOptionsContext.tsx` | React context for field options |

### Files to Modify

| File | Changes |
|------|---------|
| `src/utils/fieldPathResolver.ts` | Remove hardcoded options, use context |
| `src/components/SettingsPanel/ConfigSettingsTabs.tsx` | Use `useFieldOptions()` hook |
| `src/App.tsx` | Wrap with `FieldOptionsProvider` |

### Field Discovery Logic

```typescript
// src/services/fieldDiscovery.ts
export function discoverFieldsForContext(
  definition: CollectionDefinition,
  primaryType: string,
  context: "subtitle" | "footerBadge" | "logo" | "sort" | "badge"
): FieldOption[] {
  const options: FieldOption[] = [];
  const primaryEntity = definition.entityTypes[primaryType];

  // Add direct fields that match context type requirements
  for (const [name, field] of Object.entries(primaryEntity.fields)) {
    if (isFieldSuitableFor(field.type, context)) {
      options.push({
        value: name,
        label: toTitleCase(name),
      });
    }
  }

  // Add related entity fields (e.g., category.title)
  // ...traverse relationships...

  // Add "none" option where appropriate
  if (context !== "sort") {
    options.push({ value: "none", label: "None" });
  }

  return options;
}
```

### Success Criteria

- [ ] Field dropdowns populate from schema
- [ ] Related entity fields appear (e.g., `category.title`)
- [ ] Options update when collection changes
- [ ] Fallback to defaults when context missing

---

## Phase 5: Terminology Generalisation

**Objective:** Replace game-specific terminology with generic terms.

### Terminology Mapping

| Game-Specific | Generic | Notes |
|---------------|---------|-------|
| `platform` | `category` | Relationship target |
| `rank` | `order` | Ordinal field |
| `playedSince` | `startDate` or custom | Keep as demo-specific |
| `device` | `categoryShort` | Short category name |
| `platformTitle` | `categoryTitle` | Full category name |

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCollection.ts` | Rename DisplayCard fields |
| `src/components/Card/CardFront.tsx` | Use generic prop names |
| `src/components/Card/CardBack.tsx` | Use generic prop names |
| `src/stores/settingsStore.ts` | Update field mapping defaults |
| `src/utils/fieldPathResolver.ts` | Update resolver logic |

### DisplayCard Interface Update

```typescript
// Before (game-specific)
export interface DisplayCard {
  device?: string;
  platformTitle?: string;
  rank: number | null;
}

// After (generic)
export interface DisplayCard {
  categoryShort?: string;      // Was: device
  categoryTitle?: string;      // Was: platformTitle
  order: number | null;        // Was: rank
}
```

### Success Criteria

- [ ] No game-specific terms in core types
- [ ] Demo data uses domain-specific terms (games keep "platform")
- [ ] UI labels remain appropriate for any domain

---

## Phase 6: UI Attribution Display

**Objective:** Display rich image attribution with links to source and licence.

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/Attribution/Attribution.tsx` | Attribution display component |
| `src/components/Attribution/Attribution.module.css` | Styles |
| `src/components/Attribution/index.ts` | Re-export |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/CardExpanded/CardExpanded.tsx` | Use Attribution component, show multiple detailUrls |
| `src/components/CardExpanded/CardExpanded.module.css` | Styles for detail links |

### Attribution Component

```tsx
// src/components/Attribution/Attribution.tsx
interface AttributionProps {
  attribution: Attribution;
  compact?: boolean;
}

export function Attribution({ attribution, compact = false }: AttributionProps) {
  return (
    <div className={compact ? styles.compact : styles.full}>
      {attribution.source && (
        <span className={styles.source}>
          {attribution.sourceUrl ? (
            <a href={attribution.sourceUrl} target="_blank" rel="noopener noreferrer">
              {attribution.source}
            </a>
          ) : (
            attribution.source
          )}
        </span>
      )}
      {attribution.licence && (
        <span className={styles.licence}>
          {attribution.licenceUrl ? (
            <a href={attribution.licenceUrl}>{attribution.licence}</a>
          ) : (
            attribution.licence
          )}
        </span>
      )}
    </div>
  );
}
```

### Success Criteria

- [ ] Attribution shows source with link
- [ ] Licence displayed with optional link
- [ ] Multiple detail URLs render as buttons
- [ ] Primary URL visually distinguished

---

## Phase 7: Demo Data Migration

**Objective:** Use Gemini-enriched data and add second collection.

### Files to Modify/Create

| File | Action |
|------|--------|
| `public/data/demo/collection.json` | Update to v2 schema format |
| `public/data/demo/entities/games.json` | Replace with Gemini's 81 games |
| `public/data/demo/entities/platforms.json` | Update with enhanced attribution |
| `public/data/recipes/collection.json` | NEW: Second demo collection |
| `public/data/recipes/entities/recipes.json` | NEW: 5-10 sample recipes |
| `public/data/recipes/entities/cuisines.json` | NEW: Recipe categories |

### Gemini Data Source

Source data location (external to this repository):
- `games.json` - 81 games with structured ratings, attribution, detailUrls
- `platforms.json` - Platform data with enhanced images

The Gemini-enriched data was prepared separately and will be copied into the project during implementation.

### Success Criteria

- [ ] Games collection loads with 81 Gemini-enriched entries
- [ ] Recipes collection loads and displays correctly
- [ ] Attribution displays for both collections
- [ ] Field discovery works for both schemas

---

## Phase 8: Technical Documentation

**Objective:** Create schema reference documentation.

### Files to Create

| File | Purpose |
|------|---------|
| `docs/reference/schemas/v2/README.md` | Schema v2 reference |

### Documentation Contents

1. **Field Types Reference** - All supported field types with examples
2. **Image Structure** - Full image object documentation
3. **Rating Structure** - Simple number vs RatingValue
4. **DetailUrls Structure** - Single URL vs array
5. **Display Configuration** - Card front/back mapping

### Success Criteria

- [ ] Schema reference complete and accurate
- [ ] Examples for all new features

---

## Phase 9: Post-Implementation Documentation

**Objective:** Create process documentation after implementation.

### Files to Create

| File | Purpose |
|------|---------|
| `docs/development/process/devlogs/v0.7.0/README.md` | Development narrative |
| `docs/development/process/retrospectives/v0.7.0/README.md` | Post-milestone reflection |

### Verification Steps

1. Run `/verify-docs` - Documentation audit
2. Run `/sync-docs` - Implementation-docs consistency
3. Run `/pii-scan` - Check for personal information
4. Update milestone status to Complete
5. Create git tag

---

## Files Summary

### New Files (18)

| File | Phase |
|------|-------|
| `src/types/rating.ts` | 1 |
| `src/types/links.ts` | 1 |
| `src/schemas/v2/collection.schema.ts` | 2 |
| `src/schemas/v2/index.ts` | 2 |
| `src/loaders/ratingResolver.ts` | 3 |
| `src/services/fieldDiscovery.ts` | 4 |
| `src/contexts/FieldOptionsContext.tsx` | 4 |
| `src/components/Attribution/Attribution.tsx` | 6 |
| `src/components/Attribution/Attribution.module.css` | 6 |
| `src/components/Attribution/index.ts` | 6 |
| `public/data/recipes/collection.json` | 7 |
| `public/data/recipes/entities/recipes.json` | 7 |
| `public/data/recipes/entities/cuisines.json` | 7 |
| `docs/reference/schemas/v2/README.md` | 8 |
| `docs/development/process/devlogs/v0.7.0/README.md` | 9 |
| `docs/development/process/retrospectives/v0.7.0/README.md` | 9 |

### Modified Files (17)

| File | Phase |
|------|-------|
| `src/types/image.ts` | 1 |
| `src/types/schema.ts` | 1 |
| `src/loaders/collectionLoader.ts` | 2, 3 |
| `src/loaders/imageSelector.ts` | 3 |
| `src/hooks/useCollection.ts` | 3, 5 |
| `src/utils/fieldPathResolver.ts` | 4, 5 |
| `src/components/SettingsPanel/ConfigSettingsTabs.tsx` | 4 |
| `src/App.tsx` | 4 |
| `src/components/Card/CardFront.tsx` | 5 |
| `src/components/Card/CardBack.tsx` | 5 |
| `src/stores/settingsStore.ts` | 5 |
| `src/components/CardExpanded/CardExpanded.tsx` | 6 |
| `src/components/CardExpanded/CardExpanded.module.css` | 6 |
| `public/data/demo/collection.json` | 7 |
| `public/data/demo/entities/games.json` | 7 |

---

## Implementation Order

```
Phase 1: Schema Type Definitions
    │
    ▼
Phase 2: Zod Validation Schemas
    │
    ├─────────────────┐
    ▼                 ▼
Phase 3: Loader    Phase 5: Terminology
Updates            Generalisation
    │                 │
    └────────┬────────┘
             ▼
Phase 4: Dynamic Field Discovery
             │
             ▼
Phase 6: UI Attribution Display
             │
             ▼
Phase 7: Demo Data Migration
             │
             ▼
Phase 8: Technical Documentation
             │
             ▼
Phase 9: Post-Implementation Docs
             │
             ▼
Verification & Release
```

---

## Success Criteria (Overall)

### Schema Flexibility

- [ ] v2 schema supports any domain (not game-specific)
- [ ] Two demo collections work (games + recipes)
- [ ] Dynamic field discovery populates UI

### Data Quality

- [ ] Gemini's 81 games load correctly
- [ ] All images have proper attribution
- [ ] Ratings display with source metadata
- [ ] Multiple detail URLs accessible

### Code Quality

- [ ] Zod validation catches malformed data
- [ ] Error messages are helpful
- [ ] No TypeScript errors
- [ ] All tests pass

### UX

- [ ] Attribution displays clearly
- [ ] Source links open correctly
- [ ] Field dropdowns show appropriate options

---

## Related Documentation

- [v0.7.0 Milestone](../../development/roadmap/milestones/v0.7.0.md)
- [v0.6.0 Schema Loader](./v0.6.0/README.md)
- [v1 Schema Reference](../../reference/schemas/v1/README.md)

---

**Status**: Ready for Implementation
