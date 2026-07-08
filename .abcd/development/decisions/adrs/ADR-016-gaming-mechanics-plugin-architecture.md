# ADR-016: Gaming Mechanics Plugin Architecture

## Status

Accepted

## Context

Itemdeck needs a plugin architecture for gaming mechanics - different interactive modes for cards (Memory Game, Collection tracking, Top Trumps, Quiz, Snap Ranking). Requirements:

1. Only ONE mechanic can be active at a time (mutually exclusive)
2. Mechanics should be self-contained and independently testable
3. Support future addition of new mechanics without core changes
4. Each mechanic may need custom UI overlays on cards/grid
5. Code splitting for bundle size optimisation

We evaluated several approaches:

| Pattern | Complexity | Isolation | Extensibility | Bundle Impact |
|---------|------------|-----------|---------------|---------------|
| **Registry + Factory** | Medium | Excellent | Excellent | Good (lazy) |
| **Switch Statement** | Low | Poor | Poor | Poor (bundled) |
| **Module Federation** | High | Excellent | Excellent | Excellent |
| **Context Inheritance** | Low | Moderate | Moderate | Poor |

## Decision

Use a **Mechanic Registry with Factory Pattern** and lazy loading.

```
┌─────────────────────────────────────────────────────────────┐
│                    MechanicRegistry                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ factories: Map<id, () => Promise<Mechanic>>             │ │
│ │ instances: Map<id, Mechanic>  // Lazily created         │ │
│ │ activeMechanicId: string | null                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Methods:                                                    │
│   register(id, factory)  - Register a mechanic factory     │
│   activate(id)           - Create/activate a mechanic      │
│   deactivate()           - Deactivate current mechanic     │
│   getActive()            - Get active mechanic instance    │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │ Memory  │         │ Quiz    │         │  Snap   │
    │ Mechanic│         │ Mechanic│         │ Ranking │
    └─────────┘         └─────────┘         └─────────┘
```

## Mechanic Interface

```typescript
interface MechanicManifest {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  version: string;
  requiredFields?: string[];  // e.g., ['rank'] for Competing
}

interface Mechanic {
  manifest: MechanicManifest;

  lifecycle: {
    onActivate: () => void;
    onDeactivate: () => void;
    onReset: () => void;
  };

  getState: () => MechanicState;
  subscribe: (listener: (state: MechanicState) => void) => () => void;

  getCardActions: () => {
    onCardClick: (cardId: string, card: DisplayCard) => void;
    preventDefaultFlip: boolean;
  };

  // Optional UI components
  CardOverlay?: ComponentType<CardOverlayProps>;
  GridOverlay?: ComponentType<GridOverlayProps>;
  Settings?: ComponentType<MechanicSettingsProps>;
}
```

## Consequences

### Positive

- **Clean separation** - Each mechanic is a self-contained module
- **Lazy loading** - Mechanics loaded on demand, reduces initial bundle
- **Easy testing** - Test mechanics in isolation
- **Extensible** - Add new mechanics without modifying core
- **Type-safe** - Full TypeScript support via interfaces
- **Single active** - Registry enforces mutual exclusivity

### Negative

- **Boilerplate** - Each mechanic needs manifest, lifecycle, etc.
- **Indirect access** - Components access mechanics via registry/context
- **Learning curve** - Contributors must understand plugin pattern

### Mitigations

- **Base class/helper** - Provide `createMechanic()` factory helper
- **Documentation** - Clear guide for creating new mechanics
- **Examples** - Memory and Collection as reference implementations

## Registration Pattern

```typescript
// src/mechanics/index.ts
import { mechanicRegistry } from './registry';

// Register factories (not instances) for lazy loading
mechanicRegistry.register('memory', async () => {
  const { createMemoryMechanic } = await import('./memory');
  return createMemoryMechanic();
});

mechanicRegistry.register('collection', async () => {
  const { createCollectionMechanic } = await import('./collection');
  return createCollectionMechanic();
});

// ... other mechanics
```

## Integration Points

### Settings Panel

New "Mechanics" tab with radio button selection:

```
┌──────────────────────────────────────┐
│ Select Mechanic                      │
├──────────────────────────────────────┤
│ ○ None (Browse mode)                 │
│ ● Memory Game - Match pairs          │
│ ○ Collection - Track owned items     │
│ ○ Competing - Compare card stats     │
│ ○ Quiz - Guess the card              │
│ ○ Snap Ranking - Rate on the spot    │
└──────────────────────────────────────┘
```

### CardGrid Integration

```typescript
// CardGrid.tsx
const mechanic = useActiveMechanic();

const handleCardClick = (cardId: string) => {
  if (mechanic) {
    const actions = mechanic.getCardActions();
    actions.onCardClick(cardId, cards.find(c => c.id === cardId)!);

    if (actions.preventDefaultFlip) {
      return;  // Mechanic handled the click
    }
  }

  // Default flip behaviour
  handleFlip(cardId);
};
```

### Card Overlay Slot

```tsx
// Card.tsx
<div className="card">
  <CardInner /* ... */ />
  {mechanic?.CardOverlay && (
    <mechanic.CardOverlay card={card} state={mechanicState} />
  )}
</div>
```

## Alternatives Considered

### Switch Statement in CardGrid

- Check `activeMechanicId` and render accordingly
- **Rejected**: Tightly couples core to mechanics, no lazy loading

### Module Federation (Webpack 5)

- Load mechanics from separate builds
- **Rejected**: Overkill, complex setup, Vite compatibility issues

### Context-Based Inheritance

- Each mechanic provides its own Context
- **Rejected**: Complex nesting, prop drilling, no central control

### Event-Based System

- Core emits events, mechanics subscribe
- **Rejected**: Loose coupling makes debugging harder, no type safety

---

## Related Documentation

- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)
- [R-006: Plugin State Isolation](../../research/R-006-plugin-state-isolation.md)
- [ADR-017: Mechanic State Management](./ADR-017-mechanic-state-management.md)
- [Modular Architecture Research](../../research/modular-architecture.md)

---

**Applies to**: Itemdeck v0.11.0+
