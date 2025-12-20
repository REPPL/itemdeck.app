# itemdeck: Product Vision & Feature Scope

## Document Purpose

This document instructs an AI coding agent (Claude Code) to extend the existing itemdeck project. It provides:

1. **Product vision** — what itemdeck is and why it exists
2. **Demo context** — the specific collection being showcased
3. **Feature scope** — what to build next, in priority order
4. **Technical guidance** — how features should be implemented
5. **Boundaries** — what is explicitly out of scope

Read this document in full before making changes. Refer to existing code in `docs/` and `src/` to understand current implementation patterns.

---

## 1. Product Vision

### 1.1 What is itemdeck?

**itemdeck** is a gamified showcase for personal collections. It presents items as playing cards in a responsive grid, inviting users to explore and rediscover their collections through playful interactions.

### 1.2 Core Experience

The primary experience is **nostalgic discovery**:

- Cards begin **face-down**, displaying only minimal hints (e.g., a logo or year)
- Users **flip cards to reveal** the item beneath — its image, title, and personal notes
- The act of flipping evokes the feeling of rediscovering a forgotten favourite
- Browsing is unhurried and exploratory, not task-oriented

Think of it as a personal museum you can shuffle and rearrange.

### 1.3 Target Users (Phased)

| Phase | User | Description |
|-------|------|-------------|
| 1 (now) | The creator | A working demo showcasing the developer's own collection |
| 2 (future) | Individuals | Others can create and host their own itemdecks |
| 3 (future) | Community | Shared discovery across collections |

**For this scope, focus only on Phase 1** — a polished, functional demo for a single collection.

### 1.4 Design Principles

1. **Playful, not gamified-to-death** — Interactions should feel delightful, not like a chore or competition
2. **Personal, not generic** — The demo should feel like *someone's* collection, with warmth and memory attached
3. **Flexible, not rigid** — Configuration should allow different collections to feel distinct
4. **Progressive, not overwhelming** — Reveal information gradually; respect the user's attention

---

## 2. Demo Collection: Retro Video Games

The demo showcases **"My Top Video Games Across the Ages"** — a personal ranking of ~80 games spanning 14 platforms from 1981 to 2018.

### 2.1 Data Structure

**Items** (games):

| Field | Type | Description |
|-------|------|-------------|
| `LABEL` | string | Game title |
| `RANK` | number | Position within category (0 = top pick / honourable mention) |
| `CATEGORY` | string | Platform identifier (e.g., `C64`, `NES`, `Switch`) |
| `DESCRIPTION` | string? | Optional personal notes about the game |
| `URL` | string? | Optional Wikipedia link |

**Categories** (platforms):

| Field | Type | Description |
|-------|------|-------------|
| `LABEL` | string | Platform identifier |
| `YEAR` | number | Year the creator first used this platform |
| `DESCRIPTION` | string? | Personal memory of this era |
| `URL` | string? | Optional Wikipedia link for the platform |

### 2.2 Data Files

Source data is provided as CSV (attached separately). For the application:

1. Convert to JSON format during build or at runtime
2. Store as static files initially (e.g., `public/data/items.json`, `public/data/categories.json`)
3. Future: fetch from external URL (e.g., GitHub raw file)

### 2.3 Images

- Source cover images from **Wikipedia/Wikimedia Commons** where available and licensing permits
- Use the item's `URL` field as a hint for sourcing
- For items without images, display a **placeholder** (styled appropriately for the theme)
- Image URLs should be stored in the data file, not hardcoded in components
- Consider a build-time or manual process to populate image URLs (not required for MVP, but structure the data to support it)

---

## 3. Feature Scope (Priority Order)

### 3.1 Card Flip Mechanic ⭐ HIGH PRIORITY

**Behaviour:**

- Cards render **face-down by default** (showing card back: logo, category/platform, year)
- **Click/tap toggles** the card between face-down and face-up states
- Flip uses a **3D rotation animation** (CSS transform or Framer Motion)
- A **maximum number of cards can be face-up simultaneously** (default: 2)
- When the limit is reached and a new card is flipped, the **oldest revealed card auto-flips back**
- The flip limit should be **configurable**

**Card Back (face-down):**

