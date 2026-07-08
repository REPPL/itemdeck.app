# F-025: Bundle Size Monitoring

## Problem Statement

The bundle has grown significantly across milestones:

- v0.0.0: ~150 KB (estimated baseline)
- v0.1.0: ~200 KB (+33%)
- v0.2.0: 380 KB (+90%)

Without monitoring, bundle size can grow unchecked, impacting:

1. Initial page load time
2. Mobile data usage
3. Time to Interactive (TTI)
4. Core Web Vitals (LCP)

There are no size budgets or CI checks to catch regressions.

## Design Approach

### 1. Install Size Monitoring Tool

```bash
npm install -D size-limit @size-limit/preset-app
```

### 2. Configure Size Budgets

```json
// package.json
{
  "size-limit": [
    {
      "path": "dist/assets/*.js",
      "limit": "150 KB",
      "gzip": true
    },
    {
      "path": "dist/assets/*.css",
      "limit": "10 KB",
      "gzip": true
    }
  ]
}
```

### 3. Add Scripts

```json
{
  "scripts": {
    "size": "size-limit",
    "size:check": "size-limit --check"
  }
}
```

### 4. CI Integration

```yaml
# .github/workflows/ci.yml
- name: Check bundle size
  run: npm run size:check

- name: Report bundle size
  uses: andresz1/size-limit-action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 5. Size Budgets

| Asset | Current | Budget | Rationale |
|-------|---------|--------|-----------|
| JS (gzip) | 119 KB | 150 KB | Room for v0.3.0 features |
| CSS (gzip) | 3 KB | 10 KB | Room for themes |
| Total | 122 KB | 160 KB | Mobile-friendly target |

### 6. Bundle Analysis

Add bundle visualisation for debugging:

```bash
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
    }),
  ],
});
```

## Implementation Tasks

- [ ] Install `size-limit` and preset
- [ ] Configure size budgets in `package.json`
- [ ] Add `size` and `size:check` scripts
- [ ] Install `rollup-plugin-visualizer`
- [ ] Add visualiser to Vite config
- [ ] Run initial size check and document baseline
- [ ] Add size check to CI workflow
- [ ] Add size-limit GitHub Action for PR comments
- [ ] Document bundle composition

## Success Criteria

- [ ] `npm run size` reports current bundle sizes
- [ ] `npm run size:check` fails if budget exceeded
- [ ] CI blocks PRs that exceed size budget
- [ ] Bundle visualisation available in `dist/stats.html`
- [ ] Size budgets documented and justified

## Dependencies

- **Requires**: None
- **Blocks**: None (but informs F-016 Bundle Optimisation)

## Complexity

**Small** - Tooling configuration with no application code changes.

---

## Related Documentation

- [v0.4.0 Milestone](../../milestones/v0.4.0.md)
- [F-016: Bundle Optimisation](./F-016-bundle-optimisation.md)
