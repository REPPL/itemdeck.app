# R-009: Mechanic-Application Integration Architecture

## Executive Summary

Itemdeck's gaming mechanics need to integrate deeply with the core application while maintaining clean separation. This research addresses how mechanics can:

1. **Transform card data** (e.g., memory game duplicates cards)
2. **Control card display state** (e.g., force all cards face-down)
3. **Restrict/modify available settings** (e.g., disable shuffle in memory mode)
4. **Have dedicated UI** (separate from Settings panel)

**Recommendation:** Use a **Mechanic Controller Pattern** where each mechanic defines:
- A **data transformer** that can modify the card list before rendering
- A **settings overlay** that specifies which settings to lock/override
- A **dedicated control panel** (bottom-right button, not in Settings)
- An **integration contract** defining how it interacts with CardGrid

## Problem Statement

### Current Architecture Issues

The existing research (R-005, R-006) covers:
- ✅ State management per mechanic
- ✅ Plugin registry and activation
- ✅ State machine patterns
- ❌ How mechanics modify core app behaviour
- ❌ How mechanics transform card data
- ❌ How mechanics restrict settings
- ❌ UI placement and access

### Specific Requirements

#### Memory Game Example

| Requirement | Standard Behaviour | Memory Mode Behaviour |
|-------------|-------------------|----------------------|
| Card count | N cards | 2N cards (duplicated) |
| Initial flip state | Per setting (front/back) | All face-down (forced) |
| Shuffle setting | User controlled | Forced ON (random pairs) |
| Max visible cards | User controlled | Forced to 2 |
| Click behaviour | Flip card | Game logic intercepts |

### Design Principle

**Itemdeck Core Philosophy:** Itemdeck should only display information from JSON files. Gaming logic belongs in mechanics plugins, not core application code.

This means:
- Card data transformation happens in mechanic layer
- Core CardGrid receives already-transformed data
- Settings can be overridden/locked by active mechanic
- Click handlers can be intercepted by mechanic

## Research Findings

### Pattern 1: Data Transformer Pipeline

Each mechanic can optionally provide a data transformer:

```typescript
// src/mechanics/types.ts
interface MechanicDataTransformer {
  /**
   * Transform the card array before rendering.
   * Called after filters/search but before display.
   */
  transformCards(cards: DisplayCard[]): DisplayCard[];

  /**
   * Provide card pairs for matching (memory game).
   * Maps original ID to pair IDs.
   */
  getCardPairs?(): Map<string, string>;
}

// Memory game implementation
const memoryTransformer: MechanicDataTransformer = {
  transformCards(cards) {
    // Duplicate each card with a unique pair ID
    const duplicated: DisplayCard[] = [];

    for (const card of cards) {
      // Original card
      duplicated.push({
        ...card,
        id: `${card.id}-a`,
        _pairId: card.id,
      });

      // Duplicate card
      duplicated.push({
        ...card,
        id: `${card.id}-b`,
        _pairId: card.id,
      });
    }

    // Shuffle the pairs
    return shuffle(duplicated);
  },

  getCardPairs() {
    // Return mapping of display ID -> pair ID
    // Used for matching logic
  },
};
```

### Pattern 2: Settings Override Layer

Mechanics can declare which settings to lock or override:

```typescript
// src/mechanics/types.ts
interface MechanicSettingsOverride {
  /**
   * Settings to lock (user cannot change while mechanic active).
   */
  locked: Partial<Record<keyof SettingsState, boolean>>;

  /**
   * Settings to override (forced values while mechanic active).
   */
  overrides: Partial<SettingsState>;

  /**
   * Custom settings for this mechanic.
   * Displayed in mechanic panel, not main settings.
   */
  customSettings?: MechanicCustomSetting[];
}

// Memory game settings override
const memorySettingsOverride: MechanicSettingsOverride = {
  locked: {
    shuffleOnLoad: true,      // User can't disable shuffle
    maxVisibleCards: true,    // User can't change max visible
    defaultCardFace: true,    // User can't change default face
    randomSelectionEnabled: true,
  },
  overrides: {
    shuffleOnLoad: true,      // Force shuffle on
    maxVisibleCards: 2,       // Force max 2 visible
    defaultCardFace: 'back',  // Force start face-down
  },
  customSettings: [
    {
      key: 'pairCount',
      label: 'Number of Pairs',
      type: 'number',
      min: 4,
      max: 20,
      default: 8,
    },
    {
      key: 'timeLimit',
      label: 'Time Limit (seconds)',
      type: 'number',
      min: 0,
      max: 300,
      default: 0,  // 0 = no limit
    },
  ],
};
```

### Pattern 3: Dedicated Mechanic Panel

Separate from Settings, a Mechanics button provides:
- Mechanic selector (when no mechanic active)
- Active mechanic controls (when mechanic running)
- Mechanic-specific settings

