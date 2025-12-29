# v0.10.0 Implementation Plan - Data Editing

## Overview

**Version**: v0.10.0 - Data Editing
**Theme**: Enable users to modify entity data locally with overlay store pattern
**Pre-requisites**: v0.9.0 (Remote Source Intelligence) ✅ Complete

This plan addresses:
- All 5 core v0.10.0 features (F-048 to F-052)
- Outstanding debt from v0.9.0 retrospective (coverage, testing)
- Documentation drift fixes
- Full testing, documentation, and release workflow

---

## Phase 0: Pre-v0.10.0 Cleanup

### 0.1 Fix Documentation Drift

The following documentation is out of sync with implementation:

**Milestones README** (`docs/development/roadmap/milestones/README.md`):
- v0.9.0 shows "📋 Planned" but is complete → Change to "✅ Complete"

**Planned Features README** (`docs/development/roadmap/features/planned/README.md`):
- Still lists v0.9.0 features (F-045, F-046, F-047) as planned
- Still lists v0.6.1 features (F-042, F-043, F-044) as planned
- Remove these sections as features are now in completed/

### 0.2 Test Coverage Restoration

v0.9.0 retrospective identified coverage dropped from ~48% to ~21%. Add missing tests:

**Priority 1 - v0.9.0 Services**:
- `tests/services/sourceHealthCheck.test.ts` - Test healthy, degraded, unreachable, invalid
- `tests/services/collectionDiscovery.test.ts` - Test manifest parsing, fallback

**Priority 2 - v0.9.0 Stores**:
- `tests/stores/sourceStore.test.ts` - Test add/remove/active/default

**Priority 3 - v0.9.0 Utilities**:
- `tests/utils/collectionStats.test.ts` - Test statistics computation

**Priority 4 - v0.9.0 Components**:
- `tests/components/StatisticsBar.test.tsx` - Test rendering, dismissal
- `tests/components/SourceManager.test.tsx` - Test source list, add form
- `tests/components/CollectionBrowser.test.tsx` - Test collection cards

**Target**: Restore coverage to ≥48%

### 0.3 Deferred Items from Retrospectives

**From v0.9.0 retrospective**:
- [ ] Recipe demo collection (proves generalisation) - DEFER to v0.11.0
- [ ] Index file automation - DEFER to v0.11.0
- [ ] F-041 Card animations polish - DEFER to v0.11.0

**Rationale**: Focus v0.10.0 on core Data Editing features. These additions don't block Data Editing and can be implemented in parallel with Mechanics Foundation (v0.11.0).

---

## Phase 1: Edit Mode Toggle (F-048)

**Complexity**: Small
**Dependencies**: settingsStore, SettingsPanel

### 1.1 Store Update

**File**: `src/stores/settingsStore.ts`

```typescript
// Add to state interface
editModeEnabled: boolean;

// Add action
setEditModeEnabled: (enabled: boolean) => void;

// Add to initial state
editModeEnabled: false,

// Add version migration to v17
if (persistedState.version < 17) {
  migratedState.editModeEnabled = false;
  migratedState.version = 17;
}
```

### 1.2 Settings UI

**File**: `src/components/SettingsPanel/SystemSettingsTab.tsx` (create if needed)

Add "Edit Mode" section:
- Toggle switch with label "Enable editing"
- Description: "Allow modifying entity data"
- Info text: "Changes are saved locally only. Export edits to backup."

### 1.3 Visual Indicator

**New file**: `src/components/EditModeIndicator/EditModeIndicator.tsx`

- Show "✎ Edit Mode" badge in header when active
- Amber/yellow colour
- Click to open settings

**File**: `src/App.tsx`
- Add EditModeIndicator to header area

### 1.4 Keyboard Shortcut

**File**: `src/hooks/useGlobalKeyboard.ts`

Add handler for `E` key:
- Toggle editModeEnabled
- Ignore when focused on input/textarea
- Show toast notification: "Edit mode enabled/disabled"

### 1.5 Tests

**New file**: `tests/stores/settingsStore.editMode.test.ts`
- Test toggle action
- Test persistence
- Test migration

**New file**: `tests/components/EditModeIndicator.test.tsx`
- Test visibility based on setting
- Test click handler

---

## Phase 2: Entity Edits Store (F-049)

