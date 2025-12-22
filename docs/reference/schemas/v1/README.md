# Itemdeck Schema v1

JSON Schema specifications for itemdeck collections using the Entity-Relationship model.

## Schema Files

| File | URL | Purpose |
|------|-----|---------|
| [collection.schema.json](collection.schema.json) | `https://itemdeck.app/schemas/v1/collection.json` | Main collection schema |
| [entity.schema.json](entity.schema.json) | `https://itemdeck.app/schemas/v1/entity.json` | Individual entity schema |

## Component Schemas

Reusable schema components in the [components/](components/README.md) directory:

| File | Purpose |
|------|---------|
| [image.schema.json](components/image.schema.json) | Image with attribution |
| [display.schema.json](components/display.schema.json) | Display configuration |
| [fields.schema.json](components/fields.schema.json) | Field type definitions |

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Entity Type** | Category of things (e.g., game, platform) |
| **Entity** | Instance of a type (e.g., Super Metroid, SNES) |
| **Field** | Property of an entity (e.g., title, year) |
| **Relationship** | Link between entities (e.g., game → platform) |
| **Cardinality** | How many can relate (one-to-one, many-to-one, etc.) |

## Collection Structure

```
my-collection/
├── collection.json           # Schema definition
└── entities/
    ├── items.json            # Primary entities
    └── categories.json       # Related entities
```

## Related Documentation

- [Schema Overview](../README.md)
- [Component Schemas](components/README.md)
- [Example Collection](../examples/retro-games/README.md)
- [v0.5.0 Devlog](../../../development/process/devlogs/v0.5.0/README.md)
