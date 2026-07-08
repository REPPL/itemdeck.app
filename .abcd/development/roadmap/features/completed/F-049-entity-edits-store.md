# F-049: Entity Edits Store

## Problem Statement

Itemdeck needs to store user edits to entity data without modifying the source files. Challenges:

1. **Source integrity** - Original JSON files must remain unmodified
2. **Persistence** - Edits should survive browser refresh/closure
3. **Granular control** - Users should revert individual fields or entities
4. **Export capability** - Edits should be exportable for backup
5. **Merge display** - UI should show edited values, not source values

## Design Approach

Implement an **Overlay Store Pattern** using Zustand with localStorage persistence.

### Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     editsStore (Zustand)                    │
├─────────────────────────────────────────────────────────────┤
│ edits: Record<entityId, {                                   │
│   fields: Record<fieldName, value>,                         │
│   editedAt: timestamp                                       │
│ }>                                                          │
├─────────────────────────────────────────────────────────────┤
│ Actions:                                                    │
│   setField(entityId, field, value)                          │
│   setFields(entityId, fields)                               │
│   revertField(entityId, field)                              │
│   revertEntity(entityId)                                    │
│   revertAll()                                               │
│   exportEdits() → JSON                                      │
│   importEdits(JSON)                                         │
├─────────────────────────────────────────────────────────────┤
│ Selectors:                                                  │
│   getEdit(entityId)                                         │
│   hasEdits(entityId)                                        │
│   getEditedEntityIds()                                      │
│   getTotalEditCount()                                       │
└─────────────────────────────────────────────────────────────┘
```

### Merge Strategy

```typescript
// In useCollection hook
const mergedCards = useMemo(() => {
  return sourceCards.map(card => {
    const edit = edits[card.id];
    if (!edit) return card;

    return {
      ...card,
      ...edit.fields,
      _hasEdits: true,
      _editedAt: edit.editedAt,
    };
  });
}, [sourceCards, edits]);
```

## Implementation Tasks

### Phase 1: Store Creation

- [x] Create `src/stores/editsStore.ts`
- [x] Define `EntityEdit` interface
- [x] Implement `setField()` and `setFields()` actions
- [x] Implement `revertField()`, `revertEntity()`, `revertAll()` actions
- [x] Add Zustand persist middleware with `itemdeck-edits` key

### Phase 2: Selectors and Queries

- [x] Implement `getEdit(entityId)` selector
- [x] Implement `hasEdits(entityId)` selector
- [x] Implement `getEditedEntityIds()` for bulk operations
- [x] Implement `getTotalEditCount()` for UI badge

### Phase 3: Collection Hook Integration

- [x] Modify `CollectionDataContext` to merge edits with source data
- [x] Merge edits with source data in memoised computation
- [x] Add `_hasEdits` flag to merged entities
- [x] Add `_editedAt` timestamp for sorting/filtering

### Phase 4: Export/Import

- [x] Implement `exportEdits()` returning JSON structure
- [x] Implement `importEdits(data)` with validation
- [x] Add version field to export format
- [x] Validate imported data with Zod schema

## Success Criteria

- [x] Edits persist in localStorage across sessions
- [x] Collection returns merged data with edits applied
- [x] Individual field revert works without affecting other fields
- [x] Entity revert clears all edits for that entity
- [x] Export produces valid JSON with version metadata
- [x] Import validates and applies edits correctly

## Dependencies

- **Existing**: Zustand, `useCollection` hook
- **ADR**: [ADR-014: Entity Edit Architecture](../../decisions/adrs/ADR-014-entity-edit-architecture.md)

## Complexity

**Medium** - New store with merge logic integration.

## Testing Strategy

- Unit tests for all store actions
- Unit tests for merge logic
- Integration test with `useCollection`
- Test localStorage persistence
- Test export/import round-trip

---

## Related Documentation

- [ADR-014: Entity Edit Architecture](../../decisions/adrs/ADR-014-entity-edit-architecture.md)
- [R-007: Optimistic Updates](../../research/R-007-optimistic-updates.md)
- [F-048: Edit Mode Toggle](./F-048-edit-mode-toggle.md)
- [F-050: Edit Form Component](./F-050-edit-form-component.md)

---

**Status**: Complete
