# Adding a Remote Source

Learn how to load collections from GitHub repositories and other remote URLs.

## Supported Sources

Itemdeck can load collections from:

| Source Type | URL Pattern | Notes |
|-------------|-------------|-------|
| GitHub Repositories | `github.com/user/repo` | Public repos only |
| Raw JSON URLs | `https://example.com/collection.json` | CORS must allow access |

## Adding a GitHub Collection

### Step 1: Open Source Settings

1. Press `S` to open Settings
2. Go to the **Collections** tab
3. Click "Add Source"

### Step 2: Enter Repository URL

Enter the GitHub repository URL:

```
https://github.com/username/my-collection
```

Supported URL formats:

| Format | Example |
|--------|---------|
| Repository root | `github.com/user/repo` |
| Specific branch | `github.com/user/repo/tree/main` |
| Direct file | `github.com/user/repo/blob/main/data.json` |

### Step 3: Configure Source

| Setting | Description | Required |
|---------|-------------|----------|
| Name | Display name for the source | Optional |
| URL | GitHub or raw URL | Required |
| Description | Notes about the collection | Optional |

### Step 4: Save and Load

Click "Add" to save the source. The collection loads automatically.

## Repository Structure

For itemdeck to find your collection, structure your repository:

### Basic Structure

```
my-collection/
├── collection.json      # Main data file
├── images/              # Card images
└── README.md            # Optional
```

### With Config

```
my-collection/
├── itemdeck.config.json # Configuration
├── collection.json      # Data file
└── assets/
    └── images/
```

### Manifest File

For multiple collections or advanced configuration:

```json
{
  "name": "My Collection",
  "version": "1.0.0",
  "collection": "collection.json",
  "themes": ["theme.json"]
}
```

## URL Format Requirements

### GitHub URLs

Itemdeck converts GitHub URLs to raw content URLs automatically:

| Input | Converted To |
|-------|--------------|
| `github.com/user/repo` | `raw.githubusercontent.com/user/repo/main/` |
| `github.com/user/repo/tree/branch` | `raw.githubusercontent.com/user/repo/branch/` |

### Raw URLs

For non-GitHub sources, provide the direct JSON URL:

```
https://my-server.com/data/collection.json
```

**CORS Requirement**: The server must allow cross-origin requests.

## Managing Sources

### Viewing Sources

Go to Settings > Collections to see all added sources.

### Switching Sources

Click any source in the list to switch to it. The new collection loads and displays.

### Editing Sources

1. Select a source
2. Click "Edit"
3. Modify URL, name, or description
4. Save changes

### Removing Sources

1. Select the source
2. Click "Remove"
3. Confirm deletion

**Note**: Removing a source doesn't delete any local edits you've made.

## Image Caching

### Cache Consent

When loading a new source, itemdeck may ask about image caching:

| Option | Behaviour |
|--------|-----------|
| Allow | Images cached locally for offline use |
| Deny | Images loaded fresh each time |
| Always | Never ask, always cache |
| Never | Never ask, never cache |

### Managing Cache

Go to Settings > Data > Image Cache to:
- View cached images
- Clear cache for a source
- Change cache preferences

## Troubleshooting

### "Failed to load collection"

- Verify the URL is correct
- Check the repository is public
- Ensure `collection.json` exists at the expected location

### "Invalid JSON"

- Validate your JSON syntax
- Check for trailing commas
- Ensure proper encoding (UTF-8)

### "CORS error"

For non-GitHub sources:
- The server must include `Access-Control-Allow-Origin` header
- Consider hosting on GitHub instead

### "Schema validation failed"

- Check required fields are present
- Verify data types match expected formats
- See [Creating Collection](creating-collection.md) for format details

## Allowed Sources

Itemdeck maintains a list of trusted sources. By default, only GitHub is trusted. Custom deployments may add additional trusted sources.

---

## Related Documentation

- [Your First Collection](../tutorials/first-collection.md) - Introduction to collections
- [Creating Collection](creating-collection.md) - Full format guide
- [Data Sources](../explanation/data-sources.md) - How data loading works
