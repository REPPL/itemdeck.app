# Itemdeck Schema Documentation

JSON Schema specifications for defining itemdeck collections using the Entity-Relationship model.

## Schema Versions

| Version | Status | Description |
|---------|--------|-------------|
| [v1](v1/README.md) | Current | Entity-Relationship schema with typed fields and relationships |

## Quick Start

Create a collection by defining a `collection.json`:

```json
{
  "$schema": "https://itemdeck.app/schemas/v1/collection.json",
  "id": "my-collection",
  "name": "My Collection",
  "entityTypes": {
    "item": {
      "primary": true,
      "fields": {
        "title": { "type": "string", "required": true },
        "year": { "type": "number" }
      }
    }
  }
}
```

## Examples

- [Retro Games Collection](examples/retro-games/README.md) - Demo collection showcasing all schema features

## Related Documentation

- [v0.5.0 Devlog](../../development/process/devlogs/v0.5.0/README.md) - Schema design narrative
- [Reference Documentation](../README.md)
