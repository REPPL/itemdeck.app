# State of the Art: Observability in Browser Applications

## Executive Summary

Modern browser application observability encompasses structured logging, performance monitoring (Web Vitals), error tracking, and user analytics—all while respecting user privacy. This research surveys current best practices (2024-2025) for privacy-focused browser applications with no backend.

## Landscape Overview

### Observability Pillars

| Pillar | Purpose | Browser Tools |
|--------|---------|---------------|
| **Logging** | Debug information, audit trail | Console, structured logger |
| **Metrics** | Performance, usage statistics | Web Vitals, Performance API |
| **Tracing** | Request/operation flows | Performance marks/measures |
| **Errors** | Exception tracking, aggregation | Error boundaries, Sentry |

### Privacy Spectrum

| Level | Data Collected | Use Case |
|-------|----------------|----------|
| **None** | Nothing | Maximum privacy |
| **Anonymous** | Aggregate counts only | Privacy-focused analytics |
| **Pseudonymous** | Session ID, no PII | Debug without identification |
| **Identified** | User ID, behaviour | Personalisation (not recommended) |

## Options Evaluated

### Logging Solutions

| Solution | Privacy | Cost | Features | Verdict |
|----------|---------|------|----------|---------|
| Console only | ✅ Perfect | Free | Limited | Development only |
| Custom structured | ✅ Perfect | Free | Full control | **Recommended** |
| Sentry (errors) | ⚠️ Configurable | Freemium | Excellent | Consider |
| LogRocket | ❌ Invasive | Expensive | Session replay | Not recommended |
| Datadog RUM | ⚠️ Configurable | Expensive | Full suite | Overkill |

### Analytics Solutions

| Solution | Privacy | Cost | GDPR | Verdict |
|----------|---------|------|------|---------|
| Google Analytics | ❌ Tracking | Free | Requires consent | Not recommended |
| Plausible | ✅ No cookies | €9/mo | Compliant | **Recommended** |
| Simple Analytics | ✅ No cookies | €9/mo | Compliant | **Recommended** |
| Self-hosted Umami | ✅ Full control | Server cost | Compliant | Consider |
| None | ✅ Perfect | Free | N/A | **Acceptable** |

### Performance Monitoring

| Solution | Privacy | Cost | Accuracy | Verdict |
|----------|---------|------|----------|---------|
| Web Vitals | ✅ Local | Free | High | **Recommended** |
| Lighthouse CI | ✅ CI only | Free | Synthetic | **Recommended** |
| Chrome UX Report | ⚠️ Google | Free | Real users | Consider |
| SpeedCurve | ⚠️ 3rd party | $$$ | Excellent | Overkill |

## Detailed Analysis

### Web Vitals

Google's Core Web Vitals are the standard for measuring user experience.

```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

interface MetricReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

function reportWebVitals(onReport: (metric: MetricReport) => void) {
  onCLS(onReport);   // Cumulative Layout Shift
  onFID(onReport);   // First Input Delay (deprecated, use INP)
  onINP(onReport);   // Interaction to Next Paint (new)
  onLCP(onReport);   // Largest Contentful Paint
  onFCP(onReport);   // First Contentful Paint
  onTTFB(onReport);  // Time to First Byte
}
```

**2024-2025 Changes:**
- **INP** (Interaction to Next Paint) replaced FID as Core Web Vital
- Focus on responsiveness throughout page lifecycle, not just first interaction

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤2.5s | 2.5s–4s | >4s |
| INP | ≤200ms | 200ms–500ms | >500ms |
| CLS | ≤0.1 | 0.1–0.25 | >0.25 |

### Performance API

Built-in browser API for custom performance measurement.

```typescript
// Mark events
performance.mark('collection-load-start');
await loadCollection(id);
performance.mark('collection-load-end');

// Measure duration
performance.measure(
  'collection-load',
  'collection-load-start',
  'collection-load-end'
);

// Get measurements
const measures = performance.getEntriesByType('measure');
const loadTime = measures.find(m => m.name === 'collection-load')?.duration;

// Memory (Chrome only)
if ('memory' in performance) {
  const { usedJSHeapSize, jsHeapSizeLimit } = (performance as any).memory;
  const usage = usedJSHeapSize / jsHeapSizeLimit;
}
```

### Structured Logging Pattern

```typescript
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  sessionId?: string;
}

class Logger {
  private buffer: LogEntry[] = [];
  private level: LogLevel = 'info';

  log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitise(context),
    };

    this.buffer.push(entry);
    this.maybeFlush();
  }

  private sanitise(context?: Record<string, unknown>) {
    if (!context) return undefined;
    // Remove PII fields
    const { email, password, token, apiKey, ...safe } = context;
    return safe;
  }

  export(): string {
    return JSON.stringify(this.buffer, null, 2);
  }
}
```

### Error Tracking Without PII

