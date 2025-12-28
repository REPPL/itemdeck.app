# State of the Art: Plugin Architecture for React Applications

## Executive Summary

This document analyses plugin architecture patterns for React/Vite applications, specifically for itemdeck's mechanic system. The recommended approach is **Dynamic Imports with Registry** - a pattern that provides code splitting, lazy loading, and clean boundaries without the complexity of module federation.

---

## Landscape Overview

### Plugin Architecture Patterns

| Pattern | Complexity | Runtime Plugins | Bundle Impact | Best For |
|---------|------------|-----------------|---------------|----------|
| Dynamic Imports + Registry | Low | No | Automatic splitting | Single-team, known plugins |
| Module Federation | High | Yes | Shared deps config | Plugin marketplaces |
| Monorepo Packages | Medium | No | Per-package bundles | Large teams, OSS |
| iframe Sandboxing | Medium | Yes | Complete isolation | Security-critical |

### How Mature Projects Handle Plugins

| Project | Approach | Key Insight |
|---------|----------|-------------|
| **VS Code** | Separate processes + IPC | Complete isolation, crashes don't affect host |
| **Figma** | iframes + postMessage | Sandboxed execution, security-first |
| **Obsidian** | Dynamic script loading | Plugins are JS files loaded at runtime |
| **Notion** | No plugins (intentional) | Complexity avoided by not supporting it |

**Key insight:** All mature plugin systems started simpler than expected. VS Code's extension host evolved over years. Start simple, evolve if needed.

---

## Options Evaluated

### Option A: Dynamic Imports with Registry (Recommended)

**How it works:** Plugins are separate modules loaded via `import()`. A central registry maps plugin IDs to lazy loaders.

```typescript
// src/mechanics/registry.ts
const mechanicLoaders: Record<string, () => Promise<{ default: Mechanic }>> = {
  'memory-game': () => import('./memory-game'),
  'collection': () => import('./collection'),
  'snap-ranking': () => import('./snap-ranking'),
};

export async function loadMechanic(id: string): Promise<Mechanic> {
  const loader = mechanicLoaders[id];
  if (!loader) throw new Error(`Unknown mechanic: ${id}`);
  const module = await loader();
  return module.default;
}
```

**Pros:**
- Native to Vite/Rollup - zero configuration for code splitting
- Each plugin becomes a separate chunk automatically
- Simple mental model: one directory = one chunk
- Works with existing ADR-016 pattern

**Cons:**
- Plugins must be known at build time
- No true runtime plugin loading

**Verdict:** Best choice for itemdeck's current needs.

---

### Option B: Module Federation

**How it works:** Plugins are separate builds loaded at runtime from different origins.

```typescript
// vite.config.ts
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'itemdeck-core',
      remotes: {
        memoryGame: 'http://example.com/memory-game/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'zustand'],
    }),
  ],
});
```

**Pros:**
- True runtime loading from any URL
- Independent deployment of plugins
- Enables third-party plugin marketplace

**Cons:**
- Significant complexity (CORS, versioning, shared deps)
- Vite support is experimental
- Overkill for single-developer projects

**Verdict:** Consider only if third-party plugins become a requirement.

---

### Option C: Monorepo Packages

**How it works:** Each plugin is a separate npm package in a monorepo.

```
itemdeck/
├── packages/
│   ├── core/           # @itemdeck/core
│   ├── memory-game/    # @itemdeck/mechanic-memory-game
│   └── collection/     # @itemdeck/mechanic-collection
└── pnpm-workspace.yaml
```

**Pros:**
- Clear ownership boundaries
- Can publish plugins independently
- Works with tree-shaking

**Cons:**
- Monorepo tooling overhead
- More complex local development

**Verdict:** Consider for large teams or open-source projects.

---

## Settings Isolation Strategies

### Problem

Plugins need their own settings, but core should not know about plugin-specific configuration.

### Solution: Plugin-Provided Settings Schemas

Each plugin defines its own settings schema and UI:

```typescript
interface MechanicPlugin<TSettings = unknown> {
  id: string;
  name: string;

  // Settings
  settingsSchema: ZodSchema<TSettings>;
  defaultSettings: TSettings;
  SettingsPanel: ComponentType<MechanicSettingsProps<TSettings>>;

  // Core functionality
  CardOverlay?: ComponentType;
  GridOverlay?: ComponentType;
}

interface MechanicSettingsProps<TSettings> {
  settings: TSettings;
  onChange: (settings: Partial<TSettings>) => void;
  disabled?: boolean;
}
```

