# ADR-019: Configuration-First Mechanic Architecture

## Status

Proposed

## Context

Building on ADR-016 (Plugin Architecture) and the research in R-009 (Mechanic-Application Integration), we need to decide how much logic should live in mechanics versus core Itemdeck.

### Core Principle

**Itemdeck is a JSON viewer.** It displays information from JSON files with configurable presentation. Gaming mechanics should extend this by:

1. **Configuring existing behaviour differently** (primary)
2. **Adding minimal custom logic** (secondary, only when necessary)

### Memory Game Example Analysis

| Behaviour | Exists in Core? | Mechanic Provides |
|-----------|----------------|-------------------|
| Cards start face-down | ✅ `defaultCardFace: 'back'` | Setting override |
| Max 2 cards visible | ✅ `maxVisibleCards: 2` | Setting override |
| Cards shuffled | ✅ `shuffleOnLoad: true` | Setting override |
| Card duplication | ❌ Not in core | Data transformer |
| Match detection | ❌ Not in core | Custom logic |
| Score tracking | ❌ Not in core | Custom state |
| Win condition | ❌ Not in core | Custom logic |

**Key Insight:** 3 out of 7 behaviours are just setting overrides. Only 4 require custom code, and 3 of those (match detection, score, win) are related game state.

## Decision

Adopt a **Configuration-First Mechanic Architecture** where:

1. **Mechanics are primarily configuration files** that override settings
2. **Data transformation** is a declarative config where possible
3. **Custom logic is minimal** - only game-specific rules
4. **Core Itemdeck expands** to support mechanic needs through general features

### Mechanic Definition Structure

```typescript
interface MechanicDefinition {
  // Metadata
  manifest: MechanicManifest;

  // LAYER 1: Settings Configuration (no code needed)
  settingsOverrides: {
    // Values to force while mechanic is active
    values: Partial<SettingsState>;
    // Settings to lock (user can't change)
    locked: (keyof SettingsState)[];
    // Settings to hide from UI
    hidden: (keyof SettingsState)[];
  };

  // LAYER 2: Data Transformation Config
  dataTransform?: {
    // Card duplication (memory game)
    duplicate?: {
      enabled: true;
      suffixes: ['a', 'b'];  // Creates {id}-a, {id}-b
      pairIdField: '_pairId';  // Metadata field for matching
    };
    // Subset selection
    subset?: {
      count: number | 'all';
      method: 'random' | 'first' | 'last';
    };
    // Force shuffle after transform
    shuffleAfterTransform?: boolean;
  };

  // LAYER 3: Custom Logic (only when configuration isn't enough)
  customLogic?: {
    // State store factory
    createStore: () => MechanicStore;
    // Interaction handler
    interactionHandler?: MechanicInteractionHandler;
    // Win/end condition
    endCondition?: (state: MechanicState) => boolean;
  };

  // LAYER 4: UI Components
  components: {
    ActivePanel: React.ComponentType;  // Control panel
    GridOverlay?: React.ComponentType;  // Score, timer, etc.
    CardDecorator?: React.ComponentType<{ cardId: string }>;
  };
}
```

### Memory Game as Configuration

```typescript
// src/mechanics/memory/definition.ts
export const memoryMechanicDefinition: MechanicDefinition = {
  manifest: {
    id: 'memory',
    name: 'Memory Game',
    description: 'Match pairs of cards',
    icon: MemoryIcon,
    version: '1.0.0',
  },

  // LAYER 1: Just configuration - no code
  settingsOverrides: {
    values: {
      defaultCardFace: 'back',      // All cards start face-down
      maxVisibleCards: 2,           // Only 2 cards visible at once
      shuffleOnLoad: true,          // Always shuffle
      dragModeEnabled: false,       // Disable drag in memory mode
    },
    locked: [
      'defaultCardFace',
      'maxVisibleCards',
      'shuffleOnLoad',
      'dragModeEnabled',
    ],
    hidden: [
      'dragFace',  // Irrelevant when drag disabled
    ],
  },

  // LAYER 2: Declarative data transformation
  dataTransform: {
    duplicate: {
      enabled: true,
      suffixes: ['a', 'b'],
      pairIdField: '_pairId',
    },
    subset: {
      count: 8,  // Default: 8 pairs = 16 cards
      method: 'random',
    },
    shuffleAfterTransform: true,
  },

  // LAYER 3: Only match logic is truly custom
  customLogic: {
    createStore: () => createMemoryStore(),
    interactionHandler: memoryInteractionHandler,
    endCondition: (state) => state.matchedPairs === state.totalPairs,
  },

  // LAYER 4: UI
  components: {
    ActivePanel: MemoryControlPanel,
    GridOverlay: MemoryScoreOverlay,
  },
};
```

