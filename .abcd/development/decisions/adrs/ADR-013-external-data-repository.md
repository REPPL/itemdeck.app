# ADR-013: External Data Repository Architecture

## Status

Accepted

## Context

Itemdeck needs to fetch collection data (items and categories) from external sources. The reference implementation uses [MyPlausibleMe](https://github.com/REPPL/MyPlausibleMe), a CC0-licensed personal data repository.

Key requirements:
- Support multiple collections from a single repository
- Enable collection discovery via manifest
- Validate data with Zod at runtime
- JSON files as source of truth
- Work with GitHub raw URLs (no API rate limits)

We evaluated several approaches:

| Approach | Extensibility | Complexity |
|----------|---------------|------------|
| Flat structure | Low | Low |
| Collection-based with manifest | High | Medium |
| Database backend | Very High | High |

## Decision

Adopt a **collection-based repository structure** with:

1. **Manifest-driven discovery** — Root `manifest.json` lists available collections
2. **Collection directories** — Each collection in `data/collections/{collection-id}/`
3. **Schema definitions** — Reusable JSON Schemas in `schemas/` (reference only)
4. **JSON source of truth** — JSON files edited directly or generated via plausible-cli
5. **Raw URL fetching** — Fetch directly from `raw.githubusercontent.com`
6. **Convention over configuration** — Data files discovered by name (`items.json`, `categories.json`)

## Repository Structure

```
repository/
├── manifest.json                   # Collection registry
├── schemas/                        # JSON Schema (reference only)
│   └── ranked-collection.schema.json
└── data/
    └── collections/
        └── {collection-name}/
            ├── collection.json     # Collection metadata
            ├── items.json          # Collection items (source of truth)
            └── categories.json     # Categories (source of truth)
```

Note: The `data/` directory is extensible for future non-collection data.

## Consequences

### Positive

- **Extensibility** — Add new collections without code changes
- **Human-editable** — CSV files for non-technical editing
- **Machine-readable** — JSON for web consumption
- **Discoverable** — Manifest enables collection switching in UI
- **No rate limits** — Raw URLs bypass GitHub API limits
- **Validated** — Zod ensures data integrity at runtime
- **Tooling available** — plausible-cli for CSV to JSON conversion
- **Convention over configuration** — Predictable file names reduce boilerplate

### Negative

- **Manual JSON editing** — Less human-friendly than CSV for non-developers
- **More files per collection** — Each collection has 3 files minimum

### Mitigations

- Use plausible-cli to convert from CSV when preferred
- Clear documentation of JSON structure and schema requirements

## URL Patterns

```
# Items
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/data/collections/{collection}/items.json

# Categories
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/data/collections/{collection}/categories.json

# Manifest
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/manifest.json
```

Collection ID is derived from the folder name — no separate `id` field needed.

## Schema Registry

itemdeck uses a **schema registry** to support multiple data formats:

### Decision

Rather than dynamically interpreting arbitrary schemas from repositories, itemdeck ships with built-in schemas that users must choose from.

### Supported Schemas

| Schema ID | Description | Has Categories |
|-----------|-------------|----------------|
| `ranked-collection` | Personal ranked lists with categories | Yes |
| `simple-list` | Basic item list without ranking | No |
| `timeline` | Chronological events with dates | No |

### How It Works

1. **collection.json declares schema** — `"schema": "ranked-collection"`, `"schemaVersion": "1.0.0"`
2. **itemdeck validates schema ID** — Checks against registry
3. **Data files discovered by convention** — `items.json`, `categories.json` (based on schema)
4. **Data validated with correct Zod schema** — Based on declaration
5. **Display mapping applied** — Schema defines which fields show where
6. **Theme versioning** — `"theme": "retro"`, `"themeVersion": "1.0.0"` for visual compatibility

### Unsupported Schema Handling

If a repository declares an unsupported schema:

```
Error: Unsupported schema: "my-custom-schema"
Supported: ranked-collection, simple-list, timeline
Request new schemas at: https://github.com/REPPL/itemdeck/issues
```

### User Workflow

1. Choose a schema from itemdeck's supported list
2. Structure data according to schema requirements
3. Declare schema in `collection.json`
4. Point itemdeck at the repository

### Adding New Schemas

New schemas are added to itemdeck (not repositories):

1. Define Zod schema with field definitions
2. Add display mapping (which fields go where on cards)
3. Register in `schemaRegistry`
4. Document for users

## Alternatives Considered

### Flat Structure (Current)

```
repository/
├── items.csv
└── categories.csv
```

- **Rejected**: Doesn't scale to multiple collections

### Database Backend

- **Rejected**: Overkill for static data; adds operational complexity

### GitHub API Fetching

- **Rejected**: Rate limits (60/hour unauthenticated); raw URLs are simpler

### Dynamic Schema Interpretation

Where itemdeck reads and interprets arbitrary schemas from repositories.

- **Rejected**: Too complex; security concerns with arbitrary field mapping; harder to maintain consistent UX

### Adapter Pattern

Where users write custom mapping configs to translate their fields.

- **Rejected**: Too much burden on users; still requires itemdeck to interpret arbitrary mappings

---

## Related Documentation

- [Data Repository Architecture Research](../../research/data-repository-architecture.md)
- [External Data Sources Research](../../research/external-data-sources.md)
- [F-007: GitHub Data Source](../../roadmap/features/planned/F-007-github-data-source.md)
- [F-008: Card Data Schema](../../roadmap/features/planned/F-008-card-data-schema.md)
- [ADR-003: Data Fetching](./ADR-003-data-fetching.md)
