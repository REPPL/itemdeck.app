# v0.10.1 Implementation Prompt

## Overview

v0.10.1 is a bug-fix and polish release following v0.10.0 (Data Editing). It addresses UI issues, keyboard handling bugs, and data model refinements discovered after the edit mode implementation.

## Scope

### Bug Fixes

1. **Gallery Rounded Corners Artefact**
   - Images showing outside rounded container corners
   - Solution: Use `border-radius: inherit` in gallery CSS

2. **Spacebar Not Working in EditForm**
   - Users cannot type spaces in textarea fields
   - Solution: Stop keyboard event propagation in EditForm overlay

3. **Image Source Attribution Pluralisation**
   - Shows "Image Source" even with multiple images
   - Solution: Dynamic pluralisation based on image count

4. **Verdict Text Overflow**
   - Long verdict text overlaps info section
   - Solution: CSS line clamping (2 lines max)

5. **Raw Edit Metadata in "More" Overlay**
   - Shows `EDITED AT: 1766751198970` and `HAS EDITS: Yes`
   - Solution: Add to SKIP_FIELDS, simplify data model

### Data Model Refinement

Simplify edit tracking from two fields to one:

**Before:**
```typescript
{ _hasEdits: true, _editedAt: 1735234567890 }
```

**After:**
```typescript
{ _editedAt: 1735234567890 }  // Presence implies hasEdits
```

### Data Additions

Add Hall of Light (amiga.abime.net) resources to "It came from the Desert":
- Detail URL: `https://amiga.abime.net/games/view/it-came-from-the-desert`
- Screenshot image from Hall of Light

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ImageGallery/ImageGallery.module.css` | `border-radius: inherit` |
| `src/components/ImageGallery/ImageGallery.tsx` | Input element check for keyboard handler |
| `src/components/CardExpanded/CardExpanded.tsx` | Plural labels, edit date display |
| `src/components/CardExpanded/CardExpanded.module.css` | Text clipping, footer styles |
| `src/components/EditForm/EditForm.tsx` | Keyboard event propagation fix |
| `src/context/CollectionDataContext.tsx` | Simplified edit merge (only `_editedAt`) |
| `src/utils/entityFields.ts` | Add edit tracking fields to SKIP_FIELDS |
| `tests/stores/settingsStore.config.test.ts` | Fix theme default expectation |
| `package.json` | Version bump to 0.10.1 |
| `public/data/retro-games/games/it-came-from-the-desert-amiga.json` | Add Hall of Light URL and screenshot |

## Implementation Steps

1. Fix gallery rounded corners in CSS
2. Add event propagation stopping to EditForm
3. Implement dynamic pluralisation in CardExpanded
4. Add line clamping to verdict text
5. Add edit tracking fields to SKIP_FIELDS
6. Simplify data model to single `_editedAt` field
7. Add edit date display in CardExpanded footer
8. Fix test expectation for theme default
9. Add Hall of Light data to "It came from the Desert"
10. Bump version in package.json

## Success Criteria

- [ ] Gallery images clip correctly within rounded corners
- [ ] Spacebar works in all EditForm text inputs
- [ ] Multiple images show "Images Sources" (plural)
- [ ] Long verdict text truncates with ellipsis
- [ ] No raw edit metadata visible in "More" overlay
- [ ] Edit date displays as "Edited DD MMM YYYY"
- [ ] All 450 tests pass
- [ ] TypeScript compiles without errors
- [ ] Hall of Light appears in detailUrls and images

## Technical Notes

### CSS Inheritance for Nested Borders

Use `border-radius: inherit` when child elements need to respect parent's specific corner configuration:

```css
.parent { border-radius: 12px 12px 0 0; }  /* Top only */
.child { border-radius: inherit; }          /* Respects parent */
```

### React Portal Event Bubbling

Portals maintain React's synthetic event bubbling despite rendering outside DOM hierarchy. Stop propagation on overlay container:

```tsx
<div onKeyDown={(e) => {
  if (e.key !== "Escape") e.stopPropagation();
}}>
```

---

## Related Documentation

- [v0.10.1 Devlog](../../../development/process/devlogs/v0.10.1/README.md)
- [v0.10.1 Retrospective](../../../development/process/retrospectives/v0.10.1/README.md)
- [v0.10.0 Milestone](../../../development/roadmap/milestones/v0.10.md)
