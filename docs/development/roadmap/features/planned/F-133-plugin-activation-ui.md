# F-133: Plugin Activation UI

## Problem Statement

Users need a way to manage plugins:

1. **No visibility** - Cannot see available/active plugins
2. **No control** - Cannot activate/deactivate plugins
3. **No configuration** - Cannot access plugin settings
4. **No organisation** - Cannot organise or prioritise plugins

## Design Approach

Create a Plugin Manager in Settings:

- Browse available plugins by category
- Activate/deactivate plugins
- Access plugin-specific settings
- View plugin health and status

### Plugin Manager UI

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Plugins                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [All] [Themes] [Mechanics] [Sources] [Settings]  [+ Add]  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🎨 Minimal Theme                              [Built-in] ││
│  │    Default clean theme                                  ││
│  │    ● Active                              [Disable] [⚙️] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🎮 Memory Game                               [Built-in] ││
│  │    Classic card matching game                           ││
│  │    ● Active                              [Disable] [⚙️] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🌐 Custom Theme                              [Curated]  ││
│  │    A beautiful dark theme                               ││
│  │    ○ Inactive                             [Enable] [🗑️] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🎲 Card Trivia                              [Community] ││
│  │    ⚠️ Unverified plugin                                 ││
│  │    ● Active                              [Disable] [🗑️] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Settings Panel

```
┌─────────────────────────────────────────────────────────────┐
│  Memory Game Settings                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Card Pairs                                                  │
│  [6] [8] [10] [12] [●16]                                    │
│                                                              │
│  Difficulty                                                  │
│  [───────────●──] Hard                                      │
│                                                              │
│  Show Timer                                                  │
│  [✓] Display elapsed time                                   │
│                                                              │
│  Flip Animation                                              │
│  [✓] Animate card flips                                     │
│                                                              │
│  [Reset to Defaults]                                         │
│                                                              │
│                                       [Cancel]  [Save]      │
└─────────────────────────────────────────────────────────────┘
```

### Add Plugin Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Add Plugin                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ○ From Registry                                            │
│    Browse curated plugins                                   │
│                                                              │
│  ○ From GitHub URL                                          │
│    Install community plugin                                 │
│                                                              │
│  ○ From File                                                │
│    Upload plugin package (disabled)                         │
│                                                              │
│                                       [Cancel]  [Continue]  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Plugin List Component

- [ ] Create `src/components/PluginManager/PluginList.tsx`
- [ ] Display plugins grouped by type
- [ ] Show status (active/inactive)
- [ ] Display trust tier badges

### Phase 2: Plugin Card Component

- [ ] Create `src/components/PluginManager/PluginCard.tsx`
- [ ] Show plugin icon and name
- [ ] Display description and author
- [ ] Add activate/deactivate toggle

### Phase 3: Plugin Settings

- [ ] Create `src/components/PluginManager/PluginSettings.tsx`
- [ ] Render settings from schema (F-126)
- [ ] Save settings changes
- [ ] Reset to defaults option

### Phase 4: Add Plugin Flow

- [ ] Create `src/components/PluginManager/AddPluginModal.tsx`
- [ ] Integrate with registry browser (F-131)
- [ ] Integrate with GitHub loader (F-132)
- [ ] Show installation progress

### Phase 5: Settings Integration

- [ ] Add Plugins tab to Settings panel
- [ ] Handle plugin activation state
- [ ] Persist plugin preferences
- [ ] Show activation errors

## Success Criteria

- [ ] Plugins tab visible in Settings
- [ ] All plugins listed with correct status
- [ ] Activate/deactivate works correctly
- [ ] Plugin settings accessible
- [ ] Add plugin flow works for registry and GitHub

## Dependencies

- **F-123**: Plugin Loader & Registry - Plugin state
- **F-126**: Settings Schema Plugins - Settings UI
- **F-131**: Curated Registry API - Registry browser
- **F-132**: Community Plugin Loading - GitHub install

## Complexity

**Medium** - UI-focused with integration to plugin system.

## Estimated Effort

**10-14 hours**

---

## Related Documentation

- [Settings Panel Redesign](../completed/F-072-settings-panel-redesign.md)
- [F-126: Settings Schema Plugins](./F-126-settings-schema-plugins.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
