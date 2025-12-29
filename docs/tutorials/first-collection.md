# Your First Collection

Learn how to load and explore your first card collection in itemdeck.

## What You'll Learn

In this tutorial, you'll learn how to:

- Understand what collections are
- Load a built-in or demo collection
- Load a collection from GitHub
- Create your own simple collection

## Prerequisites

- itemdeck running in your browser
- (Optional) A GitHub repository with collection data

## Understanding Collections

### What is a Collection?

A collection is a set of cards representing items you want to display. Each card has:

- **Front face**: Image and title
- **Back face**: Details, metadata, and badges
- **Relationships**: Links to categories or other items

Collections can represent anything:
- Video games you've played
- Books you've read
- Films you've watched
- Products in a catalogue

### Collection Sources

Itemdeck loads collections from several sources:

| Source Type | Description | Use Case |
|-------------|-------------|----------|
| **Built-in** | Pre-configured demo data | Testing and demonstration |
| **GitHub** | Public repositories | Sharing collections online |
| **Local** | Files on your server | Private or custom deployments |

## Loading a Built-in Collection

When you first open itemdeck, it may load a demo collection automatically. This showcases the interface with sample data.

To explore the demo:

1. Browse cards using arrow keys or mouse
2. Click cards to flip them
3. Double-click for detail view
4. Try the search bar with `/`

## Loading a Remote Collection

### Step 1: Open Collection Settings

1. Press `S` to open Settings
2. Go to the **Collections** tab
3. Click **Add Source**

### Step 2: Enter Repository Details

For a GitHub-hosted collection:

1. Enter the GitHub URL (e.g., `https://github.com/username/my-collection`)
2. Optionally provide a custom name
3. Click **Add**

### URL Format Requirements

Itemdeck supports several URL formats:

```
https://github.com/username/repo
https://github.com/username/repo/tree/main
https://github.com/username/repo/blob/main/collection.json
```

### Step 3: Select the Collection

Once added, select your new source from the sources list. Itemdeck fetches and displays the collection.

## Creating Your Own Collection

### Basic JSON Structure

A minimal collection has two arrays: items and categories:

```json
{
  "items": [
    {
      "id": "item-1",
      "title": "My First Item",
      "image": "https://example.com/image.jpg",
      "summary": "A brief description",
      "metadata": {
        "category": "books"
      }
    }
  ],
  "categories": [
    {
      "id": "books",
      "title": "Books",
      "shortTitle": "Book"
    }
  ],
  "meta": {
    "name": "My Collection",
    "description": "A sample collection"
  }
}
```

### Required Item Fields

Each item must have:

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `title` | String | Display name |

### Optional Item Fields

| Field | Type | Description |
|-------|------|-------------|
| `image` | URL | Card front image |
| `summary` | String | Brief description |
| `verdict` | String | Longer review/opinion |
| `year` | Number | Year associated with item |
| `links` | Array | External links |
| `metadata` | Object | Custom fields |

### Image References

Images can be:

- **Absolute URLs**: `https://example.com/image.jpg`
- **Relative paths**: `./images/item.jpg` (relative to collection)
- **Data URLs**: `data:image/png;base64,...`

For GitHub-hosted collections, use raw URLs or relative paths from the repository root.

## Hosting on GitHub

To share your collection:

1. Create a public GitHub repository
2. Add your `collection.json` file
3. Add an `images/` folder for your card images
4. Share the repository URL

### Repository Structure

```
my-collection/
├── collection.json      # Main collection data
├── images/              # Card images
│   ├── item-1.jpg
│   └── item-2.jpg
└── README.md            # Optional description
```

## Troubleshooting

### Collection Won't Load

- Check the URL is correct and the repository is public
- Verify the JSON is valid (use a JSON validator)
- Check browser console for specific errors

### Images Missing

- Ensure image URLs are accessible
- For GitHub, use raw file URLs or relative paths
- Check for CORS restrictions on external images

### Validation Errors

Itemdeck validates collection data. Common issues:

- Missing required fields (`id`, `title`)
- Invalid JSON syntax
- Incorrect data types

---

## Related Documentation

- [Data Sources](../explanation/data-sources.md) - How data loading works
- [Adding Remote Source](../guides/adding-remote-source.md) - Detailed source guide
- [Creating Collection](../guides/creating-collection.md) - Full collection format
- [Schema Reference](../reference/schemas/) - Technical schema documentation
