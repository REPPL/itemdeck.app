# v0.6.2 Implementation Prompt - Settings Restructure & Card Refinements

## Overview

v0.6.2 restructures the settings panel with a cleaner hierarchy, simplifies card displays, and introduces a Configuration tab that exposes collection-specific settings with user overrides.

---

## Settings Structure

### Main Tabs (3)

```
Settings
├── System          (app-wide settings - unchanged)
├── Theme           (visual appearance - uses sub-tabs)
│   ├── Retro       (theme-specific controls)
│   ├── Modern      (theme-specific controls)
│   └── Minimal     (theme-specific controls)
└── Cards           (renamed from "Card")
    ├── Layout      (renamed from "General")
    ├── Front       (card front face)
    ├── Back        (card back face)
    ├── Behaviour   (moved from top-level)
    └── Configuration (NEW - collection-specific)
```

### Detailed Settings by Tab

#### System Tab (unchanged)
- Refresh Data button
- Theme Mode (light/dark/auto)
- Reduce Motion (system/on/off)
- High Contrast toggle
- DevTools toggle

#### Theme Tab (restructured with sub-tabs)
Each theme (Retro/Modern/Minimal) becomes a sub-tab showing:
- Theme preview/description
- Theme-specific controls (border radius, shadow intensity, animation style, accent colour)

#### Cards > Layout (renamed from General)
| Setting | Type | Options | Notes |
|---------|------|---------|-------|
| Size | segmented | Small/Medium/Large | Existing |
| Aspect Ratio | segmented | 3:4 / 5:7 / 1:1 | Existing |
| Max Visible Cards | number | 1-N | Moved from Behaviour |
| Shuffle on Load | toggle | on/off | Moved from Behaviour |

#### Cards > Front
| Setting | Type | Options | Notes |
|---------|------|---------|-------|
| Footer Style | segmented | Dark/Light | Existing |
| Title Display | segmented | Truncate/Wrap | Max 2 lines |
| Show Image | toggle | on/off | NEW |
| Show Rank Badge | toggle | on/off | Existing |
| Show Footer Badge | toggle | on/off | Renamed from "Device Badge" |

#### Cards > Back
| Setting | Type | Options | Notes |
|---------|------|---------|-------|
| Display | segmented | Logo/None | Simplified (text removed) |

#### Cards > Behaviour (moved from top-level)
| Setting | Type | Options | Notes |
|---------|------|---------|-------|
| Drag to Reorder | segmented | None/Front/Back/Both | Replaces toggle + dragFace |

#### Cards > Configuration (NEW)
*Front Face Field Mapping:*
| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| Title Field | dropdown | "title" | Entity field paths |
| Subtitle Field | dropdown | "year" | Entity field paths |
| Badge Field | dropdown | "rank" | Entity field paths |
| Footer Badge Field | dropdown | "platform.title" | Entity field paths |
| Unranked Text | text input | "The one that got away!" | Moved from Front |

*Back Face Field Mapping:*
| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| Logo Field | dropdown | "platform.logoUrl" | Entity field paths |

---

## Card Display Changes

### Front Face Changes
| Element | Current | Change | Notes |
|---------|---------|--------|-------|
| Title | 1 line truncate | 2 lines + ellipsis | CSS update |
| Subtitle | Shows year | Unchanged | - |
| Secondary badge | Shows rating | **REMOVE** | User confirmed |
| Footer badge | Shows device | Rename to "Footer Badge" | Configurable |
| Rank badge | "★★★ 1st" | "1st ★★★" | Text before stars |

### Rank Badge Formatting
| Rank | Current | New |
|------|---------|-----|
| 1st | ★★★ 1st | 1st ★★★ (filled stars) |
| 2nd | ★★ 2nd | 2nd ☆☆ (empty stars) |
| 3rd | ★ 3rd | 3rd ☆ (empty star) |
| 4+ | 4th, 5th... | 4th, 5th... (no stars) |

### Back Face Changes
| Element | Current | Change | Notes |
|---------|---------|--------|-------|
| Logo | Shows platform | Add app logo fallback | Default when no platform logo |
| Title (verdict) | Shows | **REMOVE** | Text removed from back |
| Year text | Shows | **REMOVE** | Text removed from back |

### Expanded Card (Detail View)
| Section | Change | Implementation |
|---------|--------|----------------|
| Entity Fields | Auto-discover | Show all non-empty fields from entity |
| Layout | Adaptive | Minimal if few fields, grouped if many |
| Acknowledgement | Improve UX | Add close button + Source link to image page |

