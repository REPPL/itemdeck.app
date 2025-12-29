# State of the Art: Plugin Architecture for Web Applications

## Executive Summary

This document analyses plugin architecture patterns for web applications, focusing on external plugin loading, security sandboxing, and distribution strategies for itemdeck's v1.5.0 Full Plugin Ecosystem milestone.

**Key findings:**

1. **VS Code** and **Figma** represent the gold standard for web-based plugin systems, using process/iframe isolation with message-passing APIs
2. **Module Federation** excels for micro-frontend architectures but adds significant complexity for simple plugin systems
3. **JSON manifest-based discovery** is the industry standard for plugin metadata and capability declaration
4. **Sandboxing via iframes or Web Workers** provides the best security-to-functionality balance for untrusted code
5. **For itemdeck:** Recommend a **tiered trust model** - built-in plugins use dynamic imports, external plugins use iframe sandboxing with a defined API surface

---

## Landscape Overview

### Plugin Architecture Evolution

| Era | Pattern | Example | Characteristics |
|-----|---------|---------|-----------------|
| Early web | Script injection | WordPress | Global namespace, no isolation |
| Browser extensions | Separate context | Chrome extensions | Manifest-driven, permission-based |
| Modern SPA | Module federation | Shopify | Shared dependencies, federated builds |
| Security-first | Sandbox isolation | Figma, VS Code | Message-passing, capability-based |

### Industry Approaches Comparison

| Platform | Loading Mechanism | Isolation | Communication | Trust Model |
|----------|-------------------|-----------|---------------|-------------|
| **VS Code** | Extension Host process | Process isolation | IPC/RPC | Marketplace review + runtime API |
| **Figma** | iframe sandbox | Complete DOM isolation | postMessage | Sandboxed, limited API |
| **Obsidian** | Dynamic script loading | None (same context) | Direct access | Community vetting |
| **WordPress** | PHP includes + script tags | None | Global hooks | Manual review |
| **Shopify** | App Bridge + iframe | iframe for UI | Message protocol | OAuth + review |
| **Notion** | No plugins | N/A | N/A | Avoided complexity |

---

## Plugin Architecture Patterns

### 1. Dynamic Imports with Registry (Current itemdeck)

The pattern currently used by itemdeck for mechanic plugins.

```typescript
// Registry holds factories for lazy loading
const mechanicLoaders: Record<string, () => Promise<MechanicPlugin>> = {
  'memory-game': () => import('./mechanics/memory-game'),
  'collection': () => import('./mechanics/collection'),
};

export async function loadMechanic(id: string): Promise<MechanicPlugin> {
  const loader = mechanicLoaders[id];
  if (!loader) throw new Error(`Unknown mechanic: ${id}`);
  const module = await loader();
  return module.default;
}
```

**Pros:**
- Native to Vite/Rollup - automatic code splitting
- Full TypeScript type safety
- No runtime overhead for unused plugins
- Simple mental model

**Cons:**
- Plugins must be known at build time
- No true external plugin loading
- Full trust - plugins run in main context

