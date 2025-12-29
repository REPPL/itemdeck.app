# v0.13.0 Development Log: Modular Plugin Architecture

## Overview

v0.13.0 implements the foundational modular plugin architecture for itemdeck, transforming the application into an extensible platform where themes, mechanics, and sources are all plugins.

## Implementation Narrative

### Phase 1: Plugin Core Infrastructure (WP-A)

The plugin system was built from the ground up with these core components:

**Plugin Schemas (`src/plugins/schemas/`)**
- Core manifest schema with Zod validation
- Contribution schemas for themes, mechanics, settings, and sources
- Capability definitions for plugin permissions
- Type-safe interfaces for all plugin components

**Plugin Store (`src/stores/pluginStore.ts`)**
- Zustand-based state management with persistence
- Tracks installed plugins, configurations, and permissions
- Manages active themes, mechanics, and sources
- Provides capability granting/revoking

**Plugin Loader (`src/plugins/loader/`)**
- `pluginLoader.ts` - Main loader with validation and caching
- `lazyLoader.ts` - On-demand loading with preload strategies
- Built-in plugin registration for bundled plugins
- URL-based loading for community plugins

**Plugin Cache (`src/plugins/cache/pluginCache.ts`)**
- IndexedDB-based caching for manifests and assets
- Offline support with TTL-based expiration
- Efficient storage for plugin data

**Security System (`src/plugins/security/`)**
- `capabilities.ts` - Tier-based capability definitions
- `permissionManager.ts` - Grant/revoke logic with consent handling
- Blocked capabilities for community plugins (dangerous:eval, dangerous:dom)

**Validation Pipeline (`src/plugins/validation/validator.ts`)**
- Schema validation with Zod
- Semantic validation for manifests
- Security checks for community plugins
- Content policy enforcement

### Phase 2: Plugin Migration (WP-B)

**Adapters Created (`src/plugins/integration/`)**
- `themeAdapter.ts` - Applies theme tokens as CSS variables
- `mechanicAdapter.ts` - Integrates with mechanic registry
- `settingsAdapter.ts` - Merges plugin settings into UI
- `sourceAdapter.ts` - Registers data sources

**Built-in Plugins Migrated (`src/plugins/builtin/`)**
- **Themes**: retro, modern, minimal - each with manifest.json, theme.css, index.ts
- **Mechanics**: memory, snap-ranking - wrapped existing implementations
- **Sources**: github - wraps existing GitHub discovery

## Challenges Encountered

### JSON Import Type Inference
TypeScript infers JSON imports with literal string types as `string`, not the specific union types expected by Zod schemas. Solved using `as unknown as Type` assertions with documentation notes.

### Schema-Manifest Alignment
The existing mechanic manifests used different field names than the new contribution schemas (e.g., `entry` vs `entrypoint`, `type` vs `category`). Documented as known mismatch for future alignment.

### Store Method Naming
Initial adapter implementations used `setActiveMechanics/setActiveSources` but the store provides `addActiveMechanic/addActiveSource`. Fixed to use correct method names.

### Unused Parameter Warnings
TypeScript strict mode flagged unused parameters. Prefixed with underscore (e.g., `_pluginId`) where parameters are reserved for future use.

## Code Highlights

### Capability-Based Security Model
```typescript
// Access levels per distribution tier
const CAPABILITY_TIERS: Record<Capability, Record<PluginTier, CapabilityAccess>> = {
  "storage:local": { builtin: "allowed", official: "allowed", community: "consent" },
  "dangerous:eval": { builtin: "allowed", official: "blocked", community: "blocked" },
  // ...
};
```

### Lazy Loading with Deduplication
```typescript
async load(source: PluginSource): Promise<LoadedPlugin> {
  const key = this.getSourceKey(source);
  const existing = this.loadPromises.get(key);
  if (existing) return existing;
  // ...
}
```

### CSS Variable Generation from Theme Tokens
```typescript
function themeToCSSVariables(theme: ThemeContribution): Record<string, string> {
  const vars: Record<string, string> = {};
  if (theme.colours) {
    if (theme.colours.primary) vars["--colour-primary"] = theme.colours.primary;
    // ...
  }
  return vars;
}
```

## Files Created

### Plugin Schemas
- `src/plugins/schemas/manifest.ts`
- `src/plugins/schemas/contributions/theme.ts`
- `src/plugins/schemas/contributions/mechanic.ts`
- `src/plugins/schemas/contributions/settings.ts`
- `src/plugins/schemas/contributions/source.ts`
- `src/plugins/schemas/index.ts`

