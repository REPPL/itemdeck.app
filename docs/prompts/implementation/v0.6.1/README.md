# v0.6.1 Implementation Prompt - UI Configuration & Settings Enhancement

**Version:** v0.6.1
**Codename:** UI Configuration
**Branch:** `feature/v0.6.1-ui-configuration`

---

## Overview

Implement dynamic card rendering driven by collection.json display configuration, restructure the settings panel with sub-tabs, add random card sampling, and conduct a comprehensive settings audit to ensure all settings work correctly.

---

## Context

- v0.6.0 established the schema loader with relationship resolution
- Collection now has `display.card.front` and `display.card.back` configuration
- Field path expressions exist in image selector (need generalisation)
- Settings panel has grown with many card-related options
- Demo collection has 79 games with personal fields (playedSince, verdict, rating, status)
- Current cards have hardcoded field mappings

---

## Pre-Implementation State Analysis

### Demo Data Status (Complete)

- ✅ All 13 platforms have `logoUrl` (arcade and ms-dos added)
- ✅ 79 games with personal fields (playedSince, verdict, rating, status)
- ✅ Unnecessary files deleted (games.json.full, .numbers files)

### Critical Finding: Display Configuration is Completely Ignored

The `collection.json` defines rich display configuration that Card components do not use:

```json
"display": {
  "card": {
    "front": {
      "title": "title",
      "subtitle": "playedSince",      // ❌ NOT DISPLAYED
      "badge": "rank",
      "secondaryBadge": "rating",     // ❌ NOT DISPLAYED
      "footer": ["platform.title", "status"]  // ❌ NOT DISPLAYED
    },
    "back": {
      "logo": "platform.logoUrl",
      "title": "verdict",             // ❌ NOT DISPLAYED
      "text": "year"
    }
  }
}
```

**Current CardFront.tsx props (hardcoded):**
```typescript
interface CardFrontProps {
  imageUrl: string;
  title: string;
  year?: string;       // Should be dynamic subtitle
  rank?: number | null;
  device?: string;
  // Missing: subtitle, secondaryBadge, footer
}
```

**Current CardBack.tsx props (hardcoded):**
```typescript
interface CardBackProps {
  logoUrl?: string;
  year?: string;
  display?: CardBackDisplay;
  // Missing: title (verdict), configurable text
}
```

### Settings Panel Analysis (from Screenshots)

**Current Structure:**
- 4 main tabs: System, Theme, Behaviour, Card ✅
- Card tab has GENERAL, FRONT, BACK as **section headers** (not navigable sub-tabs)
- Settings are displayed inline under each section header

**Settings Currently Visible:**
- Size (slider)
- Aspect Ratio (dropdown)
- Footer Style (dropdown)
- Title Display (dropdown)
- Show Rank Badge (toggle)
- Show Device Badge (toggle)
- Unranked Text (text input)

### Existing Infrastructure to Reuse

**`src/loaders/fieldPath.ts`** - Already handles:
- Simple field access: `title`
- Nested relationship access: `platform.title`
- `_resolved` property navigation

**`src/loaders/imageSelector.ts`** - Already handles:
- Array filter expressions: `images[type=cover][0]`
- Bracket notation parsing

**New capabilities needed:**
- Combine field path + image selector: `platform.images[type=logo][0].url`
- Fallback expressions: `verdict ?? summary`

### Orphaned Settings (Audit Required)

Settings that exist in store but don't affect Card rendering:

| Setting | In Store | In UI | Actually Works |
|---------|----------|-------|----------------|
| overlayStyle | ✅ | ✅ | ❌ hardcoded "dark" |
| titleDisplayMode | ✅ | ✅ | ❌ always truncates |
| visualTheme | ✅ | ✅ | ❌ CSS-only, no card effect |
| layout | ✅ | ❌ commented | ❌ |
| cardBackStyle | ✅ | ❌ commented | ❌ |

**Action:** Wire these up or remove from store/UI.

---

## Scope

### In Scope (v0.6.1)

1. **Collection Display Driver (F-042)** - Cards render from schema configuration
2. **Settings Panel Sub-tabs (F-043)** - Split "Cards" into General/Front/Back
3. **Random Card Sampling (F-044)** - Dropdown 1 to N for deck sampling
4. **Settings Audit** - Verify all settings work and are accessible
5. **External Scores Research (R-003)** - Already complete, document integration path

