# F-016: Bundle Optimisation

## Problem Statement

Application bundle size affects initial load performance. Currently:

1. No code splitting configured
2. Vendor libraries bundled together
3. No lazy loading of features
4. Bundle size not monitored

## Design Approach

Implement **Vite-based bundle optimisation** with code splitting and lazy loading:

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Bundle visualiser (only in analyse mode)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React vendor chunk
          'react-vendor': ['react', 'react-dom'],

          // Animation library (used on most pages)
          'animation': ['framer-motion'],

          // Data fetching (loaded early)
          'query': ['@tanstack/react-query'],

          // Virtual scrolling (loaded when needed)
          'virtual': ['@tanstack/react-virtual'],

          // State management
          'state': ['zustand'],

          // Validation (small, used everywhere)
          'validation': ['zod'],
        },
      },
    },

    // Enable source maps for debugging
    sourcemap: true,

    // Use terser for smaller bundles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Report compressed sizes
    reportCompressedSize: true,

    // Chunk size warning threshold
    chunkSizeWarningLimit: 500,
  },
});
```

### Route-Based Code Splitting

```tsx
// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from './components/LoadingSpinner';

// Eager load (core pages)
import { HomePage } from './pages/HomePage';

// Lazy load (secondary pages)
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/collection/:id" element={<CollectionPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Component-Level Lazy Loading

```tsx
// src/components/LazySettingsPanel.tsx
import { lazy, Suspense } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';

const SettingsPanel = lazy(() =>
  import('./SettingsPanel').then(module => ({
    default: module.SettingsPanel,
  }))
);

interface LazySettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LazySettingsPanel({ isOpen, onClose }: LazySettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <Suspense fallback={<LoadingSkeleton type="panel" />}>
      <SettingsPanel isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
}
```

### Preloading Critical Routes

```tsx
// src/utils/preload.ts
export function preloadRoute(routeLoader: () => Promise<unknown>): void {
  // Use requestIdleCallback for non-blocking preload
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routeLoader();
    });
  } else {
    // Fallback for Safari
    setTimeout(() => {
      routeLoader();
    }, 200);
  }
}

// Preload settings when hovering over settings button
export function preloadSettings() {
  preloadRoute(() => import('./pages/SettingsPage'));
}

// Preload collection page when hovering over collection link
export function preloadCollection() {
  preloadRoute(() => import('./pages/CollectionPage'));
}
```

### Dynamic Import Utilities

```tsx
// src/utils/dynamicImport.ts
import { ComponentType, lazy } from 'react';

interface DynamicImportOptions {
  delay?: number; // Minimum loading delay for smooth UX
  retry?: number; // Number of retry attempts
}

export function dynamicImport<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): React.LazyExoticComponent<T> {
  const { delay = 0, retry = 2 } = options;

  return lazy(async () => {
    const startTime = Date.now();

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const module = await importFn();

        // Ensure minimum delay for smooth loading state
        const elapsed = Date.now() - startTime;
        if (elapsed < delay) {
          await new Promise(resolve => setTimeout(resolve, delay - elapsed));
        }

        return module;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retry) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  });
}

// Usage
const SettingsPanel = dynamicImport(
  () => import('./SettingsPanel'),
  { delay: 200, retry: 2 }
);
```

### Bundle Analysis Script

```json
// package.json scripts
{
  "scripts": {
    "build": "vite build",
    "build:analyse": "ANALYZE=true vite build",
    "analyse": "npm run build:analyse && open dist/stats.html"
  }
}
```

### Performance Budget Configuration

