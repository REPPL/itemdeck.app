# State of the Art: Web Security Sandboxing for Plugin Execution

## Executive Summary

This document analyses browser-based sandboxing techniques for safely executing untrusted JavaScript code in plugin systems. For itemdeck's v1.5.0 plugin security model, the recommended approach is a **layered defence strategy** combining **sandboxed iframes with postMessage communication**, **strict Content Security Policy**, and **capability-based permissions**.

Key findings:
1. **iframes remain the most battle-tested** sandboxing primitive in browsers
2. **The Realms API** (formerly Realm Proposal) is promising but lacks browser support
3. **Secure EcmaScript (SES)** provides strong isolation but requires careful consideration of performance
4. **Web Workers** offer memory isolation but cannot render UI directly
5. **Capability-based security** outperforms role-based for plugin systems

Recommendation: Use **sandboxed iframes with postMessage** for plugin UI rendering, **strict CSP** for script execution control, and **capability tokens** for API access. This balances security, developer experience, and real-world practicality.

---

## Landscape Overview

### The Plugin Security Challenge

Plugin systems face a fundamental tension:

| Requirement | Security Implication |
|-------------|---------------------|
| Execute third-party code | Potential XSS, data theft |
| Access host application data | Information leakage risk |
| Render custom UI | DOM manipulation vectors |
| Respond to user interaction | Event handler injection |
| Persist plugin state | Storage exhaustion, data corruption |
| Make network requests | Data exfiltration risk |

### Browser Security Primitives

| Primitive | Isolation Level | UI Rendering | Performance | Browser Support |
|-----------|-----------------|--------------|-------------|-----------------|
| **Same-origin policy** | Domain-level | Yes | Excellent | Universal |
| **Sandboxed iframes** | Process-level | Yes | Good | Universal |
| **Web Workers** | Thread-level | No (indirect) | Good | Universal |
| **Realms API** | Compartment-level | Yes | Unknown | Stage 3 proposal |
| **SES (Hardened JS)** | Object-level | Yes | Moderate | Polyfill only |
| **Shadow DOM** | DOM-level | Yes | Excellent | Universal |

### Industry Adoption

| Platform | Primary Technique | Secondary Measures |
|----------|------------------|-------------------|
| **Figma** | Sandboxed iframes | postMessage API, capability tokens |
| **Notion** | Sandboxed iframes | CSP, API proxy |
| **Airtable** | Sandboxed iframes | Scoped permissions |
| **VS Code (web)** | Web Workers + iframes | Extension host isolation |
| **Google Sheets** | Apps Script VM | Quota limits, OAuth scopes |
| **Salesforce LWC** | Locker Service (SES-based) | CSP, API restrictions |

---

## Sandboxing Techniques

### 1. Sandboxed Iframes

**How it works:** Load plugin code in an `<iframe>` with restrictive `sandbox` attribute. Communicate via `postMessage`.

```html
<!-- Host application -->
<iframe
  id="plugin-frame"
  src="https://plugins.itemdeck.app/plugin-abc/index.html"
  sandbox="allow-scripts allow-forms"
  allow=""
  referrerpolicy="no-referrer"
></iframe>
```

**Sandbox attribute values:**

| Value | Effect | Security Implication |
|-------|--------|---------------------|
| (no value) | Strictest - no scripts, no forms | Maximum security, unusable |
| `allow-scripts` | JavaScript execution | Required for plugins |
| `allow-forms` | Form submission | Often needed for UI |
| `allow-same-origin` | Access to storage, cookies | **Avoid** - breaks isolation |
| `allow-popups` | window.open(), target="_blank" | Usually unnecessary |
| `allow-modals` | alert(), confirm(), prompt() | Usually unnecessary |
| `allow-top-navigation` | Navigate parent frame | **Never allow** |

**Communication pattern:**

```typescript
// Host application - src/plugins/PluginHost.tsx
interface PluginMessage {
  type: string;
  payload: unknown;
  requestId?: string;
}

class PluginBridge {
  private iframe: HTMLIFrameElement;
  private origin: string;
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(iframe: HTMLIFrameElement, origin: string) {
    this.iframe = iframe;
    this.origin = origin;
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent): void {
    // Critical: Validate origin
    if (event.origin !== this.origin) {
      console.warn(`Rejected message from unexpected origin: ${event.origin}`);
      return;
    }

    const message = event.data as PluginMessage;

    // Handle response to our request
    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      const pending = this.pendingRequests.get(message.requestId)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.requestId);

      if (message.type === 'error') {
        pending.reject(new Error(message.payload as string));
      } else {
        pending.resolve(message.payload);
      }
      return;
    }

    // Handle incoming request from plugin
    this.processPluginRequest(message);
  }

  async request(type: string, payload: unknown): Promise<unknown> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Plugin request timeout: ${type}`));
      }, 5000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      this.iframe.contentWindow?.postMessage(
        { type, payload, requestId },
        this.origin
      );
    });
  }

  private processPluginRequest(message: PluginMessage): void {
    // Route to capability-checked handlers
    switch (message.type) {
      case 'getCards':
        this.handleGetCards(message);
        break;
      case 'updateCard':
        this.handleUpdateCard(message);
        break;
      default:
        console.warn(`Unknown plugin request type: ${message.type}`);
    }
  }
}
```

```typescript
// Plugin side - plugin/src/bridge.ts
class HostBridge {
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent): void {
    // Plugin should also validate origin if known
    const message = event.data;

    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      const pending = this.pendingRequests.get(message.requestId)!;
      this.pendingRequests.delete(message.requestId);
      pending.resolve(message.payload);
    }
  }

  async request<T>(type: string, payload?: unknown): Promise<T> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      window.parent.postMessage(
        { type, payload, requestId },
        '*' // Plugin doesn't know host origin initially
      );
    });
  }
}