### Out of Scope (future)

- Actual external API integration (just research for now)
- Multiple collection switching
- Collection editor UI
- Advanced filtering/sorting UI

---

## Phase 1: Field Path Parser

### 1.1 Generalise Field Path Parser

**File:** `src/loaders/fieldPath.ts`

Extend existing functionality to support:

```typescript
// Simple field access
"title"                          // → entity.title

// Nested via resolved relationship
"platform.title"                 // → entity._resolved.platform.title

// Array filter + index + nested
"images[type=cover][0].url"      // → first cover image URL

// Fallback chain
"verdict ?? summary"             // → entity.verdict || entity.summary
"playedSince ?? year"            // → entity.playedSince || entity.year
```

**Interface:**

```typescript
interface FieldPathOptions {
  fallbackValue?: unknown;
  formatters?: Record<string, (value: unknown) => string>;
}

function resolveFieldPath(
  entity: ResolvedEntity,
  path: string,
  options?: FieldPathOptions
): unknown;

function resolveFieldPathAsString(
  entity: ResolvedEntity,
  path: string,
  fallback?: string
): string;
```

### 1.2 Parser Implementation

Support the following grammar:

```
expression  = path (" ?? " path)*
path        = segment ("." segment)*
segment     = identifier | filter
identifier  = [a-zA-Z_][a-zA-Z0-9_]*
filter      = identifier "[" condition "]" ("[" number "]")?
condition   = identifier "=" value
value       = quoted_string | identifier
```

### 1.3 Tests

**File:** `src/loaders/__tests__/fieldPath.test.ts`

```typescript
describe('resolveFieldPath', () => {
  it('resolves simple field', () => {
    expect(resolveFieldPath({ title: 'Zelda' }, 'title')).toBe('Zelda');
  });

  it('resolves nested relationship', () => {
    const entity = {
      _resolved: { platform: { title: 'SNES' } }
    };
    expect(resolveFieldPath(entity, 'platform.title')).toBe('SNES');
  });

  it('resolves fallback chain', () => {
    expect(resolveFieldPath({ year: 1991 }, 'verdict ?? year')).toBe(1991);
    expect(resolveFieldPath({ verdict: 'Great!' }, 'verdict ?? year')).toBe('Great!');
  });

  it('resolves array filter', () => {
    const entity = {
      images: [
        { type: 'screenshot', url: 'a.jpg' },
        { type: 'cover', url: 'b.jpg' }
      ]
    };
    expect(resolveFieldPath(entity, 'images[type=cover][0].url')).toBe('b.jpg');
  });
});
```

---

## Phase 2: Display Configuration Types

### 2.1 Extend Display Types

**File:** `src/types/display.ts`

```typescript
interface CardFrontConfig {
  /** Field path for card title */
  title?: string;

  /** Field path for subtitle (below title) */
  subtitle?: string;

  /** Image source configuration */
  image?: {
    source: string;  // e.g., "images[type=cover][0] ?? images[0]"
  };

  /** Field path for primary badge */
  badge?: string;

  /** Field path for secondary badge */
  secondaryBadge?: string;

  /** Field paths for footer elements */
  footer?: string[];
}

interface CardBackConfig {
  /** Field path for logo image */
  logo?: string;

  /** Field path for back title (e.g., verdict) */
  title?: string;

  /** Field path for back text (e.g., year) */
  text?: string;

  /** Additional field paths for back content */
  fields?: string[];
}

interface CardDisplayConfig {
  front?: CardFrontConfig;
  back?: CardBackConfig;
}
```

### 2.2 Default Configuration

Create sensible defaults when `display.card` is not specified:

```typescript
const DEFAULT_CARD_FRONT: CardFrontConfig = {
  title: 'title',
  subtitle: 'year',
  image: { source: 'images[0] ?? imageUrl' },
  badge: undefined,
  secondaryBadge: undefined,
  footer: []
};

const DEFAULT_CARD_BACK: CardBackConfig = {
  logo: undefined,
  title: 'summary',
  text: undefined
};
```

---

## Phase 3: Configurable Card Component

### 3.1 Card Component Updates

**File:** `src/components/Card/Card.tsx`

Modify Card to accept display configuration:

