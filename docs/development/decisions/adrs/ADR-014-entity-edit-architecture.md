# ADR-014: Entity Edit Architecture

## Status

Accepted

## Context

Itemdeck needs to support editing entity data (games, platforms) in the demo collection. Currently the application is read-only, with data fetched from JSON files via TanStack Query.

We need to decide how to store and manage user edits. Key considerations:

1. No backend API exists - edits must be client-side
2. Edits should persist across browser sessions
3. Users should be able to revert individual changes
4. Source data should remain unmodified
5. Edits should be exportable/importable

We evaluated several approaches:

| Approach | Complexity | Rollback | Persistence | Source Integrity |
|----------|------------|----------|-------------|------------------|
| **Overlay Store** | Low | Trivial | Built-in | Preserved |
| **TanStack Query Cache** | Medium | Complex | Requires sync | Lost on refetch |
| **Full Local Copy** | Low | Easy | Built-in | Preserved (copy) |
| **IndexedDB Direct** | Medium | Manual | Built-in | Preserved |

## Decision

Use an **Overlay Store Pattern** with Zustand.

Edits are stored in a separate Zustand store (`editsStore`) that "overlays" the source data. When rendering, the `useCollection` hook merges edits with source data at runtime.

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (Cards)                         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Merge Function   │
                    │  (in useCollection)│
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────▼────────┐   ┌───────▼───────┐    ┌───────▼───────┐
│  Source Data    │   │  Edits Store  │    │   Edit Flag   │
│  (TanStack Q)   │   │  (Zustand)    │    │   (_hasEdits) │
│  Read-only      │   │  localStorage │    │               │
└─────────────────┘   └───────────────┘    └───────────────┘
```

## Consequences

### Positive

- **Simple rollback** - Delete the edit entry to revert
- **Granular control** - Revert individual fields or entire entities
- **Source integrity** - Original data never modified
- **Offline support** - Edits persist in localStorage
- **Export/Import** - Easy to serialise edit data
- **Conflict detection** - Can compare edit timestamps with fetch timestamps
- **No TanStack Query complexity** - Avoids cache invalidation issues

### Negative

- **Merge overhead** - Must merge on every render (mitigated by memoisation)
- **Two sources of truth** - During editing, data comes from two places
- **Storage limits** - localStorage has ~5MB limit (sufficient for text edits)

### Mitigations

- **Memoise merge** - Only recalculate when source data or edits change
- **Clear UI indication** - Show which entities have local edits
- **Storage monitoring** - Warn when approaching storage limits
- **Selective sync** - Only store changed fields, not full entities

## Store Design

```typescript
// src/stores/editsStore.ts
interface EditsState {
  edits: Record<string, EntityEdit>;

  // Actions
  setField: (entityId: string, field: string, value: unknown) => void;
  revertField: (entityId: string, field: string) => void;
  revertEntity: (entityId: string) => void;
  revertAll: () => void;

  // Queries
  getEdit: (entityId: string) => EntityEdit | undefined;
  hasEdits: (entityId: string) => boolean;

  // Import/Export
  exportEdits: () => Record<string, EntityEdit>;
  importEdits: (edits: Record<string, EntityEdit>) => void;
}
```

## Alternatives Considered

### TanStack Query Cache Mutation

- Modify query cache directly with `setQueryData`
- **Rejected**: Loses edits on refetch, complex rollback, no persistence without extra work

### Full Local Copy

- Copy entire collection to localStorage on first load
- Edit the local copy directly
- **Rejected**: Wastes storage, doesn't handle source updates, large data duplication

### IndexedDB with Dexie

- Store edits in IndexedDB for larger capacity
- **Rejected**: Overkill for text edits, adds dependency, async complicates merge

### Proxy-Based State (Valtio)

- Use Valtio for mutable state with automatic tracking
- **Rejected**: Different paradigm from existing Zustand usage, learning curve

---

## Related Documentation

- [R-004: Form Handling in React](../../research/R-004-form-handling.md)
- [R-007: Optimistic Updates](../../research/R-007-optimistic-updates.md)
- [ADR-004: State Management](./ADR-004-state-management.md)
- [F-049: Entity Edits Store](../../roadmap/features/planned/F-049-entity-edits-store.md)

---

**Applies to**: Itemdeck v0.10.0+
