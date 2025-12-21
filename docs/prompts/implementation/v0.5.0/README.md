# v0.5.0 Implementation Prompt - Visual Overhaul & Navigation

**Version:** v0.5.0
**Codename:** Visual Overhaul & Navigation
**Branch:** `feature/v0.5.0-visual-overhaul`

## Overview

Comprehensive UI/UX overhaul covering card visuals, detailed view animations, navigation system, and settings reorganisation.

---

## Phase 1: Schema & Data Changes

### 1.1 Update Card Schema
**File:** `src/schemas/cardData.schema.ts`

- Change `imageUrl?: string` to `imageUrls?: string[]` (array for gallery)
- Keep backward compatibility: if single URL provided, wrap in array
- Add validation for URL format

### 1.2 Update Collection Hook
**File:** `src/hooks/useCollection.ts`

- Handle `imageUrls` array in `DisplayCard` interface
- Fallback: `card.imageUrls?.[0]` for primary image
- Generate placeholder array if no images provided

---

## Phase 2: Card Front Redesign

### 2.1 Rank Badge Component
**New File:** `src/components/RankBadge/RankBadge.tsx`

- Position: Top-left corner (prominent)
- Styles:
  - Rank 1: Gold background + crown icon
  - Rank 2: Silver background
  - Rank 3: Bronze background
  - Rank 4+: Neutral with number
  - Null/unranked: Configurable placeholder text (default: "The one that got away!")
- Props: `rank: number | null`, `placeholderText?: string`

### 2.2 Device Badge Component
**New File:** `src/components/DeviceBadge/DeviceBadge.tsx`

- Position: Bottom-right corner (rounded corners)
- Display: Category title as text badge (e.g., "Switch", "VCS2600")
- Style: Subtle, semi-transparent background
- Props: `device: string`

### 2.3 Update CardFront
**File:** `src/components/Card/CardFront.tsx`

- Remove category badge from top-left (replaced by rank)
- Add RankBadge to top-left
- Move info button to top-right (make more legible - larger, better contrast)
- Add DeviceBadge to bottom-right
- Image priority: `card.imageUrls?.[0]` → device image → colour placeholder

### 2.4 Info Button Redesign
**File:** `src/components/Card/Card.module.css`

- Increase size (32px → 40px)
- Better contrast (solid background instead of glassmorphism)
- Always visible (not just on hover)
- Position: absolute top-right with padding

---

## Phase 3: Card Back & Draggable Enhancement

### 3.1 Fix iPad/Touch Drag Support
**File:** `src/components/DraggableCardGrid/DraggableCardGrid.tsx`

Current issue: Drag and drop not working on iPad.

Fix:
- Add `TouchSensor` from `@dnd-kit/core` alongside `PointerSensor`
- Configure touch activation constraint (delay: 250ms for long-press)
- Prevent scroll interference during drag
- Add `touch-action: none` CSS for drag handles

