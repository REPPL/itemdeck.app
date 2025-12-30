# F-128: Mechanic Plugins (External)

## Problem Statement

Game mechanics are currently built into the application:

1. **No extensibility** - Cannot add new game modes without code changes
2. **No community mechanics** - Users cannot share custom mechanics
3. **Coupled implementation** - Mechanics tightly coupled to core app
4. **No variations** - Cannot create variants of existing mechanics

## Design Approach

Allow mechanics to be distributed as external plugins:

- Mechanics define their UI, logic, and requirements via plugin API
- Use existing mechanic infrastructure (overlays, stores, lifecycle)
- Sandbox execution for security
- Support for mechanic-specific settings

### Mechanic Plugin Structure

```
my-mechanic/
├── manifest.json           # Plugin manifest
├── index.tsx               # Main entry point
├── components/
│   ├── Overlay.tsx         # Main mechanic UI
│   ├── Controls.tsx        # Game controls
│   └── Results.tsx         # Score/results display
├── store.ts                # Mechanic state (optional)
├── styles.css              # Mechanic styles
└── assets/
    └── icon.svg            # Mechanic icon
```

### Mechanic Manifest

```json
{
  "$schema": "https://itemdeck.app/schemas/plugin.json",
  "id": "card-trivia",
  "type": "mechanic",
  "name": "Card Trivia",
  "description": "Test your knowledge with trivia questions",
  "permissions": ["cards:read", "ui:overlay", "settings:read"],
  "mechanic": {
    "category": "game",
    "minCards": 10,
    "maxCards": 100,
    "requirements": [
      "collection.hasField('description')",
      "collection.size >= 10"
    ],
    "icon": "./assets/icon.svg"
  }
}
```

### Mechanic API

```typescript
interface MechanicPluginAPI {
  // Card access
  cards: {
    getAll(): ReadonlyArray<Card>;
    getRandom(count: number): ReadonlyArray<Card>;
    getFiltered(filter: CardFilter): ReadonlyArray<Card>;
  };

  // UI
  ui: {
    showOverlay(component: React.FC<OverlayProps>): void;
    hideOverlay(): void;
    showNotification(message: string): void;
  };

  // State
  state: {
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    subscribe<T>(key: string, callback: (value: T) => void): () => void;
  };

  // Lifecycle
  lifecycle: {
    onActivate(callback: () => void): void;
    onDeactivate(callback: () => void): void;
    onSettingsChange(callback: (settings: Record<string, unknown>) => void): void;
  };

  // Scoring
  scoring: {
    reportScore(score: number, metadata?: Record<string, unknown>): void;
    getHighScores(): Score[];
  };
}
```

## Implementation Tasks

### Phase 1: Mechanic Plugin Interface

- [ ] Create `src/plugins/mechanics/types.ts`
- [ ] Define MechanicPluginAPI
- [ ] Create mechanic plugin base class
- [ ] Define overlay component contract

### Phase 2: Plugin Adapter

- [ ] Create `src/plugins/mechanics/adapter.ts`
- [ ] Bridge plugin API to existing mechanic infrastructure
- [ ] Handle plugin lifecycle (activate/deactivate)
- [ ] Integrate with mechanic registry

### Phase 3: Convert Built-in Mechanics

- [ ] Create adapter for Memory mechanic
- [ ] Create adapter for Quiz mechanic
- [ ] Create adapter for Competing mechanic
- [ ] Create adapter for Collection mechanic
- [ ] Create adapter for Snap Ranking mechanic

### Phase 4: External Mechanic Loading

- [ ] Load mechanic plugins from registry
- [ ] Validate mechanic requirements
- [ ] Display mechanic in Play tab
- [ ] Handle mechanic-specific settings

### Phase 5: Testing & Documentation

- [ ] Create mechanic plugin template
- [ ] Write mechanic development guide
- [ ] Add E2E tests for plugin mechanics
- [ ] Document API reference

## Success Criteria

- [ ] Built-in mechanics work through plugin interface
- [ ] External mechanics loadable from URL
- [ ] Mechanic requirements validated before activation
- [ ] Plugin mechanics appear in Play tab
- [ ] High scores persist for plugin mechanics
- [ ] Settings work for plugin mechanics

## Dependencies

- **F-122**: Plugin Manifest Schema - Mechanic manifest structure
- **F-123**: Plugin Loader & Registry - Mechanic loading
- **F-124**: Plugin Security Sandbox - Mechanic execution
- **F-126**: Settings Schema Plugins - Mechanic settings

## Complexity

**High** - Requires bridging complex existing mechanic system to plugin API.

## Estimated Effort

**16-20 hours**

---

## Related Documentation

- [Mechanic Plugin Registry](../completed/F-053-mechanic-plugin-registry.md)
- [ADR-016: Mechanic Plugin Architecture](../../decisions/adrs/ADR-016-mechanic-plugin-architecture.md)
- [F-122: Plugin Manifest Schema](./F-122-plugin-manifest-schema.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
