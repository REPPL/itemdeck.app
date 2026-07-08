# F-126: Settings Schema Plugins

## Problem Statement

The settings system is currently monolithic:

1. **No extensibility** - New settings require code changes
2. **No third-party options** - Plugin authors cannot add settings
3. **No schema validation** - Settings added manually without type safety
4. **No UI generation** - Each setting needs custom UI code

## Design Approach

Allow plugins to extend settings via schema definitions:

- Plugins define settings using JSON Schema
- UI components auto-generated from schema
- Settings namespaced by plugin ID
- Validation enforced on save

### Schema-Driven Settings

```json
{
  "type": "object",
  "properties": {
    "highlightColour": {
      "type": "string",
      "format": "colour",
      "default": "#ff6b6b",
      "title": "Highlight Colour",
      "description": "Colour used for card highlights"
    },
    "animationSpeed": {
      "type": "number",
      "minimum": 0.5,
      "maximum": 2.0,
      "default": 1.0,
      "title": "Animation Speed",
      "description": "Multiplier for all animations"
    },
    "showTips": {
      "type": "boolean",
      "default": true,
      "title": "Show Tips",
      "description": "Display helpful tips during gameplay"
    }
  }
}
```

### Auto-Generated UI

```
┌─────────────────────────────────────────────────────────────┐
│  Memory Game Settings                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Highlight Colour                                            │
│  [#ff6b6b] [🎨]  Colour used for card highlights            │
│                                                              │
│  Animation Speed                                             │
│  [────●────] 1.0x  Multiplier for all animations            │
│                                                              │
│  Show Tips                                                   │
│  [✓] Display helpful tips during gameplay                   │
│                                                              │
│  [Reset to Defaults]                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Settings Storage

```typescript
// Namespaced by plugin ID
{
  "plugins.memory-game.highlightColour": "#ff6b6b",
  "plugins.memory-game.animationSpeed": 1.0,
  "plugins.memory-game.showTips": true
}
```

## Implementation Tasks

### Phase 1: Schema Parser

- [ ] Create `src/plugins/settings/schemaParser.ts`
- [ ] Parse JSON Schema definitions
- [ ] Extract field metadata (title, description, default)
- [ ] Handle nested objects and arrays

### Phase 2: UI Component Generator

- [ ] Create `src/plugins/settings/components/`
- [ ] Implement StringField (text, colour, select)
- [ ] Implement NumberField (slider, input)
- [ ] Implement BooleanField (toggle, checkbox)
- [ ] Implement ArrayField (list editor)

### Phase 3: Settings Integration

- [ ] Extend settingsStore for plugin namespaces
- [ ] Create `usePluginSettings(pluginId)` hook
- [ ] Implement settings persistence
- [ ] Add migration support for schema changes

### Phase 4: Validation

- [ ] Validate settings on load
- [ ] Validate settings on save
- [ ] Display validation errors inline
- [ ] Handle invalid stored values gracefully

### Phase 5: Export/Import

- [ ] Include plugin settings in export
- [ ] Validate plugin settings on import
- [ ] Handle missing plugins gracefully

## Success Criteria

- [ ] Plugins can define settings via JSON Schema
- [ ] UI auto-generated from schema
- [ ] Settings namespaced and isolated
- [ ] Validation enforced on all changes
- [ ] Plugin settings included in export/import

## Dependencies

- **F-122**: Plugin Manifest Schema - Declares settings schema location
- **F-123**: Plugin Loader & Registry - Registers settings
- **Zod**: Schema validation (convert JSON Schema to Zod)

## Complexity

**Medium** - Schema parsing and UI generation require careful design.

## Estimated Effort

**10-14 hours**

---

## Related Documentation

- [Settings Export Feature](../completed/F-081-settings-export.md)
- [F-122: Plugin Manifest Schema](./F-122-plugin-manifest-schema.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
