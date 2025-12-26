# v0.10.5 Implementation Plan - Field Descriptions & Demo Datasets

## Overview

**Version**: v0.10.5 - Field Descriptions & Demo Data Enhancement
**Theme**: Improve data documentation and prepare example datasets
**Pre-requisites**: v0.10.1 (UI Polish & Data Model Refinement) - In Progress

> **Note**: This release should only begin after v0.10.1 is complete and tagged.

This intermediate release focuses on:
- Adding field descriptions to UI with info tooltips
- Enhancing platform entities with additional data sources
- Auditing data consistency across demo collection
- Proposing five example datasets of varying sizes

---

## Phase 1: Field Description Infrastructure

### 1.1 Extend FieldDefinition Interface

**File**: `src/utils/entityFields.ts`

Add description property to interface:
```typescript
export interface FieldDefinition {
  label: string;
  type?: "text" | "year" | "number" | "enum" | "stars";
  values?: string[];
  format?: string;
  description?: string;  // NEW
}
```

### 1.2 Add Descriptions to FIELD_DEFINITIONS

**File**: `src/utils/entityFields.ts`

Update all field definitions with descriptions:
```typescript
const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  title: {
    label: "Title",
    type: "text",
    description: "The official name of this item",
  },
  year: {
    label: "Year",
    type: "year",
    description: "Year of original release",
  },
  summary: {
    label: "Summary",
    type: "text",
    description: "Brief description of this item",
  },
  myVerdict: {
    label: "My verdict",
    type: "text",
    description: "Personal reflection or opinion",
  },
  myStartYear: {
    label: "Playing since",
    type: "year",
    description: "Year I first experienced this",
  },
  myRating: {
    label: "My rating",
    type: "number",
    format: "stars",
    description: "Personal rating out of 5 stars",
  },
  myRank: {
    label: "My rank",
    type: "number",
    description: "Personal ranking within this category (1 = favourite)",
  },
  playedSince: {
    label: "Playing since",
    type: "year",
    description: "Year I first experienced this",
  },
  verdict: {
    label: "Verdict",
    type: "text",
    description: "Personal reflection or opinion",
  },
  rating: {
    label: "Rating",
    type: "number",
    format: "stars",
    description: "Personal rating out of 5 stars",
  },
  status: {
    label: "Status",
    type: "enum",
    values: ["completed", "playing", "backlog", "abandoned"],
    description: "Current progress status",
  },
  genres: {
    label: "Genres",
    type: "text",
    description: "Categories or genres this belongs to",
  },
  averageRating: {
    label: "Reviews",
    type: "number",
    format: "stars10",
    description: "Aggregate review score from external sources",
  },
  rank: {
    label: "Rank",
    type: "number",
    description: "Position in ordered list",
  },
  device: {
    label: "Platform",
    type: "text",
    description: "The platform or device",
  },
  platform: {
    label: "Platform",
    type: "text",
    description: "The platform or device",
  },
};
```

### 1.3 Add getFieldDescription Function

**File**: `src/utils/entityFields.ts`

Add new utility function:
```typescript
export function getFieldDescription(fieldName: string): string | undefined {
  return FIELD_DEFINITIONS[fieldName]?.description;
}
```

### 1.4 Extend DisplayableField Interface

**File**: `src/utils/entityFields.ts`

Add description to output interface:
```typescript
export interface DisplayableField {
  key: string;
  label: string;
  value: string;
  description?: string;  // NEW
}
```

### 1.5 Update getDisplayableFields

**File**: `src/utils/entityFields.ts`

Include description in field push:
```typescript
fields.push({
  key,
  label: getFieldLabel(key),
  value: formattedValue,
  description: getFieldDescription(key),  // NEW
});
```

---

## Phase 2: InfoTooltip Component

### 2.1 Create Component

**New file**: `src/components/InfoTooltip/InfoTooltip.tsx`

```typescript
import styles from "./InfoTooltip.module.css";

interface InfoTooltipProps {
  text: string;
  className?: string;
}

export function InfoTooltip({ text, className }: InfoTooltipProps) {
  const wrapperClass = className
    ? `${styles.tooltipWrapper} ${className}`
    : styles.tooltipWrapper;

  return (
    <span className={wrapperClass}>
      <span
        className={styles.icon}
        aria-label="More information"
        tabIndex={0}
        role="button"
      >
        i
      </span>
      <span className={styles.tooltip} role="tooltip">
        {text}
      </span>
    </span>
  );
}

export default InfoTooltip;
```

### 2.2 Create Styles

**New file**: `src/components/InfoTooltip/InfoTooltip.module.css`

CSS-only tooltip implementation:
- `.tooltipWrapper` - Relative positioned container
- `.icon` - Small info icon (i in circle)
- `.tooltip` - Hidden by default, shown on hover/focus
- Responsive positioning (right on desktop, below on mobile)
- Uses CSS custom properties for theme colours
- Arrow pointer using ::before/::after pseudo-elements

### 2.3 Create Index

**New file**: `src/components/InfoTooltip/index.ts`

```typescript
export { InfoTooltip } from "./InfoTooltip";
export { default } from "./InfoTooltip";
```

