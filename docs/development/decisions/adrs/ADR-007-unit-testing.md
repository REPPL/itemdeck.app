# ADR-007: Use Vitest for Unit Testing

## Status

Accepted

## Context

Itemdeck needs a unit testing framework for:
- Component testing
- Hook testing
- Utility function testing
- Store testing

We evaluated several testing frameworks:

| Framework | Speed | Vite Integration | Watch Mode |
|-----------|-------|------------------|------------|
| Vitest | Fast | Native | Excellent |
| Jest | Medium | Requires config | Good |
| Mocha | Fast | Manual | Manual |

Key requirements:
1. Fast test execution
2. Native Vite integration
3. ESM support
4. React Testing Library compatibility
5. Coverage reporting

## Decision

Use **Vitest** with **React Testing Library** for component testing.

## Consequences

### Positive

- **Native Vite support** - Same config, instant HMR
- **Jest compatible** - Familiar API, easy migration
- **Fast** - ESM-first, parallel execution
- **Watch mode** - Instant feedback during development
- **Coverage** - Built-in v8 coverage
- **UI mode** - Optional visual test runner

### Negative

- **Newer ecosystem** - Fewer resources than Jest
- **Some Jest plugins** - May not work directly

### Mitigations

- Use Jest-compatible matchers (`@testing-library/jest-dom`)
- Follow RTL best practices for component tests
- Document testing patterns for consistency

## Test Structure

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      thresholds: { statements: 80, branches: 80 },
    },
  },
});
```

## Testing Philosophy

1. **Test behaviour, not implementation** - Use RTL queries
2. **Avoid testing framework code** - Focus on our logic
3. **Prefer integration tests** - Test components with context
4. **Mock at boundaries** - API calls, not internal functions

## Alternatives Considered

### Jest
- Industry standard
- **Rejected**: Slower, requires extra Vite configuration

### Mocha + Chai
- Flexible
- **Rejected**: More setup, less integrated

### Testing Library alone
- UI testing only
- **Rejected**: Need runner for coverage, watch mode

---

## Related Documentation

- [Testing Strategies Research](../../../research/testing-strategies.md)
- [F-017: Testing Infrastructure](../../roadmap/features/planned/F-017-testing-infrastructure.md)