### Core Settings Store Pattern

Core stores plugin settings as opaque blobs:

```typescript
// src/stores/settings.ts
interface SettingsState {
  // Core settings (known to core)
  theme: 'light' | 'dark' | 'system';
  cardSize: number;

  // Plugin settings (opaque to core)
  mechanicSettings: Record<string, unknown>;

  getMechanicSettings: <T>(id: string, defaults: T) => T;
  setMechanicSettings: <T>(id: string, settings: T) => void;
}
```

**Key principle:** Core only stores settings as opaque blobs. Plugins own their schemas and validation.

---

## State Management Patterns

### Option A: Unified Store with Plugin Slices

```typescript
interface MechanicsState {
  activeMechanic: string | null;
  mechanicStates: Record<string, unknown>;

  getMechanicState: <T>(id: string) => T | undefined;
  setMechanicState: <T>(id: string, state: T) => void;
}
```

**Pros:** Single store, good DevTools visibility
**Cons:** Less type safety

### Option B: Per-Plugin Stores (Current itemdeck approach)

Each plugin creates its own Zustand store:

```typescript
// src/mechanics/memory-game/store.ts
export const useMemoryGameStore = create<MemoryGameState>(...);
```

**Pros:** Full type inference, complete isolation
**Cons:** Fragmented persistence, no coordinated state

### Recommendation

Keep per-plugin stores (Option B) but add abstraction layer for settings access. Core should never directly import plugin stores.

---

## Recommendation for itemdeck

### Architecture

1. **Keep Dynamic Imports + Registry** (ADR-016)
2. **Add settings abstraction** (new ADR-020)
3. **Remove direct store imports** from core components

### What Belongs in Core

```
src/
├── components/
│   ├── Card/           # Card rendering, flip animation
│   ├── Grid/           # Grid layout
│   └── Overlay/        # Slot-based overlay system
├── stores/
│   ├── cards.ts        # Card data
│   └── settings.ts     # Core + opaque plugin settings
└── mechanics/
    ├── registry.ts     # Plugin loading
    └── types.ts        # MechanicPlugin interface
```

### What Belongs in Plugins

```
src/mechanics/{plugin}/
├── index.tsx          # Plugin definition
├── store.ts           # Plugin state
├── Settings.tsx       # Settings UI component
└── components/        # Plugin-specific UI
```

### Communication Flow

```
┌─────────────────────────────────────────────────┐
│                  Core App                        │
│  Grid, Cards, Settings Store, Overlay Slots     │
└─────────────────────┬───────────────────────────┘
                      │ Plugin Contract
                      │ • CardOverlay
                      │ • GridOverlay
                      │ • Settings
                      │ • getSettings()
                      ▼
┌─────────────────────────────────────────────────┐
│                   Plugins                        │
│  Memory Game | Collection | Snap Ranking        │
└─────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Current (v0.11.x)
- Keep existing ADR-016 registry pattern
- Ensure each mechanic directory is a single dynamic import boundary

### Phase 2: Settings Isolation (v0.12.x)
- Define `MechanicPlugin` interface with `settingsSchema` and `SettingsPanel`
- Update settings store to use opaque `mechanicSettings` storage
- Remove direct plugin store imports from core

### Phase 3: Bundle Optimisation (Future)
- Add `manualChunks` configuration for explicit control
- Implement preloading for predicted plugin usage

### Phase 4: Runtime Plugins (If needed)
- Consider Module Federation only if third-party plugins become a requirement

---

## References

- [Vite Dynamic Imports](https://vitejs.dev/guide/features.html#dynamic-import)
- [Module Federation](https://module-federation.github.io/)
- [VS Code Extension Architecture](https://code.visualstudio.com/api/advanced-topics/extension-host)
- [Figma Plugin Sandbox](https://www.figma.com/plugin-docs/how-plugins-run/)

---

## Related Documentation

- [ADR-016: Mechanic Plugin Registry](../decisions/adrs/ADR-016-mechanic-plugin-registry.md)
- [ADR-017: Mechanic State Management](../decisions/adrs/ADR-017-mechanic-state-management.md)
- [ADR-018: Mechanic Overlay System](../decisions/adrs/ADR-018-mechanic-overlay-system.md)
- [ADR-020: Mechanic Settings Isolation](../decisions/adrs/ADR-020-mechanic-settings-isolation.md)
