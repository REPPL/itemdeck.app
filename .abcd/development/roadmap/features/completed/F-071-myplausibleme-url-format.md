# F-071: MyPlausibleMe Strict URL Format

## Problem Statement

Current source management allows arbitrary GitHub URLs, which is complex and error-prone. Users need a simpler way to add collections.

## Design Approach

1. **Strict URL format**: `github.com/{username}/MyPlausibleMe/data/{folder}`
2. **Simplified input**: User provides only username + folder name
3. **Auto-discovery**: Fetch manifest to populate folder dropdown
4. **Legacy support**: Existing non-conforming sources marked as legacy with warning

## URL Format

```
Input: username = "REPPL", folder = "retro-games"
Output: https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/retro-games
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/SettingsPanel/AddMyPlausibleMeForm.tsx` | Simplified form |
| `src/hooks/useMyPlausibleMeDiscovery.ts` | Discover collections from username |

## Files to Modify

| File | Changes |
|------|---------|
| `src/config/allowedSources.ts` | Restrict to MyPlausibleMe pattern only |
| `src/config/dataSource.ts` | Add `buildMyPlausibleMeUrl()` |
| `src/stores/sourceStore.ts` | Add migration, legacy flag, version bump |
| `src/components/SettingsPanel/StorageSettingsTabs.tsx` | Replace AddSourceForm |

## New UI

```
+-------------------------------------------------------------+
|  Add MyPlausibleMe Collection                               |
+-------------------------------------------------------------+
|  GitHub Username:  [________________]                       |
|                                                             |
|  Collection:       [Select collection v]                    |
|                    (populated after username entered)       |
|                                                             |
|  Preview: github.com/{user}/MyPlausibleMe/data/{folder}     |
|                                                             |
|  [Add Collection]                                           |
+-------------------------------------------------------------+
```

## Implementation Tasks

- [ ] Add `buildMyPlausibleMeUrl()` to dataSource.ts
- [ ] Create `useMyPlausibleMeDiscovery` hook
- [ ] Create AddMyPlausibleMeForm component
- [ ] Add migration to sourceStore (version 2)
- [ ] Mark legacy sources with warning
- [ ] Update StorageSettingsTabs to use new form
- [ ] Test with real MyPlausibleMe repositories
- [ ] Handle discovery errors gracefully

## Success Criteria

- [ ] Only MyPlausibleMe URLs accepted for new sources
- [ ] Username + folder input UI works
- [ ] Auto-discovery from manifest populates dropdown
- [ ] Legacy sources marked with warning
- [ ] Migration preserves existing sources

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Medium** - Store migration and new discovery logic.

---

## Related Documentation

- [v0.11.1 Milestone](../../milestones/v0.11.1.md)
- [Source Store](../../../../src/stores/sourceStore.ts)
- [Allowed Sources](../../../../src/config/allowedSources.ts)
