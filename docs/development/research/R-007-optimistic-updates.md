# R-007: Optimistic Updates with TanStack Query

## Executive Summary

For Itemdeck's entity editing feature, implement **optimistic updates using an overlay store pattern** rather than TanStack Query cache mutations. Edits are stored separately in Zustand and merged with fetched data at render time. This provides simpler rollback, persistence across sessions, and clear separation between source data and user modifications.

Key recommendations:
1. Store edits in a separate Zustand store (not TanStack Query cache)
2. Merge edits with source data in the `useCollection` hook
3. Persist edits to localStorage for offline access
4. Provide explicit revert/reset actions per entity
5. Export edits as JSON for backup/sharing

## Current State in Itemdeck

Itemdeck currently uses:
- **TanStack Query** for fetching collection data (`useCollection` hook)
- **Query cache** for caching fetched data (5-minute stale time)
- **No mutation capabilities** - application is read-only
- **IndexedDB caching** via `cardCache.ts` for offline access

The editing feature needs to work alongside the existing fetch infrastructure.

## Research Findings

### Update Strategies Comparison

| Strategy | Complexity | Rollback | Persistence | Source/Edit Separation |
|----------|------------|----------|-------------|------------------------|
| **Overlay Store** | Low | Trivial | Built-in | Excellent |
| **Query Cache Mutation** | Medium | Manual | Requires sync | Poor |
| **Optimistic Mutation** | High | Automatic | Manual | Poor |
| **Local Copy** | Low | Trivial | Built-in | Good (full copy) |

### TanStack Query Mutation Pattern (Not Recommended)

Direct cache mutation requires careful rollback handling:

```typescript
// ❌ Not recommended for Itemdeck
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useEditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: Partial<CardData>) => {
      // No backend API - where does this go?
      return update;
    },
    onMutate: async (update) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['collection'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['collection']);

      // Optimistically update cache
      queryClient.setQueryData(['collection'], (old) => {
        // Complex merge logic here
        return mergeUpdate(old, update);
      });

      return { previous };
    },
    onError: (err, update, context) => {
      // Rollback on error
      queryClient.setQueryData(['collection'], context?.previous);
    },
    onSettled: () => {
      // Refetch to sync (but we have no server!)
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}
```

**Problems with this approach:**
1. No backend API to sync with
2. Rollback loses all edits on any error
3. Refetch overwrites local changes
4. Complex cache mutation logic
5. No persistence without additional storage

### Overlay Store Pattern (Recommended)

Separate store for edits, merged at render time:

```typescript
// src/stores/editsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EntityEdit {
  fields: Record<string, unknown>;
  editedAt: number;
}

interface EditsState {
  // Map of entityId -> edit data
  edits: Record<string, EntityEdit>;

  // Actions
  setField: (entityId: string, field: string, value: unknown) => void;
  setFields: (entityId: string, fields: Record<string, unknown>) => void;
  revertField: (entityId: string, field: string) => void;
  revertEntity: (entityId: string) => void;
  revertAll: () => void;

  // Getters
  getEdit: (entityId: string) => EntityEdit | undefined;
  hasEdits: (entityId: string) => boolean;
  getEditedEntityIds: () => string[];

  // Import/Export
  exportEdits: () => Record<string, EntityEdit>;
  importEdits: (edits: Record<string, EntityEdit>) => void;
}

export const useEditsStore = create<EditsState>()(
  persist(
    (set, get) => ({
      edits: {},

      setField: (entityId, field, value) => {
        set((state) => ({
          edits: {
            ...state.edits,
            [entityId]: {
              fields: {
                ...state.edits[entityId]?.fields,
                [field]: value,
              },
              editedAt: Date.now(),
            },
          },
        }));
      },

      setFields: (entityId, fields) => {
        set((state) => ({
          edits: {
            ...state.edits,
            [entityId]: {
              fields: {
                ...state.edits[entityId]?.fields,
                ...fields,
              },
              editedAt: Date.now(),
            },
          },
        }));
      },

      revertField: (entityId, field) => {
        set((state) => {
          const entityEdit = state.edits[entityId];
          if (!entityEdit) return state;

          const { [field]: _, ...remainingFields } = entityEdit.fields;
          if (Object.keys(remainingFields).length === 0) {
            const { [entityId]: __, ...remainingEdits } = state.edits;
            return { edits: remainingEdits };
          }

          return {
            edits: {
              ...state.edits,
              [entityId]: { ...entityEdit, fields: remainingFields },
            },
          };
        });
      },

      revertEntity: (entityId) => {
        set((state) => {
          const { [entityId]: _, ...remainingEdits } = state.edits;
          return { edits: remainingEdits };
        });
      },

      revertAll: () => set({ edits: {} }),

      getEdit: (entityId) => get().edits[entityId],
      hasEdits: (entityId) => entityId in get().edits,
      getEditedEntityIds: () => Object.keys(get().edits),

      exportEdits: () => get().edits,
      importEdits: (edits) => set({ edits }),
    }),
    {
      name: 'itemdeck-edits',
      version: 1,
    }
  )
);
```

### Merging Edits with Source Data

```typescript
// src/hooks/useCollection.ts (modified)
import { useEditsStore } from '@/stores/editsStore';

export function useCollection(source: string) {
  // Existing query logic
  const query = useQuery({
    queryKey: ['collection', source],
    queryFn: () => fetchCollection(source),
  });

  // Get edits from store
  const edits = useEditsStore((state) => state.edits);

  // Merge edits with source data
  const mergedData = useMemo(() => {
    if (!query.data) return null;

    return {
      ...query.data,
      cards: query.data.cards.map((card) => {
        const edit = edits[card.id];
        if (!edit) return card;

        return {
          ...card,
          ...edit.fields,
          _hasEdits: true,
          _editedAt: edit.editedAt,
        };
      }),
    };
  }, [query.data, edits]);

  return {
    ...query,
    data: mergedData,
    sourceData: query.data,  // Original unmodified data
  };
}
```