```typescript
// src/components/MechanicPanel/MechanicPanel.tsx
interface MechanicPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function MechanicPanel({ isOpen, onClose }: MechanicPanelProps) {
  const { activeMechanic, activateMechanic, deactivateMechanic } = useMechanic();
  const registeredMechanics = useRegisteredMechanics();

  if (!isOpen) return null;

  return (
    <div className={styles.panel}>
      {activeMechanic ? (
        // Active mechanic view
        <MechanicActiveView
          mechanic={activeMechanic}
          onStop={deactivateMechanic}
        />
      ) : (
        // Mechanic selector
        <MechanicSelector
          mechanics={registeredMechanics}
          onSelect={activateMechanic}
        />
      )}
    </div>
  );
}
```

### Pattern 4: Click Intercept Layer

Mechanics can intercept card interactions:

```typescript
// src/mechanics/types.ts
interface MechanicInteractionHandler {
  /**
   * Called when a card is clicked.
   * Return true to prevent default behaviour.
   */
  onCardClick?(cardId: string, isFlipped: boolean): boolean;

  /**
   * Called when a card flip completes.
   */
  onCardFlipped?(cardId: string, isNowFaceUp: boolean): void;

  /**
   * Called when a card is dragged.
   * Return true to prevent default behaviour.
   */
  onCardDrag?(cardId: string): boolean;
}

// Memory game interaction handler
const memoryInteractionHandler: MechanicInteractionHandler = {
  onCardClick(cardId, isFlipped) {
    const store = useMemoryStore.getState();

    // Prevent click if game not playing
    if (store.phase !== 'playing') return true;

    // Prevent click if card already matched
    if (store.matchedCardIds.has(cardId)) return true;

    // Prevent click if two cards already flipped
    if (store.flippedCardIds.length >= 2) return true;

    // Prevent click if this card already flipped
    if (store.flippedCardIds.includes(cardId)) return true;

    // Allow flip and track in mechanic state
    store.flipCard(cardId);
    return false; // Don't prevent default flip
  },

  onCardFlipped(cardId, isNowFaceUp) {
    if (!isNowFaceUp) return;

    const store = useMemoryStore.getState();

    // Check if we have two cards flipped
    if (store.flippedCardIds.length === 2) {
      store.checkMatch();
    }
  },
};
```

### Pattern 5: Integration Contract

Complete mechanic interface:

```typescript
// src/mechanics/types.ts
interface Mechanic {
  // Metadata
  manifest: MechanicManifest;

  // Lifecycle
  lifecycle: MechanicLifecycle;

  // Data transformation
  dataTransformer?: MechanicDataTransformer;

  // Settings integration
  settingsOverride?: MechanicSettingsOverride;

  // Interaction handling
  interactionHandler?: MechanicInteractionHandler;

  // UI components
  components: {
    /** Panel content when mechanic is active */
    ActivePanel: React.ComponentType;
    /** Overlay shown on top of grid (scores, timer, etc.) */
    GridOverlay?: React.ComponentType;
    /** Custom card decorations */
    CardDecorator?: React.ComponentType<{ cardId: string }>;
  };

  // State access
  getState(): MechanicState;
  subscribe(listener: (state: MechanicState) => void): () => void;
}
```

## Architecture Options

### Option A: Deep Integration (Not Recommended)

Mechanics modify core components directly.

**Pros:**
- Maximum flexibility
- Direct state access

**Cons:**
- Tight coupling
- Hard to test
- Violates "Itemdeck = JSON viewer" principle
- Mechanics can break core functionality

### Option B: Hook-Based Integration (Recommended)

Mechanics provide transformers/handlers, core uses them.

**Pros:**
- Clean separation
- Core remains simple
- Easy to test mechanics independently
- Follows "JSON viewer" principle

**Cons:**
- More boilerplate
- Some limitations on what mechanics can do

### Option C: Event-Based Integration

Mechanics listen to events and dispatch commands.

**Pros:**
- Very loose coupling
- Good for complex interactions

**Cons:**
- Harder to understand flow
- Event ordering issues
- More complex debugging

## Recommendation

**Use Option B: Hook-Based Integration**

The core application provides "hooks" that mechanics can tap into:

```typescript
// src/hooks/useMechanicIntegration.ts
export function useMechanicIntegration() {
  const { activeMechanic } = useMechanic();

  // Transform cards if mechanic provides transformer
  const transformCards = useCallback((cards: DisplayCard[]) => {
    if (!activeMechanic?.dataTransformer) return cards;
    return activeMechanic.dataTransformer.transformCards(cards);
  }, [activeMechanic]);

  // Get settings with mechanic overrides applied
  const getEffectiveSettings = useCallback(<K extends keyof SettingsState>(
    key: K,
    baseValue: SettingsState[K]
  ): SettingsState[K] => {
    if (!activeMechanic?.settingsOverride?.overrides) return baseValue;
    const override = activeMechanic.settingsOverride.overrides[key];
    return override !== undefined ? override : baseValue;
  }, [activeMechanic]);

  // Check if setting is locked
  const isSettingLocked = useCallback((key: keyof SettingsState): boolean => {
    if (!activeMechanic?.settingsOverride?.locked) return false;
    return activeMechanic.settingsOverride.locked[key] ?? false;
  }, [activeMechanic]);

  // Handle card click with mechanic intercept
  const handleCardClick = useCallback((cardId: string, isFlipped: boolean): boolean => {
    if (!activeMechanic?.interactionHandler?.onCardClick) return false;
    return activeMechanic.interactionHandler.onCardClick(cardId, isFlipped);
  }, [activeMechanic]);

  return {
    transformCards,
    getEffectiveSettings,
    isSettingLocked,
    handleCardClick,
  };
}
```

