# ADR-026: Plugin Manifest Schema

## Status

Accepted

## Context

Itemdeck's plugin ecosystem (v1.5.0) requires a standardised manifest format for:

1. **Plugin metadata** - Name, version, author, description
2. **Capability declaration** - What permissions the plugin needs
3. **Entry points** - Where to load code and assets
4. **Compatibility** - Minimum app version requirements
5. **Type information** - Mechanic, theme, source adapter, or settings

### Industry Patterns

| Platform | Manifest Format | Validation | Notable Fields |
|----------|-----------------|------------|----------------|
| VS Code | package.json | JSON Schema | `activationEvents`, `contributes` |
| Figma | manifest.json | Runtime | `api`, `editorType` |
| Chrome Extensions | manifest.json | JSON Schema | `permissions`, `content_scripts` |
| npm | package.json | JSON Schema | `main`, `exports`, `peerDependencies` |

### Requirements

- **Human-readable** - JSON format
- **Type-safe** - TypeScript types derived from schema
- **Validatable** - Zod schema for runtime validation
- **Extensible** - Support future plugin types
- **Documented** - JSON Schema for editor support

## Decision

Define a **JSON manifest schema** with Zod validation and TypeScript type inference.

### Manifest Schema

```typescript
// src/plugins/core/manifest.ts

import { z } from 'zod';

// Plugin types
export const PluginTypeSchema = z.enum([
  'mechanic',
  'theme',
  'source',
  'settings',
]);

export type PluginType = z.infer<typeof PluginTypeSchema>;

// Permission types
export const PermissionSchema = z.enum([
  // Card access
  'cards:read',
  'cards:write',

  // Collection access
  'collection:read',
  'collection:write',

  // Settings access
  'settings:read',
  'settings:write',

  // UI capabilities
  'ui:toast',
  'ui:modal',
  'ui:panel',
  'ui:overlay',

  // Storage
  'storage:local',

  // Network (curated only)
  'network:fetch',

  // Theme
  'theme:write',
]);

export type Permission = z.infer<typeof PermissionSchema>;

// Author information
export const AuthorSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().optional(),
  email: z.string().email().optional(),
});

// Activation events
export const ActivationEventSchema = z.enum([
  'onStartup',
  'onMechanicSelect',
  'onSettingsOpen',
  'onCollectionLoad',
  'onCardSelect',
]);

// Contribution points
export const MechanicContributionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  minCards: z.number().int().min(1).default(4),
  maxCards: z.number().int().optional(),
});

export const ThemeContributionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  preview: z.string().optional(),
  colorScheme: z.enum(['light', 'dark', 'auto']).default('auto'),
});

export const SettingsContributionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  type: z.enum(['text', 'number', 'boolean', 'select', 'color', 'range']),
  default: z.unknown(),
  options: z.array(z.object({
    value: z.unknown(),
    label: z.string(),
  })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
});

export const ContributesSchema = z.object({
  mechanics: z.array(MechanicContributionSchema).optional(),
  themes: z.array(ThemeContributionSchema).optional(),
  settings: z.array(SettingsContributionSchema).optional(),
  sources: z.array(z.object({
    id: z.string(),
    name: z.string(),
    urlPatterns: z.array(z.string()),
  })).optional(),
});

// Asset declarations
export const AssetsSchema = z.object({
  icons: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  fonts: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

// Main manifest schema
export const PluginManifestSchema = z.object({
  // Schema reference for editor support
  $schema: z.string().optional(),

  // Identity
  id: z.string()
    .min(3)
    .max(50)
    .regex(
      /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/,
      'ID must be lowercase with dots/hyphens (e.g., "my-plugin" or "com.example.plugin")'
    ),

  name: z.string().min(1).max(100),
  version: z.string().regex(
    /^\d+\.\d+\.\d+(-[a-z0-9]+)?$/,
    'Version must be semver (e.g., "1.0.0" or "1.0.0-beta")'
  ),
  description: z.string().max(500).optional(),

  // Authorship
  author: AuthorSchema,
  license: z.string().optional(),
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),

  // Compatibility
  engines: z.object({
    itemdeck: z.string().regex(
      /^[<>=^~]*\d+\.\d+\.\d+$/,
      'Must be semver range (e.g., ">=1.5.0")'
    ),
  }),

  // Plugin type
  type: PluginTypeSchema,

  // Permissions
  permissions: z.array(PermissionSchema).default([]),

  // Activation
  activationEvents: z.array(ActivationEventSchema).default(['onStartup']),

  // Entry points
  main: z.string(),
  ui: z.string().optional(),
  sandbox: z.string().optional(),

  // Contributions
  contributes: ContributesSchema.optional(),

  // Assets
  assets: AssetsSchema.optional(),

  // Keywords for search
  keywords: z.array(z.string()).optional(),

  // Private flag (not listed in registry)
  private: z.boolean().default(false),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

// Validation function
export function validateManifest(data: unknown): PluginManifest {
  return PluginManifestSchema.parse(data);
}

export function safeValidateManifest(data: unknown): {
  success: true;
  data: PluginManifest;
} | {
  success: false;
  error: z.ZodError;
} {
  const result = PluginManifestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
```