### Detecting and Displaying Edits

```typescript
// src/components/Card/Card.tsx
interface CardProps {
  card: DisplayCard & { _hasEdits?: boolean };
}

function Card({ card }: CardProps) {
  return (
    <div className={clsx('card', { 'card--edited': card._hasEdits })}>
      {card._hasEdits && (
        <span className="edit-indicator" title="This card has local edits">
          ✎
        </span>
      )}
      {/* ... rest of card */}
    </div>
  );
}
```

### Diff View for Edits

Show what changed:

```typescript
// src/components/EditDiff/EditDiff.tsx
interface EditDiffProps {
  entityId: string;
  sourceData: Record<string, unknown>;
}

function EditDiff({ entityId, sourceData }: EditDiffProps) {
  const edit = useEditsStore((state) => state.getEdit(entityId));
  const revertField = useEditsStore((state) => state.revertField);

  if (!edit) return null;

  return (
    <div className="edit-diff">
      <h4>Local Changes</h4>
      <ul>
        {Object.entries(edit.fields).map(([field, newValue]) => {
          const oldValue = sourceData[field];
          return (
            <li key={field}>
              <span className="field-name">{field}:</span>
              <span className="old-value">{String(oldValue)}</span>
              <span className="arrow">→</span>
              <span className="new-value">{String(newValue)}</span>
              <button onClick={() => revertField(entityId, field)}>
                Revert
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

### Export/Import Edits

```typescript
// src/utils/editExport.ts
import { useEditsStore } from '@/stores/editsStore';

interface EditExport {
  version: 1;
  exportedAt: string;
  collectionId: string;
  edits: Record<string, { fields: Record<string, unknown>; editedAt: number }>;
}

export function exportEditsToFile(collectionId: string): void {
  const edits = useEditsStore.getState().exportEdits();

  const exportData: EditExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    collectionId,
    edits,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${collectionId}-edits-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importEditsFromFile(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as EditExport;

  if (data.version !== 1) {
    throw new Error(`Unsupported export version: ${data.version}`);
  }

  useEditsStore.getState().importEdits(data.edits);
}
```

### Conflict Detection

Handle when source data changes after local edits:

```typescript
// src/hooks/useEditConflicts.ts
import { useMemo } from 'react';
import { useEditsStore } from '@/stores/editsStore';

interface Conflict {
  entityId: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  editedAt: number;
  remoteFetchedAt: number;
}

export function useEditConflicts(
  sourceData: Record<string, unknown>[],
  lastFetchedAt: number
): Conflict[] {
  const edits = useEditsStore((state) => state.edits);

  return useMemo(() => {
    const conflicts: Conflict[] = [];

    for (const entity of sourceData) {
      const entityId = entity.id as string;
      const edit = edits[entityId];
      if (!edit) continue;

      // If source data was fetched after our edit, check for conflicts
      if (lastFetchedAt > edit.editedAt) {
        for (const [field, localValue] of Object.entries(edit.fields)) {
          const remoteValue = entity[field];
          // If remote value differs from what we edited from
          if (remoteValue !== localValue) {
            conflicts.push({
              entityId,
              field,
              localValue,
              remoteValue,
              editedAt: edit.editedAt,
              remoteFetchedAt: lastFetchedAt,
            });
          }
        }
      }
    }

    return conflicts;
  }, [sourceData, edits, lastFetchedAt]);
}
```

## Recommendations for Itemdeck

### Priority 1: Overlay Store

1. **Create `editsStore.ts`** following the pattern above
2. **Persist to localStorage** with version migration support
3. **Provide granular revert** (field, entity, all)
4. **Track edit timestamps** for conflict detection

### Priority 2: Merge Layer

1. **Modify `useCollection`** to merge edits with source data
2. **Add `_hasEdits` flag** for UI indication
3. **Keep source data accessible** for diff views
4. **Memoise merge** to prevent unnecessary recalculations

### Priority 3: UI Integration

1. **Visual indicator** on edited cards (pencil icon, highlight)
2. **Diff view** in CardExpanded modal
3. **Revert button** per field and per entity
4. **Conflict warning** when source updates

### When NOT to Use Optimistic Updates

| Scenario | Approach |
|----------|----------|
| Editing local demo data | Overlay store (recommended) |
| Syncing to backend API | TanStack Query mutations |
| Real-time collaboration | Conflict resolution + sync |
| Undo/redo | Overlay store with history |

## Implementation Considerations

### Dependencies

No additional dependencies - uses existing Zustand and TanStack Query.

### Bundle Size Impact

Minimal - reuses existing infrastructure.

### Performance

- **Merge operation**: O(n) where n = number of cards
- **Memoise merges** to run only when edits or source data change
- **Selective subscriptions** in Zustand for edited entity IDs

### Migration Path

1. **v1**: Basic overlay store with field-level edits
2. **v2**: Add timestamps and conflict detection
3. **v3**: Add edit history for undo/redo

## References

- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [Offline-First Patterns](https://web.dev/offline-cookbook/)

---

## Related Documentation

- [F-048: Edit Mode Toggle](../roadmap/features/completed/F-048-edit-mode-toggle.md) - Edit mode implementation
- [R-004: Form Handling in React](./R-004-form-handling.md) - Form handling patterns
- [ADR-014: Entity Edit Architecture](../decisions/adrs/ADR-014-entity-edit-architecture.md) - Edit architecture decision
- [State Persistence Research](./state-persistence.md) - State persistence patterns

---

**Applies to**: Itemdeck v0.10.0+