### What This Means for Core Itemdeck

Core should support these features (some already exist):

| Feature | Status | Used By |
|---------|--------|---------|
| `defaultCardFace` setting | ✅ Exists | Memory (force back) |
| `maxVisibleCards` setting | ✅ Exists | Memory (force 2) |
| `shuffleOnLoad` setting | ✅ Exists | Memory (force on) |
| Settings override API | 🆕 Needed | All mechanics |
| Card duplication transform | 🆕 Needed | Memory |
| Subset/sampling | ✅ Exists (`randomSelectionCount`) | Memory |
| Mechanic-aware click handling | 🆕 Needed | Memory, Quiz |
| Grid overlay slot | 🆕 Needed | All mechanics |

### Benefits of Configuration-First

1. **Most mechanic behaviour is zero-code** - just JSON/config
2. **Core Itemdeck gains features** that benefit non-gaming use too
3. **Easy to create new mechanics** - copy config, tweak values
4. **Clear separation** - game logic is small and isolated
5. **Easier testing** - test config separately from logic
6. **Less maintenance** - fewer custom code paths

## Implementation Guidelines

### When to Add Core Feature vs Mechanic Logic

Add to **Core Itemdeck** when:
- Feature is generally useful (not game-specific)
- Feature is about display/configuration
- Feature can be expressed as a setting
- Multiple mechanics would benefit

Add to **Mechanic** when:
- Logic is game-specific (scoring, win conditions)
- Logic requires game state tracking
- Logic involves timing/sequences

### Example: Should Card Matching Be Core?

**Question:** Should "cards match if they share an attribute" be a core feature?

**Analysis:**
- ✅ Could be useful for non-gaming (highlight related cards)
- ✅ Multiple mechanics could use (Memory, Quiz)
- ❌ Matching rules vary per mechanic
- ❌ Game-specific (what counts as "match")

**Decision:** Keep matching logic in mechanics. Core provides metadata (pairId), mechanic decides match rules.

## Consequences

### Positive

- **Smaller mechanic codebase** - mostly configuration
- **Better factored core** - features split out properly
- **Easier mechanic development** - less to implement
- **Reusable patterns** - same transform works across mechanics
- **Declarative** - configuration is easier to understand than code

### Negative

- **Core grows** - more settings, more code paths
- **Indirection** - config interpreted at runtime
- **Limited flexibility** - unusual mechanics might not fit pattern
- **Migration** - existing mechanic code needs refactoring

### Mitigations

- **Escape hatch** - `customLogic` layer for anything config can't handle
- **Feature flags** - new core features behind flags during development
- **Gradual migration** - don't refactor all mechanics at once

## Migration Plan

### Phase 1: Core Enhancements (v0.11.x)

1. Add settings override API
2. Add data transformer pipeline
3. Add grid overlay slot
4. Add mechanic-aware click handling

### Phase 2: Memory Game Refactor (v0.12.0)

1. Convert Memory to configuration-first
2. Extract reusable transforms (duplicate, subset)
3. Minimal custom logic (match detection, scoring)

### Phase 3: Other Mechanics (v0.13.0+)

1. Collection - mostly config (owned/wishlist toggles)
2. Quiz - config + question logic
3. Snap Ranking - config + rating logic

---

## Related Documentation

- [ADR-016: Gaming Mechanics Plugin Architecture](./ADR-016-gaming-mechanics-plugin-architecture.md)
- [R-009: Mechanic-Application Integration](../../research/R-009-mechanic-app-integration.md)
- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)

---

**Applies to**: Itemdeck v0.11.0+
