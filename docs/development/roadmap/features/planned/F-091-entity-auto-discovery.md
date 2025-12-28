# F-091: Entity Auto-Discovery

## Problem Statement

Collections currently require an `index.json` file in each entity directory to list entity IDs for loading. This creates maintenance overhead when adding/removing entities and requires keeping the index in sync with actual files.

## Design Approach

1. **Fallback pattern**: When no `index.json` exists, scan the entity directory for `*.json` files
2. **Backwards compatible**: Collections with `index.json` continue to work unchanged
3. **Exclude patterns**: Skip files starting with `_` (e.g., `_template.json`, `_schema.json`)
4. **Derive ID from filename**: Entity ID = filename without `.json` extension

## Files to Modify

| File | Changes |
|------|---------|
| `src/loaders/collectionLoader.ts` | Add directory scanning fallback in `loadEntities()` |

## Implementation Tasks

- [ ] Update `loadEntities()` to detect missing `index.json`
- [ ] Implement directory listing via GitHub API (for remote) or fetch manifest
- [ ] Filter out files starting with `_` and `index.json`
- [ ] Extract entity IDs from filenames
- [ ] Load entities using existing `loadEntitiesFromDirectory()`
- [ ] Add tests for auto-discovery behaviour
- [ ] Update documentation

## Technical Considerations

### Remote Collections (GitHub)

For GitHub-hosted collections, directory listing requires:
- GitHub Contents API: `GET /repos/{owner}/{repo}/contents/{path}`
- Returns array of file objects with `name` and `type` fields

### Local/Bundled Collections

For local collections served via HTTP:
- Cannot list directory contents via fetch
- Options:
  1. Generate manifest file at build time
  2. Require `index.json` for local collections
  3. Use Vite's `import.meta.glob` for bundled data

### Recommended Approach

1. **GitHub collections**: Use Contents API for auto-discovery
2. **Local collections**: Continue requiring `index.json`
3. **Bundled collections**: Use `import.meta.glob` at build time

## Loading Order

```
1. Try: {type}s/index.json (existing behaviour)
2. Try: {type}s/_index.json (alternative location)
3. NEW: Try auto-discovery via GitHub API
4. Fall back: {type}s.json (single file with array)
5. Fall back: {type}.json (single file)
```

## Success Criteria

- [ ] GitHub-hosted collections work without `index.json`
- [ ] Existing collections with `index.json` continue to work
- [ ] Files starting with `_` are excluded from discovery
- [ ] Entity IDs correctly derived from filenames
- [ ] Error handling for API failures

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Medium** - GitHub API integration, error handling for network failures.

---

## Related Documentation

- [v0.12.0 Milestone](../../milestones/v0.12.0.md)
- [Collection Loader](../../../../src/loaders/collectionLoader.ts)
- [Schema Documentation](../../../reference/schemas/)

---

**Status**: Planned
