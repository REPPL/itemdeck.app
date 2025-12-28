# ADR-020: Mechanic Settings Isolation

## Status

Accepted

## Context

The mechanic plugin system (ADR-016, ADR-017, ADR-018) successfully enables isolated mechanics with their own state stores. However, the current implementation has gaps in how mechanic settings are accessed and managed:

### Current Gaps

| Gap | Location | Problem |
|-----|----------|---------|
| Direct store import | `CardGrid.tsx:14` | Core imports `useMemoryStore` to read `pairCount` |
| No settings accessor | `Mechanic.Settings` | Component has no props - can't receive settings from parent |
| No `getSettings()` | `Mechanic` interface | No standard way for core to read mechanic settings |
| Fragmented persistence | Each store persists independently | No unified strategy for collection-scoped settings |

### Direct Import Problem

```typescript
// src/components/CardGrid/CardGrid.tsx (current - problematic)
import { useMemoryStore } from "@/mechanics/memory/store";

// CardGrid directly couples to Memory mechanic
const memoryPairCount = useMemoryStore((s) => s.pairCount);
```

This violates the plugin isolation principle. Core components should not know about specific mechanic implementations.

### Settings Access Pattern Requirements

1. **Core reads mechanic settings** - For display configuration (e.g., pair count affects card grid)
2. **Core renders mechanic settings UI** - Settings panel renders mechanic-provided component
3. **Settings isolated from core** - Core stores settings as opaque blobs
4. **Type safety** - Mechanics define their own settings types
5. **Collection overrides** - Collection `settings.json` can override mechanic defaults

## Decision

Add **settings accessor pattern** to the `Mechanic` interface, enabling core to access and modify mechanic settings without direct store imports.

### Interface Additions

```typescript
// src/mechanics/types.ts

/**
 * Props for mechanic settings component.
 */
export interface MechanicSettingsProps<TSettings = unknown> {
  /** Current settings values */
  settings: TSettings;
  /** Callback to update settings */
  onChange: (settings: Partial<TSettings>) => void;
  /** Whether settings are disabled (e.g., during active game) */
  disabled?: boolean;
}

/**
 * Extended mechanic interface with settings support.
 */
export interface Mechanic<TSettings = unknown> {
  // ... existing fields

  /** Get current mechanic settings */
  getSettings?: () => TSettings;

  /** Update mechanic settings */
  setSettings?: (settings: Partial<TSettings>) => void;

  /** Optional settings component with props */
  Settings?: ComponentType<MechanicSettingsProps<TSettings>>;

  /** Default settings values */
  defaultSettings?: TSettings;

  /** Settings schema for validation (optional) */
  settingsSchema?: ZodSchema<TSettings>;
}
```

### Memory Mechanic Settings Type

```typescript
// src/mechanics/memory/types.ts
export interface MemorySettings {
  difficulty: MemoryDifficulty;
  pairCount: PairCount;
}
```

### Implementation Pattern

```typescript
// src/mechanics/memory/index.tsx
export const memoryMechanic: Mechanic<MemorySettings> = {
  // ... existing fields

  getSettings: () => {
    const state = useMemoryStore.getState();
    return {
      difficulty: state.difficulty,
      pairCount: state.pairCount,
    };
  },

  setSettings: (settings) => {
    const store = useMemoryStore.getState();
    if (settings.difficulty !== undefined) {
      store.setDifficulty(settings.difficulty);
    }
    if (settings.pairCount !== undefined) {
      store.setPairCount(settings.pairCount);
    }
  },

  defaultSettings: {
    difficulty: "easy",
    pairCount: 6,
  },

  Settings: MemorySettingsPanel,
};
```

### Core Usage Pattern

