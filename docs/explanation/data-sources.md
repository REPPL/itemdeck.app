# Data Sources

Learn how itemdeck loads and manages collection data.

## What Are Data Sources?

A data source is a location from which itemdeck fetches collection data. Sources provide:

- Card item data (titles, images, metadata)
- Category definitions
- Collection configuration
- Optional theme files

## Source Types

### Built-in Sources

Pre-configured in the application:

| Type | Description | Use Case |
|------|-------------|----------|
| Demo | Sample collection | Testing, demonstration |
| Default | Bundled with app | Offline fallback |

### GitHub Sources

Public GitHub repositories:

| Feature | Support |
|---------|---------|
| Public repos | Full support |
| Private repos | Not supported |
| Branch selection | Supported |
| Subdirectory paths | Supported |

### Custom URL Sources

Direct JSON URLs:

| Requirement | Details |
|-------------|---------|
| Format | Valid JSON |
| CORS | Must allow cross-origin requests |
| HTTPS | Required for security |

## Collection Loading

### Loading Process

```
1. Source Selection
   └── User selects or app defaults to a source

2. URL Resolution
   └── Convert source reference to fetch URL
   └── GitHub URLs → raw.githubusercontent.com

3. Data Fetching
   └── HTTP GET request
   └── Handle errors, timeouts

4. Validation
   └── JSON parsing
   └── Schema validation
   └── Required fields check

5. Data Processing
   └── Join items with categories
   └── Resolve image URLs
   └── Apply collection settings

6. Display
   └── Cards rendered in grid
   └── Settings applied
```

### Caching

Itemdeck caches data for performance:

| Cache Type | Storage | Purpose |
|------------|---------|---------|
| Collection data | Memory | Current session |
| Images | IndexedDB | Offline access |
| Settings | localStorage | Persistence |

### Offline Support

With image caching enabled:
- Collections load from cache when offline
- Images display from local storage
- Edits persist locally

## Data Schema

### Collection Structure

```json
{
  "items": [/* card data */],
  "categories": [/* category definitions */],
  "meta": {/* collection metadata */}
}
```

### Item Fields

Required:
- `id`: Unique identifier
- `title`: Display name

Optional:
- `image`: URL to card image
- `summary`: Short description
- `verdict`: Detailed text
- `year`: Associated year
- `links`: External URLs
- `metadata`: Custom fields

### Category Fields

- `id`: Unique identifier
- `title`: Full name
- `shortTitle`: Abbreviated name
- `logoUrl`: Category icon
- `colour`: Display colour

### Metadata

Collection-level configuration:
- `name`: Collection title
- `description`: Collection summary
- `version`: Data version
- `schema`: Schema type identifier
- `display`: Theme/display preferences
- `settings`: Forced and default settings

## Source Management

### Adding Sources

1. Open Settings > Collections
2. Click "Add Source"
3. Enter URL and optional name
4. Save and load

### Switching Sources

Click any source in the list to switch. The new collection loads immediately.

### Removing Sources

1. Select source in list
2. Click "Remove"
3. Confirm deletion

**Note**: Removing a source doesn't delete local edits.

## URL Resolution

### GitHub URL Conversion

| Input Format | Output Format |
|--------------|---------------|
| `github.com/user/repo` | `raw.githubusercontent.com/user/repo/main/collection.json` |
| `github.com/user/repo/tree/branch` | `raw.githubusercontent.com/user/repo/branch/collection.json` |
| `github.com/user/repo/blob/main/data.json` | `raw.githubusercontent.com/user/repo/main/data.json` |

### Image URL Resolution

Images can be:

| Type | Resolution |
|------|------------|
| Absolute | Used directly |
| Relative | Resolved against collection base URL |
| Data URL | Used directly |

## Security Considerations

### Allowed Sources

By default, only trusted sources are permitted:

| Source | Trust Level | Reason |
|--------|-------------|--------|
| GitHub | Trusted | Major platform, consistent format |
| localhost | Trusted | Development use |
| Custom | Configurable | Per-deployment |

### Content Security

- HTTPS required for remote sources
- JSON-only content (no executable code)
- Images validated before display
- No arbitrary script execution

### Cache Consent

Users control image caching per-source:

| Preference | Behaviour |
|------------|-----------|
| Always | Cache without asking |
| Ask | Prompt on first load |
| Never | Don't cache images |

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Network error | No connection | Check internet, try again |
| 404 Not Found | Wrong URL | Verify repository/file exists |
| Invalid JSON | Malformed data | Validate JSON syntax |
| Schema error | Missing fields | Check required fields |
| CORS error | Server restriction | Use GitHub or configure server |

### Error Recovery

- Retry with exponential backoff
- Fall back to cached data
- Display user-friendly messages
- Offer alternative actions

## Performance

### Optimisation Strategies

| Strategy | Benefit |
|----------|---------|
| Lazy loading | Images load on scroll |
| Data caching | Faster subsequent loads |
| Image caching | Offline availability |
| Virtualisation | Handle large collections |

### Large Collections

For collections with 500+ items:
- Virtual scrolling renders only visible cards
- Pagination option available
- Search/filter to narrow view

---

## Related Documentation

- [Adding Remote Source](../guides/adding-remote-source.md) - Source setup guide
- [Creating Collection](../guides/creating-collection.md) - Data format guide
- [Your First Collection](../tutorials/first-collection.md) - Getting started
