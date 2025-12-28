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

## User Settings Field Mapping

In addition to collection-defined display configuration, users can customise field mappings in Settings > Appearance > Fields. These settings are stored in `settingsStore` and override collection defaults:

| Field | Purpose | Default | Examples |
|-------|---------|---------|----------|
| `titleField` | Card title text | `"title"` | `"title"`, `"name"` |
| `subtitleField` | Subtitle below title | `"year"` | `"year"`, `"playedSince"`, `"none"` |
| `footerBadgeField` | Bottom badge text | `"platform.shortTitle"` | `"platform.shortTitle"`, `"device"`, `"none"` |
| `logoField` | Card back logo | `"logoUrl"` | `"logoUrl"`, `"platform.images[0].url"` |
| `sortField` | Sort order field | `"order"` | `"order"`, `"title"`, `"year"` |
| `sortDirection` | Sort direction | `"asc"` | `"asc"`, `"desc"` |
| `topBadgeField` | Top corner badge | `"order"` | `"order"`, `"myRank"`, `"myVerdict"`, `"none"` |

### Top Badge Field (v0.11.5+)

The `topBadgeField` setting replaced the previous `showRankBadge` toggle:

- **Purpose**: Select which field appears as the top corner badge on card fronts
- **Options**: Dynamically generated from collection data, includes:
  - `"order"` - Display order/rank number (default)
  - `"myRank"` - User-defined ranking
  - `"myVerdict"` - User verdict/rating
  - Any field containing "verdict", "rating", or "score"
  - `"none"` - Hide the badge entirely
- **Placeholder Text**: When a card has no value for the selected field, the "Text if Empty" setting is displayed instead (default: "?")

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