### JSON Schema for Editor Support

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://itemdeck.app/schemas/plugin-v1.json",
  "title": "Itemdeck Plugin Manifest",
  "description": "Manifest schema for itemdeck plugins",
  "type": "object",
  "required": ["id", "name", "version", "author", "engines", "type", "main"],
  "properties": {
    "$schema": {
      "type": "string",
      "description": "JSON Schema reference"
    },
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*(\\.[a-z][a-z0-9-]*)*$",
      "minLength": 3,
      "maxLength": 50,
      "description": "Unique plugin identifier"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Display name"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[a-z0-9]+)?$",
      "description": "Semantic version"
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "author": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": { "type": "string" },
        "url": { "type": "string", "format": "uri" },
        "email": { "type": "string", "format": "email" }
      }
    },
    "license": { "type": "string" },
    "repository": { "type": "string", "format": "uri" },
    "homepage": { "type": "string", "format": "uri" },
    "engines": {
      "type": "object",
      "required": ["itemdeck"],
      "properties": {
        "itemdeck": {
          "type": "string",
          "description": "Minimum itemdeck version required"
        }
      }
    },
    "type": {
      "type": "string",
      "enum": ["mechanic", "theme", "source", "settings"]
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "cards:read", "cards:write",
          "collection:read", "collection:write",
          "settings:read", "settings:write",
          "ui:toast", "ui:modal", "ui:panel", "ui:overlay",
          "storage:local", "network:fetch", "theme:write"
        ]
      }
    },
    "activationEvents": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["onStartup", "onMechanicSelect", "onSettingsOpen", "onCollectionLoad", "onCardSelect"]
      }
    },
    "main": {
      "type": "string",
      "description": "Path to main entry point"
    },
    "ui": {
      "type": "string",
      "description": "Path to UI entry point (for sandboxed plugins)"
    },
    "sandbox": {
      "type": "string",
      "description": "Path to sandbox HTML entry"
    },
    "contributes": {
      "type": "object",
      "properties": {
        "mechanics": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "name"],
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "description": { "type": "string" },
              "icon": { "type": "string" },
              "minCards": { "type": "integer", "minimum": 1 },
              "maxCards": { "type": "integer" }
            }
          }
        },
        "themes": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "name"],
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "description": { "type": "string" },
              "preview": { "type": "string" },
              "colorScheme": { "type": "string", "enum": ["light", "dark", "auto"] }
            }
          }
        },
        "settings": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "label", "type"],
            "properties": {
              "id": { "type": "string" },
              "label": { "type": "string" },
              "description": { "type": "string" },
              "type": { "type": "string", "enum": ["text", "number", "boolean", "select", "color", "range"] }
            }
          }
        }
      }
    },
    "assets": {
      "type": "object",
      "properties": {
        "icons": { "type": "array", "items": { "type": "string" } },
        "styles": { "type": "array", "items": { "type": "string" } },
        "fonts": { "type": "array", "items": { "type": "string" } },
        "images": { "type": "array", "items": { "type": "string" } }
      }
    },
    "keywords": {
      "type": "array",
      "items": { "type": "string" }
    },
    "private": {
      "type": "boolean",
      "default": false
    }
  }
}
```

### Example Manifests

**Mechanic plugin:**

```json
{
  "$schema": "https://itemdeck.app/schemas/plugin-v1.json",
  "id": "trivia-challenge",
  "name": "Trivia Challenge",
  "version": "1.0.0",
  "description": "A timed trivia game mode with multiple choice questions",
  "author": {
    "name": "Plugin Developer",
    "url": "https://github.com/developer"
  },
  "license": "MIT",
  "repository": "https://github.com/developer/itemdeck-trivia",
  "engines": {
    "itemdeck": ">=1.5.0"
  },
  "type": "mechanic",
  "permissions": [
    "cards:read",
    "settings:read",
    "settings:write",
    "ui:toast",
    "storage:local"
  ],
  "activationEvents": ["onMechanicSelect"],
  "main": "./dist/plugin.js",
  "sandbox": "./dist/index.html",
  "contributes": {
    "mechanics": [{
      "id": "trivia-challenge",
      "name": "Trivia Challenge",
      "description": "Test your knowledge with timed questions",
      "icon": "./assets/trivia-icon.svg",
      "minCards": 5,
      "maxCards": 50
    }],
    "settings": [{
      "id": "questionCount",
      "label": "Questions per game",
      "type": "number",
      "default": 10,
      "min": 5,
      "max": 30
    }, {
      "id": "timeLimit",
      "label": "Time per question (seconds)",
      "type": "select",
      "default": 15,
      "options": [
        { "value": 10, "label": "10 seconds" },
        { "value": 15, "label": "15 seconds" },
        { "value": 30, "label": "30 seconds" },
        { "value": null, "label": "No limit" }
      ]
    }]
  },
  "assets": {
    "icons": ["./assets/trivia-icon.svg"],
    "styles": ["./dist/styles.css"]
  },
  "keywords": ["trivia", "quiz", "game", "questions"]
}
```

**Theme plugin:**

```json
{
  "$schema": "https://itemdeck.app/schemas/plugin-v1.json",
  "id": "midnight-blue",
  "name": "Midnight Blue",
  "version": "1.0.0",
  "description": "A deep blue dark theme with subtle gradients",
  "author": {
    "name": "Theme Designer"
  },
  "engines": {
    "itemdeck": ">=1.5.0"
  },
  "type": "theme",
  "permissions": ["theme:write"],
  "activationEvents": ["onStartup"],
  "main": "./theme.css",
  "contributes": {
    "themes": [{
      "id": "midnight-blue",
      "name": "Midnight Blue",
      "description": "Deep blue dark theme",
      "preview": "./preview.png",
      "colorScheme": "dark"
    }]
  },
  "assets": {
    "styles": ["./theme.css"],
    "fonts": ["./fonts/Inter.woff2"],
    "images": ["./preview.png"]
  }
}
```

**Source adapter plugin:**

```json
{
  "$schema": "https://itemdeck.app/schemas/plugin-v1.json",
  "id": "notion-source",
  "name": "Notion Source",
  "version": "1.0.0",
  "description": "Load collections from Notion databases",
  "author": {
    "name": "Integration Developer"
  },
  "engines": {
    "itemdeck": ">=1.5.0"
  },
  "type": "source",
  "permissions": [
    "collection:write",
    "settings:read",
    "network:fetch"
  ],
  "activationEvents": ["onStartup"],
  "main": "./dist/source.js",
  "contributes": {
    "sources": [{
      "id": "notion",
      "name": "Notion",
      "urlPatterns": [
        "https://www.notion.so/{workspace}/{database}",
        "notion://{database}"
      ]
    }],
    "settings": [{
      "id": "apiKey",
      "label": "Notion API Key",
      "description": "Your Notion integration API key",
      "type": "text"
    }]
  }
}
```

### Manifest Loader

```typescript
// src/plugins/core/loader.ts