**Acknowledgement overlay improvements:**
- Add explicit close button (X icon) in top-right
- Add "Source" external link button to image page (Wikipedia File: page)
- Both buttons visible alongside attribution text

**Auto-discover logic:**
```typescript
// Skip these internal/display fields
const SKIP_FIELDS = [
  'id', '_resolved', 'images', 'imageUrl', 'imageUrls',
  'logoUrl', 'detailUrl', 'imageAttribution', 'metadata'
];

// Display remaining non-empty fields as label: value pairs
// Use field definitions from schema for labels
```

**Field Definitions (in collection.json schema):**
```json
"fields": {
  "playedSince": {
    "label": "Playing since",
    "type": "year"
  },
  "status": {
    "label": "Status",
    "type": "enum",
    "values": ["completed", "playing", "backlog", "abandoned"]
  },
  "rating": {
    "label": "My rating",
    "type": "number",
    "format": "stars"
  },
  "verdict": {
    "label": "Verdict",
    "type": "text"
  }
}
```

**Platform/Device Names (short vs long):**
```json
// In platforms.json entity
{
  "id": "switch",
  "title": "Nintendo Switch",
  "shortTitle": "Switch",
  "logoUrl": "..."
}
```

**Display logic:**
- Card footer badge (small): Use `shortTitle` if available, else `title`
- Expanded card details (large): Use full `title`
- Settings dropdowns: Use full `title`

**Display label resolution:**
1. Use field definition `label` from schema if defined
2. Fall back to title-cased field name (e.g., "playedSince" → "Played Since")

---

## Implementation Phases

### Phase 1: Card Visual Simplification
1. Remove `secondaryBadge` from CardFront.tsx
2. Remove `secondaryBadge` prop from Card.tsx
3. Remove `.overlaySecondaryBadge` CSS
4. Remove `title` and `text` display from CardBack.tsx (keep logo only)
5. Add app logo fallback to CardBack when no platform logo
6. Update title CSS: `-webkit-line-clamp: 2` with ellipsis
7. Update RankBadge: text before stars, empty stars (☆) for 2nd/3rd

### Phase 2: Settings Restructure - Cards Tab
1. Rename "Card" → "Cards" in SettingsPanel.tsx
2. Rename "General" → "Layout" in CardSettingsTabs.tsx
3. Add "Behaviour" and "Configuration" sub-tabs
4. Move `maxVisibleCards` and `shuffleOnLoad` to Layout sub-tab
5. Create Behaviour sub-tab with combined drag control
6. Create Configuration sub-tab with field dropdowns

### Phase 3: Theme Tab Restructure
1. Create ThemeSettingsTabs.tsx component
2. Implement Retro/Modern/Minimal sub-tabs
3. Add theme-specific controls to each sub-tab
4. Remove current theme cards implementation

### Phase 4: Drag Behaviour Update
1. Replace `dragModeEnabled` + `dragFace` with single `dragMode`: `"none" | "front" | "back" | "both"`
2. When `dragMode === "none"`, hide all drag UI
3. Update DraggableCardGrid to respect new setting
4. Migrate settings store with version bump

### Phase 5: Configuration Tab Implementation
1. Add `configOverrides` to settings store
2. Create ConfigurationSubTab.tsx component
3. Scan DisplayCard for available field paths
4. Create dropdown selectors for field mapping
5. Move `rankPlaceholderText` to Configuration

### Phase 6: Expanded Card Auto-Discovery
1. Add `fields` definition to collection.json schema
2. Add `shortTitle` to platform entities in demo data
3. Create `getDisplayableFields()` utility
4. Create `getFieldLabel()` utility (uses schema labels or title-case fallback)
5. Update CardExpanded to use auto-discovered fields
6. Implement smart value formatting (dates, arrays, objects, stars for ratings)
7. Create adaptive layout (few fields vs many fields)
8. Improve acknowledgement overlay: add close button + Source link to image page
9. Use `shortTitle` for card footer badge, `title` for expanded view

### Phase 7: Help Button & Keyboard Shortcuts
1. Add help button (?) above settings gear icon in UI
2. Create HelpModal component with keyboard shortcuts
3. Document all keyboard shortcuts in modal

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `Enter` / `Space` | Flip focused card |
| `←` / `→` | Navigate between cards |
| `↑` / `↓` | Navigate grid rows |
| `Escape` | Close expanded card / settings |
| `?` | Open help modal |
| `S` | Toggle settings panel |
| `R` | Shuffle cards |

