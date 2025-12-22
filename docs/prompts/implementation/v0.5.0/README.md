# v0.5.0 Implementation Prompt - Schema Design & Data Architecture

**Version:** v0.5.0
**Codename:** Schema Design
**Branch:** `feature/v0.5.0-visual-overhaul`

---

## Overview

Design and implement a flexible, extensible JSON schema for itemdeck collections. This version establishes the data architecture foundation that will power all future collection types.

---

## Context

- v0.4.1 is complete with drag-and-drop, settings, and performance features
- Current `retro-games` data uses a rigid, domain-specific structure
- Need a generic schema that works for games, recipes, books, or any collection type
- Schema should support Entity-Relationship patterns with typed fields and relationships

---

## Scope

### In Scope (v0.5.0)

1. **Schema Design** - JSON Schema specification for collections
2. **Image Structure** - First-class image handling with attribution
3. **Entity-Relationship Model** - Typed entities with relationships
4. **Example Collection** - Retro-games in new format (documentation only)
5. **Bug Fixes** - DragOverlay cardBackDisplay prop fix

### Out of Scope (deferred to v0.6.0)

- Schema loader implementation
- Data migration from old format
- UI changes for new schema
- Runtime validation

---

## Phase 1: Schema Architecture Design

### 1.1 Choose Schema Pattern

Evaluate three approaches:
1. **Tag-Based** - Flat items with faceted tags
2. **Entity-Relationship** - Normalised entities with typed relationships
3. **Document-Based** - Self-describing flexible documents

**Decision:** Entity-Relationship (most robust for complex collections)

### 1.2 Design URL Namespace

```
https://itemdeck.app/schemas/v1/collection.json
https://itemdeck.app/schemas/v1/entity.json
https://itemdeck.app/schemas/v1/components/image.json
https://itemdeck.app/schemas/v1/components/display.json
https://itemdeck.app/schemas/v1/components/fields.json
```

### 1.3 Define Core Concepts

| Concept | Purpose |
|---------|---------|
| **Entity Type** | Category of things (game, platform) |
| **Entity** | Instance of a type (Super Metroid, SNES) |
| **Field** | Property of an entity (title, year) |
| **Relationship** | Link between entities (game → platform) |
| **Cardinality** | How many can relate (one-to-many, etc.) |

---

## Phase 2: Collection Schema

### 2.1 Create collection.schema.json

**Location:** `docs/reference/schemas/v1/collection.schema.json`

**Required properties:**
- `$schema` - Schema URL for validation
- `id` - Unique collection identifier (kebab-case)
- `name` - Human-readable name
- `entityTypes` - Entity type definitions

**Optional properties:**
- `description` - Collection description
- `version` - Semantic version
- `metadata` - Author, licence, homepage, tags
- `relationships` - Relationship definitions
- `display` - Display configuration

### 2.2 Entity Type Definition

```json
{
  "game": {
    "primary": true,
    "label": "Game",
    "labelPlural": "Games",
    "fields": {
      "title": { "type": "string", "required": true },
      "year": { "type": "number" },
      "summary": { "type": "text" },
      "images": { "type": "images" }
    }
  }
}
```

### 2.3 Relationship Definition

```json
{
  "game.platform": {
    "target": "platform",
    "cardinality": "many-to-one",
    "required": true
  },
  "game.rank": {
    "type": "ordinal",
    "scope": "platform"
  }
}
```

---

## Phase 3: Image Schema

### 3.1 First-Class Image Objects

**Problem:** Current `imageUrl` string lacks metadata and attribution.

**Solution:** Structured image objects with:
- `url` - Image URL
- `type` - cover, screenshot, title-screen, logo, etc.
- `alt` - Accessibility text
- `width/height` - Dimensions (optional)
- `attribution` - Source, author, licence, URL

### 3.2 Create image.schema.json

**Location:** `docs/reference/schemas/v1/components/image.schema.json`