- Centred itemdeck logo (or placeholder)
- Platform/category label
- Year (from category data)

**Card Front (face-up):**

- Cover image (or placeholder)
- Game title
- Platform
- Personal description (if present)
- "More info" link (if URL present)

### 3.2 Real Data Loading ⭐ HIGH PRIORITY

**Replace mock data with actual collection:**

- Load `items.json` and `categories.json` from `public/data/` (or fetched URL)
- Join items to categories by `CATEGORY` ↔ `LABEL`
- Handle loading and error states gracefully
- Use **TanStack Query** for data fetching (as noted in existing plans)
- Validate data shape with **Zod** schemas

### 3.3 Responsive Content Tiers ⭐ HIGH PRIORITY

Cards should adapt their displayed content based on available space:

| Card Width | Face-Down Shows | Face-Up Shows |
|------------|-----------------|---------------|
| ≥220px | Logo, platform, year | Image, title, platform, description snippet, link |
| 180–219px | Logo, platform, year | Image, title, platform |
| 140–179px | Logo, year | Image, title (truncated) |
| 100–139px | Logo only | Image only |
| <100px | "Zoom in" indicator | "Zoom in" indicator |

Use **CSS Container Queries** for this (each card declares `container-type: inline-size`).

### 3.4 Configuration System ⭐ MEDIUM PRIORITY

**Layered configuration:**

1. **App default** — Ships with the application, loaded into memory
2. **External override** — Fetched from URL (e.g., GitHub raw JSON), merges over default
3. **Local storage** (future) — User edits persisted in browser; UI editing out of scope for now

**Configurable options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxVisibleCards` | number | 2 | How many cards can be face-up at once |
| `cardWidth` | number | 180 | Base card width in pixels |
| `cardRatio` | number | 1.4 | Height = width × ratio |
| `defaultOrder` | `"shuffle"` \| `"rank"` \| `"category"` \| `"year"` | `"shuffle"` | Initial card arrangement |
| `theme` | `"modern"` \| `"retro"` | `"modern"` | Visual theme |
| `enableDragDrop` | boolean | false | Allow manual card reordering |
| `dragDropScope` | `"all"` \| `"revealed"` \| `"hidden"` | `"all"` | Which cards can be dragged |
| `showPlatformFilter` | boolean | true | Show platform filter in sidebar |
| `showSortOptions` | boolean | true | Show sort controls in sidebar |
| `dataUrl` | string? | null | External URL for items/categories JSON |

**Implementation:**

- Define a `Config` type with Zod schema
- Create a `useConfig` hook that:
  1. Loads app default
  2. Fetches external config (if `configUrl` query param or env var set)
  3. Deep-merges external over default
  4. Returns merged config + loading state
- Expose config via React Context

### 3.5 Sidebar Controls ⭐ MEDIUM PRIORITY

Populate the existing Sidebar shell with functional controls:

- **Filter by platform/category** — Checkbox list or chip toggles
- **Sort options** — Dropdown or toggle group (shuffle, by rank, by category, by year)
- **Shuffle button** — Re-randomise card order
- **Reset button** — Flip all cards face-down
- **Card count display** — "Showing X of Y items"

Visibility of controls should respect configuration (`showPlatformFilter`, `showSortOptions`).

### 3.6 Theming System ⭐ MEDIUM PRIORITY

Support two themes (switchable via config):

**Modern (default):**

- Background: #1a1a2e (deep charcoal)
- Primary accent: #4ecca3 (teal)
- Card face: #f8f9fa (near-white)
- Typography: Clean sans-serif

**Retro (80s):**

- Background: #1a0a2e (deep purple)
- Primary accent: #ff2a6d (neon pink)
- Secondary: #05d9e8 (cyan)
- Tertiary: #ff6b35 (orange)
- CRT scanline overlay effect (subtle)
- Typography: Pixelated or retro-styled font

Implementation:

- CSS custom properties for colours
- Theme class on root element (`.theme-modern`, `.theme-retro`)
- Theme-specific assets (card backs, logos) if needed

### 3.7 Drag-and-Drop Reordering ⭐ LOW PRIORITY

When `enableDragDrop` is true:

- Cards can be dragged and repositioned within the grid
- Respect `dragDropScope` setting (which cards are draggable)
- Visual feedback during drag (lift effect, drop zone highlight)
- Order persists for session (future: persist to localStorage)

Consider using a library like `@dnd-kit/core` for accessible drag-and-drop.

### 3.8 Keyboard Navigation ⭐ LOW PRIORITY

- Arrow keys navigate between cards
- Enter/Space flips the focused card
- Escape flips all cards face-down
- Tab moves through interactive elements in logical order
- Visible focus indicators

---

## 4. Technical Guidance

### 4.1 Extend, Don't Rewrite

The foundation is already scaffolded. Work with existing patterns:

- Continue using CSS Modules (`.module.css` per component)
- Continue using the existing Context pattern for settings
- Add new contexts/hooks as needed (e.g., `useConfig`, `useFlipState`)

### 4.2 Animation Approach

- Use **Framer Motion** for card flip animations (add as dependency)
- Keep CSS transitions for simpler effects (grid repositioning, hover states)
- Ensure animations are **reducible** (respect `prefers-reduced-motion`)

### 4.3 Data Flow

```
[External JSON / Static files]
        ↓
   TanStack Query (fetch + cache)
        ↓
   Zod validation
        ↓
   React Context (items, categories, config)
        ↓
   Components
