# F-046: Collection Discovery UI

## Problem Statement

Currently, itemdeck can only display one collection at a time, and switching collections requires:

1. **Code changes** - Modifying `defaultDataSource` configuration
2. **No visibility** - Users cannot see what collections are available in a repository
3. **No browsing** - Cannot explore a repository's offerings before selecting
4. **Manual URL construction** - Need to know exact collection path

Users should be able to discover and browse available collections from a repository's manifest.

## Design Approach

Implement a collection browser that reads repository manifests and allows users to browse, preview, and switch collections.

### Discovery Flow

```
User enters repository (owner/repo)
        ↓
┌─────────────────────────────┐
│ Fetch manifest.json         │
│ → Parse collection list     │
│ → Extract metadata          │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│ Display Collection Browser  │
│ → Grid/list of collections  │
│ → Show name, description    │
│ → Show item/category counts │
│ → Featured badge            │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│ User selects collection     │
│ → Update active source      │
│ → Trigger data load         │
└─────────────────────────────┘
```

### Manifest Schema

```typescript
interface RepositoryManifest {
  version: string;
  collections: CollectionMeta[];
}

interface CollectionMeta {
  path: string;           // "data/collections/retro-games"
  name: string;           // "My Top Computer & Video Games"
  description?: string;   // Brief description
  schema: string;         // "ranked-collection"
  schemaVersion: string;  // "v2"
  itemCount?: number;     // 81
  categoryCount?: number; // 12
  featured?: boolean;     // Highlighted collection
  thumbnail?: string;     // Preview image URL
}
```

### Component Architecture

```
CollectionBrowser/
├── CollectionBrowser.tsx    # Main container
├── CollectionGrid.tsx       # Grid layout
├── CollectionCard.tsx       # Individual card
├── CollectionSwitcher.tsx   # Dropdown for quick switch
└── RepositoryInput.tsx      # Owner/repo input form
```

### Hook API

```typescript
function useManifest(
  owner: string,
  repo: string,
  options?: { enabled?: boolean }
): UseQueryResult<RepositoryManifest>;

function useCollectionMeta(
  source: GitHubRawConfig
): UseQueryResult<CollectionMeta>;
```

## Implementation Tasks

### Phase 1: Manifest Fetching

- [x] Create `src/hooks/useCollectionManifest.ts` hook
- [x] Add query key factory for manifest
- [x] Configure caching (1-hour stale time)
- [x] Handle missing manifest gracefully (fallback to single collection)

### Phase 2: Collection Metadata

- [x] Create manifest interfaces in hook file
- [x] Extract collection metadata from manifest
- [x] Build collection URL from path

### Phase 3: Browser Components

- [x] Create `CollectionBrowser.tsx` main component
- [x] Create `CollectionCard.tsx` with metadata display
- [x] Add thumbnail support (optional image preview)
- [x] Highlight current collection
- [x] Show health status indicator per collection

### Phase 4: Quick Switcher

- [x] Integrated into CollectionBrowser component
- [x] Show current collection highlighted
- [x] List available collections from manifest
- [x] Click to switch collections

### Phase 5: Repository Input

- [x] URL input in SourceSettingsTabs
- [x] Validate repository accessibility via health check
- [x] Show loading state during validation
- [x] Error handling for invalid repos

### Phase 6: Integration

- [x] CollectionBrowser integrated into SourceSettingsTabs
- [x] Update source store when collection selected
- [x] Health check on source addition

## Success Criteria

- [x] Manifest fetched and parsed successfully
- [x] Collections displayed with name, description, counts
- [x] Current collection visually highlighted
- [x] Collection switch updates display
- [x] Missing manifest falls back gracefully
- [x] Health status shown per collection
- [x] Responsive grid layout

## Dependencies

- **F-045**: Source health check (for compatibility indicators)
- **v0.7.0**: Schema v2 with metadata fields
- **Existing**: TanStack Query, Zod

## Complexity

**Medium** - New components and hook, straightforward data flow.

## UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ Collections from REPPL/MyPlausibleMe                    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐                 │
│ │ ⭐ Retro Games  │ │   Recipes       │                 │
│ │ 81 items        │ │   45 items      │                 │
│ │ 12 categories   │ │   8 categories  │                 │
│ │ [v2 ✓]         │ │ [v2 ✓]         │                 │
│ │                 │ │                 │                 │
│ │ [Select]        │ │ [Select]        │                 │
│ └─────────────────┘ └─────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Testing Strategy

- Unit tests for manifest parsing
- Mock manifests with various configurations
- Test missing manifest fallback
- Test schema compatibility display
- E2E test for collection switching

---

## Related Documentation

- [State of the Art: Remote Data Assessment](../../research/state-of-the-art-remote-data-assessment.md)
- [Data Repository Architecture](../../research/data-repository-architecture.md)
- [F-045: Remote Source Health Check](./F-045-remote-source-health-check.md)
- [F-047: Remote Source Management](./F-047-remote-source-management.md)
- [v0.9.0 Milestone](../../milestones/v0.9.0.md)

---

**Status**: Complete
