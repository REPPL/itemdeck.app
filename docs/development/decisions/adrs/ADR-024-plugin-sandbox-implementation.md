# ADR-024: Plugin Sandbox Implementation

## Status

Accepted

## Context

Following ADR-023 (Plugin Trust Tiers), external plugins (curated and community) require sandboxing to prevent:

- **XSS attacks** - Malicious DOM manipulation
- **Data exfiltration** - Stealing user data via network requests
- **Storage hijacking** - Corrupting or reading host localStorage
- **UI spoofing** - Fake prompts to steal credentials
- **Prototype pollution** - Corrupting JavaScript intrinsics

### Sandboxing Options Evaluated

| Technique | Isolation Level | UI Rendering | Performance | Browser Support |
|-----------|-----------------|--------------|-------------|-----------------|
| Same-origin (current) | None | Yes | Excellent | Universal |
| **Sandboxed iframe** | Process-level | Yes | Good | Universal |
| Web Worker | Thread-level | No | Good | Universal |
| Realms API | Compartment-level | Yes | Unknown | Stage 3 (not ready) |
| SES (Hardened JS) | Object-level | Yes | Moderate | Polyfill only |

### Industry Precedent

| Platform | Primary Technique | Notes |
|----------|------------------|-------|
| **Figma** | Sandboxed iframe | postMessage API, no allow-same-origin |
| **Notion** | Sandboxed iframe | CSP, API proxy |
| **VS Code (web)** | Web Worker + iframe | Extension host isolation |
| **Airtable** | Sandboxed iframe | Scoped permissions |

## Decision

Use **sandboxed iframes** for external plugin isolation with **postMessage** communication and **capability-based permissions**.

### Architecture

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

### Iframe Sandbox Configuration

```html
<!-- Plugin iframe -->
<iframe
  id="plugin-{id}"
  src="https://plugins.itemdeck.app/{plugin-id}/index.html"
  sandbox="allow-scripts allow-forms"
  allow=""
  referrerpolicy="no-referrer"
></iframe>
```

**Sandbox attributes:**

| Attribute | Included | Reason |
|-----------|----------|--------|
| `allow-scripts` | ✅ | Required for JavaScript execution |
| `allow-forms` | ✅ | Required for form-based UI |
| `allow-same-origin` | ❌ | **Critical** - Prevents storage/cookie access |
| `allow-popups` | ❌ | Prevents window.open attacks |
| `allow-modals` | ❌ | Prevents alert/confirm abuse |
| `allow-top-navigation` | ❌ | **Critical** - Prevents redirect attacks |

### Content Security Policy

**Host application CSP:**

```typescript
const HOST_CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https://images.itemdeck.app'],
  'connect-src': ["'self'", 'https://api.itemdeck.app'],
  'frame-src': ['https://plugins.itemdeck.app'],
  'frame-ancestors': ["'none'"],
};
```

**Plugin iframe CSP:**

```typescript
const PLUGIN_CSP = {
  'default-src': ["'none'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:'],
  'connect-src': ['https://api.itemdeck.app'], // Proxied only
  'frame-src': ["'none'"],
  'frame-ancestors': ['https://itemdeck.app'],
};
```

### PostMessage Communication Protocol

```typescript
// src/plugins/sandbox/protocol.ts

export interface PluginMessage {
  /** Message type identifier */
  type: string;
  /** Unique request ID for request/response correlation */
  requestId: string;
  /** Message payload */
  payload: unknown;
  /** Plugin ID for routing */
  pluginId: string;
}

export interface PluginResponse {
  type: 'response' | 'error';
  requestId: string;
  payload: unknown;
  error?: string;
}

// Message types
export type PluginRequestType =
  | 'getCards'
  | 'getCard'
  | 'updateCard'
  | 'getSettings'
  | 'updateSettings'
  | 'showToast'
  | 'openModal'
  | 'getStorage'
  | 'setStorage';
```

### Plugin Bridge Implementation

