# v0.7.0 Development Log - Schema Flexibility

## Implementation Narrative

v0.7.0 focused on generalising the ItemDeck schema to support any collection domain, not just retro games. The milestone introduced rich metadata structures including structured images with attribution, flexible ratings with source information, and multiple detail URLs per entity.

### Phase 1: Schema Type Definitions

Created new TypeScript types to support v2 schema features:

- **`src/types/rating.ts`** - `RatingValue` interface with score, max, sourceCount, source, and sourceUrl fields. Added normalisation helpers and comparison functions.

- **`src/types/links.ts`** - `DetailLink` interface for structured URLs with source metadata. Supports single URL strings, single objects, or arrays.

- **Updated `src/types/image.ts`** - Enhanced Attribution with `sourceUrl` and `licenceUrl` fields. Added `isPrimary` flag to Image interface.

- **Updated `src/types/schema.ts`** - Added `SchemaVersion` type and version detection utilities.

### Phase 2: Zod Validation

Implemented runtime validation with Zod for helpful error messages:

- **`src/schemas/v2/collection.schema.ts`** - Comprehensive Zod schemas for all v2 types
- Helpful path-based error messages for debugging
- Safe validation helpers that don't throw

### Phase 3: Loader Updates

Enhanced the collection loader to support new features:

- **`src/loaders/imageSelector.ts`** - Support for boolean filter values (`isPrimary=true`)
- **`src/loaders/ratingResolver.ts`** - Rating normalisation and display utilities
- **`src/loaders/collectionLoader.ts`** - Zod validation integration, directory-based entity loading

### Phase 4: Dynamic Field Discovery

Replaced hardcoded dropdown options with schema introspection:

- **`src/services/fieldDiscovery.ts`** - Discovers available fields from schema definition
- **`src/contexts/FieldOptionsContext.tsx`** - React context for field options
- Settings dropdowns now populate dynamically from schema

### Phase 5: Terminology Generalisation

Replaced game-specific terms with generic terminology:

| Before | After |
|--------|-------|
| `device` | `categoryShort` |
| `platformTitle` | `categoryTitle` |
| `rank` | `order` |

Legacy aliases maintained for backward compatibility.

### Phase 6: Attribution Component

Created reusable component for image credits:

- **`src/components/Attribution/`** - Display component with source/licence links
- Compact and full display modes
- External link icons with proper accessibility

### Phase 7: Demo Data Migration

Restructured demo data to use individual entity files:

**New structure:**
```
public/data/retro-games/
├── collection.json
├── games/
│   ├── index.json          # Entity ID listing
│   ├── populous-amiga.json
│   └── ...81 game files
└── platforms/
    ├── index.json
    └── ...13 platform files
```

This replaces the previous `demo/` folder with single large JSON files.

### Phase 8: Schema v2 Documentation

Created comprehensive reference documentation:

- **`docs/reference/schemas/v2/README.md`** - Full schema v2 reference
- Field type documentation
- Image and rating structure examples
- Migration notes from v1

### Phase 9: Settings & UI Polish

Additional improvements made to settings wiring and UI polish:

#### Settings Fixes
- **Field mapping corrections** - Fixed `getEntityRank()` to check both `rank` and `myRank` fields
- **Logo extraction** - Added `getLogoUrl()` helper to extract logos from platform `images` array
- **Settings reorganisation** - Moved Max Visible, Shuffle on Load, and Drag to Reorder from Cards > Layout to Config > Display Order

#### Expandable Platform Section
- **Platform details** - Made Platform row in CardExpanded clickable to reveal platform info
- **Dynamic fields** - Platform section now displays any additional fields from JSON (manufacturer, generation, unitsSold, etc.)
- **Source links** - Added Wikipedia/MobyGames links with deduplication by source

#### Image Loading UX
- **Title placeholder** - Replaced skeleton loader with coloured background showing item title
- **Graceful degradation** - Title remains visible if image fails to load
- **Smooth transition** - Images fade in when loaded

#### Details View Cleanup
- **Skip list expansion** - Added rating, averageRating, originalPlatform, categoryInfo to skip list
- **Link deduplication** - Show only one link per source (e.g., one Wikipedia link even if multiple URLs)

#### Theme Integration
- **Background colour** - Card Background colour setting now applies to detail view panel

## Key Technical Decisions

1. **Directory-based entities**: Chose individual files per entity for better git diffs and manageable file sizes

2. **Index files**: Used `index.json` in each entity directory to list IDs, enabling parallel loading

3. **Legacy aliases**: Maintained backward-compatible property names to avoid breaking existing code

4. **Zod validation**: Runtime validation catches schema errors early with helpful messages

5. **Title placeholders**: Show meaningful content during image load rather than abstract skeleton

## Files Created

| File | Purpose |
|------|---------|
| `src/types/rating.ts` | Rating type definitions |
| `src/types/links.ts` | Detail link type definitions |
| `src/schemas/v2/collection.schema.ts` | Zod validation schemas |
| `src/schemas/v2/index.ts` | Schema exports |
| `src/loaders/ratingResolver.ts` | Rating utilities |
| `src/services/fieldDiscovery.ts` | Field introspection |
| `src/services/index.ts` | Service exports |
| `src/contexts/FieldOptionsContext.tsx` | Field options context |
| `src/contexts/index.ts` | Context exports |
| `src/components/Attribution/` | Attribution component |
| `docs/reference/schemas/v2/README.md` | Schema reference |
| `public/data/retro-games/` | 96 entity files |

## Files Modified

| File | Changes |
|------|---------|
| `src/types/image.ts` | Added isPrimary, sourceUrl, licenceUrl |
| `src/types/schema.ts` | Added SchemaVersion type |
| `src/loaders/collectionLoader.ts` | Directory loading, Zod validation |
| `src/loaders/imageSelector.ts` | Boolean filter support |
| `src/loaders/index.ts` | New exports |
| `src/hooks/useCollection.ts` | Generic terminology, v2 fields |
| `src/hooks/useGitHubCollection.ts` | Generic terminology |
| `src/utils/fieldPathResolver.ts` | Generic field options |
| `src/components/CardExpanded/CardExpanded.tsx` | Updated property names |

---

## Related Documentation

- [v0.7.0 Milestone](../../roadmap/milestones/v0.7.0.md)
- [v0.7.0 Retrospective](../../process/retrospectives/v0.7.0/README.md)
- [Schema v2 Reference](../../../reference/schemas/v2/README.md)
