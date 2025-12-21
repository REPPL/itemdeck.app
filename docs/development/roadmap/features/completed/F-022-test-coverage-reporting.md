# F-022: Test Coverage Reporting

## Problem Statement

The project has 211 tests but no way to measure or report code coverage:

1. `@vitest/coverage-v8` is not installed
2. Cannot identify untested code paths
3. No coverage thresholds enforced in CI
4. No visibility into coverage trends over time

Without coverage metrics, it's impossible to know if new code is adequately tested or if refactoring introduces coverage gaps.

## Design Approach

### 1. Install Coverage Dependencies

```bash
npm install -D @vitest/coverage-v8
```

### 2. Configure Vitest for Coverage

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.ts",
        "src/main.tsx",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### 3. Add Coverage Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=junit"
  }
}
```

### 4. Coverage Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Statements | 80% | High coverage for core logic |
| Branches | 75% | Allow some edge case gaps |
| Functions | 80% | All public functions tested |
| Lines | 80% | Consistent with statements |

### 5. CI Integration

Add coverage check to GitHub Actions:

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
```

## Implementation Tasks

- [ ] Install `@vitest/coverage-v8`
- [ ] Update `vitest.config.ts` with coverage settings
- [ ] Add coverage scripts to `package.json`
- [ ] Set initial coverage thresholds
- [ ] Run coverage and identify gaps
- [ ] Add tests to reach threshold if needed
- [ ] Update CI workflow with coverage step
- [ ] Add coverage badge to README (optional)

## Success Criteria

- [ ] `npm run test:coverage` generates HTML report
- [ ] Coverage meets 80% threshold for statements/lines
- [ ] Coverage meets 75% threshold for branches
- [ ] CI fails if coverage drops below thresholds
- [ ] Coverage report accessible in `coverage/` directory

## Dependencies

- **Requires**: None
- **Blocks**: F-017 Testing Infrastructure (provides foundation)

## Complexity

**Small** - Straightforward tooling addition with minimal code changes.

---

## Related Documentation

- [v0.3.0 Milestone](../../milestones/v0.3.0.md)
- [F-017: Testing Infrastructure](./F-017-testing-infrastructure.md)