// Plugin API exposed to plugin developers
export const itemdeck = {
  cards: {
    getAll: () => bridge.request<Card[]>('getCards'),
    getById: (id: string) => bridge.request<Card>('getCard', { id }),
    update: (id: string, data: Partial<Card>) =>
      bridge.request<void>('updateCard', { id, data }),
  },
  ui: {
    showToast: (message: string) => bridge.request('showToast', { message }),
    openModal: (config: ModalConfig) => bridge.request('openModal', config),
  },
};
```

**Pros:**
- Battle-tested in production (Figma, Notion, Airtable)
- Process-level isolation in most browsers
- Plugin can render its own UI
- CSP violations in plugin don't affect host
- Plugin crashes don't crash host

**Cons:**
- Cross-frame communication overhead (~1-5ms per message)
- Complex state synchronisation
- Plugin cannot directly access host DOM
- Requires hosting plugin code separately
- iframe sizing and responsiveness challenges

---

### 2. Web Workers

**How it works:** Execute plugin JavaScript in a dedicated Worker thread. No DOM access; communicate via structured cloning.

```typescript
// src/plugins/PluginWorker.ts
interface WorkerPlugin {
  id: string;
  worker: Worker;
  capabilities: Set<string>;
}

class PluginWorkerManager {
  private plugins = new Map<string, WorkerPlugin>();

  async loadPlugin(manifest: PluginManifest): Promise<void> {
    // Create worker from blob URL to avoid CORS issues
    const workerCode = await this.fetchPluginCode(manifest.entryPoint);
    const blob = new Blob([this.wrapPluginCode(workerCode)], {
      type: 'application/javascript',
    });
    const blobUrl = URL.createObjectURL(blob);

    const worker = new Worker(blobUrl, {
      type: 'module',
      name: `plugin-${manifest.id}`,
    });

    worker.onmessage = (event) => this.handleWorkerMessage(manifest.id, event);
    worker.onerror = (event) => this.handleWorkerError(manifest.id, event);

    this.plugins.set(manifest.id, {
      id: manifest.id,
      worker,
      capabilities: new Set(manifest.capabilities),
    });

    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);
  }

  private wrapPluginCode(code: string): string {
    // Inject sandboxed global object
    return `
      // Freeze dangerous globals
      const _fetch = fetch;
      const _setTimeout = setTimeout;
      const _setInterval = setInterval;

      // Create restricted global
      const itemdeck = {
        async request(type, payload) {
          return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const handler = (event) => {
              if (event.data.responseId === id) {
                self.removeEventListener('message', handler);
                if (event.data.error) reject(new Error(event.data.error));
                else resolve(event.data.result);
              }
            };
            self.addEventListener('message', handler);
            self.postMessage({ type, payload, requestId: id });
          });
        }
      };

      Object.freeze(itemdeck);

      // Plugin code runs here
      ${code}
    `;
  }

  async invokePlugin(
    pluginId: string,
    method: string,
    args: unknown[]
  ): Promise<unknown> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timeout = setTimeout(() => {
        reject(new Error(`Plugin invocation timeout: ${method}`));
      }, 10000);

      const handler = (event: MessageEvent) => {
        if (event.data.responseId === requestId) {
          clearTimeout(timeout);
          plugin.worker.removeEventListener('message', handler);

          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      plugin.worker.addEventListener('message', handler);
      plugin.worker.postMessage({ method, args, requestId });
    });
  }

  terminatePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.worker.terminate();
      this.plugins.delete(pluginId);
    }
  }
}
```

**For UI rendering, combine with iframe:**

```typescript
// Plugin renders to virtual DOM, host applies changes
interface VirtualDOMNode {
  type: string;
  props: Record<string, unknown>;
  children: (VirtualDOMNode | string)[];
}

// Worker sends virtual DOM
self.postMessage({
  type: 'render',
  vdom: {
    type: 'div',
    props: { className: 'plugin-root' },
    children: [
      { type: 'h2', props: {}, children: ['Plugin Title'] },
      { type: 'button', props: { onclick: 'handleClick' }, children: ['Click me'] },
    ],
  },
});