```json
{
  "definitions": {
    "image": {
      "type": "object",
      "required": ["url"],
      "properties": {
        "url": { "type": "string", "format": "uri" },
        "type": { "type": "string" },
        "alt": { "type": "string" },
        "attribution": { "$ref": "#/definitions/attribution" }
      }
    },
    "attribution": {
      "type": "object",
      "properties": {
        "source": { "type": "string" },
        "author": { "type": "string" },
        "licence": { "type": "string" },
        "url": { "type": "string", "format": "uri" }
      }
    }
  }
}
```

### 3.3 Image Selection Expressions

Display config uses expressions to select images:
- `images[0]` - First image (primary)
- `images[type=cover][0]` - First cover image
- `images[type=cover][0] ?? images[0]` - Cover if exists, else first

---

## Phase 4: Display Configuration

### 4.1 Create display.schema.json

**Location:** `docs/reference/schemas/v1/components/display.schema.json`

**Covers:**
- `displayConfig` - Top-level display settings
- `cardDisplayConfig` - Card front/back configuration
- `cardFaceConfig` - Individual face settings
- `expandedDisplayConfig` - Detail view configuration
- `fieldMapping` - Map entity fields to display elements
- `imageMapping` - Map images with fallback

### 4.2 Field Mapping Examples

```json
{
  "card": {
    "front": {
      "title": "title",
      "subtitle": "year",
      "image": {
        "source": "images[0]",
        "fallback": "images[type=screenshot][0]"
      },
      "badge": "rank"
    },
    "back": {
      "logo": "platform.logoUrl",
      "text": "year"
    }
  }
}
```

---

## Phase 5: Field Types

### 5.1 Create fields.schema.json

**Location:** `docs/reference/schemas/v1/components/fields.schema.json`

**Supported types:**
- `string` - Short text
- `text` - Long text
- `number` - Numeric values
- `boolean` - True/false
- `date` - Date values
- `url` - URL strings
- `enum` - Constrained values
- `array` - Lists
- `object` - Nested objects
- `images` - Image array (special type)

---

## Phase 6: Entity Schema

### 6.1 Create entity.schema.json

**Location:** `docs/reference/schemas/v1/entity.schema.json`

**Purpose:** Schema for individual entity files

**Required:**
- `id` - Unique identifier (kebab-case)

**Common optional:**
- `images` - Array of image objects

---

## Phase 7: Example Collection

### 7.1 Create Example Directory

```
docs/reference/schemas/examples/retro-games/
├── collection.json
└── entities/
    ├── platforms.json
    └── games.json
```

### 7.2 Convert Sample Data

Convert a subset of current retro-games to new format:
- 3-5 platforms
- 10-15 games with proper image attribution
- Demonstrate all schema features

---

## Phase 8: Bug Fixes

### 8.1 DragOverlay cardBackDisplay Fix

**File:** `src/components/DraggableCardGrid/DraggableCardGrid.tsx`

**Problem:** DragOverlay doesn't pass `cardBackDisplay` prop to Card

**Fix:** Add `cardBackDisplay={cardBackDisplay}` to Card in DragOverlay

---

## Files to Create

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

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/DraggableCardGrid/DraggableCardGrid.tsx` | Add cardBackDisplay to DragOverlay |

---

## Success Criteria

- [ ] Collection schema defined with entity types and relationships
- [ ] Image schema supports multiple images with attribution
- [ ] Display schema defines card/expanded view mapping
- [ ] Field types schema covers all common data types
- [ ] Entity schema provides base for entity files
- [ ] Example retro-games collection demonstrates all features
- [ ] DragOverlay bug fixed
- [ ] All existing tests pass
- [ ] Build succeeds
- [ ] TypeScript/ESLint clean

---

## Implementation Order

1. Design schema architecture (done in conversation)
2. Create collection.schema.json
3. Create component schemas (image, display, fields)
4. Create entity.schema.json
5. Create example collection with sample data
6. Fix DragOverlay bug
7. Write devlog and retrospective
8. Run tests and verification
9. Commit, tag, push

---

## Related Documentation

- [v0.5.0 Devlog](../../development/process/devlogs/v0.5.0/README.md)
- [v0.5.0 Retrospective](../../development/process/retrospectives/v0.5.0/README.md)
- [Collection Schema](../../reference/schemas/v1/collection.schema.json)

---

**Status**: Complete
