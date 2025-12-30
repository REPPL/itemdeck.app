# R-019: Logging & Observability

## Executive Summary

This research examines logging and observability patterns for browser-based applications, focusing on privacy-respecting approaches suitable for itemdeck's production release. The goal is to establish monitoring capabilities that aid debugging and improve user experience without compromising user privacy.

## Current State in Itemdeck

### Existing Logging

1. **Console Logging**
   - Development-only `console.log` statements
   - No structured logging format
   - No production logging strategy

2. **Error Tracking**
   - Basic error boundaries catch React errors
   - No external error reporting service
   - No error aggregation or analysis

3. **Performance Monitoring**
   - None currently implemented
   - Bundle size monitoring via size-limit
   - No runtime performance tracking

### Gaps Identified

- No structured logging framework
- No error aggregation service
- No performance metrics collection
- No user session debugging capability
- Missing audit trail for state changes

## Research Findings

### Logging Levels

| Level | Use Case | Production |
|-------|----------|------------|
| **ERROR** | Unrecoverable failures, exceptions | Yes |
| **WARN** | Recoverable issues, deprecations | Yes |
| **INFO** | Key user actions, state changes | Configurable |
| **DEBUG** | Detailed execution flow | No |
| **TRACE** | Very detailed, performance-sensitive | No |

### Browser Logging Options

#### Option 1: Console-Based (Development)

```typescript
const logger = {
  error: (...args) => console.error('[itemdeck]', ...args),
  warn: (...args) => console.warn('[itemdeck]', ...args),
  info: (...args) => console.info('[itemdeck]', ...args),
  debug: (...args) => {
    if (import.meta.env.DEV) console.debug('[itemdeck]', ...args);
  },
};
```

**Pros:** Zero overhead, familiar, built-in
**Cons:** No aggregation, no persistence, no remote access

#### Option 2: Structured Logger

```typescript
interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  sessionId?: string;
}

class Logger {
  private buffer: LogEntry[] = [];
  private readonly maxBuffer = 100;

  log(level: LogEntry['level'], message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitise(context),
      sessionId: this.getSessionId(),
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.shift();
    }

    if (level === 'error') {
      this.flush();
    }
  }

  private sanitise(context?: Record<string, unknown>) {
    // Remove PII, tokens, sensitive data
    if (!context) return undefined;
    const sanitised = { ...context };
    delete sanitised.email;
    delete sanitised.token;
    delete sanitised.password;
    return sanitised;
  }

  getRecentLogs(): LogEntry[] {
    return [...this.buffer];
  }

  flush() {
    // Send to external service if configured
  }
}
```

#### Option 3: External Service Integration

**Sentry (Error Tracking)**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://...@sentry.io/...',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,

  // Privacy: Don't send user data
  beforeSend(event) {
    // Remove PII
    delete event.user;
    return event;
  },

  // Performance: Sample transactions
  tracesSampleRate: 0.1,
});
```

**LogRocket (Session Replay)**
- Full session recording
- Privacy concerns for card collection data
- **Not recommended** for itemdeck

**Simple Analytics / Plausible**
- Privacy-focused analytics
- No personal data collection
- Aggregate metrics only

### Privacy-First Logging

#### What to Log (Safe)

```typescript
const safeContext = {
  // App state
  viewMode: 'grid',
  mechanicActive: 'memory',
  cardCount: 42,

  // Performance
  loadTimeMs: 1234,

  // Environment
  viewport: { width: 1920, height: 1080 },
  online: true,

  // Error context
  component: 'CardGrid',
  action: 'flip',
};
```

#### What NOT to Log

```typescript
const unsafeContext = {
  // Personal data
  email: 'user@example.com',

  // Content
  cardData: [...],
  collectionUrl: 'https://...',

  // Identifiers
  ipAddress: '192.168.1.1',
  userId: 'abc123',

  // Sensitive settings
  customSourceUrls: [...],
};
```

### Performance Monitoring

#### Web Vitals

```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function reportWebVitals(metric: Metric) {
  logger.info('web-vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
}

onCLS(reportWebVitals);
onFID(reportWebVitals);
onLCP(reportWebVitals);
onFCP(reportWebVitals);
onTTFB(reportWebVitals);
```

#### Custom Performance Marks

```typescript
// Measure collection loading
performance.mark('collection-load-start');
await loadCollection(id);
performance.mark('collection-load-end');

performance.measure('collection-load', 'collection-load-start', 'collection-load-end');

const measure = performance.getEntriesByName('collection-load')[0];
logger.info('collection-loaded', { durationMs: measure.duration });
```

#### Memory Monitoring

```typescript
function checkMemoryPressure() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
    const usage = usedMB / limitMB;

    if (usage > 0.8) {
      logger.warn('memory-pressure', { usedMB, limitMB, usage });
    }
  }
}
```

### Debug Mode

#### Developer Tools Integration

```typescript
// Expose debug utilities in development
if (import.meta.env.DEV) {
  (window as any).__itemdeck = {
    getState: () => useSettingsStore.getState(),
    getLogs: () => logger.getRecentLogs(),
    getQueries: () => queryClient.getQueryCache().getAll(),
    clearCache: () => queryClient.clear(),
    resetSettings: () => useSettingsStore.getState().reset(),
  };
}
```

#### Debug Panel Component

```typescript
function DebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getRecentLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <details className="debug-panel">
      <summary>Debug ({logs.length} logs)</summary>
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </details>
  );
}
```

### State Change Auditing

```typescript
// Zustand middleware for state change logging
const logMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      const prevState = get();
      set(...args);
      const nextState = get();

      logger.debug('state-change', {
        changed: Object.keys(nextState).filter(
          (key) => prevState[key] !== nextState[key]
        ),
      });
    },
    get,
    api
  );