**Best for:** First-party, built-in plugins (itemdeck's current mechanics)

---

### 2. Module Federation

Webpack 5's Module Federation enables runtime loading of separately-built modules.

```typescript
// Host application (vite.config.ts)
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'itemdeck-host',
      remotes: {
        memoryPlugin: 'https://plugins.itemdeck.app/memory/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'zustand'],
    }),
  ],
});

// Runtime usage
const MemoryPlugin = React.lazy(() => import('memoryPlugin/Plugin'));
```

**How it works:**
1. Plugins are separately built with Module Federation plugin
2. Each plugin exposes modules via a `remoteEntry.js` manifest
3. Host application loads remotes at runtime
4. Shared dependencies deduplicated across host and remotes

**Pros:**
- True runtime plugin loading from any URL
- Independent deployment of plugins
- Shared dependencies reduce duplication
- Supports micro-frontend architecture

**Cons:**
- Significant complexity (CORS, versioning, shared deps config)
- Vite support is experimental (@originjs/vite-plugin-federation)
- Version mismatches can cause runtime errors
- No security isolation - plugins run in host context
- Requires build tooling for plugin authors

**Best for:** Micro-frontends, large organisations with multiple teams

---

### 3. iframe Sandboxing (Figma Model)

Plugins run in sandboxed iframes with communication via postMessage.

```typescript
// Host: Create sandboxed iframe
function loadSandboxedPlugin(manifest: PluginManifest): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.sandbox.add(
    'allow-scripts',          // Allow JS execution
    // 'allow-same-origin',   // OMIT: prevents access to host storage/cookies
    // 'allow-popups',        // OMIT: prevents opening new windows
  );
  iframe.src = manifest.sandboxUrl;  // Plugin HTML entry
  iframe.style.display = 'none';     // UI-less plugin
  document.body.appendChild(iframe);
  return iframe;
}

// Host: Message protocol
interface PluginMessage {
  type: 'GET_CARDS' | 'UPDATE_SETTINGS' | 'RENDER_OVERLAY';
  requestId: string;
  payload: unknown;
}

window.addEventListener('message', (event) => {
  if (event.origin !== PLUGIN_ORIGIN) return;

  const message: PluginMessage = event.data;
  switch (message.type) {
    case 'GET_CARDS':
      sendToPlugin(event.source, {
        type: 'CARDS_RESPONSE',
        requestId: message.requestId,
        payload: getCards(),
      });
      break;
    // ... other handlers
  }
});

// Plugin side: Request host data
async function getCards(): Promise<Card[]> {
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.data.requestId === requestId) {
        window.removeEventListener('message', handler);
        resolve(event.data.payload);
      }
    };
    window.addEventListener('message', handler);

    parent.postMessage({ type: 'GET_CARDS', requestId }, HOST_ORIGIN);
  });
}
```

**Pros:**
- Complete DOM isolation - plugin cannot access host DOM
- Storage isolation (when `allow-same-origin` omitted)
- Browser enforces security boundary
- Plugin crashes don't crash host
- Can run untrusted code safely

**Cons:**
- Async communication only (postMessage latency)
- Plugin UI requires separate rendering approach
- Complex state synchronisation
- Cannot share React components directly
- Larger bundle (plugin has own React copy)

**Best for:** Untrusted third-party plugins, security-critical applications

---

### 4. Web Worker Sandboxing

Plugins run in dedicated Web Workers with no DOM access.

```typescript
// Host: Create worker for plugin
function loadWorkerPlugin(manifest: PluginManifest): Worker {
  const worker = new Worker(manifest.workerUrl, { type: 'module' });

  worker.onmessage = (event) => {
    const { type, payload } = event.data;
    switch (type) {
      case 'RENDER_REQUEST':
        // Host renders UI based on plugin's declarative description
        renderPluginUI(payload.elements);
        break;
      case 'STATE_UPDATE':
        updatePluginState(manifest.id, payload);
        break;
    }
  };

  return worker;
}

// Plugin (runs in Worker)
self.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'CARD_CLICKED':
      const newState = processCardClick(payload.cardId);
      self.postMessage({
        type: 'STATE_UPDATE',
        payload: newState,
      });
      break;
  }
};
```

**Pros:**
- No DOM access at all - purely computational
- True thread isolation (won't block main thread)
- Cannot access localStorage, cookies, or network
- Smaller attack surface than iframes

**Cons:**
- No DOM = no direct UI rendering
- Must serialise all data (no SharedArrayBuffer by default)
- Complex for stateful UI plugins
- Requires host to implement all rendering

**Best for:** Computation-heavy plugins, game logic, data processing

---

### 5. JavaScript VM Sandboxing

Run plugin code in a JavaScript VM with controlled globals.

```typescript
// Using isolated-vm or similar
import ivm from 'isolated-vm';

async function executePluginCode(code: string, context: PluginContext) {
  const isolate = new ivm.Isolate({ memoryLimit: 128 }); // 128MB limit
  const vmContext = await isolate.createContext();

  // Inject safe APIs
  const jail = vmContext.global;
  await jail.set('console', createSafeConsole());
  await jail.set('itemdeck', createPluginAPI(context));

  // Execute plugin
  const script = await isolate.compileScript(code);
  const result = await script.run(vmContext, { timeout: 5000 });

  return result;
}

function createPluginAPI(context: PluginContext) {
  return {
    getCards: () => context.cards,
    updateSettings: (settings: unknown) => {
      validateSettings(settings);
      context.onSettingsUpdate(settings);
    },
    // ... other safe APIs
  };
}
```

**Pros:**
- Fine-grained control over available globals
- Memory and CPU limits
- Can intercept and validate all API calls
- Works server-side (Node.js) for validation

**Cons:**
- Native module required (isolated-vm)
- Significant complexity
- Performance overhead for context switches
- Limited browser support (primarily Node.js)

**Best for:** Server-side plugin execution, untrusted code evaluation

---

## Real-World Case Studies

### VS Code Extensions

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Main Process                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Renderer Process (UI)                                    ││
│  │  - Editor                                                ││
│  │  - Webviews (iframe-sandboxed extension UI)             ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                 │
│                      IPC/RPC                                 │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Extension Host Process (Node.js)                         ││
│  │  - Runs extension code                                   ││
│  │  - Separate process per workspace                        ││
│  │  - Crashes don't affect main process                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
1. **Extension Host isolation** - Extensions run in a separate Node.js process
2. **RPC-based API** - Extensions interact via defined API, not direct access
3. **Activation events** - Extensions load lazily based on triggers
4. **Manifest-driven capabilities** - `package.json` declares contributions
5. **Webview sandboxing** - Extension UI runs in iframes with CSP

**Manifest example:**
```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "engines": { "vscode": "^1.80.0" },
  "activationEvents": ["onLanguage:typescript"],
  "contributes": {
    "commands": [{ "command": "myext.doThing", "title": "Do Thing" }],
    "configuration": {
      "title": "My Extension",
      "properties": {
        "myext.enabled": { "type": "boolean", "default": true }
      }
    }
  },
  "main": "./out/extension.js"
}
```

**Lessons for itemdeck:**
- Manifest declares capabilities before loading code
- Activation events enable lazy loading
- Process isolation prevents extension crashes from affecting host
- API surface carefully designed and versioned

---

### Figma Plugins

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Figma Main Thread                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Document & Canvas                                        ││
│  │  - Scene graph                                           ││
│  │  - Selection state                                       ││
│  │  - User actions                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                 │
│                      postMessage                             │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Plugin Sandbox (iframe, no allow-same-origin)           ││
│  │  - figma.* API available                                 ││
│  │  - Cannot access parent DOM                              ││
│  │  - Cannot make network requests (use figma.fetch)        ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                 │
│                      postMessage                             │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Plugin UI (optional, separate iframe)                    ││
│  │  - Can use React, HTML, CSS                              ││
│  │  - Communicates with sandbox via postMessage             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
1. **Two-iframe model** - Logic sandbox + UI iframe
2. **No network access** - Must use `figma.fetch()` proxy
3. **Declarative UI option** - `figma.showUI(htmlString)`
4. **Read/write API** - Plugins can modify document
5. **Permission model** - Manifest declares required access

**Plugin code example:**
```typescript
// Plugin code (runs in sandbox)
figma.showUI(__html__, { width: 300, height: 400 });

// Listen for UI messages
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-shapes') {
    const rect = figma.createRectangle();
    rect.x = 0;
    rect.y = 0;
    rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
    figma.currentPage.appendChild(rect);
  }
};

// Close plugin
figma.closePlugin();
```

**Lessons for itemdeck:**
- Sandbox without `allow-same-origin` provides strong isolation
- Proxy network requests through host for security
- Split UI from logic for cleaner architecture
- Message-based API enables async operations

---

### Obsidian Plugins

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Obsidian (Electron)                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Main Process                                             ││
│  │  - File system access                                    ││
│  │  - Native integrations                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Renderer Process                                         ││
│  │  - Markdown editor                                       ││
│  │  - Plugin code (same context!)                          ││
│  │  - Full DOM access                                       ││
│  │  - Full API access                                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
1. **No sandbox** - Plugins run in same context as app
2. **Full API access** - Plugins can access internal APIs
3. **Community trust** - Relies on community review
4. **Local-first** - Plugins stored in vault, no cloud distribution

**Manifest example:**
```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "minAppVersion": "1.0.0",
  "author": "Developer Name",
  "authorUrl": "https://github.com/developer",
  "description": "A helpful plugin",
  "isDesktopOnly": false
}
```

**Lessons for itemdeck:**
- Simpler architecture = faster development
- Community trust model works for local-first apps
- Full access enables powerful plugins
- Risk: malicious plugins have full control

---

### WordPress Plugins

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    WordPress (PHP)                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Core                                                     ││
│  │  - Action/Filter hooks                                   ││
│  │  - Plugin API                                            ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                 │
│                        Hooks                                 │
│                            │                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ Plugin A  │  │ Plugin B  │  │ Plugin C  │               │
│  │ (PHP)     │  │ (PHP+JS)  │  │ (PHP)     │               │
│  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
1. **Hook system** - Actions and filters for extensibility
2. **No isolation** - PHP code runs in same process
3. **Manual review** - wordpress.org reviews plugins
4. **Auto-updates** - Plugins can update from repository

**Lessons for itemdeck:**
- Hook system provides clean extension points
- No isolation is a security risk
- Repository review helps but doesn't prevent all issues
- Plugin conflicts are common (namespace pollution)

---

## Security Considerations

### Threat Model for Web Plugins

| Threat | Impact | Likelihood | Mitigation |
|--------|--------|------------|------------|
| XSS via plugin | High | Medium | CSP, DOM isolation |
| Data exfiltration | Critical | Medium | Network restrictions |
| Cryptomining | Medium | Low | CPU/memory limits |
| UI spoofing | Medium | Medium | Visual isolation |
| Storage hijacking | High | Medium | Storage isolation |
| Dependency confusion | High | Low | Manifest validation |

### Sandboxing Comparison

| Approach | DOM Access | Network | Storage | CPU Limit | Complexity |
|----------|------------|---------|---------|-----------|------------|
| Same context | Full | Full | Full | None | Low |
| iframe (strict) | None | Proxied | None | None | Medium |
| Web Worker | None | None | None | None | Medium |
| VM (isolated-vm) | None | None | None | Yes | High |
| Process (Electron) | None | Controlled | Controlled | Yes | Very High |

### Recommended Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Manifest Validation                                 │
│  - Validate manifest schema                                  │
│  - Check declared permissions                                │
│  - Verify plugin signature (if applicable)                   │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Content Security Policy                             │
│  - Restrict script sources                                   │
│  - Block unsafe-inline, unsafe-eval                          │
│  - Limit connect-src to allowlisted domains                  │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Runtime Sandbox                                     │
│  - iframe without allow-same-origin                          │
│  - Limited API surface via postMessage                       │
│  - Timeout for plugin operations                             │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: API Permission Checks                               │
│  - Check permissions before each API call                    │
│  - Rate limiting                                             │
│  - Audit logging                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## JSON Manifest-Based Discovery

### Industry Standard Manifest Fields

```json
{
  "$schema": "https://itemdeck.app/schemas/plugin-v1.json",

  "id": "com.example.my-plugin",
  "name": "My Plugin",
  "version": "1.2.3",
  "description": "A helpful plugin that does things",

  "author": {
    "name": "Developer Name",
    "url": "https://github.com/developer"
  },

  "license": "MIT",
  "repository": "https://github.com/developer/my-plugin",

  "engines": {
    "itemdeck": ">=1.5.0"
  },

  "type": "mechanic",

  "permissions": [
    "cards:read",
    "settings:read",
    "settings:write"
  ],

  "activationEvents": [
    "onMechanicSelect:my-plugin",
    "onSettingsOpen"
  ],

  "main": "./dist/plugin.js",
  "ui": "./dist/ui.html",

  "contributes": {
    "mechanics": [{
      "id": "my-game",
      "name": "My Game Mode",
      "icon": "./assets/icon.svg"
    }],
    "settings": [{
      "id": "difficulty",
      "type": "select",
      "options": ["easy", "medium", "hard"],
      "default": "medium"
    }]
  },

  "assets": {
    "icons": ["./assets/icon-16.png", "./assets/icon-32.png"],
    "styles": ["./dist/styles.css"]
  }
}
```

### Manifest Validation with Zod

```typescript
import { z } from 'zod';

const PermissionSchema = z.enum([
  'cards:read',
  'cards:write',
  'settings:read',
  'settings:write',
  'network:fetch',
  'storage:local',
]);

const PluginManifestSchema = z.object({
  $schema: z.string().optional(),

  id: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/),

  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500).optional(),

  author: z.object({
    name: z.string(),
    url: z.string().url().optional(),
  }).optional(),

  license: z.string().optional(),
  repository: z.string().url().optional(),

  engines: z.object({
    itemdeck: z.string(),
  }),

  type: z.enum(['mechanic', 'theme', 'source', 'settings']),

  permissions: z.array(PermissionSchema).default([]),

  activationEvents: z.array(z.string()).default([]),

  main: z.string(),
  ui: z.string().optional(),

  contributes: z.object({
    mechanics: z.array(z.object({
      id: z.string(),
      name: z.string(),
      icon: z.string().optional(),
    })).optional(),
    settings: z.array(z.object({
      id: z.string(),
      type: z.enum(['text', 'number', 'boolean', 'select']),
      default: z.unknown(),
    })).optional(),
  }).optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;
```

---

## Performance Implications

### Loading Strategies

| Strategy | Initial Load | Plugin Load | Memory |
|----------|--------------|-------------|--------|
| Eager (all at startup) | Slow | Instant | High |
| Lazy (on activation) | Fast | Slight delay | Optimal |
| Background (after idle) | Fast | Faster | Medium |
| On-demand (explicit) | Fast | User-triggered | Low |

### Recommended: Tiered Loading

```typescript
type LoadPriority = 'critical' | 'high' | 'normal' | 'low';

const loadingStrategy: Record<LoadPriority, () => void> = {
  critical: () => {
    // Load immediately during app init
    // e.g., active mechanic, current theme
  },
  high: () => {
    // Load after first paint
    requestIdleCallback(() => loadHighPriorityPlugins());
  },
  normal: () => {
    // Load on user interaction hint
    // e.g., hover over mechanics menu
  },
  low: () => {
    // Load only when explicitly requested
    // e.g., community plugins
  },
};
```

### Bundle Size Considerations

| Approach | Main Bundle | Per Plugin | Shared Deps |
|----------|-------------|------------|-------------|
| Dynamic imports | ~200KB | ~10-50KB | Deduplicated |
| Module Federation | ~200KB | ~20-100KB | Configurable |
| iframe sandbox | ~200KB | ~150KB+ | Duplicated |
| Web Worker | ~200KB | ~10-50KB | Duplicated |

### Code Splitting Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core chunks
          if (id.includes('react')) return 'vendor-react';
          if (id.includes('zustand')) return 'vendor-state';

          // Plugin chunks (built-in)
          if (id.includes('/mechanics/memory/')) return 'plugin-memory';
          if (id.includes('/mechanics/quiz/')) return 'plugin-quiz';
          if (id.includes('/mechanics/collection/')) return 'plugin-collection';
          if (id.includes('/mechanics/competing/')) return 'plugin-competing';

          // Theme chunks
          if (id.includes('/themes/')) return 'themes';
        },
      },
    },
  },
});
```

---

## Recommendation for itemdeck

### Tiered Trust Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   itemdeck v1.5.0 Plugin System              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 1: Built-in Plugins (Full Trust)                 │  │
│  │                                                        │  │
│  │  • Dynamic imports (current pattern)                   │  │
│  │  • Same context as host                                │  │
│  │  • Full API access                                     │  │
│  │  • Code reviewed, bundled with app                     │  │
│  │                                                        │  │
│  │  Examples: Memory, Quiz, Collection, Competing         │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                    Plugin API                                │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 2: Curated Plugins (Verified Trust)              │  │
│  │                                                        │  │
│  │  • Loaded from official registry                       │  │
│  │  • Reviewed before listing                             │  │
│  │  • iframe sandbox with messaging                       │  │
│  │  • Permission-based API access                         │  │
│  │                                                        │  │
│  │  Source: https://plugins.itemdeck.app/registry.json    │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                    Sandbox API                               │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TIER 3: Community Plugins (Minimal Trust)             │  │
│  │                                                        │  │
│  │  • Loaded from GitHub URLs                             │  │
│  │  • Strict iframe sandbox                               │  │
│  │  • Restricted API surface                              │  │
│  │  • User must explicitly approve                        │  │
│  │                                                        │  │
│  │  Source: raw.githubusercontent.com/{user}/{repo}/...   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Phases

#### Phase 1: Formalise Built-in Plugin Contract (v1.5.0-alpha)

Extend current mechanic system with formal manifest:

```typescript
// src/plugins/types.ts
export interface BuiltinPlugin {
  manifest: PluginManifest;