### Plugin Infrastructure
- `src/stores/pluginStore.ts`
- `src/plugins/cache/pluginCache.ts`
- `src/plugins/loader/pluginLoader.ts`
- `src/plugins/loader/lazyLoader.ts`
- `src/plugins/loader/index.ts`
- `src/plugins/security/capabilities.ts`
- `src/plugins/security/permissionManager.ts`
- `src/plugins/security/index.ts`
- `src/plugins/validation/validator.ts`
- `src/plugins/validation/index.ts`

### Plugin Adapters
- `src/plugins/integration/themeAdapter.ts`
- `src/plugins/integration/mechanicAdapter.ts`
- `src/plugins/integration/settingsAdapter.ts`
- `src/plugins/integration/sourceAdapter.ts`
- `src/plugins/integration/index.ts`

### Built-in Plugins
- `src/plugins/builtin/themes/retro/{manifest.json,theme.css,index.ts}`
- `src/plugins/builtin/themes/modern/{manifest.json,theme.css,index.ts}`
- `src/plugins/builtin/themes/minimal/{manifest.json,theme.css,index.ts}`
- `src/plugins/builtin/mechanics/memory/{manifest.json,index.ts}`
- `src/plugins/builtin/mechanics/snap-ranking/{manifest.json,index.ts}`
- `src/plugins/builtin/sources/github/{manifest.json,gh.json,index.ts}`
- `src/plugins/builtin/index.ts`

## Files Modified

- Various adapter files during type error fixes
- Integration files to align with store methods

---

## Phase 3: Game Mechanics UX Improvements

Following the plugin architecture work, v0.13.0 also addressed critical UX issues in the game mechanics:

### Card Count Filtering

**Problem:** Snap Ranking's card count setting controlled internal game state but displayed all collection cards, confusing players who expected to see only their selected number.

**Solution:** Modified CardGrid.tsx to filter displayed cards when snap-ranking is active:
- Extract `cardIds` from mechanic state
- Filter `cards` useMemo to show only cards in the game
- Preserve the shuffled order from the game state

### Guess Options Consistency

**Problem:** Guess buttons only showed values from selected cards, making the game easier when fewer cards were chosen. A player selecting 5 cards from a 100-card collection would only see 5 possible answers instead of all unique values.

**Solution:** Compute `uniqueValues` from `baseCards` (entire collection) rather than `cards` (filtered subset), ensuring consistent difficulty regardless of card count setting.

### Close Guess Feedback

**Problem:** "Close" guesses (off by 1-2) displayed with wrong/red styling instead of yellow feedback.

**Solution:**
- Added `.guessItem.close` CSS class with yellow background
- Updated ResultsModal to use `getGuessFeedback()` for categorising guesses
- Added `uniqueValues` subscription for accurate feedback calculation

### Game Complete Screen Polish

**Improvements:**
- Removed "Copy Results" button (destination unclear for v0.13.0)
- Removed "Different Game" button (CSS specificity issues unresolved; users can exit and select another game)
- Made completion modal responsive for iPhone (smaller text, reduced padding)
- Added `.hideOnMobile` utility class for Memory game's "Choose Different Game" button
- Repositioned Exit button to left, Play Again to right

### Files Modified (Phase 3)

- `src/components/CardGrid/CardGrid.tsx` - Card filtering, uniqueValues computation
- `src/mechanics/snap-ranking/components.tsx` - Removed copy/different buttons, added close feedback
- `src/mechanics/snap-ranking/SnapRanking.module.css` - Close styles, mobile responsive, button layout
- `src/mechanics/memory/memory.module.css` - Mobile responsive, hideOnMobile class
- `src/mechanics/memory/components.tsx` - Added hideOnMobile to Choose Different Game button

## Deferred Work

- WP-C: User Documentation (tutorials, guides)
- WP-D: Discovery UI (plugin browser, manager)
- WP-E: Developer Documentation

---

## Related Documentation

- [v0.13.0 Milestone](../../../roadmap/milestones/v0.13.0.md)
- [v0.13.0 Retrospective](../../retrospectives/v0.13.0/README.md)
- [Mechanic Settings ADR](../../decisions/adrs/ADR-020-mechanic-settings-isolation.md)