```typescript
// src/utils/performanceBudget.ts
export interface PerformanceBudget {
  totalSize: number;      // KB
  mainChunk: number;      // KB
  vendorChunk: number;    // KB
  perRouteChunk: number;  // KB
}

export const PERFORMANCE_BUDGET: PerformanceBudget = {
  totalSize: 300,        // 300KB total (gzipped)
  mainChunk: 100,        // 100KB main bundle
  vendorChunk: 150,      // 150KB vendor libraries
  perRouteChunk: 50,     // 50KB per lazy route
};

// Check budget in CI
export function checkBudget(stats: Record<string, number>): boolean {
  const violations: string[] = [];

  if (stats.total > PERFORMANCE_BUDGET.totalSize) {
    violations.push(`Total size ${stats.total}KB exceeds budget ${PERFORMANCE_BUDGET.totalSize}KB`);
  }

  if (stats.main > PERFORMANCE_BUDGET.mainChunk) {
    violations.push(`Main chunk ${stats.main}KB exceeds budget ${PERFORMANCE_BUDGET.mainChunk}KB`);
  }

  if (violations.length > 0) {
    console.error('Performance budget violations:');
    violations.forEach(v => console.error(`  - ${v}`));
    return false;
  }

  return true;
}
```

### Tree Shaking Verification

```typescript
// src/utils/treeShakeTest.ts

// Ensure named exports are used for tree shaking
// BAD: import _ from 'lodash';
// GOOD: import { debounce } from 'lodash-es';

// Example of tree-shakeable exports
export { Card } from './components/Card';
export { CardGrid } from './components/CardGrid';
export { useCards } from './hooks/useCards';

// Don't re-export entire modules
// BAD: export * from './components';
```

### Loading States

```tsx
// src/components/LoadingSkeleton/LoadingSkeleton.tsx
import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  type: 'card' | 'grid' | 'panel' | 'page';
}

export function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  switch (type) {
    case 'card':
      return (
        <div className={styles.card} role="presentation" aria-hidden="true">
          <div className={styles.cardImage} />
          <div className={styles.cardContent}>
            <div className={styles.line} style={{ width: '80%' }} />
            <div className={styles.line} style={{ width: '60%' }} />
          </div>
        </div>
      );

    case 'grid':
      return (
        <div className={styles.grid} role="presentation" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
      );

    case 'panel':
      return (
        <div className={styles.panel} role="presentation" aria-hidden="true">
          <div className={styles.line} style={{ width: '40%' }} />
          <div className={styles.line} style={{ width: '100%' }} />
          <div className={styles.line} style={{ width: '70%' }} />
        </div>
      );

    case 'page':
      return (
        <div className={styles.page} role="presentation" aria-hidden="true">
          <LoadingSkeleton type="grid" />
        </div>
      );
  }
}
```

## Implementation Tasks

- [ ] Install rollup-plugin-visualizer: `npm install -D rollup-plugin-visualizer`
- [ ] Configure manual chunks in vite.config.ts
- [ ] Implement route-based code splitting
- [ ] Create lazy-loaded component wrappers
- [ ] Create preloading utilities
- [ ] Create dynamic import with retry logic
- [ ] Add bundle analysis npm script
- [ ] Define performance budget
- [ ] Create loading skeleton components
- [ ] Enable terser minification
- [ ] Add source maps for production debugging
- [ ] Write CI check for bundle size
- [ ] Document code splitting patterns

## Success Criteria

- [ ] Bundle split into logical chunks
- [ ] Total gzipped size < 300KB
- [ ] Main chunk < 100KB
- [ ] Routes lazy loaded with suspense
- [ ] Settings panel lazy loaded on open
- [ ] Bundle analyser generates report
- [ ] Tree shaking verified working
- [ ] Loading states smooth and accessible
- [ ] Performance budget enforced in CI
- [ ] Tests pass

## Dependencies

- **Requires**: v0.3.0 complete
- **Blocks**: None

## Complexity

**Medium** - Requires understanding of Vite/Rollup configuration and React Suspense patterns.

---

## Related Documentation

- [Performance & Virtualisation Research](../../../../research/performance-virtualisation.md)
- [v0.4.0 Milestone](../../milestones/v0.4.md)
