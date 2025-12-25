# F-047: Remote Source Management

## Problem Statement

Currently, itemdeck has a single hardcoded data source:

```typescript
export const defaultDataSource: GitHubRawConfig = {
  owner: "REPPL",
  repo: "MyPlausibleMe",
  collection: "retro-games",
  branch: "main",
};
```

This creates several limitations:

1. **No user customisation** - Cannot add personal collections
2. **No source history** - Recently used sources not remembered
3. **Single source only** - Cannot compare or switch between multiple repos
4. **No persistence** - Configuration lost on page refresh
5. **Manual URL entry** - Need to construct GitHub URLs manually

Users should be able to manage a list of data sources, add new ones, and switch between them easily.

## Design Approach

Implement a source management system with persistent storage, validation, and a user-friendly interface.

### Source Management Flow

```
User wants to add source
        ↓
┌─────────────────────────────┐
│ Add Source Dialog           │
│ → Enter owner/repo or URL   │
│ → Select collection         │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│ Validate Source             │
│ → Health check              │
│ → Schema compatibility      │
│ → Show preview              │
└─────────────────────────────┘
        ↓ Valid
┌─────────────────────────────┐
│ Add to Source List          │
│ → Persist to localStorage   │
│ → Set as active (optional)  │
└─────────────────────────────┘
```

### Data Model

```typescript
interface ManagedSource extends GitHubRawConfig {
  id: string;           // Unique identifier
  addedAt: Date;        // When source was added
  lastAccessed?: Date;  // Last time source was used
  nickname?: string;    // User-provided name
  health?: {            // Cached health status
    status: 'healthy' | 'degraded' | 'unavailable';
    lastChecked: Date;
  };
}

interface SourceState {
  sources: ManagedSource[];
  activeSourceId: string | null;
  defaultSourceId: string | null;  // Used when no active source
}
```

### Store API

```typescript
interface SourceManagerActions {
  addSource: (source: GitHubRawConfig) => Promise<string>;  // Returns ID
  removeSource: (id: string) => void;
  updateSource: (id: string, updates: Partial<ManagedSource>) => void;
  setActive: (id: string) => void;
  setDefault: (id: string) => void;
  getActive: () => ManagedSource | null;
  recentSources: (limit?: number) => ManagedSource[];
}
```

### Component Architecture

```
SourceManager/
├── SourceManager.tsx        # Main panel/modal
├── SourceList.tsx           # List of managed sources
├── SourceListItem.tsx       # Individual source row
├── AddSourceDialog.tsx      # Add new source form
├── SourceActions.tsx        # Edit/remove/set default actions
└── SourceValidation.tsx     # Validation status display
```

## Implementation Tasks

### Phase 1: Zustand Store

- [x] Create `src/stores/sourceStore.ts` with Zustand
- [x] Implement `persist` middleware for localStorage
- [x] Define `Source` and `SourceState` interfaces
- [x] Implement CRUD actions (add, remove, update)
- [x] Add active source selection

### Phase 2: Source Validation

- [x] Validate source URL before adding
- [x] Check for duplicate sources
- [x] Health check on add
- [x] Generate unique ID from timestamp

### Phase 3: Add Source Form

- [x] Create add source form in SourceSettingsTabs
- [x] Support URL input
- [x] Display validation status
- [x] Show error messages

### Phase 4: Source List

- [x] Create source list in SourceSettingsTabs
- [x] Show source name, URL, health status
- [x] Highlight active source
- [x] Mark default source

### Phase 5: Source Actions

- [x] "Set as active" action
- [x] "Set as default" action
- [x] "Remove" action with confirmation

### Phase 6: Integration

- [x] Add Sources tab to Settings panel
- [x] Source management fully integrated

### Phase 7: Migration

- [x] Default source auto-added on first load
- [x] Handle empty source list gracefully

## Success Criteria

- [x] Sources persist across page refreshes
- [x] New sources validated before adding
- [x] Duplicate sources prevented
- [x] Active source clearly indicated
- [x] Default source used when no active source
- [x] Sources removable
- [x] URL input works correctly

## Dependencies

- **F-045**: Source health check for validation
- **F-046**: Collection discovery for collection picker
- **Existing**: Zustand (already installed)

## Complexity

**Medium** - New store and UI components, localStorage persistence.

## UI Mockup

### Source Manager Panel

```
┌─────────────────────────────────────────────────────────┐
│ Data Sources                                    [+ Add] │
├─────────────────────────────────────────────────────────┤
│ ● Retro Games (active)                          ⋮      │
│   REPPL/MyPlausibleMe • 81 items • ✓ healthy           │
├─────────────────────────────────────────────────────────┤
│ ○ Recipes                                       ⋮      │
│   REPPL/MyPlausibleMe • 45 items • ✓ healthy           │
├─────────────────────────────────────────────────────────┤
│ ○ Books Collection                              ⋮      │
│   friend/collections • 120 items • ⚠ degraded          │
└─────────────────────────────────────────────────────────┘
```

### Add Source Dialog

```
┌─────────────────────────────────────────────────────────┐
│ Add Data Source                                    [×]  │
├─────────────────────────────────────────────────────────┤
│ Enter GitHub URL or owner/repo:                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ https://github.com/REPPL/MyPlausibleMe             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ✓ Repository found: MyPlausibleMe                       │
│                                                         │
│ Select collection:                                      │
│ ○ Retro Games (81 items, v2)                           │
│ ● Recipes (45 items, v2)                               │
│                                                         │
│ Nickname (optional):                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ My Favourite Recipes                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                              [Cancel]  [Add Source]     │
└─────────────────────────────────────────────────────────┘
```

## Testing Strategy

- Unit tests for store actions
- Unit tests for URL parsing
- Mock localStorage for persistence tests
- Integration test for add/remove flow
- E2E test for source switching

## Edge Cases

- **Empty source list**: Show "Add your first source" prompt
- **All sources unavailable**: Show error state with retry
- **Invalid URL pasted**: Clear error message with format hints
- **Duplicate source**: Prevent add, highlight existing
- **Active source removed**: Fall back to default or first available

---

## Related Documentation

- [State of the Art: Remote Data Assessment](../../research/state-of-the-art-remote-data-assessment.md)
- [F-045: Remote Source Health Check](./F-045-remote-source-health-check.md)
- [F-046: Collection Discovery UI](./F-046-collection-discovery-ui.md)
- [v0.9.0 Milestone](../../milestones/v0.9.0.md)

---

**Status**: Complete