// Host renders safely
function renderVDOM(node: VirtualDOMNode, eventHandlers: Map<string, () => void>): React.ReactNode {
  if (typeof node === 'string') return node;

  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node.props)) {
    if (key.startsWith('on') && typeof value === 'string') {
      // Map event handler name to actual function
      props[key] = () => eventHandlers.get(value)?.();
    } else {
      props[key] = value;
    }
  }

  return React.createElement(
    node.type,
    props,
    ...node.children.map((child) =>
      typeof child === 'string' ? child : renderVDOM(child, eventHandlers)
    )
  );
}
```

**Pros:**
- Complete memory isolation
- Plugin cannot access any host globals
- Crashes don't affect main thread
- Good for computation-heavy plugins

**Cons:**
- Cannot render UI directly (need iframe or virtual DOM)
- No DOM access - requires serialisation
- Structured cloning overhead for large data
- More complex plugin development

---

### 3. Realms API (Stage 3 Proposal)

**How it works:** Create isolated JavaScript compartments within the same thread, with separate global objects but shared intrinsics.

```typescript
// Note: This API is not yet available in browsers
// Using the TC39 proposal syntax for illustration

// Create a new Realm
const pluginRealm = new Realm();

// Evaluate code in the Realm
const result = pluginRealm.evaluate(`
  const greeting = 'Hello from plugin';
  greeting.length;
`);

console.log(result); // 22

// Import modules into the Realm
const pluginModule = await pluginRealm.import('./plugin.js');

// Expose host API to plugin
pluginRealm.evaluate(`
  globalThis.itemdeck = ${JSON.stringify(allowedAPI)};
`);
```

**Current status (December 2024):**
- Stage 3 at TC39 (likely to be standardised)
- No browser implementation yet
- Polyfills available but incomplete

**Pros:**
- Lightweight compared to iframes/workers
- Same-thread execution (synchronous calls possible)
- Can share carefully chosen objects
- Clean separation of global scope

**Cons:**
- Not yet implemented in browsers
- Polyfills have limitations
- Same-thread means plugin can block UI
- Requires careful membrane design for object sharing

---

### 4. Secure EcmaScript (SES) / Hardened JavaScript

**How it works:** Freeze JavaScript intrinsics and create compartments with controlled global objects.

```typescript
// Using @endo/ses and @endo/compartment packages
import 'ses';
import { Compartment } from '@endo/compartment';

// Lock down JavaScript environment
lockdown({
  errorTaming: 'safe',
  stackFiltering: 'verbose',
  overrideTaming: 'severe',
  consoleTaming: 'safe',
});

// Create a compartment for plugin
const pluginCompartment = new Compartment({
  globals: {
    // Only expose what plugin needs
    console: harden({
      log: (...args: unknown[]) => console.log('[Plugin]', ...args),
      warn: (...args: unknown[]) => console.warn('[Plugin]', ...args),
      error: (...args: unknown[]) => console.error('[Plugin]', ...args),
    }),
    itemdeck: harden({
      cards: {
        getAll: async () => {
          // Capability check happens here
          return cards.map(card => ({ ...card })); // Return copies
        },
      },
    }),
  },
  modules: {
    // Controlled module graph
  },
});

// Evaluate plugin code
try {
  const pluginExports = pluginCompartment.evaluate(pluginSourceCode);

  // Call plugin functions
  if (typeof pluginExports.onCardSelect === 'function') {
    pluginExports.onCardSelect(selectedCard);
  }
} catch (error) {
  console.error('Plugin execution error:', error);
}
```

**The `lockdown()` function:**

```typescript
// What lockdown() does:
// 1. Freezes all intrinsics (Object, Array, Function, etc.)
// 2. Removes ambient authority (Date.now, Math.random become deterministic)
// 3. Prevents prototype pollution
// 4. Tames Error stacks to prevent information leakage

// After lockdown(), this throws:
Object.prototype.malicious = 'data'; // TypeError: Cannot add property
Array.prototype.push = () => {}; // TypeError: Cannot assign
```

**Pros:**
- Strong object-level isolation
- Same-thread execution (fast)
- Detailed control over what plugins can access
- Battle-tested at Agoric (blockchain)

**Cons:**
- Requires `lockdown()` early in application lifecycle
- All code must be compatible with frozen intrinsics
- Some libraries break after lockdown
- Learning curve for membrane patterns
- Performance overhead for hardens/freezes

---

### 5. Shadow DOM (DOM Isolation Only)

**How it works:** Encapsulate DOM and styles, but not JavaScript execution.

```typescript
// Shadow DOM only isolates DOM structure and styles
// It does NOT provide JavaScript sandboxing

class PluginContainer extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'closed' });

    // Plugin styles don't leak out
    shadow.innerHTML = `
      <style>
        /* These styles are scoped */
        .plugin-root { background: white; }
      </style>
      <div class="plugin-root"></div>
    `;
  }
}

customElements.define('plugin-container', PluginContainer);
```

**Shadow DOM is useful for:**
- Style encapsulation
- DOM structure isolation
- Preventing CSS conflicts

**Shadow DOM does NOT provide:**
- JavaScript sandboxing
- Prevention of XSS
- Memory isolation
- Script execution control

**Use Shadow DOM alongside other techniques, not as primary security.**

---

## Content Security Policy (CSP)

### CSP for Plugin Security

CSP restricts what code can execute and what resources can be loaded.

```typescript
// src/security/csp.ts

