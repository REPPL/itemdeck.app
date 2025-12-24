# v0.7.0 Retrospective - Schema Flexibility

## Summary

v0.7.0 successfully generalised the ItemDeck schema to support any collection domain, implemented Zod validation, and migrated demo data to a cleaner individual-file structure with 81 games from GEMINI enrichment.

## What Went Well

### 1. Schema Generalisation
The terminology changes (platform → category, rank → order) were straightforward and the legacy aliases ensured no breaking changes to existing code.

### 2. Zod Validation
Adding runtime validation catches schema errors early with helpful path-based error messages. This will save significant debugging time.

### 3. Directory-Based Entity Storage
The decision to use individual entity files (`games/populous-amiga.json`) rather than single large files provides:
- Better git diffs (only changed entities show)
- Easier manual editing
- Parallel loading capability
- Natural organisation by entity ID

### 4. Dynamic Field Discovery
Replacing hardcoded dropdown options with schema introspection means new collections automatically get appropriate field options without code changes.

### 5. Clean Attribution Component
The Attribution component provides consistent credit display across the application with proper accessibility.

### 6. Expandable Platform Section
The expandable platform row demonstrates how related entities can be explored inline without navigating away. Dynamic field display shows any fields added to the JSON.

### 7. Title Placeholders
Replacing skeleton loaders with coloured backgrounds showing the item title provides meaningful content during load and graceful degradation when images fail.

## What Could Improve

### 1. Index File Overhead
Each entity directory requires an `index.json` listing all entity IDs. While this enables efficient parallel loading, it requires manual maintenance when adding/removing entities.

**Potential improvement**: Auto-generate index files, or use a manifest pattern.

### 2. Recipe Collection Not Implemented
The original plan included a recipes collection to prove domain generalisation. This was deferred to focus on completing the games collection properly.

**Status**: Deferred to future milestone.

### 3. Field Options Context Not Wired Up
While `FieldOptionsContext` was created, it wasn't fully integrated into the settings panel. The context exists but dropdowns still use static options.

**Status**: Partial implementation, needs follow-up.

## Lessons Learned

### 1. Data Migration Requires Source Verification
Initial attempt to update demo data used stale verdicts that didn't match the user's actual GEMINI-enriched data. Always verify the source of truth before migrating data.

### 2. Individual Files Scale Better
Large JSON arrays are difficult to review in PRs and prone to merge conflicts. Individual files per entity are more manageable.

### 3. Backward Compatibility via Aliases
Using property aliases (`device` → `categoryShort`) allows gradual migration without breaking changes. Both old and new names work.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Individual entity files | Better git diffs, easier editing |
| Index files for loading | Enables parallel fetch, explicit entity list |
| Legacy property aliases | Backward compatibility without breaking changes |
| Zod for validation | Runtime checking with helpful error messages |
| Generic terminology | Support any domain, not just games |

## Metrics

| Metric | Value |
|--------|-------|
| Entity files created | 96 (81 games + 13 platforms + 2 indexes) |
| New TypeScript types | 5 (RatingValue, DetailLink, SchemaVersion, etc.) |
| New components | 1 (Attribution) |
| New services | 2 (fieldDiscovery, ratingResolver) |
| Documentation pages | 1 (Schema v2 Reference) |
| UI improvements | 5 (expandable platform, title placeholders, link deduplication, settings reorganisation, theme integration) |

## Follow-Up Items

1. **Wire up FieldOptionsContext** - Integrate dynamic field options into settings panel
2. **Recipe collection** - Add non-game collection to prove generalisation
3. **Index file automation** - Consider auto-generating from directory contents
4. **Migration guide** - Document v1 → v2 migration for users

---

## Related Documentation

- [v0.7.0 Milestone](../../roadmap/milestones/v0.7.0.md)
- [v0.7.0 Devlog](../../process/devlogs/v0.7.0/README.md)
- [Schema v2 Reference](../../../reference/schemas/v2/README.md)