**Complexity**: Medium
**Dependencies**: Zustand, useCollection

### 2.1 Store Creation

**New file**: `src/stores/editsStore.ts`

```typescript
interface EntityEdit {
  fields: Record<string, unknown>;
  editedAt: number;
}

interface EditsState {
  edits: Record<string, EntityEdit>;

  // Actions
  setField: (entityId: string, field: string, value: unknown) => void;
  setFields: (entityId: string, fields: Record<string, unknown>) => void;
  revertField: (entityId: string, field: string) => void;
  revertEntity: (entityId: string) => void;
  revertAll: () => void;

  // Export/Import
  exportEdits: () => ExportedEdits;
  importEdits: (data: ExportedEdits, mode: 'merge' | 'replace') => void;
}
```

Use persist middleware with key `itemdeck-edits`.

### 2.2 Selectors

Add selectors to store:
```typescript
getEdit: (entityId: string) => EntityEdit | undefined;
hasEdits: (entityId: string) => boolean;
getEditedEntityIds: () => string[];
getTotalEditCount: () => number;
```

### 2.3 Collection Hook Integration

**File**: `src/hooks/useCollection.ts`

Modify to merge edits with source data:
```typescript
const { edits } = useEditsStore();

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

### 2.4 Tests

**New file**: `tests/stores/editsStore.test.ts`
- Test all actions
- Test persistence
- Test selectors
- Test export/import round-trip

---

## Phase 3: Edit Form Component (F-050)

**Complexity**: Medium
**Dependencies**: F-048, F-049

### 3.1 Form Component

**New files**:
- `src/components/EditForm/EditForm.tsx`
- `src/components/EditForm/EditForm.module.css`
- `src/components/EditForm/index.ts`

Implement controlled form with fields:
- Title (text, required)
- Year (number, optional, 1900-2100)
- Summary (textarea, optional)
- My Verdict (textarea, optional)
- My Rank (number, optional, ≥1)

### 3.2 Field Components

**New files**:
- `src/components/EditForm/EditFormField.tsx` - Text/number inputs
- `src/components/EditForm/EditFormTextarea.tsx` - Multiline text

### 3.3 Validation

Create Zod schema for editable fields:
```typescript
const editableFieldsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  year: z.number().min(1900).max(2100).optional(),
  summary: z.string().optional(),
  myVerdict: z.string().optional(),
  myRank: z.number().min(1).optional(),
});
```

Display inline error messages with ARIA attributes.

### 3.4 Modal Integration

- Wrap form in modal (reuse existing modal pattern)
- Close button (×) with Escape key handler
- Focus trap within modal
- Backdrop click to close (with unsaved warning if dirty)

### 3.5 Save Flow

- Save button calls `editsStore.setFields()`
- Close modal on success
- Show toast: "Changes saved"
- Cancel closes without saving

### 3.6 Tests

**New file**: `tests/components/EditForm.test.tsx`
- Test form rendering
- Test validation
- Test save flow
- Test cancel flow

---

## Phase 4: Edit Button Integration (F-051)

**Complexity**: Small
**Dependencies**: F-048, F-049, F-050

### 4.1 CardQuickActions Update

**File**: `src/components/Card/CardQuickActions.tsx`

Add Edit button:
- Conditionally render when `editModeEnabled`
- Use pencil icon (✎)
- `aria-label="Edit card"`
- onClick opens EditForm modal

### 4.2 CardExpanded Update

**File**: `src/components/Card/CardExpanded.tsx`

Add Edit button to footer:
- Conditionally render when `editModeEnabled`
- Position alongside existing action buttons

### 4.3 Modal State Management

**New file**: `src/hooks/useEditModal.ts`

```typescript
export function useEditModal() {
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);

  const openEdit = (entityId: string) => setEditingEntityId(entityId);
  const closeEdit = () => setEditingEntityId(null);

  return { editingEntityId, openEdit, closeEdit };
}
```

### 4.4 Edit Indicator on Cards

**File**: `src/components/Card/Card.tsx`

Add small pencil icon to cards with local edits:
- Check `hasEdits(card.id)`
- Show regardless of edit mode
- Tooltip: "This card has local edits"

### 4.5 Tests

**New file**: `tests/components/EditButton.test.tsx`
- Test visibility based on edit mode
- Test edit flow from CardQuickActions
- Test edit flow from CardExpanded

---

## Phase 5: Edit Export/Import (F-052)

**Complexity**: Small
**Dependencies**: F-049

### 5.1 Export Functionality

**New file**: `src/utils/editExport.ts`

```typescript
interface ExportedEdits {
  version: 1;
  exportedAt: string;
  collectionId: string;
  editCount: number;
  edits: Record<string, EntityEdit>;
}