export const HOST_CSP = {
  // Default: block everything
  'default-src': ["'self'"],

  // Scripts: only our own code
  'script-src': [
    "'self'",
    // No unsafe-inline - all scripts must be from files
    // No unsafe-eval - no eval(), new Function()
  ],

  // Styles: our own plus inline (required for CSS-in-JS)
  'style-src': [
    "'self'",
    "'unsafe-inline'",
  ],

  // Images: our sources plus data URIs for small images
  'img-src': [
    "'self'",
    'data:',
    'https://images.itemdeck.app',
    'https://raw.githubusercontent.com',
  ],

  // Connections: our API only
  'connect-src': [
    "'self'",
    'https://api.itemdeck.app',
  ],

  // Frames: only our plugin sandbox origin
  'frame-src': [
    'https://plugins.itemdeck.app',
  ],

  // Prevent this page from being framed
  'frame-ancestors': ["'none'"],

  // Block all object/embed
  'object-src': ["'none'"],

  // Block base tag hijacking
  'base-uri': ["'self'"],

  // Form submissions only to our origin
  'form-action': ["'self'"],

  // Report violations
  'report-uri': ['https://api.itemdeck.app/csp-violations'],
};

// Plugin iframe CSP (more restrictive)
export const PLUGIN_CSP = {
  'default-src': ["'none'"],
  'script-src': ["'self'"], // Only plugin's own scripts
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https://images.itemdeck.app'],
  'connect-src': ['https://api.itemdeck.app'], // API proxy only
  'frame-src': ["'none'"], // No nested frames
  'frame-ancestors': ['https://itemdeck.app'], // Only embeddable in host
};

export function buildCSPHeader(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}
```

### Nonce-Based Script Allowlisting

```typescript
// Server-side: Generate nonce per request
import { randomBytes } from 'crypto';

function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

