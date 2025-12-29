# Creating a Collection

Learn how to create your own collection for itemdeck.

## Collection Structure

A collection is a JSON file containing items and categories:

```json
{
  "items": [],
  "categories": [],
  "meta": {}
}
```

## JSON Schema

### Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | Array | Yes | Array of card items |
| `categories` | Array | Yes | Array of category definitions |
| `meta` | Object | No | Collection metadata |

### Item Schema

Each item in the `items` array:

```json
{
  "id": "unique-id",
  "title": "Item Title",
  "image": "https://example.com/image.jpg",
  "summary": "Brief description",
  "verdict": "Longer review text",
  "year": 2024,
  "links": [
    {
      "label": "Website",
      "url": "https://example.com"
    }
  ],
  "metadata": {
    "category": "category-id",
    "customField": "value"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique identifier |
| `title` | String | Yes | Display name |
| `image` | String | No | Image URL |
| `summary` | String | No | Short description |
| `verdict` | String | No | Detailed opinion |
| `year` | Number | No | Associated year |
| `links` | Array | No | External links |
| `metadata` | Object | No | Custom fields |

### Category Schema

Each category in the `categories` array:

```json
{
  "id": "books",
  "title": "Books",
  "shortTitle": "Book",
  "logoUrl": "https://example.com/book-icon.png",
  "colour": "#4A90D9"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique identifier |
| `title` | String | Yes | Full display name |
| `shortTitle` | String | No | Abbreviated name |
| `logoUrl` | String | No | Category icon |
| `colour` | String | No | Hex colour code |

### Metadata Schema

The `meta` object describes the collection:

```json
{
  "name": "My Collection",
  "description": "A curated collection of items",
  "version": "1.0.0",
  "schema": "simple-list",
  "display": {
    "theme": "modern"
  }
}
```

## Image Assets

### Image Sources

Images can be referenced as:

| Type | Example | Notes |
|------|---------|-------|
| Absolute URL | `https://example.com/img.jpg` | Any accessible URL |
| Relative path | `./images/item.jpg` | Relative to collection file |
| Data URL | `data:image/png;base64,...` | Embedded (increases file size) |

### Recommended Practices

- Use JPEG for photos (smaller files)
- Use PNG for graphics with transparency
- Optimise images before adding
- Consistent aspect ratios (5:7 recommended)
- Maximum ~500KB per image

### Image Sizes

| Use | Recommended Size |
|-----|------------------|
| Card images | 400x560px (5:7 ratio) |
| Category logos | 64x64px (square) |
| Thumbnails | 200x280px |

## Validating Your Collection

### Manual Validation

1. Use a JSON validator (jsonlint.com)
2. Check for:
   - Valid JSON syntax
   - Required fields present
   - Unique IDs
   - Valid URLs

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Unexpected token" | Invalid JSON | Check commas, quotes, brackets |
| "Missing required field" | Required field absent | Add `id` and `title` |
| "Duplicate id" | Non-unique identifiers | Use unique IDs |

## Hosting on GitHub

### Step 1: Create Repository

1. Go to GitHub and create a new repository
2. Make it public (required for itemdeck access)
3. Add a README.md (optional)

### Step 2: Add Collection File

Upload or create `collection.json` in the repository root.

### Step 3: Add Images

Create an `images/` folder and upload your images:

```
my-collection/
├── collection.json
├── images/
│   ├── item-1.jpg
│   ├── item-2.jpg
│   └── item-3.jpg
└── README.md
```

### Step 4: Reference Images

Use relative paths in your collection:

```json
{
  "id": "item-1",
  "title": "First Item",
  "image": "./images/item-1.jpg"
}
```

### Step 5: Test

1. Open itemdeck
2. Add your repository as a source
3. Verify all items and images load correctly

## Advanced: Collection Settings

Collections can include settings that apply when loaded:

```json
{
  "meta": {
    "name": "My Collection",
    "settings": {
      "defaults": {
        "visualTheme": "retro",
        "cardSizePreset": "medium"
      },
      "forced": {
        "fieldMapping": {
          "titleField": "name",
          "subtitleField": "creator"
        }
      }
    }
  }
}
```

### Defaults vs Forced

| Type | Behaviour |
|------|-----------|
| Defaults | Applied on first load, user can override |
| Forced | Always applied, user cannot override |

## Example: Complete Collection

```json
{
  "items": [
    {
      "id": "book-001",
      "title": "The Great Adventure",
      "image": "./images/book-001.jpg",
      "summary": "An epic tale of discovery",
      "verdict": "A must-read for adventure lovers",
      "year": 2023,
      "metadata": {
        "category": "fiction",
        "author": "Jane Author",
        "pages": 342
      }
    },
    {
      "id": "book-002",
      "title": "Learning TypeScript",
      "image": "./images/book-002.jpg",
      "summary": "A comprehensive guide to TypeScript",
      "year": 2024,
      "metadata": {
        "category": "technical",
        "author": "Tech Writer"
      }
    }
  ],
  "categories": [
    {
      "id": "fiction",
      "title": "Fiction",
      "shortTitle": "Fic",
      "colour": "#E74C3C"
    },
    {
      "id": "technical",
      "title": "Technical",
      "shortTitle": "Tech",
      "colour": "#3498DB"
    }
  ],
  "meta": {
    "name": "My Book Collection",
    "description": "Books I've read and reviewed",
    "version": "1.0.0"
  }
}
```

---

## Related Documentation

- [Your First Collection](../tutorials/first-collection.md) - Getting started
- [Adding Remote Source](adding-remote-source.md) - Loading collections
- [Data Sources](../explanation/data-sources.md) - How loading works
- [Schema Reference](../reference/schemas/) - Technical specification