export async function loadManifest(source: PluginSource): Promise<PluginManifest> {
  let manifestData: unknown;

  switch (source.type) {
    case 'builtin':
      // Import from bundled location
      const module = await import(`../builtins/${source.id}/manifest.json`);
      manifestData = module.default;
      break;

    case 'file':
      // Load from file path
      manifestData = JSON.parse(await fs.readFile(source.path, 'utf-8'));
      break;

    case 'url':
      // Fetch from URL
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status}`);
      }
      manifestData = await response.json();
      break;
  }

  // Validate against schema
  const result = safeValidateManifest(manifestData);

  if (!result.success) {
    const errors = result.error.errors
      .map(e => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid manifest:\n${errors}`);
  }

  return result.data;
}
```

## Consequences

### Positive

- **Type safety** - TypeScript types derived from Zod schema
- **Runtime validation** - Catches invalid manifests early
- **Editor support** - JSON Schema enables autocomplete
- **Extensible** - Easy to add new fields/types
- **Self-documenting** - Schema defines valid values

### Negative

- **Dual schemas** - Zod + JSON Schema must stay in sync
- **Verbosity** - Full manifest can be lengthy
- **Version coupling** - Schema changes require migration

### Mitigations

- **Schema generation** - Generate JSON Schema from Zod
- **Templates** - Provide minimal manifest templates
- **Migration tooling** - Automated manifest upgrades

## Migration Path

When schema changes:

1. **Minor changes** (new optional fields) - Backwards compatible
2. **Major changes** (required fields, type changes) - Bump schema version
3. **Provide migration script** - `npx @itemdeck/cli migrate-manifest`

```typescript
// Migration example
async function migrateManifest(oldManifest: unknown): Promise<PluginManifest> {
  const version = detectSchemaVersion(oldManifest);

  switch (version) {
    case 'v1':
      return oldManifest as PluginManifest; // Current version

    case 'v0':
      // Migrate from pre-v1 format
      return {
        ...oldManifest,
        engines: { itemdeck: '>=1.5.0' },
        permissions: oldManifest.capabilities || [],
        // ... other migrations
      };

    default:
      throw new Error(`Unknown manifest version: ${version}`);
  }
}
```

---

## Related Documentation

- [ADR-023: Plugin Trust Tiers](./ADR-023-plugin-trust-tiers.md)
- [ADR-024: Plugin Sandbox Implementation](./ADR-024-plugin-sandbox-implementation.md)
- [ADR-025: Plugin Distribution Strategy](./ADR-025-plugin-distribution-strategy.md)
- [State-of-the-Art: Plugin Architecture](../../research/state-of-the-art-plugin-architecture.md)
- [v1.5.0 Milestone](../../roadmap/milestones/v1.5.0.md)

---

**Applies to**: itemdeck v1.5.0+
