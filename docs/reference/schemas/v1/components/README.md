# Component Schemas

Reusable schema components for itemdeck collections.

## Files

| File | Purpose | Key Definitions |
|------|---------|-----------------|
| [image.schema.json](image.schema.json) | Image handling | `image`, `attribution`, `imageArray` |
| [display.schema.json](display.schema.json) | Display config | `displayConfig`, `cardDisplayConfig`, `fieldMapping` |
| [fields.schema.json](fields.schema.json) | Field types | `fieldDefinition`, `fieldType` |

## Image Schema

Defines structured images with attribution:

```json
{
  "url": "https://example.com/image.jpg",
  "type": "cover",
  "alt": "Description for accessibility",
  "attribution": {
    "source": "Wikimedia Commons",
    "author": "Photographer Name",
    "licence": "CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:Example.jpg"
  }
}
```

## Display Schema

Defines how entities are displayed on cards:

```json
{
  "card": {
    "front": {
      "image": { "source": "images[0]" },
      "title": "title",
      "badge": "rank"
    },
    "back": {
      "logo": "platform.logoUrl",
      "text": "year"
    }
  }
}
```

## Fields Schema

Supported field types:
- `string` - Short text
- `text` - Long text
- `number` - Numeric values
- `boolean` - True/false
- `date` - Date values
- `url` - URL strings
- `enum` - Constrained values
- `array` - Lists
- `object` - Nested objects
- `images` - Image array

## Related Documentation

- [v1 Schema Overview](../README.md)
- [Collection Schema](../collection.schema.json)
