# F-123: Plugin Loader & Registry

## Problem Statement

Itemdeck has no unified system to load and manage plugins:

1. **No dynamic loading** - Plugins cannot be added at runtime
2. **No registry** - No central place to discover available plugins
3. **No lifecycle** - No consistent activation/deactivation flow
4. **No conflict detection** - Multiple plugins could conflict

## Design Approach

Create a central plugin loader and registry that:

- Discovers and loads plugins from multiple sources
- Maintains a registry of available and active plugins
- Handles plugin lifecycle (load, activate, deactivate, unload)
- Detects and resolves conflicts

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Plugin Registry                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Built-in    │  │ Curated     │  │ Community   │         │
│  │ Plugins     │  │ Plugins     │  │ Plugins     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Plugin Loader                               │ │
│  │  • Manifest validation                                   │ │
│  │  • Dependency resolution                                 │ │
│  │  • Sandbox creation                                      │ │
│  │  • Lifecycle management                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Active Plugins                              │ │
│  │  themes: [minimal, retro]                               │ │
│  │  mechanics: [memory, quiz, competing]                   │ │
│  │  sources: [github]                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Registry State

```typescript
interface PluginRegistry {
  available: Map<string, PluginManifest>;
  active: Map<string, LoadedPlugin>;
  loading: Set<string>;
  errors: Map<string, PluginError>;
}

interface LoadedPlugin {
  manifest: PluginManifest;
  instance: PluginInstance;
  sandbox: PluginSandbox;
  activatedAt: Date;
}
```

## Implementation Tasks

### Phase 1: Registry Store

- [ ] Create `src/stores/pluginStore.ts` using Zustand
- [ ] Define registry state shape
- [ ] Implement CRUD operations for plugins
- [ ] Add persistence for user-activated plugins

### Phase 2: Plugin Loader

- [ ] Create `src/plugins/loader/index.ts`
- [ ] Implement manifest fetching and validation
- [ ] Implement dependency resolution
- [ ] Handle circular dependency detection

### Phase 3: Lifecycle Management

- [ ] Implement `loadPlugin(manifest)` - Validate and prepare
- [ ] Implement `activatePlugin(id)` - Start and integrate
- [ ] Implement `deactivatePlugin(id)` - Stop and cleanup
- [ ] Implement `unloadPlugin(id)` - Remove completely

### Phase 4: Built-in Plugin Discovery

- [ ] Create `src/plugins/builtin/index.ts`
- [ ] Register existing themes as built-in plugins
- [ ] Register existing mechanics as built-in plugins
- [ ] Register GitHub source as built-in plugin

### Phase 5: Integration

- [ ] Integrate with theme system
- [ ] Integrate with mechanics system
- [ ] Integrate with source system
- [ ] Integrate with settings system

## Success Criteria

- [ ] All built-in plugins registered in registry
- [ ] Plugins can be activated/deactivated without reload
- [ ] Dependency conflicts detected and reported
- [ ] Plugin state persists across sessions
- [ ] Clean error handling for failed plugins

## Dependencies

- **F-122**: Plugin Manifest Schema - Defines what can be loaded
- **F-124**: Plugin Security Sandbox - Where plugins execute
- **Zustand**: State management (already in project)

## Complexity

**High** - Central coordination point for entire plugin system.

## Estimated Effort

**12-16 hours**

---

## Related Documentation

- [Plugin Architecture Research](../../research/state-of-the-art-plugin-architecture.md)
- [F-122: Plugin Manifest Schema](./F-122-plugin-manifest-schema.md)
- [F-124: Plugin Security Sandbox](./F-124-plugin-security-sandbox.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