```typescript
interface CardProps {
  card: DisplayCard;
  displayConfig?: CardDisplayConfig;
  // ... existing props
}

function Card({ card, displayConfig, ...props }: CardProps) {
  const config = displayConfig ?? DEFAULT_CARD_CONFIG;

  // Resolve field values using paths
  const title = resolveFieldPathAsString(card, config.front?.title ?? 'title');
  const subtitle = resolveFieldPathAsString(card, config.front?.subtitle ?? '');
  const badge = config.front?.badge
    ? resolveFieldPathAsString(card, config.front.badge)
    : undefined;

  // ... render with resolved values
}
```

### 3.2 FieldValue Component

**New File:** `src/components/FieldValue/FieldValue.tsx`

Render arbitrary field values with type-aware formatting:

```typescript
interface FieldValueProps {
  entity: ResolvedEntity;
  path: string;
  fallback?: string;
  className?: string;
}

function FieldValue({ entity, path, fallback = '', className }: FieldValueProps) {
  const value = resolveFieldPath(entity, path);

  if (value === undefined || value === null) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  // Format based on type
  if (typeof value === 'number') {
    return <span className={className}>{value.toLocaleString()}</span>;
  }

  return <span className={className}>{String(value)}</span>;
}
```

### 3.3 Update useCollection Hook

**File:** `src/hooks/useCollection.ts`

Pass display configuration to components:

```typescript
interface CollectionResult {
  cards: DisplayCard[];
  collection: Collection;
  displayConfig?: DisplayConfig;  // NEW
}

// In fetchV1Collection:
return {
  cards,
  collection: legacyCollection,
  displayConfig: loaded.definition.display  // Pass through
};
```

---

## Phase 4: Settings Panel Sub-tabs

### Critical UX Requirement: No Scrolling

**User Requirement:** All settings must be immediately discoverable on large AND small screens - no scrolling required within the settings panel.

**Current Problem:**
- Panel: 600px fixed height, content area ~440px
- Card tab: 8 settings + 3 section headers = ~480px content
- Result: Scrolling IS currently required

**Solution: Sub-tabs Replace Section Headers**

| Approach | Settings Per View | Scroll Required |
|----------|-------------------|-----------------|
| Current (1 tab, 3 sections) | 8 + headers | YES |
| Sub-tabs (General/Front/Back) | 2-5 each | NO |

By showing only one section at a time, sub-tabs eliminate scrolling while keeping all settings discoverable.

### 4.1 Card Settings Tab Structure

**File:** `src/components/SettingsPanel/CardSettingsTabs.tsx`

```typescript
type CardSettingsTab = 'general' | 'front' | 'back';

function CardSettingsTabs() {
  const [activeTab, setActiveTab] = useState<CardSettingsTab>('general');

  return (
    <div className="card-settings">
      <nav className="card-settings-nav">
        <button
          className={activeTab === 'general' ? 'active' : ''}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={activeTab === 'front' ? 'active' : ''}
          onClick={() => setActiveTab('front')}
        >
          Front
        </button>
        <button
          className={activeTab === 'back' ? 'active' : ''}
          onClick={() => setActiveTab('back')}
        >
          Back
        </button>
      </nav>

      <div className="card-settings-content">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'front' && <FrontSettings />}
        {activeTab === 'back' && <BackSettings />}
      </div>
    </div>
  );
}
```

### 4.2 Settings Organisation

**General Tab:**
- Card size (slider)
- Gap between cards (slider)
- Border radius (slider)
- Max visible cards (dropdown 1 to N)
- Shuffle on load (toggle)

**Front Tab:**
- Show title (toggle)
- Show subtitle (toggle)
- Show primary badge (toggle)
- Show secondary badge (toggle)
- Show footer metadata (toggle)

**Back Tab:**
- Show logo (toggle)
- Show title/verdict (toggle)
- Show text/year (toggle)
- Card back display mode (dropdown)

### 4.3 Accessibility

Ensure sub-tabs are keyboard accessible:

```typescript
<nav role="tablist" aria-label="Card settings">
  <button
    role="tab"
    aria-selected={activeTab === 'general'}
    aria-controls="panel-general"
    tabIndex={activeTab === 'general' ? 0 : -1}
  >
    General
  </button>
  {/* ... */}
</nav>

<div
  role="tabpanel"
  id="panel-general"
  aria-labelledby="tab-general"
  hidden={activeTab !== 'general'}
>
  <GeneralSettings />
</div>
```