---

## Phase 3: CardExpanded Integration

### 3.1 Import InfoTooltip

**File**: `src/components/CardExpanded/CardExpanded.tsx`

Add import:
```typescript
import { InfoTooltip } from "@/components/InfoTooltip";
```

### 3.2 Update Metadata Rendering

**File**: `src/components/CardExpanded/CardExpanded.tsx`

Update the metadata list (around line 541-548):
```tsx
<dl className={styles.metadataList}>
  {additionalFields.map(({ key, label, value, description }) => (
    <div key={key} className={styles.metadataItem}>
      <dt className={styles.metadataKey}>
        {label}
        {description && <InfoTooltip text={description} />}
      </dt>
      <dd className={styles.metadataValue}>{value}</dd>
    </div>
  ))}
</dl>
```

---

## Phase 4: Platform Data Enhancement

### 4.1 Add MobyGames URLs

Add MobyGames links to all 13 platform files:

| Platform File | MobyGames URL |
|---------------|---------------|
| `platforms/amiga.json` | `https://www.mobygames.com/platform/amiga/` |
| `platforms/arcade.json` | `https://www.mobygames.com/platform/arcade/` |
| `platforms/c64.json` | `https://www.mobygames.com/platform/c64/` |
| `platforms/gameboy.json` | `https://www.mobygames.com/platform/gameboy/` |
| `platforms/gba.json` | `https://www.mobygames.com/platform/gba/` |
| `platforms/mac.json` | `https://www.mobygames.com/platform/macintosh/` |
| `platforms/ms-dos.json` | `https://www.mobygames.com/platform/dos/` |
| `platforms/n64.json` | `https://www.mobygames.com/platform/nintendo-64/` |
| `platforms/nes.json` | `https://www.mobygames.com/platform/nes/` |
| `platforms/snes.json` | `https://www.mobygames.com/platform/snes/` |
| `platforms/switch.json` | `https://www.mobygames.com/platform/nintendo-switch/` |
| `platforms/vcs2600.json` | `https://www.mobygames.com/platform/atari-2600/` |
| `platforms/vic20.json` | `https://www.mobygames.com/platform/vic-20/` |

### 4.2 Update Pattern

Add to each platform's `detailUrls` array:
```json
{
  "detailUrls": [
    {
      "url": "https://en.wikipedia.org/wiki/...",
      "source": "Wikipedia"
    },
    {
      "url": "https://www.mobygames.com/platform/.../",
      "source": "MobyGames"
    }
  ]
}
```

---

## Phase 5: Data Consistency Audit

### 5.1 Verify Required Fields

Check all 69 games have:
- `title` (required)
- `year` (required)
- `summary` (required)
- `platform` (required)
- `myRank` (personal ranking)

### 5.2 Verify Optional Personal Fields

Audit games for:
- `myVerdict` - Personal reflection
- `myStartYear` - When first played

### 5.3 Verify External Links

Check all games have at least one `detailUrl`:
- Preferably Wikipedia
- Preferably MobyGames

### 5.4 Verify Image Attribution

All images should have:
- `attribution.source`
- `attribution.sourceUrl`
- `attribution.licence`

---

## Phase 6: Demo Dataset Specifications

### 6.1 Starter Pack (5 cards)

**Theme**: Iconic games everyone recognises
**Purpose**: Quick demo, minimal data transfer

**Selection**:
1. Tetris (Game Boy) - Puzzle
2. Super Mario Bros. 3 (NES) - Platform
3. The Legend of Zelda: Ocarina of Time (N64) - Adventure
4. Street Fighter II (Arcade) - Fighting
5. Civilization (MS-DOS) - Strategy

### 6.2 Genre Sampler (10 cards)

**Theme**: One game per major genre
**Purpose**: Show variety of collection types

**Genres covered**:
1. Puzzle - Tetris
2. Platform - Super Mario Bros. 3
3. Adventure - Zelda: Ocarina of Time
4. Fighting - Street Fighter II
5. Strategy - Civilization
6. Racing - Super Mario Kart
7. Shooter - Gradius
8. RPG - Fire Emblem: Sacred Stones
9. Sports - All-Star Baseball 2000
10. Simulation - SimCity

### 6.3 Platform Focus (20 cards)

**Theme**: Deep-dive into Game Boy + GBA handhelds
**Purpose**: Show platform grouping and filtering

**Selection**: All 11 handheld games currently in collection, plus 9 new additions:
- Pokémon Red/Blue
- Kirby's Dream Land
- Super Mario Land 2
- Wario Land
- Donkey Kong (Game Boy)
- Golden Sun
- Castlevania: Aria of Sorrow
- Mario & Luigi: Superstar Saga
- Final Fantasy Tactics Advance

### 6.4 Decade Journey (50 cards)

**Theme**: Gaming history from 1980s to 2020s
**Purpose**: Show year distribution and timeline

**Distribution**:
- 1980s: 10 games (VCS2600, C64, Amiga)
- 1990s: 20 games (NES, SNES, N64, Game Boy)
- 2000s: 15 games (GBA, Mac)
- 2010s+: 5 games (Switch)

