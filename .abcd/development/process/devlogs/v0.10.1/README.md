# v0.10.1 Development Log

## Overview

v0.10.1 is a bug-fix release addressing UI polish issues discovered after the v0.10.0 edit mode implementation. This release focused on improving visual consistency, fixing keyboard interaction bugs, and simplifying the edit tracking data model.

## Implementation Narrative

### Session Focus: UI Polish and Data Model Refinement

This session began as a continuation of v0.10.0 bug fixes but evolved into a deeper refactoring of how edit metadata is tracked and displayed.

### Issue 1: Gallery Rounded Corners Artefact

**Problem:** Image gallery showed visible artefacts where images appeared outside the rounded container corners. Screenshots revealed black/dark rectangular areas extending past the rounded border-radius.

**Root Cause:** The `.gallery` element in `ImageGallery.module.css` was setting its own `border-radius` value, which conflicted with the parent container's `border-radius: X X 0 0` (top corners only).

**Solution:** Changed `.gallery` to use `border-radius: inherit` so it respects the parent's specific corner rounding configuration.

```css
.gallery {
  border-radius: inherit;  /* Was: fixed value */
}
```

### Issue 2: Attribution Label Pluralisation

**Problem:** The image source attribution showed "Image Source" even when multiple images were displayed from the same source.

**Solution:** Added dynamic pluralisation in `CardExpanded.tsx`:

```tsx
{card.imageUrls.length > 1
  ? uiLabels.imageSourceLabel
      .replace(/^Image\b/i, "Images")
      .replace(/\bSource$/i, "Sources")
  : uiLabels.imageSourceLabel}
```

### Issue 3: Spacebar Not Working in EditForm

**Problem:** Users couldn't type spaces in textarea fields within the EditForm component. Text like "A decent game" would appear as "Adecentgame".

**Investigation:** Checked multiple keyboard handlers across the codebase:
- `useGlobalKeyboard.ts` - correctly skips input elements
- `App.tsx` - no Space handler
- `CardExpanded.tsx` - only Escape handler
- `ImageGallery.tsx` - window-level keydown for arrow navigation

**Root Cause:** Keyboard events were bubbling from the EditForm portal to parent components that had keyboard handlers.

**Solution:** Added `onKeyDown` handler to EditForm overlay that stops propagation:

```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === "Escape") return;  // Let escape bubble
  e.stopPropagation();  // Stop all other keys
}, []);
```

Also added input element detection to `ImageGallery.tsx` keyboard handler as a precaution.

### Issue 4: Verdict Text Overflow

**Problem:** Long verdict text (e.g., "The one that got away!") could extend too close to or overlap with the info section.

**Solution:** Added CSS line clamping to `.attributionText`:

```css
.attributionText {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Issue 5: Raw Edit Metadata in "More" Overlay

**Problem:** The "More" overlay displayed raw edit tracking fields:
- `EDITED AT: 1766751198970` (raw timestamp)
- `HAS EDITS: Yes` (redundant boolean)

**Initial Approach:** Added these fields to `SKIP_FIELDS` in `entityFields.ts`.

**Data Model Refinement:** Through discussion, we simplified the approach:

1. **Removed `_hasEdits` field** - Redundant when `_editedAt` presence indicates edits exist
2. **Single field `_editedAt`** - Serves dual purpose: presence indicates edits, value is timestamp
3. **Formatted display** - Footer shows "Edited 26 Dec 2025" in italics

**Files Modified:**
- `CollectionDataContext.tsx` - Simplified merge to only add `_editedAt`
- `CardExpanded.tsx` - Read `_editedAt` from card data, format as date
- `CardExpanded.module.css` - Added `.moreFooter` and `.editedTimestamp` styles
- `entityFields.ts` - Added `editedAt`, `hasEdits`, `_editedAt`, `_hasEdits` to skip list

### Test Fix

**Pre-existing Bug:** Test expected default theme "retro" but store default is "modern".

**Fix:** Updated test expectation to match actual store default.

### Data Addition: Hall of Light Resources

**Task:** Add Hall of Light (amiga.abime.net) data to "It came from the Desert" item.

**Changes to `it-came-from-the-desert-amiga.json`:**

1. Added new detailUrl entry:
```json
{
  "url": "https://amiga.abime.net/games/view/it-came-from-the-desert",
  "source": "Hall of Light"
}
```

2. Added screenshot image:
```json
{
  "url": "https://amiga.abime.net/screen/2601-2700/2674_screen0.png?v=5291",
  "type": "screenshot",
  "attribution": {
    "source": "Hall of Light",
    "sourceUrl": "https://amiga.abime.net/games/view/it-came-from-the-desert"
  },
  "alt": "It came from the Desert screenshot"
}
```

This enriches the item with an additional authoritative source (Hall of Light is the premier Amiga games database) and provides a gameplay screenshot alongside the existing boxart.

## Files Modified

| File | Changes |
|------|---------|
| `src/components/ImageGallery/ImageGallery.module.css` | `border-radius: inherit` |
| `src/components/ImageGallery/ImageGallery.tsx` | Input element check for keyboard handler |
| `src/components/CardExpanded/CardExpanded.tsx` | Plural labels, edit date display, removed editsStore import |
| `src/components/CardExpanded/CardExpanded.module.css` | Text clipping, footer styles |
| `src/components/EditForm/EditForm.tsx` | Keyboard event propagation fix |
| `src/context/CollectionDataContext.tsx` | Simplified edit merge (only `_editedAt`) |
| `src/utils/entityFields.ts` | Added edit tracking fields to SKIP_FIELDS |
| `tests/stores/settingsStore.config.test.ts` | Fixed theme default expectation |
| `package.json` | Version bump to 0.10.1 |
| `public/data/retro-games/games/it-came-from-the-desert-amiga.json` | Added Hall of Light detailUrl and screenshot |

## Technical Insights

### CSS Inheritance for Nested Borders

When a child element needs to respect a parent's specific border configuration (e.g., top corners only), use `border-radius: inherit` rather than setting a fixed value. This ensures the child clips correctly regardless of the parent's configuration.

### Event Propagation in React Portals

React Portals render outside the DOM hierarchy but maintain React's event bubbling. When a modal/overlay needs isolated keyboard handling, use `stopPropagation()` on the overlay container to prevent events from reaching parent handlers.

### Data Model Simplicity

When tracking state, avoid redundant fields. A single timestamp field (`_editedAt`) can serve multiple purposes:
- **Existence check:** `if (_editedAt)` indicates edits exist
- **Value:** The timestamp itself for display

This is simpler than maintaining separate `hasEdits` boolean and `editedAt` timestamp fields.

---

## Related Documentation

- [v0.10.1 Retrospective](../../retrospectives/v0.10.1/README.md)
- [v0.10.0 Devlog](../v0.10.0/README.md) - Parent milestone with edit mode implementation