// Express middleware
app.use((req, res, next) => {
  const nonce = generateNonce();
  res.locals.nonce = nonce;

  res.setHeader('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'unsafe-inline';
  `);

  next();
});

// In HTML template
`<script nonce="${nonce}" src="/bundle.js"></script>`
```

### CSP Violation Reporting

```typescript
// src/api/cspViolations.ts
interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'source-file': string;
    'line-number': number;
    'column-number': number;
  };
}

// Log violations for security monitoring
app.post('/csp-violations', (req, res) => {
  const report = req.body as CSPViolationReport;

  logger.warn('CSP Violation', {
    directive: report['csp-report']['violated-directive'],
    blockedUri: report['csp-report']['blocked-uri'],
    sourceFile: report['csp-report']['source-file'],
    line: report['csp-report']['line-number'],
  });

  res.status(204).send();
});
```

---

## Permission Models

### 1. Capability-Based Security (Recommended)

**Principle:** Authority comes from possessing unforgeable tokens (capabilities), not from identity.

```typescript
// src/plugins/capabilities.ts

// Capability token - unforgeable reference to a specific permission
interface Capability {
  id: string;
  type: CapabilityType;
  scope: CapabilityScope;
  expiry?: number;
  signature: string;
}

type CapabilityType =
  | 'cards:read'
  | 'cards:write'
  | 'collection:read'
  | 'collection:write'
  | 'ui:toast'
  | 'ui:modal'
  | 'storage:read'
  | 'storage:write';

interface CapabilityScope {
  collectionId?: string;
  cardIds?: string[];
  storageKey?: string;
}

class CapabilityManager {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  // Issue capability to plugin
  issue(
    pluginId: string,
    type: CapabilityType,
    scope: CapabilityScope,
    expiryMinutes?: number
  ): Capability {
    const capability: Capability = {
      id: crypto.randomUUID(),
      type,
      scope,
      expiry: expiryMinutes
        ? Date.now() + expiryMinutes * 60 * 1000
        : undefined,
      signature: '', // Computed below
    };

    capability.signature = this.sign(capability, pluginId);
    return capability;
  }

  // Verify capability is valid
  verify(capability: Capability, pluginId: string): boolean {
    // Check expiry
    if (capability.expiry && Date.now() > capability.expiry) {
      return false;
    }

    // Verify signature
    const expectedSignature = this.sign(capability, pluginId);
    return capability.signature === expectedSignature;
  }

  // Check if capability authorises specific action
  authorises(
    capability: Capability,
    action: CapabilityType,
    resource: CapabilityScope
  ): boolean {
    // Type must match
    if (capability.type !== action) return false;

    // Check scope
    if (capability.scope.collectionId &&
        capability.scope.collectionId !== resource.collectionId) {
      return false;
    }

    if (capability.scope.cardIds && resource.cardIds) {
      const allowed = new Set(capability.scope.cardIds);
      if (!resource.cardIds.every(id => allowed.has(id))) {
        return false;
      }
    }

    return true;
  }

  private sign(capability: Omit<Capability, 'signature'>, pluginId: string): string {
    const data = JSON.stringify({ ...capability, pluginId });
    // In production, use HMAC-SHA256
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(data + this.secret))
      .then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      );
  }
}
```

**Plugin API with capability checking:**

```typescript
// src/plugins/PluginAPI.ts

class PluginAPI {
  private capabilities: Map<string, Set<Capability>> = new Map();
  private capabilityManager: CapabilityManager;

  grantCapability(pluginId: string, capability: Capability): void {
    if (!this.capabilities.has(pluginId)) {
      this.capabilities.set(pluginId, new Set());
    }
    this.capabilities.get(pluginId)!.add(capability);
  }

  revokeCapability(pluginId: string, capabilityId: string): void {
    const caps = this.capabilities.get(pluginId);
    if (caps) {
      for (const cap of caps) {
        if (cap.id === capabilityId) {
          caps.delete(cap);
          break;
        }
      }
    }
  }

  async handleRequest(
    pluginId: string,
    request: PluginRequest
  ): Promise<unknown> {
    const caps = this.capabilities.get(pluginId);
    if (!caps) {
      throw new Error('Plugin has no capabilities');
    }

    // Find capability that authorises this request
    const requiredType = this.mapRequestToCapability(request.type);
    const scope = this.extractScope(request);

    let authorised = false;
    for (const cap of caps) {
      if (this.capabilityManager.verify(cap, pluginId) &&
          this.capabilityManager.authorises(cap, requiredType, scope)) {
        authorised = true;
        break;
      }
    }

    if (!authorised) {
      throw new Error(`Plugin lacks capability for: ${request.type}`);
    }

    // Execute the authorised request
    return this.executeRequest(request);
  }

  private mapRequestToCapability(requestType: string): CapabilityType {
    const mapping: Record<string, CapabilityType> = {
      'getCards': 'cards:read',
      'getCard': 'cards:read',
      'updateCard': 'cards:write',
      'getCollection': 'collection:read',
      'showToast': 'ui:toast',
      'openModal': 'ui:modal',
    };
    return mapping[requestType] ?? 'cards:read';
  }
}
```

**Pros:**
- Fine-grained access control
- Capabilities can be scoped to specific resources
- Revocable at any time
- No ambient authority - explicit grants only
- Supports principle of least privilege

**Cons:**
- More complex to implement than role-based
- Requires careful capability design
- Token management overhead

---

### 2. Role-Based Access Control (RBAC)

**How it works:** Assign roles to plugins; roles grant sets of permissions.

```typescript
// src/plugins/rbac.ts

type Permission =
  | 'cards.read'
  | 'cards.write'
  | 'cards.delete'
  | 'collection.read'
  | 'collection.write'
  | 'settings.read'
  | 'settings.write'
  | 'ui.toast'
  | 'ui.modal'
  | 'ui.panel';

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

const ROLES: Record<string, Role> = {
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    permissions: ['cards.read', 'collection.read'],
  },
  editor: {
    id: 'editor',
    name: 'Editor',
    permissions: [
      'cards.read', 'cards.write',
      'collection.read',
      'ui.toast',
    ],
  },
  admin: {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      'cards.read', 'cards.write', 'cards.delete',
      'collection.read', 'collection.write',
      'settings.read', 'settings.write',
      'ui.toast', 'ui.modal', 'ui.panel',
    ],
  },
};

class RBACManager {
  private pluginRoles: Map<string, string[]> = new Map();

  assignRole(pluginId: string, roleId: string): void {
    const roles = this.pluginRoles.get(pluginId) ?? [];
    if (!roles.includes(roleId)) {
      roles.push(roleId);
      this.pluginRoles.set(pluginId, roles);
    }
  }

  hasPermission(pluginId: string, permission: Permission): boolean {
    const roleIds = this.pluginRoles.get(pluginId) ?? [];

    for (const roleId of roleIds) {
      const role = ROLES[roleId];
      if (role?.permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }
}
```

**Pros:**
- Simple mental model
- Easy to audit (role -> permissions mapping)
- Familiar pattern

**Cons:**
- Coarse-grained (all-or-nothing per permission)
- Role explosion for fine-grained control
- Cannot scope to specific resources
- Harder to implement least privilege

---

### 3. Hybrid Approach (Recommended for itemdeck)

Combine RBAC for coarse control with capabilities for fine-grained resource access:

```typescript
// src/plugins/permissions.ts

// RBAC for categories of access
type PluginTier = 'basic' | 'trusted' | 'verified';

const TIER_PERMISSIONS: Record<PluginTier, string[]> = {
  basic: ['cards:read', 'ui:toast'],
  trusted: ['cards:read', 'cards:write', 'ui:toast', 'ui:modal'],
  verified: ['cards:read', 'cards:write', 'collection:read', 'ui:*'],
};

// Capabilities for specific resources
interface PluginPermissions {
  tier: PluginTier;
  capabilities: Capability[];
  restrictions: {
    maxApiCallsPerMinute: number;
    maxStorageBytes: number;
    allowedDomains: string[];
  };
}

class HybridPermissionManager {
  private plugins: Map<string, PluginPermissions> = new Map();

  async checkAccess(
    pluginId: string,
    action: string,
    resource?: unknown
  ): Promise<boolean> {
    const perms = this.plugins.get(pluginId);
    if (!perms) return false;

    // Check tier-level permission
    const tierPerms = TIER_PERMISSIONS[perms.tier];
    const actionBase = action.split(':')[0];

    const hasTierPerm = tierPerms.some(p =>
      p === action || p === `${actionBase}:*` || p === '*'
    );

    if (!hasTierPerm) return false;

    // For resource-specific actions, check capabilities
    if (resource && (action.includes(':write') || action.includes(':delete'))) {
      return perms.capabilities.some(cap =>
        this.capabilityCovers(cap, action, resource)
      );
    }

    return true;
  }
}
```

---

## Real-World Implementations

### 1. Figma Plugin Sandbox

**Architecture:**
```
┌─────────────────────────────────────────────────┐
│                 Figma Main Thread                │
│  ┌─────────────┐  ┌─────────────┐               │
│  │   Canvas    │  │   Plugin    │               │
│  │   Engine    │  │   Manager   │               │
│  └─────────────┘  └──────┬──────┘               │
│                          │                       │
│                    postMessage                   │
│                          │                       │
│  ┌───────────────────────▼─────────────────────┐│
│  │         Plugin Sandbox (iframe)              ││
│  │  ┌─────────────┐  ┌───────────────────────┐ ││
│  │  │  Plugin UI  │  │     Plugin Code       │ ││
│  │  │    (DOM)    │  │  (figma.* API calls)  │ ││
│  │  └─────────────┘  └───────────────────────┘ ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**Key techniques:**
1. **Sandboxed iframe** - Plugin runs in isolated origin
2. **postMessage API** - All communication serialised
3. **Capability tokens** - Access to specific nodes granted explicitly
4. **Rate limiting** - API calls throttled
5. **Read replicas** - Plugin receives copies, not references

**Figma plugin API pattern:**

```typescript
// Figma exposes a limited API object
const figma = {
  // Read access to selected nodes
  get currentPage() { /* returns proxy */ },
  get selection() { /* returns proxied array */ },

  // Controlled mutations
  createRectangle() { /* validated, logged */ },

  // UI communication
  ui: {
    postMessage(data: unknown) { /* to plugin UI iframe */ },
    onmessage: null as ((data: unknown) => void) | null,
  },

  // Explicit close
  closePlugin() { /* cleanup and terminate */ },
};

// Plugin code runs with this restricted global
declare const figma: PluginAPI;
```

---

### 2. Notion Custom Blocks

**Architecture:**
```
┌─────────────────────────────────────────────────┐
│                 Notion App                       │
│                                                  │
│  ┌─────────────────────────────────────────────┐│
│  │              Block Renderer                  ││
│  │                                              ││
│  │  ┌─────────────────────────────────────────┐││
│  │  │     Custom Block (sandboxed iframe)     │││
│  │  │                                         │││
│  │  │  - sandbox="allow-scripts"              │││
│  │  │  - Scoped storage                       │││
│  │  │  - postMessage to parent                │││
│  │  │  - No direct Notion API access          │││
│  │  └─────────────────────────────────────────┘││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  ┌─────────────────────────────────────────────┐│
│  │              Block API Proxy                 ││
│  │  - Validates all requests                   ││
│  │  - Enforces permissions                     ││
│  │  - Audit logs                               ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**Key techniques:**
1. **Strict CSP** on custom blocks
2. **API proxy** - blocks cannot call Notion API directly
3. **Scoped access** - block only sees its own data
4. **Signed URLs** for any external resources

---

### 3. Airtable Custom Apps

**Permission model:**

```typescript
// Airtable uses declarative permissions in app manifest
{
  "airtableSchema": {
    "tables": {
      "tableName": {
        "read": true,
        "write": false
      }
    }
  },
  "externalAccess": {
    "urls": ["https://api.example.com/*"],
    "scopes": ["read"]
  }
}

// SDK enforces these at runtime
const table = base.getTable('Tasks');
await table.selectRecordsAsync(); // Works
await table.createRecordAsync({}); // Throws - no write permission
```

---

## Performance and UX Trade-offs

### Sandboxing Performance Comparison

| Technique | Startup Time | Message Latency | Memory Overhead | UI Smoothness |
|-----------|--------------|-----------------|-----------------|---------------|
| **Same-origin (unsafe)** | <10ms | <1ms | Minimal | Excellent |
| **Sandboxed iframe** | 50-200ms | 1-5ms | ~5-20MB per plugin | Good |
| **Web Worker** | 20-50ms | 0.5-2ms (structured clone) | ~2-10MB | N/A (no UI) |
| **SES Compartment** | 100-500ms (lockdown) | <1ms | Minimal | Good |
| **Realms (when available)** | TBD | <1ms | Minimal | Good |

### Optimisation Strategies

**1. Lazy loading plugins:**

```typescript
// Only load plugin iframe when needed
function PluginContainer({ pluginId }: { pluginId: string }) {
  const [shouldLoad, setShouldLoad] = useState(false);

  // Use Intersection Observer for viewport-based loading
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="plugin-container">
      {shouldLoad ? (
        <iframe
          src={`https://plugins.itemdeck.app/${pluginId}/index.html`}
          sandbox="allow-scripts"
        />
      ) : (
        <PluginPlaceholder />
      )}
    </div>
  );
}
```

**2. Message batching:**

```typescript
// Batch multiple requests to reduce postMessage overhead
class BatchedPluginBridge {
  private pendingBatch: Array<{ request: PluginRequest; resolve: Function }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  async request(type: string, payload: unknown): Promise<unknown> {
    return new Promise((resolve) => {
      this.pendingBatch.push({ request: { type, payload }, resolve });

      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.flush(), 16); // One frame
      }
    });
  }

  private flush(): void {
    const batch = this.pendingBatch;
    this.pendingBatch = [];
    this.batchTimeout = null;

    const batchId = crypto.randomUUID();
    this.iframe.contentWindow?.postMessage(
      { type: 'batch', requests: batch.map(b => b.request), batchId },
      this.origin
    );

    // Handle batch response...
  }
}
```

**3. Preloading plugin assets:**

```typescript
// Preload plugin iframe in background
function preloadPlugin(pluginId: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'document';
  link.href = `https://plugins.itemdeck.app/${pluginId}/index.html`;
  document.head.appendChild(link);
}