```typescript
// src/plugins/sandbox/PluginBridge.ts

export class PluginBridge {
  private iframe: HTMLIFrameElement;
  private origin: string;
  private pluginId: string;
  private pendingRequests = new Map<string, PendingRequest>();
  private permissionManager: PermissionManager;

  constructor(config: PluginBridgeConfig) {
    this.iframe = config.iframe;
    this.origin = config.origin;
    this.pluginId = config.pluginId;
    this.permissionManager = config.permissionManager;

    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent): void {
    // Critical: Validate origin
    if (event.origin !== this.origin) {
      console.warn(`Rejected message from: ${event.origin}`);
      return;
    }

    const message = event.data as PluginMessage;

    // Validate plugin ID
    if (message.pluginId !== this.pluginId) {
      console.warn(`Message from wrong plugin: ${message.pluginId}`);
      return;
    }

    // Check if this is a response to our request
    if (this.pendingRequests.has(message.requestId)) {
      this.handleResponse(message);
      return;
    }

    // Handle incoming plugin request
    this.handlePluginRequest(message);
  }

  private async handlePluginRequest(message: PluginMessage): Promise<void> {
    try {
      // Check permission before processing
      const requiredPermission = this.mapTypeToPermission(message.type);
      const hasPermission = await this.permissionManager.checkPermission(
        this.pluginId,
        requiredPermission,
        message.payload
      );

      if (!hasPermission) {
        this.sendError(message.requestId, `Permission denied: ${requiredPermission}`);
        return;
      }

      // Process the request
      const result = await this.processRequest(message);
      this.sendResponse(message.requestId, result);

    } catch (error) {
      this.sendError(message.requestId, error.message);
    }
  }

  private async processRequest(message: PluginMessage): Promise<unknown> {
    switch (message.type) {
      case 'getCards':
        return this.handleGetCards();

      case 'getCard':
        return this.handleGetCard(message.payload as { id: string });

      case 'updateCard':
        return this.handleUpdateCard(message.payload as CardUpdate);

      case 'showToast':
        return this.handleShowToast(message.payload as ToastConfig);

      case 'getStorage':
        return this.handleGetStorage(message.payload as { key: string });

      case 'setStorage':
        return this.handleSetStorage(message.payload as StorageUpdate);

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private sendResponse(requestId: string, payload: unknown): void {
    this.iframe.contentWindow?.postMessage(
      { type: 'response', requestId, payload },
      this.origin
    );
  }

  private sendError(requestId: string, error: string): void {
    this.iframe.contentWindow?.postMessage(
      { type: 'error', requestId, error },
      this.origin
    );
  }

  destroy(): void {
    window.removeEventListener('message', this.handleMessage);
    this.iframe.remove();
  }
}
```

### Plugin SDK (for plugin developers)

```typescript
// @itemdeck/plugin-sdk/src/bridge.ts

class HostBridge {
  private pendingRequests = new Map<string, PendingRequest>();

  constructor() {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  async request<T>(type: string, payload?: unknown): Promise<T> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${type}`));
      }, 5000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      window.parent.postMessage(
        {
          type,
          requestId,
          payload,
          pluginId: PLUGIN_ID, // Injected at build time
        },
        '*'
      );
    });
  }

  private handleMessage(event: MessageEvent): void {
    const response = event.data as PluginResponse;

    const pending = this.pendingRequests.get(response.requestId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.requestId);

    if (response.type === 'error') {
      pending.reject(new Error(response.error));
    } else {
      pending.resolve(response.payload);
    }
  }
}

// Exported API for plugin developers
export const itemdeck = {
  cards: {
    getAll: () => bridge.request<Card[]>('getCards'),
    getById: (id: string) => bridge.request<Card>('getCard', { id }),
    update: (id: string, data: Partial<Card>) =>
      bridge.request<void>('updateCard', { id, data }),
  },

  ui: {
    showToast: (message: string, options?: ToastOptions) =>
      bridge.request('showToast', { message, ...options }),
  },

  storage: {
    get: <T>(key: string) => bridge.request<T | null>('getStorage', { key }),
    set: <T>(key: string, value: T) =>
      bridge.request<void>('setStorage', { key, value }),
  },
};
```

### Capability-Based Permissions

```typescript
// src/plugins/sandbox/PermissionManager.ts

export interface Capability {
  id: string;
  type: CapabilityType;
  scope: CapabilityScope;
  expiry?: number;
  signature: string;
}

export type CapabilityType =
  | 'cards:read'
  | 'cards:write'
  | 'collection:read'
  | 'settings:read'
  | 'settings:write'
  | 'ui:toast'
  | 'ui:modal'
  | 'storage:read'
  | 'storage:write';