### 6.5 Full Collection (200 cards)

**Theme**: Comprehensive retro gaming collection
**Purpose**: Stress test, realistic collection size

**Approach**: Expand current 69 games to 200 by:
- Adding more games per existing platform (approx 8-15 per platform)
- Adding 2-3 new platforms (PlayStation, Sega Genesis, PC Engine)
- Ensuring genre diversity within each platform

---

## Phase 7: Testing & Verification

### 7.1 TypeScript Check

```bash
npm run typecheck
```

**Target**: No TypeScript errors

### 7.2 Lint Check

```bash
npm run lint
```

**Target**: No lint errors

### 7.3 Build Verification

```bash
npm run build
```

**Target**: Build succeeds

### 7.4 Manual Testing Checklist

- [ ] Info icons appear next to field labels in Verdict view
- [ ] Tooltips show on hover with correct descriptions
- [ ] Tooltips show on focus (keyboard accessible)
- [ ] Tooltips position correctly on desktop (to the right)
- [ ] Tooltips position correctly on mobile (below)
- [ ] MobyGames icons appear for platforms with MobyGames links
- [ ] All platform info overlays show both Wikipedia and MobyGames
- [ ] No console errors when viewing cards

---

## Phase 8: Documentation

### 8.1 Create Devlog

**New file**: `docs/development/process/devlogs/v0.10.5/README.md`

Document:
- Implementation narrative
- InfoTooltip component design
- Platform data enhancements
- Demo dataset rationale

### 8.2 Create Retrospective

**New file**: `docs/development/process/retrospectives/v0.10.5/README.md`

Document:
- What went well
- What could improve
- Lessons learned
- Metrics (files changed, features added)

### 8.3 Update Milestone

**File**: `docs/development/roadmap/milestones/README.md`

Add v0.10.5 entry:
```markdown
| v0.10.5 | Field Descriptions & Demo Data | ✅ Complete | 4 |
```

### 8.4 Create Feature Spec

**New file**: `docs/development/roadmap/features/completed/F-068-field-descriptions.md`

Document the field descriptions and tooltip feature.

---

## Phase 9: Release

### 9.1 Update Version

**File**: `package.json`

Change version: `0.10.1` → `0.10.5`

### 9.2 Git Commit

```bash
git add .
git commit -m "feat(v0.10.5): field descriptions and demo data enhancement

Features:
- Add field descriptions to FIELD_DEFINITIONS
- Create InfoTooltip component for field labels
- Display tooltips in Verdict view on hover/focus
- Add MobyGames URLs to all 13 platforms
- Audit and enhance demo data consistency

Demo datasets proposed:
- Starter Pack (5 cards)
- Genre Sampler (10 cards)
- Platform Focus (20 cards)
- Decade Journey (50 cards)
- Full Collection (200 cards)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 9.3 Create Tag

```bash
git tag -a v0.10.5 -m "v0.10.5: Field Descriptions & Demo Data

Features:
- Field descriptions with info icon tooltips
- Enhanced platform data with MobyGames links
- Data consistency improvements

Technical:
- InfoTooltip component (CSS-only, accessible)
- Extended FIELD_DEFINITIONS with descriptions
- DisplayableField interface updated"
```

---

## Files Summary

### New Files (~4)

| Category | Files |
|----------|-------|
| Components | `InfoTooltip/InfoTooltip.tsx`, `InfoTooltip/InfoTooltip.module.css`, `InfoTooltip/index.ts` |
| Documentation | `docs/development/roadmap/features/completed/F-068-field-descriptions.md` |

### Modified Files (~17)

| File | Changes |
|------|---------|
| `src/utils/entityFields.ts` | Add descriptions, getFieldDescription(), update interfaces |
| `src/components/CardExpanded/CardExpanded.tsx` | Import and render InfoTooltip |
| `public/data/retro-games/platforms/amiga.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/arcade.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/c64.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/gameboy.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/gba.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/mac.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/ms-dos.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/n64.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/nes.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/snes.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/switch.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/vcs2600.json` | Add MobyGames URL |
| `public/data/retro-games/platforms/vic20.json` | Add MobyGames URL |
| `docs/development/roadmap/milestones/README.md` | Add v0.10.5 entry |

---

## Success Criteria

### Core Features
- [ ] All FIELD_DEFINITIONS have description property
- [ ] InfoTooltip component renders correctly
- [ ] Tooltips appear next to field labels in Verdict view
- [ ] Tooltips show on hover and focus
- [ ] Tooltips are accessible (keyboard navigable, ARIA labels)
- [ ] All 13 platforms have MobyGames detailUrls

### Data Quality
- [ ] All games have required fields
- [ ] Data consistency verified
- [ ] Demo dataset specifications documented

### Quality
- [ ] TypeScript check passes
- [ ] Lint check passes
- [ ] Build succeeds
- [ ] No PII in committed files

### Documentation
- [ ] Devlog created
- [ ] Retrospective created
- [ ] Feature spec created
- [ ] Milestone README updated

---

**Status**: Ready for implementation
