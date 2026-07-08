# F-130: Built-in Plugin Bundling

## Problem Statement

Core functionality must be available without network access:

1. **Offline support** - App must work without internet
2. **Fast startup** - No network delay for core features
3. **Guaranteed availability** - Core plugins always present
4. **Single bundle** - Efficient distribution

## Design Approach

Bundle essential plugins directly with the application:

- Built-in plugins compiled into main bundle
- No network requests required for core functionality
- Instant availability on startup
- Cannot be disabled (always active)

### Built-in Plugin Categories

| Category | Plugins | Purpose |
|----------|---------|---------|
| **Themes** | Minimal, Retro, Modern, High Contrast | Core visual options |
| **Mechanics** | Collection, Memory, Quiz, Competing, Snap Ranking | Core game modes |
| **Sources** | GitHub | Primary data source |
| **Settings** | Default settings schema | Core configuration |

### Bundle Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Bundle                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Core Application Code                                   ││
│  │  • React components                                      ││
│  │  • State management                                      ││
│  │  • Plugin infrastructure                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Built-in Plugins (always loaded)                        ││
│  │                                                          ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        ││
│  │  │ Themes      │ │ Mechanics   │ │ Sources     │        ││
│  │  │ • minimal   │ │ • collection│ │ • github    │        ││
│  │  │ • retro     │ │ • memory    │ │             │        ││
│  │  │ • modern    │ │ • quiz      │ │             │        ││
│  │  │ • contrast  │ │ • competing │ │             │        ││
│  │  │             │ │ • snap-rank │ │             │        ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'core': ['react', 'zustand', 'zod'],
          'plugins-themes': [
            './src/plugins/builtin/themes/minimal',
            './src/plugins/builtin/themes/retro',
            './src/plugins/builtin/themes/modern',
            './src/plugins/builtin/themes/high-contrast',
          ],
          'plugins-mechanics': [
            './src/plugins/builtin/mechanics/collection',
            './src/plugins/builtin/mechanics/memory',
            './src/plugins/builtin/mechanics/quiz',
            './src/plugins/builtin/mechanics/competing',
            './src/plugins/builtin/mechanics/snap-ranking',
          ],
          'plugins-sources': [
            './src/plugins/builtin/sources/github',
          ],
        },
      },
    },
  },
});
```

## Implementation Tasks

### Phase 1: Plugin Directory Structure

- [ ] Create `src/plugins/builtin/` directory
- [ ] Create subdirectories: themes/, mechanics/, sources/
- [ ] Define built-in plugin manifest format
- [ ] Create plugin registration module

### Phase 2: Convert Existing Code

- [ ] Move theme code to `builtin/themes/`
- [ ] Move mechanic code to `builtin/mechanics/`
- [ ] Move GitHub source to `builtin/sources/`
- [ ] Create manifest.json for each

### Phase 3: Bundle Integration

- [ ] Update Vite config for plugin chunks
- [ ] Implement lazy loading for plugin chunks
- [ ] Add preloading for critical plugins
- [ ] Optimise bundle size

### Phase 4: Registry Integration

- [ ] Auto-register built-in plugins on startup
- [ ] Mark built-in plugins in registry UI
- [ ] Prevent disabling built-in plugins
- [ ] Show "built-in" badge in plugin list

### Phase 5: Offline Verification

- [ ] Test app works completely offline
- [ ] Verify all built-in plugins load without network
- [ ] Test Service Worker caching
- [ ] Document offline capabilities

## Success Criteria

- [ ] All built-in plugins bundled with app
- [ ] No network requests for core functionality
- [ ] Bundle size within 200KB gzip limit
- [ ] Built-in plugins clearly marked in UI
- [ ] Offline mode fully functional

## Dependencies

- **F-122**: Plugin Manifest Schema - Manifest format
- **F-123**: Plugin Loader & Registry - Registration

## Complexity

**Medium** - Primarily build configuration and code organisation.

## Estimated Effort

**8-10 hours**

---

## Related Documentation

- [Bundle Optimisation](../completed/F-016-bundle-optimisation.md)
- [F-122: Plugin Manifest Schema](./F-122-plugin-manifest-schema.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
