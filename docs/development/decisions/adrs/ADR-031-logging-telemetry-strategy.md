# ADR-031: Logging & Telemetry Strategy

## Status

Accepted

## Context

itemdeck needs structured logging and observability for production while respecting user privacy. The current state includes only development-time `console.log` statements with no production logging strategy.

Research findings from [R-019: Logging & Observability](../../research/R-019-logging-observability.md) identified requirements for:

1. **Structured logging** with configurable levels
2. **Privacy-first approach** - no personal data collection
3. **Performance monitoring** via Web Vitals
4. **Debug utilities** for troubleshooting
5. **Error aggregation** for pattern detection

### Privacy Requirements

itemdeck is privacy-focused with no authentication. Any telemetry must:

- Never collect personal information
- Never track user behaviour across sessions
- Only aggregate anonymous metrics
- Work entirely offline after initial load
- Allow user opt-out

### Options Evaluated

| Option | Privacy | Cost | Complexity | Debugging |
|--------|---------|------|------------|-----------|
| Console only | ✅ Perfect | Free | Low | Poor |
| Self-hosted (Plausible) | ✅ Good | Server cost | High | Medium |
| Sentry (errors only) | ⚠️ Configurable | Tier-based | Medium | Good |
| Local-only structured | ✅ Perfect | Free | Low | Good |

## Decision

Adopt a **local-first structured logging** strategy with optional anonymous telemetry:

### 1. Structured Logger (Core)

A lightweight logging service with:
- Configurable log levels (ERROR, WARN, INFO, DEBUG)
- In-memory buffer for recent logs
- Privacy-safe context sanitisation
- Development console output
- Export capability for bug reports

### 2. Web Vitals Monitoring (Core)

Built-in performance tracking:
- LCP, FID, CLS, FCP, TTFB metrics
- Custom performance marks
- Memory pressure detection
- No external service required

### 3. Anonymous Telemetry (Optional)

If users opt-in:
- Privacy-focused analytics (e.g., Plausible)
- Aggregate usage metrics only
- No personal data
- No cookies/tracking

### 4. Debug Utilities (Development)

Developer tools accessible in development:
- State inspection
- Log export
- Cache management
- Error simulation

## Implementation

### Logger Service

```typescript
// src/services/logger.ts
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  private buffer: LogEntry[] = [];
  private readonly maxBuffer = 100;
  private level: LogLevel;

  constructor() {
    this.level = import.meta.env.PROD ? 'warn' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  private sanitise(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;
    const sanitised = { ...context };

    // Remove potentially sensitive fields
    const sensitiveKeys = ['email', 'token', 'password', 'apiKey', 'url', 'path'];
    for (const key of sensitiveKeys) {
      delete sanitised[key];
    }

    return sanitised;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitise(context),
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.shift();
    }

    if (import.meta.env.DEV) {
      const consoleFn = console[level] || console.log;
      consoleFn(`[itemdeck] ${message}`, context);
    }
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  getRecentLogs(): LogEntry[] {
    return [...this.buffer];
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  export(): string {
    return JSON.stringify(this.buffer, null, 2);
  }
}

export const logger = new Logger();
```

### Performance Monitor

```typescript
// src/services/performance.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import { logger } from './logger';

interface PerformanceMetrics {
  webVitals: Record<string, number>;
  customMarks: Array<{ name: string; duration: number }>;
  memoryPressure: 'low' | 'medium' | 'high' | 'unknown';
}

class PerformanceMonitor {
  private webVitals: Record<string, number> = {};
  private customMarks: Array<{ name: string; duration: number }> = [];

  init() {
    const reportMetric = (metric: Metric) => {
      this.webVitals[metric.name] = metric.value;
      logger.debug('web-vital', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      });
    };

    onCLS(reportMetric);
    onFID(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.customMarks.push({ name, duration });
      logger.debug('performance-mark', { name, durationMs: duration });
    }
  }

  getMemoryPressure(): 'low' | 'medium' | 'high' | 'unknown' {
    if (!('memory' in performance)) return 'unknown';

    const memory = (performance as any).memory;
    const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    if (usage > 0.8) return 'high';
    if (usage > 0.6) return 'medium';
    return 'low';
  }

  getSummary(): PerformanceMetrics {
    return {
      webVitals: { ...this.webVitals },
      customMarks: [...this.customMarks],
      memoryPressure: this.getMemoryPressure(),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### Debug Utilities

```typescript
// src/utils/debug.ts
import { logger } from '../services/logger';
import { performanceMonitor } from '../services/performance';
import { useSettingsStore } from '../stores/settings';
import { queryClient } from '../lib/queryClient';

interface DiagnosticsBundle {
  timestamp: string;
  version: string;
  logs: unknown[];
  performance: unknown;
  state: {
    viewMode: string;
    activeMechanic: string | null;
    collectionCount: number;
  };
}

export const debugUtils = {
  exportDiagnostics(): DiagnosticsBundle {
    const settings = useSettingsStore.getState();
    return {
      timestamp: new Date().toISOString(),
      version: import.meta.env.VITE_APP_VERSION || 'unknown',
      logs: logger.getRecentLogs(),
      performance: performanceMonitor.getSummary(),
      state: {
        viewMode: settings.viewMode,
        activeMechanic: settings.activeMechanic,
        collectionCount: 0, // Determined at runtime
      },
    };
  },

  hardReset(): void {
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  },

  downloadDiagnostics(): void {
    const bundle = this.exportDiagnostics();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itemdeck-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// Expose in development
if (import.meta.env.DEV) {
  (window as any).__itemdeck = {
    logger,
    performanceMonitor,
    debugUtils,
    getState: () => useSettingsStore.getState(),
    getQueries: () => queryClient.getQueryCache().getAll(),
  };
}
```

### Telemetry Settings

```typescript
// src/stores/settings.ts (addition)
interface SettingsState {
  // ... existing
  telemetryEnabled: boolean;
  debugMode: boolean;
}

// Default: telemetry disabled (privacy-first)
const defaultSettings: SettingsState = {
  // ... existing
  telemetryEnabled: false,
  debugMode: false,
};
```

## Consequences

### Positive

- **Privacy preserved** - No personal data collection
- **Zero cost** - No external services required
- **Full debugging** - Export capability for bug reports
- **Performance insight** - Web Vitals without overhead
- **User control** - Optional telemetry with clear opt-in

### Negative

- **No remote monitoring** - Can't proactively detect issues
- **Manual bug reports** - Users must export diagnostics
- **Limited aggregation** - No cross-session pattern detection

### Mitigations

- Clear "Report Bug" feature with diagnostics export
- In-app error notifications with suggested actions
- Consider optional Sentry integration for error tracking only

## Alternatives Considered

### Full Sentry Integration

- Comprehensive error + performance monitoring
- **Rejected**: Privacy concerns, requires configuration to anonymise

### LogRocket / FullStory

- Session replay and detailed tracking
- **Rejected**: Captures too much personal data, expensive

### No Logging

- Rely only on user bug reports
- **Rejected**: Makes debugging nearly impossible

### Custom Backend

- Self-hosted telemetry service
- **Rejected**: Operational complexity, cost, itemdeck is client-only

---

## Related Documentation

- [R-019: Logging & Observability](../../research/R-019-logging-observability.md)
- [ADR-030: Error Boundary Architecture](./ADR-030-error-boundary-architecture.md)
- [ADR-009: Security](./ADR-009-security.md)
- [Privacy Policy](../../../reference/privacy.md)