// Predict which plugins user might need
function predictivePreload(recentPlugins: string[]): void {
  // Preload top 3 most recently used
  recentPlugins.slice(0, 3).forEach(preloadPlugin);
}
```

### Developer Experience Considerations

**1. Local development:**

```typescript
// Development mode: Skip sandbox for faster iteration
const isDev = import.meta.env.DEV;

function PluginFrame({ pluginId }: { pluginId: string }) {
  const src = isDev
    ? `http://localhost:3001/${pluginId}` // Local dev server
    : `https://plugins.itemdeck.app/${pluginId}/index.html`;

  return (
    <iframe
      src={src}
      sandbox={isDev ? undefined : 'allow-scripts'}
      // In dev, omit sandbox for easier debugging
    />
  );
}
```

**2. Plugin SDK with TypeScript:**

```typescript
// @itemdeck/plugin-sdk
export interface ItemdeckPlugin {
  id: string;
  name: string;
  version: string;

  // Lifecycle hooks
  onActivate?(context: PluginContext): Promise<void>;
  onDeactivate?(): Promise<void>;

  // UI rendering
  render?(container: HTMLElement): void;

  // Card overlays
  CardOverlay?: React.ComponentType<CardOverlayProps>;
}

export interface PluginContext {
  // Typed API
  cards: {
    getAll(): Promise<Card[]>;
    getById(id: string): Promise<Card | null>;
    update(id: string, data: Partial<Card>): Promise<void>;
  };

