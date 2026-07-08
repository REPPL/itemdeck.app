# F-124: Plugin Security Sandbox

## Problem Statement

External plugins pose security risks:

1. **Unrestricted DOM access** - Plugins could modify any part of the UI
2. **Data exfiltration** - Plugins could send card data to external servers
3. **Storage tampering** - Plugins could corrupt application state
4. **XSS vectors** - Malicious plugins could inject scripts

## Design Approach

Create a sandboxed execution environment that:

- Isolates plugin code from the main application
- Provides controlled APIs for approved operations
- Blocks dangerous browser APIs
- Monitors plugin behaviour

### Sandbox Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Application                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   Plugin Bridge                          ││
│  │  • Validates all plugin requests                        ││
│  │  • Enforces rate limits                                 ││
│  │  • Logs all API calls                                   ││
│  └──────────────────────────┬──────────────────────────────┘│
│                             │                                │
│  ┌──────────────────────────▼──────────────────────────────┐│
│  │                  Plugin Sandbox                          ││
│  │  ┌─────────────────┐  ┌─────────────────────────────┐   ││
│  │  │  Plugin Code    │  │  Allowed APIs               │   ││
│  │  │  (Isolated)     │  │  • React components          │   ││
│  │  │                 │──│  • Settings store (scoped)   │   ││
│  │  │                 │  │  • Theme CSS variables       │   ││
│  │  │                 │  │  • Card data (read-only)     │   ││
│  │  └─────────────────┘  └─────────────────────────────┘   ││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────┐    ││
│  │  │  Blocked APIs                                   │    ││
│  │  │  • localStorage (direct)                        │    ││
│  │  │  • fetch (except allowlisted domains)          │    ││
│  │  │  • DOM manipulation (outside plugin root)       │    ││
│  │  │  • eval / Function constructor                  │    ││
│  │  │  • WebSocket connections                        │    ││
│  │  │  • IndexedDB (direct)                          │    ││
│  │  └─────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Sandbox Implementation Options

1. **iframe sandbox** - Strongest isolation, complex communication
2. **Web Workers** - Good isolation, no DOM access
3. **Proxy-based** - Lighter weight, requires careful implementation
4. **ShadowRealm** (future) - Native JS isolation when available

Recommended: **Proxy-based with CSP** for balance of security and developer experience.

### API Surface

```typescript
interface PluginAPI {
  // Theme plugins
  theme: {
    setVariable(name: string, value: string): void;
    getVariable(name: string): string;
  };

  // Mechanic plugins
  mechanic: {
    registerOverlay(component: React.FC): void;
    getCards(): ReadonlyArray<Card>;
    reportScore(score: number): void;
  };

  // Settings plugins
  settings: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
    subscribe(key: string, callback: (value: unknown) => void): () => void;
  };

  // Common
  log: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
  };
}
```

## Implementation Tasks

### Phase 1: Sandbox Core

- [ ] Create `src/plugins/sandbox/index.ts`
- [ ] Implement Proxy-based API interception
- [ ] Create sandboxed global object
- [ ] Block dangerous APIs (eval, Function, etc.)

### Phase 2: API Bridge

- [ ] Create `src/plugins/sandbox/bridge.ts`
- [ ] Implement message passing between sandbox and main
- [ ] Add request validation and sanitisation
- [ ] Implement rate limiting for API calls

### Phase 3: DOM Isolation

- [ ] Create isolated container for plugin UI
- [ ] Implement Shadow DOM boundaries
- [ ] Add CSP headers for plugin content
- [ ] Prevent CSS leakage

### Phase 4: Network Control

- [ ] Create fetch interceptor
- [ ] Implement domain allowlist
- [ ] Block WebSocket connections
- [ ] Log all network requests

### Phase 5: Monitoring

- [ ] Implement API call logging
- [ ] Add performance monitoring
- [ ] Create security violation alerts
- [ ] Build plugin behaviour analytics

## Success Criteria

- [ ] Plugins cannot access localStorage directly
- [ ] Plugins cannot fetch from non-allowlisted domains
- [ ] Plugins cannot modify DOM outside container
- [ ] eval/Function blocked in plugin context
- [ ] All API calls logged and auditable

## Dependencies

- **F-122**: Plugin Manifest Schema - Declares permissions
- **F-125**: Plugin Permission Model - Enforces capabilities

## Complexity

**High** - Security-critical component requiring thorough testing.

## Estimated Effort

**16-20 hours**

---

## Related Documentation

- [Web Security Sandbox Research](../../research/state-of-the-art-web-security-sandbox.md)
- [ADR-024: Plugin Sandbox Implementation](../../decisions/adrs/ADR-024-plugin-sandbox-implementation.md)
- [F-125: Plugin Permission Model](./F-125-plugin-permission-model.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
