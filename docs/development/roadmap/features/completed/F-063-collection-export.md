# F-063: Collection Export

## Problem Statement

Users cannot backup, share, or analyse their collection data externally:

1. **No backup** - Data stuck in browser/app
2. **No sharing** - Cannot share collection with others
3. **No analysis** - Cannot use external tools (spreadsheets)
4. **No portability** - Cannot move data between systems

## Design Approach

Add client-side export functionality with multiple format options.

### Export Dialogue

```
┌─────────────────────────────────────────────────────────────┐
│ Export Collection                                     [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Format:                                                     │
│ ● JSON (complete data, reimportable)                        │
│ ○ CSV (spreadsheet compatible)                              │
│ ○ Markdown (human readable)                                 │
│                                                             │
│ Include:                                                    │
│ ☑ All fields                                                │
│ ☐ Only visible fields                                       │
│ ☐ Include images (base64, large file)                       │
│ ☑ Include local edits                                       │
│                                                             │
│ Filter:                                                     │
│ ● All items (124)                                           │
│ ○ Current view/filter (45)                                  │
│ ○ Selected items only (0)                                   │
│                                                             │
│ Filename: retro-games-2025-12-25                            │
│                                                             │
│                              [Cancel]  [Export ↓]           │
└─────────────────────────────────────────────────────────────┘
```

### Export Formats

**JSON Format:**
```json
{
  "exportVersion": 1,
  "exportedAt": "2025-12-25T12:00:00Z",
  "collectionId": "retro-games",
  "itemCount": 124,
  "items": [
    {
      "id": "super-metroid-snes",
      "title": "Super Metroid",
      "platform": "SNES",
      "year": 1994,
      "...": "..."
    }
  ]
}
```

**CSV Format:**
```csv
id,title,platform,year,summary
super-metroid-snes,Super Metroid,SNES,1994,"A side-scrolling..."
legend-of-zelda-nes,The Legend of Zelda,NES,1986,"An action-adventure..."
```

**Markdown Format:**
```markdown
# Retro Games Collection

Exported: 2025-12-25

## Items (124)

### Super Metroid
- **Platform:** SNES
- **Year:** 1994
- **Summary:** A side-scrolling...

### The Legend of Zelda
- **Platform:** NES
- **Year:** 1986
...
```

## Implementation Tasks

### Phase 1: Export Core

- [x] Create `src/lib/collectionExport.ts`
- [x] Implement `exportToJSON()` function
- [x] Implement `exportToCSV()` function
- [x] Implement `exportToMarkdown()` function
- [x] Trigger browser download using Blob/URL

### Phase 2: Export UI

- [x] Format selection dropdown in StorageSettingsTabs
- [x] JSON/CSV/Markdown options
- [x] Export button triggers download

### Phase 3: Settings Integration

- [x] Export section in Storage > Images sub-tab
- [x] Format selector + export button

### Phase 4: Field Selection

- [ ] Detect all available fields from schema (deferred)
- [ ] Allow selecting specific fields to export (deferred)
- [ ] Remember last field selection (deferred)

### Phase 5: Filter Integration

- [x] Export all items
- [ ] Export current filtered view (deferred)
- [ ] Export selected items (deferred)

### Phase 6: Local Edits Integration

- [ ] Option to include local edits (deferred - F-049 not implemented)
- [ ] Merge edits into exported data (deferred)
- [ ] Mark edited fields (deferred)

## Success Criteria

- [x] JSON export creates valid, complete file
- [x] CSV export opens correctly in Excel/Sheets
- [x] Markdown export is human readable
- [x] Filename includes collection name
- [ ] Filter options work correctly (partial - all items only)
- [ ] Local edits can be included/excluded (deferred)

## Dependencies

- **F-049**: Entity Edits Store (for including edits)
- **Existing**: Collection data from hooks

## Complexity

**Medium** - Multiple formats with options UI.

## Testing Strategy

- Unit tests for each export format
- Test CSV escaping (quotes, commas)
- Test Markdown formatting
- Test with special characters in data
- Test export/import round-trip (JSON)

---

## Related Documentation

- [F-062: Collection Statistics Summary](./F-062-collection-statistics.md)
- [F-052: Edit Export/Import](./F-052-edit-export-import.md)

---

**Status**: Complete
