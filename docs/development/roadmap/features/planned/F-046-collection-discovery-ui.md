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

- [ ] Create `src/hooks/useManifest.ts` hook
- [ ] Add `manifestKeys` to query key factory
- [ ] Configure caching (1-hour stale time)
- [ ] Handle missing manifest gracefully (fallback to single collection)

### Phase 2: Collection Metadata

- [ ] Create `src/types/manifest.ts` with interfaces
- [ ] Create Zod schema for manifest validation
- [ ] Extract collection metadata from manifest
- [ ] Build collection URL from path

### Phase 3: Browser Components

- [ ] Create `CollectionBrowser.tsx` main component
- [ ] Create `CollectionCard.tsx` with metadata display
- [ ] Add thumbnail support (optional image preview)
- [ ] Highlight featured collections
- [ ] Show schema compatibility indicator

### Phase 4: Quick Switcher

- [ ] Create `CollectionSwitcher.tsx` dropdown component
- [ ] Show current collection name
- [ ] List available collections from manifest
- [ ] Add to header/sidebar
- [ ] Keyboard shortcut for quick switch (Cmd/Ctrl+K?)

### Phase 5: Repository Input

- [ ] Create `RepositoryInput.tsx` form component
- [ ] Parse GitHub URL or owner/repo format
- [ ] Validate repository accessibility
- [ ] Show loading state during manifest fetch
- [ ] Error handling for invalid repos

### Phase 6: Integration

- [ ] Add CollectionBrowser to Sidebar or Settings
- [ ] Add CollectionSwitcher to header
- [ ] Update source store when collection selected
- [ ] Trigger health check on selection
- [ ] Animate collection transition

## Success Criteria

- [ ] Manifest fetched and parsed successfully
- [ ] Collections displayed with name, description, counts
- [ ] Featured collections visually highlighted
- [ ] Collection switch updates display within 2s
- [ ] Missing manifest falls back gracefully
- [ ] Schema compatibility shown per collection
- [ ] Responsive grid layout (1-4 columns)

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

**Status**: Planned
