# F-053: Mechanic Plugin Registry

## Problem Statement

Itemdeck needs a plugin system for gaming mechanics (Memory, Collection, Competing, Quiz, Snap Ranking). The registry must:

1. **Manage mechanics** - Register, discover, activate, deactivate
2. **Enforce exclusivity** - Only one mechanic active at a time
3. **Support lazy loading** - Load mechanic code on demand
4. **Provide lifecycle hooks** - onActivate, onDeactivate, onReset

## Design Approach

Create a central `MechanicRegistry` class that manages mechanic factories and instances.

### Registry Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MechanicRegistry                         │
├─────────────────────────────────────────────────────────────┤
│ factories: Map<id, () => Promise<Mechanic>>                 │
│ instances: Map<id, Mechanic>                                │
│ activeMechanicId: string | null                             │
├─────────────────────────────────────────────────────────────┤
│ register(id, factory)    → void                             │
│ activate(id)             → Promise<Mechanic>                │
│ deactivate()             → void                             │
│ getActive()              → Mechanic | null                  │
│ list()                   → MechanicManifest[]               │
│ unload(id)               → void (free memory)               │
└─────────────────────────────────────────────────────────────┘
```

### Mechanic Interface

```typescript
interface MechanicManifest {
  id: string;
  name: string;
  description: string;
  icon: ComponentType;
  version: string;
  requiredFields?: string[];
}

interface Mechanic {
  manifest: MechanicManifest;
  lifecycle: MechanicLifecycle;
  getState: () => MechanicState;
  subscribe: (listener) => () => void;
  getCardActions: () => CardActions;
  CardOverlay?: ComponentType;
  GridOverlay?: ComponentType;
  Settings?: ComponentType;
}
```

## Implementation Tasks

### Phase 1: Core Types

- [ ] Create `src/mechanics/types.ts` with all interfaces
- [ ] Define `MechanicManifest` interface
- [ ] Define `Mechanic` interface
- [ ] Define `MechanicState`, `MechanicLifecycle` interfaces

### Phase 2: Registry Implementation

- [ ] Create `src/mechanics/registry.ts`
- [ ] Implement `register(id, factory)` for factory registration
- [ ] Implement `activate(id)` with lazy loading
- [ ] Implement `deactivate()` with lifecycle cleanup
- [ ] Implement `getActive()` accessor
- [ ] Implement `list()` for UI rendering

### Phase 3: Settings Store Integration

- [ ] Add `activeMechanicId: string | null` to settingsStore
- [ ] Add `setActiveMechanicId(id)` action
- [ ] Add version migration for new field

### Phase 4: Registration Entry Point

- [ ] Create `src/mechanics/index.ts`
- [ ] Register mechanic factories with dynamic imports
- [ ] Export registry and hooks

## Success Criteria

- [ ] Can register mechanic factories
- [ ] Can activate a mechanic (creates instance if needed)
- [ ] Activating new mechanic deactivates previous one
- [ ] Lifecycle hooks called at correct times
- [ ] `list()` returns all registered mechanic manifests
- [ ] Lazy loading works (mechanic code not loaded until activated)

## Dependencies

- **Existing**: Zustand settingsStore
- **ADR**: [ADR-016: Gaming Mechanics Plugin Architecture](../../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md)

## Complexity

**Medium** - Core infrastructure for plugin system.

## Testing Strategy

- Unit tests for registry operations
- Test lazy loading with mock mechanics
- Test lifecycle hook invocation
- Test mutual exclusivity

---

## Related Documentation

- [ADR-016: Gaming Mechanics Plugin Architecture](../../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md)
- [R-006: Plugin State Isolation](../../research/R-006-plugin-state-isolation.md)
- [F-054: Mechanic Context Provider](./F-054-mechanic-context-provider.md)

---

**Status**: Planned
