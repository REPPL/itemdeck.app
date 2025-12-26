# F-066: View Mode Toggle

## Problem Statement

Different use cases benefit from different card display densities. The current grid view is optimised for visual browsing but less efficient for scanning large collections. Users need the ability to switch between view modes.

## Current State

The settings store **already includes** a `layout` type:
```typescript
export type LayoutType = "grid" | "list" | "compact";
```

However, only the grid view is currently implemented. This feature activates the list and compact modes.

## Design Approach

Implement three view modes with a toggle control near the search bar:

### View Mode Options

| Mode | Description | Use Case |
|------|-------------|----------|
| **Grid** | Current card layout with flip animation | Visual browsing, discovery |
| **List** | Horizontal rows with thumbnail + text | Scanning, quick review |
| **Compact** | Dense grid of small thumbnails | Large collections, overview |

### Grid Mode (Current)

```
[Card]  [Card]  [Card]  [Card]
[Card]  [Card]  [Card]  [Card]
```

### List Mode

```
┌─────────────────────────────────────────────────────────┐
│ [Thumb] Title                          Year | Platform  │
│         Summary text truncated...                       │
├─────────────────────────────────────────────────────────┤
│ [Thumb] Title                          Year | Platform  │
│         Summary text truncated...                       │
└─────────────────────────────────────────────────────────┘
```

### Compact Mode

```
[Img] [Img] [Img] [Img] [Img] [Img] [Img] [Img]
[Img] [Img] [Img] [Img] [Img] [Img] [Img] [Img]
```

Small thumbnails with title on hover.

### Toggle Control

```
┌────────────────────────────────┐
│ View: [▦ Grid] [≡ List] [⊞]   │
└────────────────────────────────┘
```

Segmented control or button group near search bar.

### Technical Implementation

**Utilise existing layout state (settingsStore.ts):**
```typescript
// Already exists
layout: LayoutType;  // 'grid' | 'list' | 'compact'
setLayout: (layout: LayoutType) => void;
```

**CardGrid.tsx conditional rendering:**
```typescript
if (layout === 'list') {
  return <CardListView cards={sortedCards} ... />;
}
if (layout === 'compact') {
  return <CardCompactView cards={sortedCards} ... />;
}
return <CardGridView cards={sortedCards} ... />;
```

## Implementation Tasks

- [ ] Create `CardListItem` component for list view
- [ ] Create `CardListItem.module.css` with row styling
- [ ] Create compact card variant (small thumbnail)
- [ ] Modify `CardGrid.tsx` to render based on `layout` state
- [ ] Add view mode toggle to search bar area
- [ ] Ensure consistent interactions across modes
- [ ] Maintain keyboard navigation in all modes
- [ ] Handle flip animation appropriately per mode
- [ ] Test responsive behaviour in all modes
- [ ] Ensure view toggle is accessible
- [ ] Write tests for view mode switching

## Success Criteria

- [ ] Grid mode works as current (no regression)
- [ ] List mode shows horizontal rows with details
- [ ] Compact mode shows dense thumbnail grid
- [ ] Toggle switches modes smoothly
- [ ] View preference persists to localStorage
- [ ] Keyboard navigation works in all modes
- [ ] Responsive layout in all modes
- [ ] Screen readers announce view mode changes

## Components

### New Components

**CardListItem:**
- Thumbnail (small, square)
- Title
- Subtitle (year, platform)
- Summary (truncated)
- Click to expand or flip

**CardCompactItem:**
- Small thumbnail only
- Title on hover (tooltip)
- Click to expand details

### Modified Components

**CardGrid:**
- Check `layout` state
- Render appropriate view component

## Dependencies

- **Uses**: Existing `layout` state in settingsStore
- **Uses**: Existing card data structures
- **Related**: F-036 Card Filtering, F-065 Card Grouping

## Complexity

Medium

## Milestone

v0.11.0

---

## Related Documentation

- [Card Filtering](./F-036-card-filtering.md)
- [Card Grouping](./F-065-card-grouping.md)
- [v0.11.0 Milestone](../../milestones/v0.11.0.md)

---

**Status**: Planned