```typescript
import { TouchSensor } from "@dnd-kit/core";

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

### 3.2 Draggable Card Back
**File:** `src/components/DraggableCardGrid/DraggableCardGrid.tsx`

- When drag mode enabled, make entire card draggable (not just handle)
- Maintain click-to-flip functionality:
  - Short click (< 200ms) = flip
  - Long press / drag motion = drag
- Use pointer sensor with delay activation constraint

### 3.3 Visual Drag Feedback
**File:** `src/components/DraggableCardGrid/DraggableCardGrid.module.css`

- Show drag cursor on entire card when drag mode on
- Subtle scale on hover to indicate draggability
- Add `touch-action: none` to prevent scroll during drag

---

## Phase 4: Detailed Card View (Expand Animation)

### 4.1 New Expanded Card Component
**New File:** `src/components/CardExpanded/CardExpanded.tsx`

Features:
- Animate from original card position to centre screen
- Blurred/dimmed background (non-interactive)
- Image gallery with left/right navigation + dots indicator
- Rank display (playful, theme-selectable: text/emoji/graphic)
- "View More" button in bottom-right (external link)
- "More details" icon in bottom-left (expand for additional attributes)
- Only show "more" icon if additional metadata exists

### 4.2 Image Gallery Component
**New File:** `src/components/ImageGallery/ImageGallery.tsx`

- Left/right arrow buttons on image (desktop)
- Dot indicators at bottom
- **Swipe gesture support for iPad/touch devices:**
  - Use `useTouchGestures` hook (already exists)
  - Swipe left = next image
  - Swipe right = previous image
  - Smooth CSS transition between images
  - Threshold: 50px swipe distance to trigger
- Props: `images: string[]`, `currentIndex`, `onChange`

### 4.3 Animation System
**File:** `src/components/CardExpanded/CardExpanded.tsx`

- Use Framer Motion `layoutId` for shared element transition
- Calculate start position from card's DOM rect
- Animate to centre with scale
- Background blur transition (0 → 8px)

### 4.4 Rank Display Themes
**New File:** `src/components/RankDisplay/RankDisplay.tsx`

- Theme options: text, emoji, graphic
- Text: "1st Place", "2nd Place"
- Emoji: "🥇", "🥈", "🥉", "4️⃣"
- Graphic: Medal/trophy SVG icons
- Configurable via theme settings

---

## Phase 5: Navigation - Admin Button

### 5.1 Floating Admin Button
**New File:** `src/components/AdminButton/AdminButton.tsx`

- Floating button (bottom-right or configurable position)
- Toggle visibility with Ctrl+A
- Gear/cog icon
- Opens SettingsPanel when clicked
- Animate in/out (fade + scale)

### 5.2 Header Toggle
**File:** `src/App.tsx`

- Ctrl+A toggles:
  1. Admin button visibility
  2. TanStack Query devtools
- Header animation: slide down from top when visible

### 5.3 Keyboard Shortcut Hook
**New File:** `src/hooks/useGlobalKeyboard.ts`

- Register global keyboard shortcuts
- Ctrl+A: Toggle admin mode
- Escape: Close modals/overlays
- /: Focus search (future)

---

## Phase 6: Navigation - Search & Explorer

### 6.1 Floating Search Button
**New File:** `src/components/SearchButton/SearchButton.tsx`

- Replace red MenuButton with prominent search icon
- Position: Top-left (floating)
- Click: Expand to search bar
- Animation: Button morphs into search input

### 6.2 Search Bar Component
**New File:** `src/components/SearchBar/SearchBar.tsx`

- Expands from SearchButton
- Text input for dynamic filtering
- Explorer icon button inside bar
- Close button to collapse back
- Real-time filtering as user types

### 6.3 Explorer Sidebar
**File:** `src/components/Sidebar/Sidebar.tsx` (major refactor)

- Trigger: Explorer icon in SearchBar
- On open: Temporarily flip all cards to front
- Filter controls:
  - Category checkboxes
  - Rank range slider
  - Year range
  - Device/platform filter
- Footer buttons: "Apply Filters" / "Just Browsing"
- On close with "Just Browsing": Reset to previous state
- On close with "Apply Filters": Keep filters active

### 6.4 Filter State Management
**File:** `src/stores/filterStore.ts` (new or extend layoutStore)

- `explorerOpen: boolean`
- `previousFlipState: string[]` (card IDs that were flipped)
- `tempFilters` vs `appliedFilters`
- `applyFilters()` and `resetFilters()` actions

---

## Phase 7: Settings Reorganisation

### 7.1 Tabbed Settings Panel
**File:** `src/components/SettingsPanel/SettingsPanel.tsx`

Reorganise into tabs:

**Tab 1: System**
- Refresh button
- Dark/Light/Auto theme toggle
- TanStack devtools toggle

**Tab 2: Theme**
- Visual theme selector (Retro/Modern/etc.)
- Layout mode (Grid/List/Compact)
- Card back style: Bitmap/SVG/Colour

**Tab 3: Behaviour**
- Shuffle on load toggle
- Drag to reorder toggle
- Sort parameter (when shuffle off)

**Tab 4: Card**
- General: Card size sliders
- Background: Parameter toggles (year, etc.)
- Front: Footer style, title display
- Rank placeholder text input

### 7.2 Visual Themes System
**New File:** `src/styles/themes/`

Create theme files:
- `retro.css` - Pixelated fonts, sharp corners, CRT effects
- `modern.css` - Clean fonts, rounded corners, smooth shadows
- `minimal.css` - No borders, subtle colours

Each theme defines:
- Font families
- Border radii
- Shadow styles
- Animation curves
- Colour accents

---

## Phase 8: Settings Persistence

### 8.1 Update Settings Store
**File:** `src/stores/settingsStore.ts`

Add new settings:
- `visualTheme: 'retro' | 'modern' | 'minimal'`
- `rankDisplayStyle: 'text' | 'emoji' | 'graphic'`
- `cardBackStyle: 'bitmap' | 'svg' | 'colour'`
- `rankPlaceholderText: string`
- `showDeviceBadge: boolean`
- `showRankBadge: boolean`

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/RankBadge/` | Rank badge with crown/medal |
| `src/components/DeviceBadge/` | Device text badge |
| `src/components/CardExpanded/` | Animated detail view |
| `src/components/ImageGallery/` | Multi-image carousel |
| `src/components/RankDisplay/` | Themed rank display |
| `src/components/AdminButton/` | Floating admin toggle |
| `src/components/SearchButton/` | Floating search trigger |
| `src/components/SearchBar/` | Expandable search input |
| `src/hooks/useGlobalKeyboard.ts` | Global shortcuts |
| `src/stores/filterStore.ts` | Explorer filter state |
| `src/styles/themes/*.css` | Visual theme files |