  // Lifecycle
  activate: () => void;
  deactivate: () => void;

  // State
  getState: () => PluginState;
  subscribe: (listener: StateListener) => Unsubscribe;

  // Settings
  settingsSchema: ZodSchema;
  defaultSettings: unknown;
  SettingsComponent?: React.ComponentType<SettingsPanelProps>;

  // UI Slots
  CardOverlay?: React.ComponentType<CardOverlayProps>;
  GridOverlay?: React.ComponentType<GridOverlayProps>;
  StatusBar?: React.ComponentType<StatusBarProps>;
}
```

#### Phase 2: Sandbox Infrastructure (v1.5.0-beta)

Build iframe sandbox and message protocol:

```typescript
// src/plugins/sandbox/host.ts
export class PluginSandbox {
  private iframe: HTMLIFrameElement;
  private messageHandlers: Map<string, MessageHandler>;

  constructor(manifest: PluginManifest) {
    this.iframe = this.createSandboxedIframe(manifest);
    this.messageHandlers = this.createSecureAPI(manifest.permissions);
    window.addEventListener('message', this.handleMessage);
  }

  private createSandboxedIframe(manifest: PluginManifest): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts');
    // Explicitly omit: allow-same-origin, allow-popups, allow-forms

    // CSP for iframe content
    iframe.setAttribute('csp', [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'none'",  // All network via host proxy
    ].join('; '));