```

### 4.4 File Structure (Suggested Additions)

```
src/
├── components/
│   ├── Card/
│   │   ├── CardBack.tsx       # Face-down content
│   │   ├── CardFront.tsx      # Face-up content
│   │   └── CardFlip.tsx       # Flip animation wrapper
│   ├── Sidebar/
│   │   ├── FilterControls.tsx
│   │   ├── SortControls.tsx
│   │   └── ActionButtons.tsx
│   └── ...
├── contexts/
│   ├── ConfigContext.tsx
│   ├── DeckContext.tsx        # Items, categories, flip states
│   └── ...
├── hooks/
│   ├── useConfig.ts
│   ├── useDeck.ts
│   ├── useFlipManager.ts      # Tracks which cards are flipped, enforces limit
│   └── ...
├── schemas/
│   ├── item.schema.ts
│   ├── category.schema.ts
│   └── config.schema.ts
├── data/
│   └── defaultConfig.ts
└── themes/
    ├── modern.css
    └── retro.css
```

### 4.5 Dependencies to Add

| Package | Purpose |
|---------|---------|
| `framer-motion` | Card flip animations |
| `@tanstack/react-query` | Data fetching and caching |
| `zod` | Schema validation |
| `@dnd-kit/core` | Drag-and-drop (when implementing 3.7) |

---

## 5. Out of Scope

Do **not** implement the following in this phase:

| Feature | Reason |
|---------|--------|
| Multi-user / authentication | Phase 2+ |
| Blockchain / IPFS storage | Phase 3+ |
| UI-based config editing | Future enhancement |
| User accounts or profiles | Phase 2+ |
| Sharing or social features | Phase 2+ |
| Analytics or tracking | Not planned |
| Server-side rendering | Unnecessary for static demo |
| Unit/integration tests | Focus on functionality first |
| CI/CD pipeline | Manual deployment for now |

---

## 6. Acceptance Criteria

When this scope is complete:

1. Cards display real data from the retro games collection
2. Cards flip on click with smooth 3D animation
3. Maximum 2 cards visible at once (configurable)
4. Cards adapt content based on size (container queries)
5. Sidebar has working filter (by platform) and sort controls
6. Configuration loads from app default, overridable via external JSON
7. Two themes available (modern and retro), switchable via config
8. Shuffle button randomises card order
9. Reset button flips all cards face-down
10. App runs without errors: `npm install && npm run dev`
11. No TypeScript errors: `npm run typecheck`

---

## 7. Sample Data (Reference)

Summary of the demo collection:

- **~80 games** across **14 platforms**
- Platforms span 1981 (Atari VCS 2600) to 2018 (Nintendo Switch)
- Some items include personal descriptions and Wikipedia URLs
- Some platforms include nostalgic memories

Data files will be provided separately in JSON format for `public/data/`.

---

## Related Documentation

- [Setup Prompt](../setup/README.md) - Original scaffold specification
- [Clarifications](./clarifications.md) - Decisions made during implementation