## Implementation Plan for Memory Game

### Step 1: Update Mechanic Type Definition

Add new integration points to the existing Mechanic interface.

### Step 2: Create Data Transformer

Memory mechanic provides a transformer that:
- Duplicates each card with unique IDs
- Adds `_pairId` metadata for matching
- Shuffles the result

### Step 3: Create Settings Override

Memory mechanic declares:
- Locked settings (shuffle, max visible, default face)
- Override values (shuffle ON, max 2, face DOWN)

### Step 4: Create Interaction Handler

Memory mechanic provides:
- Click handler that validates game state
- Flip handler that checks for matches

### Step 5: Update CardGrid

CardGrid uses `useMechanicIntegration` hook to:
- Transform card list before rendering
- Apply effective settings
- Delegate click handling

### Step 6: Create MechanicButton Component

Floating button (bottom-right, above Help) that opens MechanicPanel.

### Step 7: Move Mechanics Tab Out of Settings

Remove MechanicsTab from SettingsPanel, replace with MechanicPanel.

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Search] [Filter] [Group] [View]              │ Statistics Bar  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │  Mechanic Overlay   │                      │
│                    │  (score, timer)     │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │
│   │     │  │     │  │     │  │     │  │     │  │     │         │
│   │Card │  │Card │  │Card │  │Card │  │Card │  │Card │         │
│   │     │  │     │  │     │  │     │  │     │  │     │         │
│   └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘         │
│                                                                 │
│   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │
│   │     │  │     │  │     │  │     │  │     │  │     │         │
│   │Card │  │Card │  │Card │  │Card │  │Card │  │Card │   [🎮]  │
│   │     │  │     │  │     │  │     │  │     │  │     │   [⚙️]  │
│   └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘   [❓]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

[🎮] = Mechanic Button (opens MechanicPanel)
[⚙️] = Settings Button (opens SettingsPanel)
[❓] = Help Button (opens HelpModal)
```

## Testing Strategy

### Unit Tests

```typescript
describe('Memory Data Transformer', () => {
  it('duplicates cards with unique IDs', () => {
    const cards = [{ id: 'card-1' }, { id: 'card-2' }];
    const result = memoryTransformer.transformCards(cards);
    expect(result).toHaveLength(4);
    expect(result.map(c => c.id)).toContain('card-1-a');
    expect(result.map(c => c.id)).toContain('card-1-b');
  });

  it('preserves card data in duplicates', () => {
    const cards = [{ id: 'card-1', title: 'Test' }];
    const result = memoryTransformer.transformCards(cards);
    expect(result[0].title).toBe('Test');
    expect(result[1].title).toBe('Test');
  });
});

describe('Memory Settings Override', () => {
  it('locks required settings', () => {
    expect(memorySettingsOverride.locked.shuffleOnLoad).toBe(true);
    expect(memorySettingsOverride.locked.maxVisibleCards).toBe(true);
  });

  it('overrides to correct values', () => {
    expect(memorySettingsOverride.overrides.shuffleOnLoad).toBe(true);
    expect(memorySettingsOverride.overrides.maxVisibleCards).toBe(2);
    expect(memorySettingsOverride.overrides.defaultCardFace).toBe('back');
  });
});
```

### Integration Tests

```typescript
describe('CardGrid with Memory Mechanic', () => {
  beforeEach(async () => {
    await activateMechanic('memory');
  });

  it('shows doubled card count', () => {
    const sourceCards = 10;
    const rendered = screen.getAllByRole('gridcell');
    expect(rendered).toHaveLength(sourceCards * 2);
  });

  it('starts all cards face down', () => {
    const cards = screen.getAllByRole('gridcell');
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-flipped', 'false');
    });
  });
});
```

## Migration Path

1. **v0.11.0** - Current: Basic mechanic structure without deep integration
2. **v0.12.0** - Add data transformer support, settings override
3. **v0.13.0** - Add interaction handlers, separate MechanicPanel
4. **v0.14.0** - Full memory game implementation

Or alternatively:
- Include all in v0.11.0 if prioritised

## References

- [R-005: Gaming Mechanics State Patterns](./R-005-gaming-mechanics-state.md)
- [R-006: Plugin State Isolation](./R-006-plugin-state-isolation.md)
- [Modular Architecture Research](./modular-architecture.md)
- [Plugin Architecture Patterns](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch03.html)

---

## Related Documentation

- [ADR-016: Gaming Mechanics Plugin Architecture](../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md)
- [ADR-017: Mechanic State Management](../decisions/adrs/ADR-017-mechanic-state-management.md)
- Feature Specification: F-XXX-mechanic-app-integration (to be created)

---

**Applies to**: Itemdeck v0.11.0+