    iframe.src = manifest.sandboxEntry;
    return iframe;
  }

  private createSecureAPI(permissions: Permission[]): Map<string, MessageHandler> {
    const handlers = new Map<string, MessageHandler>();

    if (permissions.includes('cards:read')) {
      handlers.set('GET_CARDS', () => this.getCards());
    }

    if (permissions.includes('settings:read')) {
      handlers.set('GET_SETTINGS', (payload) => this.getSettings(payload.scope));
    }

    if (permissions.includes('settings:write')) {
      handlers.set('UPDATE_SETTINGS', (payload) => this.updateSettings(payload));
    }

    return handlers;
  }
}
```

#### Phase 3: Plugin Registry and Discovery (v1.5.0-rc)

Build curated registry system:

```typescript
// src/plugins/registry/client.ts
const REGISTRY_URL = 'https://plugins.itemdeck.app/v1';

export interface RegistryPlugin {
  id: string;
  manifest: PluginManifest;
  downloadUrl: string;
  checksum: string;
  verified: boolean;
  downloads: number;
  rating: number;
}

export async function searchPlugins(query: string): Promise<RegistryPlugin[]> {
  const response = await fetch(`${REGISTRY_URL}/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.plugins;
}

export async function downloadPlugin(plugin: RegistryPlugin): Promise<Blob> {
  const response = await fetch(plugin.downloadUrl);
  const blob = await response.blob();

  // Verify checksum
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  const hashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (hashHex !== plugin.checksum) {
    throw new Error('Plugin checksum mismatch');
  }

  return blob;
}
```

### Directory Structure

```
src/
├── plugins/
│   ├── core/
│   │   ├── types.ts              # Plugin interfaces
│   │   ├── manifest.ts           # Manifest validation
│   │   ├── registry.ts           # Plugin registry
│   │   └── loader.ts             # Plugin loader
│   │
│   ├── sandbox/
│   │   ├── host.ts               # Sandbox host
│   │   ├── protocol.ts           # Message protocol
│   │   ├── permissions.ts        # Permission checks
│   │   └── api/                   # Sandboxed API implementations
│   │       ├── cards.ts
│   │       ├── settings.ts
│   │       └── ui.ts
│   │
│   ├── builtins/                  # Tier 1: Built-in plugins
│   │   ├── mechanics/
│   │   │   ├── memory/
│   │   │   ├── quiz/
│   │   │   ├── collection/
│   │   │   └── competing/
│   │   └── themes/
│   │       ├── light/
│   │       └── dark/
│   │
│   └── external/                  # Tier 2 & 3: External plugins
│       ├── curated/               # Downloaded from registry
│       └── community/             # User-provided URLs
│
├── stores/
│   └── pluginStore.ts             # Plugin state management
│
└── components/
    └── PluginManager/             # Plugin management UI
        ├── PluginList.tsx
        ├── PluginSettings.tsx
        └── PluginInstaller.tsx
```

### What Belongs in Core vs Plugins

| Core (Always Loaded) | Plugin (Lazy Loaded) |
|---------------------|----------------------|
| Card rendering | Game mechanics |
| Grid layout | Custom themes |
| Settings framework | Advanced settings |
| Plugin loader | Data source adapters |
| Security sandbox | Community extensions |
| Basic theme (light/dark) | Custom fonts |

### API Surface for External Plugins

```typescript
// Available to sandboxed plugins via postMessage
interface SandboxedPluginAPI {
  // Cards (requires cards:read)
  getCards(): Promise<Card[]>;
  getCard(id: string): Promise<Card | null>;
  subscribeToCards(callback: (cards: Card[]) => void): Unsubscribe;

  // Settings (requires settings:read/write)
  getSettings(scope: string): Promise<unknown>;
  updateSettings(scope: string, settings: unknown): Promise<void>;

  // UI (requires ui:render)
  renderOverlay(elements: UIElement[]): void;
  showNotification(message: string, type: 'info' | 'error'): void;

  // Events
  onCardClick(callback: (card: Card) => void): Unsubscribe;
  onMechanicActivate(callback: () => void): Unsubscribe;
  onMechanicDeactivate(callback: () => void): Unsubscribe;
}
```

---

## ADR Recommendations for v1.5.0

Based on this research, the following Architecture Decision Records should be created:

### ADR-022: Plugin Trust Tiers

**Decision:** Implement three-tier trust model (built-in, curated, community)

**Context:** Need to balance extensibility with security

**Consequences:** More complex architecture, but secure by default

### ADR-023: Sandbox Implementation

**Decision:** Use iframe sandbox for external plugins (without `allow-same-origin`)

**Context:** Need isolation for untrusted code

**Consequences:** Async-only communication, some UX limitations

### ADR-024: Plugin Distribution

**Decision:** Official registry for curated plugins, GitHub raw URLs for community

**Context:** Need distribution mechanism without infrastructure burden

**Consequences:** GitHub dependency, potential availability issues

### ADR-025: Plugin Manifest Schema

**Decision:** JSON manifest with Zod validation

**Context:** Need declarative plugin metadata and capability declaration

**Consequences:** Schema versioning required, migration path needed

---

## References

### Primary Sources
- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Extension Host Architecture](https://code.visualstudio.com/api/advanced-topics/extension-host)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Figma Plugin Sandbox](https://www.figma.com/plugin-docs/how-plugins-run/)
- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)

### Module Federation
- [Module Federation Documentation](https://webpack.js.org/concepts/module-federation/)
- [Vite Module Federation Plugin](https://github.com/originjs/vite-plugin-federation)
- [Module Federation Examples](https://github.com/module-federation/module-federation-examples)

### Security
- [OWASP Content Security Policy](https://owasp.org/www-community/controls/Content_Security_Policy)
- [MDN iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox)
- [postMessage Security](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concerns)

### Performance
- [Vite Code Splitting](https://vitejs.dev/guide/features.html#async-chunk-loading-optimization)
- [Web Performance Working Group](https://www.w3.org/webperf/)

---

## Related Documentation

- [ADR-016: Gaming Mechanics Plugin Architecture](../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md)
- [ADR-017: Mechanic State Management](../decisions/adrs/ADR-017-mechanic-state-management.md)
- [ADR-020: Mechanic Settings Isolation](../decisions/adrs/ADR-020-mechanic-settings-isolation.md)
- [R-006: Plugin State Isolation](./R-006-plugin-state-isolation.md)
- [Modular Architecture Research](./modular-architecture.md)
- [System Security Research](./system-security.md)
- [v1.5.0 Milestone](../roadmap/milestones/v1.5.0.md)

---

**Status**: Complete (informs v1.5.0 ADRs)
