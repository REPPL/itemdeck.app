# F-052: Edit Export/Import

## Problem Statement

User edits stored in localStorage are vulnerable to:

1. **Browser storage clearing** - Users may clear site data
2. **Device switching** - Edits don't sync across devices
3. **Sharing** - Can't share curated edits with others
4. **Backup** - No way to backup edits before reinstalling

Users need a way to export and import their local edits.

## Design Approach

Add Export and Import buttons to the Settings panel with JSON file format.

### Settings UI

```
Settings Panel → System Tab → Edit Mode Section
┌─────────────────────────────────────┐
│ Edit Mode                           │
│ ┌─────────────────────────────────┐ │
│ │ ☑ Enable editing                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Local Edits (12 cards modified)     │
│                                     │
│ [Export Edits ↓]  [Import Edits ↑]  │
│                                     │
│ [Revert All Edits]                  │
└─────────────────────────────────────┘
```

### Export File Format

```json
{
  "version": 1,
  "exportedAt": "2025-12-25T12:00:00Z",
  "collectionId": "retro-games",
  "editCount": 12,
  "edits": {
    "super-metroid-snes": {
      "fields": {
        "myVerdict": "One of the greatest games ever made.",
        "myRank": 1
      },
      "editedAt": 1735120000000
    }
  }
}
```

## Implementation Tasks

### Phase 1: Export Functionality

- [ ] Create `src/utils/editExport.ts`
- [ ] Implement `exportEditsToFile()` function
- [ ] Generate filename with timestamp (e.g., `retro-games-edits-2025-12-25.json`)
- [ ] Trigger browser download using Blob/URL

### Phase 2: Import Functionality

- [ ] Implement `importEditsFromFile(file: File)` function
- [ ] Parse and validate JSON with Zod schema
- [ ] Handle version compatibility (reject if version unsupported)
- [ ] Merge or replace existing edits (user choice)

### Phase 3: Settings UI

- [ ] Add "Local Edits" section to System tab
- [ ] Show count of modified cards
- [ ] Add Export button with download handler
- [ ] Add Import button with file picker
- [ ] Add "Revert All Edits" button with confirmation

### Phase 4: Import Options Modal

- [ ] Create import options modal
- [ ] Show preview: "12 edits found"
- [ ] Option: Merge with existing / Replace all
- [ ] Confirm before applying

## Success Criteria

- [ ] Export creates downloadable JSON file
- [ ] Export filename includes collection ID and timestamp
- [ ] Import accepts valid JSON files
- [ ] Import rejects invalid/incompatible files with error message
- [ ] User can choose merge or replace on import
- [ ] Revert All clears all edits with confirmation

## Dependencies

- **F-049**: Entity Edits Store (`exportEdits()`, `importEdits()`)

## Complexity

**Small** - File I/O with JSON serialisation.

## Testing Strategy

- Unit test for export format
- Unit test for import validation
- Test round-trip (export → import)
- Test merge vs replace behaviour

---

## Related Documentation

- [F-049: Entity Edits Store](./F-049-entity-edits-store.md)
- [ADR-014: Entity Edit Architecture](../../decisions/adrs/ADR-014-entity-edit-architecture.md)

---

**Status**: Planned
