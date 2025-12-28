# Search and Filters

Find cards quickly using the search bar and filter options.

## Basic Search

Press `/` or click the search icon to focus the search bar.

### Simple Search

Type any text to search across card titles, summaries, and verdict fields:

```
zelda
```

This finds all cards containing "zelda" in searchable fields.

### Case Insensitive

Searches are case-insensitive:

```
ZELDA = zelda = Zelda
```

## Search Operators

### AND (Default)

Multiple words are combined with AND logic:

```
mario kart
```

Finds cards containing both "mario" AND "kart".

### OR

Use `|` or `OR` for alternatives:

```
mario | sonic
mario OR sonic
```

Finds cards containing either "mario" OR "sonic".

### Exact Phrases

Use quotes for exact phrases:

```
"super mario"
```

Finds cards with the exact phrase "super mario".

### NOT / Exclusion

Use `-` to exclude terms:

```
mario -kart
```

Finds cards with "mario" but NOT "kart".

## Filtering

### Field Filters

Filter by specific field values using the dropdowns:

1. Click the filter icon in the search bar
2. Select a field (e.g., Platform, Year)
3. Choose one or more values

### Active Filters

Active filters appear as chips below the search bar. Click the `×` to remove a filter.

### Combining Search and Filters

Search and filters work together:

- Search narrows results by text
- Filters narrow results by field values
- Both must match for a card to appear

## Grouping

Group cards by field values:

1. Click the "Group by" dropdown
2. Select a field (Platform, Year, Genre)
3. Cards are organised into collapsible groups

### Group Controls

- Click a group header to collapse/expand
- Use "Expand All" / "Collapse All" for bulk control

## Tips

### Search Scope

By default, search applies to all cards. When filters are active, you can limit search to only the filtered results.

### Clearing Search

- Press `Escape` to clear the search
- Click the `×` button in the search bar
- Click "Clear All" to remove all filters

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `/` | Focus search bar |
| `Escape` | Clear search / blur |
| `Enter` | Submit search |

---

## Related Documentation

- [Keyboard Shortcuts](keyboard-shortcuts.md)
- [Getting Started](../tutorials/getting-started.md)

*View Modes guide coming soon*