### Phase 8: Small Card Size Fixes
1. Hide unranked badge entirely on small cards (don't show "The one that got away" if no space)
2. Remove secondary badge (rating numbers) from footer - already covered in Phase 1
3. Title: wrap text but enforce max 2 lines with ellipsis
4. Use `shortTitle` for device badge (e.g., "GBA" instead of "GAME BOY")

### Phase 9: Cleanup
1. Remove orphaned TODO comment in MenuButton.tsx (line 12)
2. Remove any remaining search overlay references

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/SettingsPanel/ThemeSettingsTabs.tsx` | Theme sub-tabs |
| `src/components/SettingsPanel/ThemeSettingsTabs.module.css` | Theme sub-tab styles |
| `src/components/SettingsPanel/ConfigurationSubTab.tsx` | Configuration sub-tab |
| `src/components/HelpModal/HelpModal.tsx` | Keyboard shortcuts modal |
| `src/components/HelpModal/HelpModal.module.css` | Help modal styles |
| `src/utils/entityFields.ts` | Field discovery utility |
| `src/types/fieldDefinition.ts` | Field definition types |

## Files to Modify

### Schema/Data Files
| File | Changes |
|------|---------|
| `public/data/demo/collection.json` | Add `fields` definitions for entity fields |
| `src/types/schema.ts` | Add FieldDefinition interface |
| `src/loaders/collectionLoader.ts` | Load and expose field definitions |

### Components
| File | Changes |
|------|---------|
| `src/components/Card/Card.tsx` | Remove secondaryBadge handling |
| `src/components/Card/CardFront.tsx` | Remove secondaryBadge, rename device → footer badge |
| `src/components/Card/CardBack.tsx` | Remove title/text, add logo fallback |
| `src/components/Card/Card.module.css` | 2-line title, remove unused styles |
| `src/components/RankBadge/RankBadge.tsx` | Text before stars, empty stars for 2nd/3rd |
| `src/components/CardExpanded/CardExpanded.tsx` | Auto-discover entity fields |
| `src/components/SettingsPanel/SettingsPanel.tsx` | Restructure tabs |
| `src/components/SettingsPanel/CardSettingsTabs.tsx` | Add Layout, Behaviour, Configuration |
| `src/stores/settingsStore.ts` | Add dragMode, configOverrides, bump version |

---

## Settings Store Changes

```typescript
// New types
type DragMode = "none" | "front" | "back" | "both";

interface ConfigOverrides {
  front: {
    titleField?: string;
    subtitleField?: string;
    badgeField?: string;
    footerBadgeField?: string;
  };
  back: {
    logoField?: string;
  };
}

// Settings changes
- dragModeEnabled: boolean  → REMOVED
- dragFace: DragFace        → REMOVED
+ dragMode: DragMode        → NEW (replaces both)
+ configOverrides: ConfigOverrides → NEW
- cardBackDisplay: "year" | "logo" | "both" | "none" → CHANGE to "logo" | "none"
```

---

## Success Criteria

### Card Simplification
- [ ] No secondary badge on card front
- [ ] Title truncates after 2 lines with ellipsis
- [ ] No text on card back (logo only)
- [ ] App logo shows when no platform logo defined
- [ ] Rank badge shows "1st ★★★", "2nd ☆☆", "3rd ☆"
- [ ] Expanded card shows all non-empty entity fields
- [ ] Field labels use schema definitions (e.g., "Playing since" not "playedSince")
- [ ] Values formatted appropriately (stars for ratings, etc.)

### Settings Structure
- [ ] "Cards" tab (not "Card")
- [ ] "Layout" sub-tab (not "General")
- [ ] Layout contains: Size, Aspect Ratio, Max Visible, Shuffle
- [ ] Behaviour sub-tab with Drag to Reorder (None/Front/Back/Both)
- [ ] Configuration sub-tab with field dropdowns
- [ ] Theme tab with Retro/Modern/Minimal sub-tabs
- [ ] No scrolling in any settings view

### Behaviour
- [ ] Drag "None" hides drag UI entirely
- [ ] Configuration overrides persist to localStorage
- [ ] Field dropdowns show available entity fields
- [ ] All settings migrate cleanly from v4 → v5

---

## Related Documentation

- [v0.6.1 Devlog](../../process/devlogs/v0.6.1/README.md)
- [v0.6.1 Retrospective](../../process/retrospectives/v0.6.1/README.md)

---