  ui: {
    showToast(message: string, options?: ToastOptions): void;
    openModal<T>(config: ModalConfig<T>): Promise<T>;
  };

  storage: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
  };
}

// Plugin template
export function definePlugin(plugin: ItemdeckPlugin): ItemdeckPlugin {
  return plugin;
}
```

**3. Error boundaries:**

```typescript
// Isolate plugin errors from host
function PluginErrorBoundary({ children, pluginId }: {
  children: React.ReactNode;
  pluginId: string;
}) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="plugin-error">
          <p>Plugin "{pluginId}" encountered an error</p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
          {import.meta.env.DEV && <pre>{error.stack}</pre>}
        </div>
      )}
      onError={(error) => {
        console.error(`Plugin ${pluginId} error:`, error);
        // Report to monitoring
        reportPluginError(pluginId, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## Recommendation for itemdeck v1.5.0

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     itemdeck Host Application                    │
│                                                                  │
│  ┌───────────────────┐  ┌───────────────────┐                   │
│  │    Card Grid      │  │  Plugin Manager   │                   │
│  │    (React)        │  │                   │                   │
│  └───────────────────┘  └─────────┬─────────┘                   │
│                                   │                              │
│                          ┌────────┴────────┐                    │
│                          │                 │                    │
│  ┌───────────────────────▼───┐  ┌─────────▼──────────────────┐ │
│  │    Plugin Bridge          │  │    Permission Manager       │ │
│  │    (postMessage)          │  │    (Capability-based)       │ │
│  └───────────────────────────┘  └────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Plugin Sandbox                            ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │                  Sandboxed iframe                       │││
│  │  │  Origin: https://plugins.itemdeck.app                   │││
│  │  │  sandbox="allow-scripts allow-forms"                    │││
│  │  │                                                         │││
│  │  │  ┌──────────────┐  ┌─────────────────┐                 │││
│  │  │  │  Plugin UI   │  │  Plugin Logic   │                 │││
│  │  │  │  (React)     │  │  (TypeScript)   │                 │││
│  │  │  └──────────────┘  └─────────────────┘                 │││
│  │  │                                                         │││
│  │  │  CSP: default-src 'self'; connect-src host-proxy       │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Strategy

**Phase 1: Foundation (v1.5.0)**

| Component | Technique | Rationale |
|-----------|-----------|-----------|
| **Isolation** | Sandboxed iframe | Battle-tested, process isolation |
| **Communication** | postMessage + typed bridge | Type-safe, auditable |
| **Permissions** | Capability tokens | Fine-grained, revocable |
| **CSP** | Strict host + plugin CSP | Defence in depth |

**Phase 2: Enhancement (v1.6.0+)**

| Component | Technique | Rationale |
|-----------|-----------|-----------|
| **Plugin SDK** | NPM package with types | Better DX |
| **Hot reload** | Development server proxy | Faster iteration |
| **Marketplace** | Signed manifests | Trust establishment |
| **Analytics** | Usage tracking | Understand plugin adoption |

### Security Checklist

```markdown
## Plugin Security Checklist (v1.5.0)

### Isolation
- [ ] Plugins run in sandboxed iframes (sandbox="allow-scripts allow-forms")
- [ ] Plugin origin is separate from host (plugins.itemdeck.app)
- [ ] Cross-origin restrictions enforced
- [ ] No allow-same-origin in sandbox attribute

### Communication
- [ ] All communication via postMessage
- [ ] Origin validated on every message
- [ ] Request/response IDs prevent replay attacks
- [ ] Timeouts on all async operations

### Permissions
- [ ] Capability tokens issued per-plugin, per-resource
- [ ] Tokens are cryptographically signed
- [ ] Tokens have expiry times
- [ ] Capabilities can be revoked
- [ ] Default-deny policy

### Content Security Policy
- [ ] Host CSP blocks inline scripts
- [ ] Plugin CSP restricts connections to API proxy
- [ ] No unsafe-eval in any CSP
- [ ] CSP violations logged

### Rate Limiting
- [ ] API calls rate-limited per plugin
- [ ] Storage quotas enforced
- [ ] Network requests proxied and throttled

### Monitoring
- [ ] Plugin errors logged (without sensitive data)
- [ ] CSP violations reported
- [ ] Suspicious activity alerts
```

### Plugin Manifest Schema

```typescript
// Plugin manifest (plugin.json)
interface PluginManifest {
  // Identity
  id: string;                    // Unique identifier
  name: string;                  // Display name
  version: string;               // Semver
  author: {
    name: string;
    url?: string;
  };

  // Entry points
  main: string;                  // Main script
  ui?: string;                   // UI iframe entry

  // Permissions requested
  permissions: {
    cards?: 'read' | 'read-write';
    collection?: 'read' | 'read-write';
    storage?: {
      read: boolean;
      write: boolean;
      maxBytes?: number;
    };
    ui?: ('toast' | 'modal' | 'panel')[];
    network?: string[];          // Allowed domains
  };

  // Integration points
  hooks?: {
    onCardSelect?: boolean;
    onCollectionLoad?: boolean;
    onSettingsOpen?: boolean;
  };

  // Display
  icon?: string;
  description?: string;
  screenshots?: string[];
}
```

---

## References

### Standards and Specifications
- [W3C CSP Level 3](https://www.w3.org/TR/CSP3/)
- [TC39 Realms Proposal](https://github.com/tc39/proposal-shadowrealm)
- [HTML Living Standard - iframe sandbox](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox)

### Industry Implementations
- [Figma Plugin Development](https://www.figma.com/plugin-docs/)
- [Notion API](https://developers.notion.com/)
- [Airtable Custom Apps](https://airtable.com/developers/apps)
- [VS Code Extension Host](https://code.visualstudio.com/api/advanced-topics/extension-host)

### Security Research
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Google Security Blog - Site Isolation](https://security.googleblog.com/2018/07/mitigating-spectre-with-site-isolation.html)
- [Agoric Secure EcmaScript](https://github.com/Agoric/agoric-sdk/tree/master/packages/ses)

### Libraries and Tools
- [@aspect-build/aspect-iframe-messaging](https://github.com/aspect-build/aspect-iframe-messaging)
- [postmate](https://github.com/dollarshaveclub/postmate) - Parent/child iframe communication
- [@nicolo-ribaudo/ses](https://www.npmjs.com/package/ses) - Secure EcmaScript shim
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML sanitisation

---

## Related Documentation

- [ADR-024: Plugin Sandbox Implementation](../decisions/adrs/ADR-024-plugin-sandbox-implementation.md) - Sandbox implementation decision
- [v1.5.0 Milestone](../roadmap/milestones/v1.5.0.md) - Plugin security sandbox (F-124)
- [System Security](./system-security.md) - General security practices
- [Modular Architecture](./modular-architecture.md) - Plugin system patterns
- [State-of-the-Art Plugin Architecture](./state-of-the-art-plugin-architecture.md) - Current mechanic plugin system
- [R-006 Plugin State Isolation](./R-006-plugin-state-isolation.md) - State management for plugins

---

**Applies to**: itemdeck v1.5.0+ (Plugin Security Model)