---

## Phase 5: Random Card Sampling

### 5.1 Settings Store Update

**File:** `src/stores/settingsStore.ts`

```typescript
interface SettingsState {
  // ... existing settings
  maxVisibleCards: number | 'all';
}

const initialState: SettingsState = {
  // ... existing defaults
  maxVisibleCards: 'all',
};

// Actions
setMaxVisibleCards: (value: number | 'all') => void;
```

### 5.2 Sampling Logic

**File:** `src/hooks/useCollection.ts` or new file

```typescript
function sampleCards(
  cards: DisplayCard[],
  maxVisible: number | 'all',
  shuffle: boolean
): DisplayCard[] {
  if (maxVisible === 'all' || maxVisible >= cards.length) {
    return shuffle ? shuffleArray(cards) : cards;
  }

  // Random sample of maxVisible cards
  const shuffled = shuffleArray([...cards]);
  return shuffled.slice(0, maxVisible);
}
```

### 5.3 UI Component

**File:** `src/components/SettingsPanel/MaxVisibleCardsSelect.tsx`

```typescript
interface MaxVisibleCardsSelectProps {
  totalCards: number;
  value: number | 'all';
  onChange: (value: number | 'all') => void;
}

function MaxVisibleCardsSelect({ totalCards, value, onChange }: MaxVisibleCardsSelectProps) {
  const options = [
    { value: 'all', label: 'All' },
    ...Array.from({ length: totalCards }, (_, i) => ({
      value: i + 1,
      label: String(i + 1)
    }))
  ];

  return (
    <label>
      Max visible cards:
      <select
        value={value}
        onChange={(e) => onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}
```

For large collections (100+), consider a searchable dropdown or number input:

```typescript
function MaxVisibleCardsInput({ totalCards, value, onChange }: MaxVisibleCardsSelectProps) {
  const [inputValue, setInputValue] = useState(value === 'all' ? '' : String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (val === '' || val.toLowerCase() === 'all') {
      onChange('all');
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= totalCards) {
        onChange(num);
      }
    }
  };

  return (
    <label>
      Max visible cards:
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={`All (1-${totalCards})`}
      />
    </label>
  );
}
```

---

## Phase 6: Settings Audit

### 6.1 Settings Inventory

Review all existing settings:

| Setting | Location | Works? | Accessible? | Persists? |
|---------|----------|--------|-------------|-----------|
| Card size | General | ? | ? | ? |
| Gap | General | ? | ? | ? |
| Border radius | General | ? | ? | ? |
| Shuffle on load | General | ? | ? | ? |
| Show title | Front | ? | ? | ? |
| Show badge | Front | ? | ? | ? |
| Show secondary badge | Front | ? | ? | ? |
| Show logo | Back | ? | ? | ? |
| Card back display | Back | ? | ? | ? |
| Theme | Theme tab | ? | ? | ? |
| ... | ... | ... | ... | ... |

### 6.2 Verification Steps

For each setting:

1. **Works?** - Toggle/change the setting and verify visible effect
2. **Accessible?** - Can it be found in the Settings panel?
3. **Persists?** - Change setting, refresh page, verify value restored
4. **Defaults?** - Reset to defaults, verify sensible initial state

### 6.3 Fix Orphaned Settings

Identify settings that:
- Exist in store but have no UI
- Have UI but no effect
- Are duplicated or redundant

### 6.4 Document Missing Settings

Identify functionality that should be configurable but isn't:
- Display configuration overrides
- Sort order selection
- Group by selection
- Image preference selection

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/loaders/fieldPath.ts` | Field path expression parser |
| `src/components/FieldValue/FieldValue.tsx` | Render field values |
| `src/components/SettingsPanel/CardSettingsTabs.tsx` | Sub-tab navigation |
| `src/components/SettingsPanel/GeneralSettings.tsx` | General card settings |
| `src/components/SettingsPanel/FrontSettings.tsx` | Card front settings |
| `src/components/SettingsPanel/BackSettings.tsx` | Card back settings |
| `src/components/SettingsPanel/MaxVisibleCardsSelect.tsx` | Card sampling control |
| `src/loaders/__tests__/fieldPath.test.ts` | Field path tests |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/display.ts` | Extend card display config types |
| `src/components/Card/Card.tsx` | Accept and use display config |
| `src/hooks/useCollection.ts` | Pass display config, add sampling |
| `src/stores/settingsStore.ts` | Add maxVisibleCards setting |
| `src/components/SettingsPanel/SettingsPanel.tsx` | Integrate CardSettingsTabs |