```typescript
// src/components/CardGrid/CardGrid.tsx (after refactor)
import { useMechanic } from "@/mechanics/context";

function CardGrid({ cards }: CardGridProps) {
  const { mechanic } = useMechanic();

  // Access settings through mechanic interface, not direct store import
  const pairCount = useMemo(() => {
    if (mechanic?.manifest.id === "memory" && mechanic.getSettings) {
      return (mechanic.getSettings() as MemorySettings).pairCount;
    }
    return cards.length;
  }, [mechanic, cards.length]);

  // ...
}
```

### Settings Panel Integration

```typescript
// src/components/SettingsPanel/MechanicSettings.tsx
function MechanicSettings() {
  const { mechanic } = useMechanic();

  if (!mechanic?.Settings || !mechanic.getSettings) {
    return null;
  }

  const settings = mechanic.getSettings();

  const handleChange = (newSettings: Partial<unknown>) => {
    mechanic.setSettings?.(newSettings);
  };

  // Check if settings should be disabled (e.g., game in progress)
  const isDisabled = mechanic.getState().isActive;

  return (
    <mechanic.Settings
      settings={settings}
      onChange={handleChange}
      disabled={isDisabled}
    />
  );
}
```

## Consequences

### Positive

- **Proper isolation** - Core never imports mechanic-specific stores
- **Type-safe settings** - Each mechanic defines its own settings type
- **Controlled access** - Settings flow through defined interface
- **Testable** - Can mock mechanic settings in tests
- **Future-proof** - Pattern supports collection-scoped settings overrides

### Negative

- **Slight indirection** - One more layer to access settings
- **Migration effort** - Existing direct imports must be refactored
- **Type gymnastics** - Generic settings type requires casting in some contexts

### Mitigations

- **Helper hooks** - Create `useMechanicSettings<T>()` for type-safe access
- **Gradual migration** - Remove direct imports incrementally
- **Documentation** - Clear examples in mechanic template

## Migration Steps

### Step 1: Update `src/mechanics/types.ts`

Add `MechanicSettingsProps`, `getSettings`, `setSettings`, `defaultSettings` to interface.

### Step 2: Update Memory Mechanic

1. Create `src/mechanics/memory/types.ts` with `MemorySettings`
2. Add `getSettings()`, `setSettings()`, `defaultSettings` to `memoryMechanic`
3. Create `src/mechanics/memory/Settings.tsx` component

### Step 3: Refactor CardGrid

Remove direct `useMemoryStore` import. Access pair count through `mechanic.getSettings()`.

### Step 4: Update MechanicProvider

Expose settings through context if needed for convenience.

## Collection Settings Override

This pattern supports future collection-level settings overrides:

```json
// data/collections/commercials/settings.json
{
  "mechanics": {
    "memory": {
      "difficulty": "hard",
      "pairCount": 8
    }
  }
}
```

Core loads these and passes to `mechanic.setSettings()` on collection load.

## Alternatives Considered

### Global Settings Store

Store all mechanic settings in a central `settingsStore`:

```typescript
interface SettingsState {
  mechanicSettings: Record<string, unknown>;
}
```

**Rejected:** Loses type safety, makes settings harder to locate.

### Settings as Part of State

Include settings in `MechanicState`:

```typescript
interface MechanicState {
  isActive: boolean;
  settings: unknown;
}
```

**Rejected:** Conflates runtime state with configuration.

### Render Props for Settings

Pass settings via render prop instead of component prop:

```typescript
interface Mechanic {
  renderSettings?: (props: SettingsProps) => ReactNode;
}
```

**Rejected:** Less idiomatic, harder to optimise with React.memo.

---

## Related Documentation

- [ADR-016: Gaming Mechanics Plugin Architecture](./ADR-016-gaming-mechanics-plugin-architecture.md)
- [ADR-017: Mechanic State Management](./ADR-017-mechanic-state-management.md)
- [ADR-018: Mechanic UI Overlay System](./ADR-018-mechanic-ui-overlay.md)
- [SOTA: Plugin Architecture](../../research/state-of-the-art-plugin-architecture.md)

---

**Applies to**: Itemdeck v0.12.0+