## Files to Modify

| File | Changes |
|------|---------|
| `src/schemas/cardData.schema.ts` | `imageUrls` array |
| `src/hooks/useCollection.ts` | Handle image arrays |
| `src/components/Card/CardFront.tsx` | New badge layout |
| `src/components/Card/Card.module.css` | Info button styles |
| `src/components/DraggableCardGrid/` | Full card drag |
| `src/components/Sidebar/Sidebar.tsx` | Explorer mode |
| `src/components/SettingsPanel/` | Tabbed layout |
| `src/stores/settingsStore.ts` | New settings |
| `src/App.tsx` | Admin toggle, search |

---

## Implementation Order

1. **Fix iPad drag & drop** (critical bug fix)
2. **Schema changes** (foundation - imageUrls array)
3. **RankBadge & DeviceBadge** (visual components)
4. **CardFront redesign** (integrate badges)
5. **Draggable enhancement** (full card drag + click-to-flip)
6. **CardExpanded & ImageGallery** (detail view with swipe)
7. **AdminButton & keyboard shortcuts** (navigation)
8. **SearchButton & SearchBar** (search)
9. **Explorer sidebar** (filtering)
10. **Settings reorganisation** (tabbed configuration)
11. **Visual themes** (polish)

---

## Success Criteria

- [ ] **iPad drag & drop works** (TouchSensor configured)
- [ ] Rank badge shows with gold/silver/bronze for top 3
- [ ] Device badge appears in bottom-right
- [ ] Info button is prominent and always visible
- [ ] Entire card draggable when drag mode on (with click-to-flip preserved)
- [ ] Cards expand from position with blur background
- [ ] Image gallery works with multiple images + swipe on iPad
- [ ] Ctrl+A toggles admin button
- [ ] Search expands from floating button
- [ ] Explorer flips cards and provides filters
- [ ] "Apply Filters" vs "Just Browsing" options work correctly
- [ ] Settings organised in tabs (System, Theme, Behaviour, Card)
- [ ] Visual themes change fonts/borders/shadows
- [ ] All tests pass
- [ ] Build succeeds

---

## Related Documentation

- [v0.5.0 Milestone](../../development/roadmap/milestones/v0.5.0.md)
- [Card UI Design Patterns Research](../../development/research/card-ui-design-patterns.md)
- [Touch Gestures Hook](../../../src/hooks/useTouchGestures.ts)

---

**Status**: Ready for implementation