---

## Success Criteria

### F-042 (Collection Display Driver)
- [ ] Cards render title from configured path
- [ ] Cards render subtitle from configured path
- [ ] Badges render from configured paths
- [ ] Card back renders from configuration
- [ ] Nested paths work (`platform.title`)
- [ ] Fallback expressions work (`verdict ?? summary`)
- [ ] Missing fields show gracefully
- [ ] Existing collections work unchanged

### F-043 (Settings Panel Sub-tabs)
- [ ] "Cards" shows General/Front/Back sub-tabs
- [ ] All settings retain functionality after move
- [ ] Tab navigation is keyboard accessible
- [ ] Visual indicator shows active sub-tab
- [ ] **All settings visible without scrolling in each sub-tab**
- [ ] **Sub-tabs work on screens as small as 320px wide**

### F-044 (Random Card Sampling)
- [ ] "Max visible cards" in General sub-tab
- [ ] Dropdown shows All, 1, 2, ... N
- [ ] Selection limits displayed cards
- [ ] Shuffle re-samples selection
- [ ] Setting persists in localStorage
- [ ] Value clamps for smaller collections

### Settings Audit
- [ ] Every setting has visible effect
- [ ] All settings accessible via panel
- [ ] All settings persist correctly
- [ ] No orphaned or hidden settings
- [ ] Sensible defaults for all settings

---

## Implementation Order

### Phase A: Core Implementation

1. **Field Path Parser** - Foundation for dynamic rendering
2. **Display Configuration Types** - TypeScript types for config
3. **FieldValue Component** - Render arbitrary fields
4. **Card Component Updates** - Use config and field paths
5. **Settings Store Updates** - Add maxVisibleCards
6. **MaxVisibleCardsSelect** - Sampling UI component
7. **CardSettingsTabs** - Sub-tab navigation
8. **Settings Reorganisation** - Move settings to sub-tabs
9. **Sampling Logic** - Integrate in useCollection
10. **Settings Audit** - Verify all settings work
11. **Testing** - Unit and integration tests
12. **Verification Suite** - Run tests, lint, build

### Phase B: Release Process (MANDATORY)

13. **Create devlog**: `docs/development/process/devlogs/v0.6.1/README.md`
14. **Create retrospective**: `docs/development/process/retrospectives/v0.6.1/README.md`
15. **Update time logs**: Record actual hours spent in `docs/development/process/time-logs/`
16. **Run PII scan**: `/pii-scan` on all staged changes
17. **Commit**: With conventional commit message and AI attribution
18. **Tag**: `git tag -a v0.6.1 -m "v0.6.1"`

---

## Testing Checklist

### Unit Tests
- [ ] Field path parser - simple fields
- [ ] Field path parser - nested paths
- [ ] Field path parser - array filters
- [ ] Field path parser - fallback chains
- [ ] Sampling logic - various limits
- [ ] Sampling logic - shuffle integration

### Integration Tests
- [ ] Card renders with display config
- [ ] Settings panel sub-tabs work
- [ ] Settings persist after reload
- [ ] Cards update when settings change

### Manual Tests
- [ ] All 79 demo cards display correctly
- [ ] Personal fields (verdict, rating) visible
- [ ] Sub-tabs navigate correctly
- [ ] Max visible cards limits display
- [ ] Shuffle respects sampling limit

---

## Related Documentation

- [v0.6.1 Milestone](../../development/roadmap/milestones/v0.6.1.md)
- [v0.6.0 Schema Loader](./v0.6.0/README.md)
- [F-042 Collection Display Driver](../../development/roadmap/features/planned/F-042-collection-display-driver.md)
- [F-043 Settings Panel Sub-tabs](../../development/roadmap/features/planned/F-043-settings-panel-subtabs.md)
- [F-044 Random Card Sampling](../../development/roadmap/features/planned/F-044-random-card-sampling.md)
- [R-003 External Scores Research](../../development/research/R-003-external-scores.md)
- [v1 Schema Reference](../../reference/schemas/v1/README.md)

---

**Status**: Ready for Implementation