const useStore = create(logMiddleware((set) => ({
  // ... store definition
})));
```

### Error Aggregation

```typescript
interface ErrorAggregate {
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  contexts: Record<string, unknown>[];
}

class ErrorAggregator {
  private errors = new Map<string, ErrorAggregate>();

  record(error: Error, context?: Record<string, unknown>) {
    const key = `${error.name}:${error.message}`;
    const existing = this.errors.get(key);

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date().toISOString();
      if (context && existing.contexts.length < 5) {
        existing.contexts.push(context);
      }
    } else {
      this.errors.set(key, {
        message: error.message,
        count: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        contexts: context ? [context] : [],
      });
    }
  }

  getSummary(): ErrorAggregate[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.count - a.count);
  }
}
```

## Recommendations

### 1. Implement Structured Logger

Create `src/services/logger.ts` with:
- Configurable log levels
- In-memory buffer for recent logs
- Privacy-safe context sanitisation
- Development console output
- Optional external service integration

### 2. Add Performance Monitoring

```typescript
// src/services/performance.ts
export const performanceMonitor = {
  // Web Vitals
  trackWebVitals(): void,

  // Custom metrics
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>,

  // Memory
  checkMemory(): MemoryMetrics | null,

  // Get summary
  getSummary(): PerformanceSummary,
};
```

### 3. Create Debug Utilities

```typescript
// src/utils/debug.ts
export const debugUtils = {
  // Export current state for bug reports
  exportDiagnostics(): DiagnosticsBundle,

  // Clear all caches and reset
  hardReset(): void,

  // Simulate errors for testing
  simulateError(type: ErrorType): void,
};
```

### 4. Privacy-First External Integration

If external logging is needed:
- Use privacy-focused services (Plausible, Simple Analytics)
- No personal data collection
- Aggregate metrics only
- User opt-in for detailed logging
- Clear data retention policies

### 5. Error Export for Support

```typescript
function generateErrorReport(): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    logs: logger.getRecentLogs(),
    performance: performanceMonitor.getSummary(),
    errors: errorAggregator.getSummary(),
    // Sanitised state snapshot
    state: {
      viewMode: settings.viewMode,
      mechanicActive: settings.activeMechanic,
      collectionCount: sources.length,
    },
  }, null, 2);
}
```

## Implementation Considerations

### Bundle Size

- Logger service: ~2KB gzipped
- Web Vitals library: ~1.5KB gzipped
- Sentry SDK: ~30KB gzipped (consider lazy loading)

### Performance Impact

- Buffered logging: Minimal
- Web Vitals: Passive observers, no impact
- State auditing: Slight overhead, development only

### Testing

- Mock logger in tests
- Verify no PII in log output
- Test log buffer overflow handling

## References

- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Console API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Console)
- [Performance API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [GDPR Compliance for Analytics](https://gdpr.eu/cookies/)

---

## Related Documentation

- [R-018: Error Handling Strategies](./R-018-error-handling-strategies.md)
- [ADR-031: Logging & Telemetry Strategy](../decisions/adrs/ADR-031-logging-telemetry-strategy.md)
- [System Security Research](./system-security.md)

---

**Status**: Complete