export function exportEditsToFile(
  edits: Record<string, EntityEdit>,
  collectionId: string
): void {
  const data: ExportedEdits = {
    version: 1,
    exportedAt: new Date().toISOString(),
    collectionId,
    editCount: Object.keys(edits).length,
    edits,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = `${collectionId}-edits-${format(new Date(), 'yyyy-MM-dd')}.json`;

  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 5.2 Import Functionality

```typescript
export async function importEditsFromFile(file: File): Promise<ExportedEdits> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Validate with Zod
  const result = exportedEditsSchema.safeParse(data);
  if (!result.success) {
    throw new Error('Invalid edits file format');
  }

  if (result.data.version > 1) {
    throw new Error('Unsupported edits file version');
  }

  return result.data;
}
```

### 5.3 Settings UI

**File**: `src/components/SettingsPanel/SystemSettingsTab.tsx`

Add "Local Edits" section:
- Show count: "12 cards modified"
- Export button: triggers download
- Import button: opens file picker
- "Revert All Edits" button with confirmation dialogue

### 5.4 Import Options Modal

**New file**: `src/components/ImportEditsModal/ImportEditsModal.tsx`

- Show preview: "12 edits found"
- Radio options: "Merge with existing" / "Replace all"
- Confirm/Cancel buttons

### 5.5 Tests

**New file**: `tests/utils/editExport.test.ts`
- Test export format
- Test import validation
- Test round-trip

---

## Phase 6: Testing & Verification

### 6.1 Run All Tests

```bash
npm run test
npm run test:coverage
```

**Target**: All tests passing, coverage ≥48%

### 6.2 Type Check

```bash
npm run typecheck
```

**Target**: No TypeScript errors

### 6.3 Lint

```bash
npm run lint
```

**Target**: No lint errors

### 6.4 Manual Testing Checklist

- [ ] Edit mode toggle works in settings
- [ ] Edit mode toggle works with E key
- [ ] Visual indicator shows when edit mode active
- [ ] Edit button appears on card hover when edit mode on
- [ ] Edit button appears in expanded card when edit mode on
- [ ] Edit form opens with current values
- [ ] Form validation works (empty title blocked)
- [ ] Save updates card display
- [ ] Edits persist after page refresh
- [ ] Cards with edits show pencil indicator
- [ ] Export creates downloadable JSON file
- [ ] Import reads and applies edits
- [ ] Merge mode preserves existing edits
- [ ] Replace mode clears existing edits
- [ ] Revert All clears all edits with confirmation

---

## Phase 7: Documentation

### 7.1 Sync Documentation

Run `/sync-docs`:
- Verify feature specs match implementation
- Verify milestone status correct

### 7.2 Verify Documentation

Run `/verify-docs`:
- Check SSOT violations
- Check directory naming
- Check README coverage
- Check cross-references
- Check British English

### 7.3 PII Scan

Run `/pii-scan` on all staged files

### 7.4 Create Devlog

**New file**: `docs/development/process/devlogs/v0.10.0/README.md`

Document:
- Implementation narrative
- Challenges encountered
- Code highlights
- Files created/modified

### 7.5 Create Retrospective

**New file**: `docs/development/process/retrospectives/v0.10.0/README.md`

Document:
- What went well
- What could improve
- Lessons learned
- Decisions made
- Metrics

### 7.6 Update Feature Specs

Move to completed/:
- F-048-edit-mode-toggle.md
- F-049-entity-edits-store.md
- F-050-edit-form-component.md
- F-051-edit-button-integration.md
- F-052-edit-export-import.md

Tick all success criteria checkboxes.

### 7.7 Update Milestone

**File**: `docs/development/roadmap/milestones/v0.10.0.md`

- Tick all success criteria
- Update status to Complete
- Add implementation summary

### 7.8 Update Index Files

- `docs/development/process/devlogs/README.md` - Add v0.10.0
- `docs/development/process/retrospectives/README.md` - Add v0.10.0

---

## Phase 8: Release

### 8.1 Update Version

**File**: `package.json`

Change version: `0.9.0` → `0.10.0`

### 8.2 Final Verification

```bash
npm run build
npm run test
npm run lint
npm run typecheck
```

All must pass.

### 8.3 Git Commit

```bash
git add .
git commit -m "feat(v0.10.0): data editing

Features:
- F-048: Edit mode toggle with keyboard shortcut
- F-049: Entity edits store with overlay pattern
- F-050: Edit form component with validation
- F-051: Edit button integration in cards
- F-052: Edit export/import with merge support

Pre-v0.10.0 fixes:
- Fix documentation drift from v0.9.0
- Restore test coverage to 48%+
- Add tests for v0.9.0 services and stores

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 8.4 Create Tag

```bash
git tag -a v0.10.0 -m "v0.10.0: Data Editing

Features:
- Edit mode toggle with E keyboard shortcut
- Entity edits stored locally with overlay pattern
- Edit form for modifying card properties
- Edit buttons in card UI when edit mode active
- Export/import edits as JSON files

Technical:
- New editsStore with Zustand persist
- Integration with useCollection for merged display
- Form validation with Zod
- Focus trap and accessibility support"
```

### 8.5 Push

```bash
git push origin main --tags
```

---

## Files Summary

### New Files (~20)

| Category | Files |
|----------|-------|
| Stores | `editsStore.ts` |
| Hooks | `useEditModal.ts` |
| Components | `EditModeIndicator/*`, `EditForm/*`, `ImportEditsModal/*` |
| Utils | `editExport.ts` |
| Tests | `editsStore.test.ts`, `settingsStore.editMode.test.ts`, `EditModeIndicator.test.tsx`, `EditForm.test.tsx`, `EditButton.test.tsx`, `editExport.test.ts`, `sourceHealthCheck.test.ts`, `sourceStore.test.ts`, `collectionStats.test.ts` |

### Modified Files (~10)

| File | Changes |
|------|---------|
| `src/stores/settingsStore.ts` | Add editModeEnabled (v17 migration) |
| `src/hooks/useCollection.ts` | Merge edits with source data |
| `src/hooks/useGlobalKeyboard.ts` | Add E key handler |
| `src/components/Card/Card.tsx` | Add edit indicator |
| `src/components/Card/CardQuickActions.tsx` | Add edit button |
| `src/components/Card/CardExpanded.tsx` | Add edit button |
| `src/components/SettingsPanel/SettingsPanel.tsx` | Add edit mode section |
| `src/App.tsx` | Add EditModeIndicator |
| `docs/development/roadmap/milestones/README.md` | Fix v0.9.0 status |
| `docs/development/roadmap/features/planned/README.md` | Remove completed features |

---

## Implementation Order

1. **Phase 0** - Cleanup (docs drift, coverage restoration)
2. **Phase 1** - Edit Mode Toggle (F-048)
3. **Phase 2** - Entity Edits Store (F-049)
4. **Phase 3** - Edit Form Component (F-050)
5. **Phase 4** - Edit Button Integration (F-051)
6. **Phase 5** - Edit Export/Import (F-052)
7. **Phase 6** - Testing
8. **Phase 7** - Documentation
9. **Phase 8** - Release

---

## Success Criteria

### Core Features
- [ ] Edit mode toggleable from settings and keyboard
- [ ] Visual indicator shows when edit mode active
- [ ] Edits stored in localStorage with overlay pattern
- [ ] Edit form validates required fields
- [ ] Edit buttons appear when edit mode enabled
- [ ] Cards with edits show visual indicator
- [ ] Export produces valid JSON file
- [ ] Import validates and applies edits
- [ ] Merge and replace modes work correctly

### Quality
- [ ] All tests passing
- [ ] Coverage ≥48%
- [ ] No lint errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] No PII in committed files

### Documentation
- [ ] Devlog created
- [ ] Retrospective created
- [ ] Feature specs moved to completed
- [ ] Milestone marked complete
- [ ] Index files updated

---

**Status**: Ready for implementation