```typescript
interface AnonymousError {
  message: string;
  stack?: string;
  type: string;
  timestamp: string;
  context: {
    url: string;  // Current route, not full URL
    viewport: { width: number; height: number };
    online: boolean;
    userAgent: string;  // Browser identification only
  };
}

function reportError(error: Error): AnonymousError {
  return {
    message: error.message,
    stack: error.stack?.split('\n').slice(0, 5).join('\n'),  // Truncate
    type: error.constructor.name,
    timestamp: new Date().toISOString(),
    context: {
      url: window.location.pathname,  // Not full URL
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      online: navigator.onLine,
      userAgent: navigator.userAgent,
    },
  };
}
```

### Privacy-Focused Analytics

Plausible/Simple Analytics approach:

```html
<!-- Plausible - no cookies, GDPR compliant -->
<script defer data-domain="itemdeck.app" src="https://plausible.io/js/script.js"></script>
```

**What they track:**
- Page views (aggregate count)
- Referrer (where visitors come from)
- Country (from IP, not stored)
- Device type (desktop/mobile)
- Browser (Chrome/Firefox/Safari)

**What they DON'T track:**
- Individual users
- Cross-session behaviour
- Personal information
- Cookies

### Conditional Telemetry

User opt-in pattern:

```typescript
interface TelemetryConfig {
  enabled: boolean;
  anonymousAnalytics: boolean;
  errorReporting: boolean;
  performanceMetrics: boolean;
}

const defaultConfig: TelemetryConfig = {
  enabled: false,  // Opt-in by default
  anonymousAnalytics: false,
  errorReporting: false,
  performanceMetrics: false,
};

function initTelemetry(config: TelemetryConfig) {
  if (!config.enabled) return;

  if (config.performanceMetrics) {
    reportWebVitals((metric) => {
      logger.info('web-vital', metric);
    });
  }

  if (config.errorReporting) {
    window.addEventListener('error', (event) => {
      const error = reportError(event.error);
      // Send to aggregation service if configured
    });
  }
}
```

### Debug Mode

Development-only utilities:

```typescript
if (import.meta.env.DEV) {
  // Expose debug utilities
  (window as any).__app = {
    getState: () => store.getState(),
    getLogs: () => logger.export(),
    getPerformance: () => performanceMonitor.getSummary(),
    simulateError: (type: string) => {
      throw new Error(`Simulated ${type} error`);
    },
    clearCache: () => {
      queryClient.clear();
      localStorage.clear();
    },
  };

  // React DevTools integration
  console.log(
    '%c🔧 Debug mode enabled',
    'color: #00ff00; font-weight: bold;',
    'Access via window.__app'
  );
}
```

### Diagnostics Export

For user-submitted bug reports:

```typescript
interface DiagnosticsBundle {
  version: string;
  timestamp: string;
  environment: {
    userAgent: string;
    viewport: { width: number; height: number };
    online: boolean;
    memory?: { used: number; limit: number };
  };
  logs: LogEntry[];
  performance: {
    webVitals: Record<string, number>;
    customMarks: Array<{ name: string; duration: number }>;
  };
  state: {
    // Sanitised app state
    viewMode: string;
    activeFeatures: string[];
    collectionCount: number;
  };
}

function exportDiagnostics(): DiagnosticsBundle {
  return {
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    environment: {
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight },
      online: navigator.onLine,
      memory: getMemoryInfo(),
    },
    logs: logger.getRecentLogs(),
    performance: performanceMonitor.getSummary(),
    state: getSanitisedState(),
  };
}

function downloadDiagnostics() {
  const bundle = exportDiagnostics();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diagnostics-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

## Recommendations for itemdeck

### 1. Local-First Logging

Implement structured logger with in-memory buffer, no external service required.

### 2. Web Vitals Integration

Track Core Web Vitals locally for performance awareness.

### 3. Diagnostics Export

Provide "Download Diagnostics" feature for user bug reports.

### 4. No Mandatory Analytics

Privacy-first means no tracking by default. Consider optional Plausible integration.

### 5. Debug Mode

Expose developer utilities in development builds only.

### 6. Error Aggregation (Local)

Aggregate errors locally for pattern detection, exportable in diagnostics.

## References

- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [web.dev Core Web Vitals](https://web.dev/vitals/)
- [Performance API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Plausible Analytics](https://plausible.io/)
- [Simple Analytics](https://simpleanalytics.com/)
- [GDPR and Analytics](https://gdpr.eu/cookies/)
- [INP: Interaction to Next Paint](https://web.dev/inp/)

---

## Related Documentation

- [R-019: Logging & Observability](./R-019-logging-observability.md)
- [ADR-031: Logging & Telemetry Strategy](../decisions/adrs/ADR-031-logging-telemetry-strategy.md)
- [ADR-009: Security](../decisions/adrs/ADR-009-security.md)

---

**Status**: Complete