export class PermissionManager {
  private capabilities = new Map<string, Set<Capability>>();
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  grantCapability(
    pluginId: string,
    type: CapabilityType,
    scope: CapabilityScope = {}
  ): Capability {
    const capability: Capability = {
      id: crypto.randomUUID(),
      type,
      scope,
      expiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      signature: '',
    };

    capability.signature = this.sign(capability, pluginId);

    if (!this.capabilities.has(pluginId)) {
      this.capabilities.set(pluginId, new Set());
    }
    this.capabilities.get(pluginId)!.add(capability);

    return capability;
  }

  async checkPermission(
    pluginId: string,
    requiredType: CapabilityType,
    resource?: unknown
  ): Promise<boolean> {
    const caps = this.capabilities.get(pluginId);
    if (!caps) return false;

    for (const cap of caps) {
      if (this.isExpired(cap)) {
        caps.delete(cap);
        continue;
      }

      if (this.verifySignature(cap, pluginId) &&
          this.authorises(cap, requiredType, resource)) {
        return true;
      }
    }

    return false;
  }

  private authorises(
    capability: Capability,
    action: CapabilityType,
    resource: unknown
  ): boolean {
    if (capability.type !== action) return false;

    // Check scope restrictions
    if (capability.scope.collectionId && resource) {
      const resourceCollection = (resource as { collectionId?: string }).collectionId;
      if (resourceCollection && resourceCollection !== capability.scope.collectionId) {
        return false;
      }
    }

    return true;
  }

  private sign(capability: Omit<Capability, 'signature'>, pluginId: string): string {
    const data = JSON.stringify({ ...capability, pluginId });
    // Simplified - use HMAC-SHA256 in production
    return btoa(data + this.secret);
  }

  private verifySignature(capability: Capability, pluginId: string): boolean {
    const expected = this.sign(
      { ...capability, signature: '' },
      pluginId
    );
    return capability.signature === expected;
  }

  private isExpired(capability: Capability): boolean {
    return capability.expiry !== undefined && Date.now() > capability.expiry;
  }
}
```

### Rate Limiting

```typescript
// src/plugins/sandbox/RateLimiter.ts

export class RateLimiter {
  private calls = new Map<string, number[]>();
  private limits: Record<string, number>;

  constructor(limits: Record<string, number>) {
    this.limits = limits;
  }

  checkLimit(pluginId: string, action: string): boolean {
    const key = `${pluginId}:${action}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    let timestamps = this.calls.get(key) || [];

    // Remove old timestamps
    timestamps = timestamps.filter(t => now - t < windowMs);

    const limit = this.limits[action] || 100;
    if (timestamps.length >= limit) {
      return false;
    }

    timestamps.push(now);
    this.calls.set(key, timestamps);
    return true;
  }
}
```

## Consequences

### Positive

- **Strong isolation** - Process-level separation in browsers
- **Battle-tested** - Same pattern as Figma, Notion, Airtable
- **UI capable** - Plugins can render their own interfaces
- **Granular control** - Capability-based permissions
- **Crash isolation** - Plugin errors don't crash host

### Negative

- **Latency** - 1-5ms per postMessage round-trip
- **Complexity** - Async-only communication
- **Bundle size** - Each plugin needs its own React copy
- **Developer experience** - More setup for plugin authors

### Mitigations

- **Message batching** - Combine multiple requests
- **Plugin SDK** - Abstract away bridge complexity
- **Shared deps service** - Future: share React via importmap
- **Templates** - Provide starter kits for plugin developers

## Security Checklist

- [ ] Plugin iframes use `sandbox="allow-scripts allow-forms"`
- [ ] No `allow-same-origin` in sandbox attribute
- [ ] Origin validation on every postMessage
- [ ] Request IDs prevent replay attacks
- [ ] Capability tokens are signed and expire
- [ ] CSP blocks inline scripts
- [ ] CSP restricts connect-src to API proxy
- [ ] Rate limiting enforced per plugin
- [ ] Storage quotas enforced

---

## Related Documentation

- [ADR-023: Plugin Trust Tiers](./ADR-023-plugin-trust-tiers.md)
- [ADR-025: Plugin Distribution Strategy](./ADR-025-plugin-distribution-strategy.md)
- [State-of-the-Art: Web Security Sandboxing](../../research/state-of-the-art-web-security-sandbox.md)
- [v1.5.0 Milestone](../../roadmap/milestones/v1.5.0.md)

---

**Applies to**: itemdeck v1.5.0+
