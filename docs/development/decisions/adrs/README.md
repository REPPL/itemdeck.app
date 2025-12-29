# Architecture Decision Records

Documented architectural decisions for Itemdeck.

## ADR Index

| # | Decision | Status | Research |
|---|----------|--------|----------|
| [001](./ADR-001-animation-library.md) | Use Framer Motion for animations | Accepted | [card-layouts-animations](../../research/card-layouts-animations.md) |
| [002](./ADR-002-schema-validation.md) | Use Zod for schema validation | Accepted | [configuration-hierarchy](../../research/configuration-hierarchy.md) |
| [003](./ADR-003-data-fetching.md) | Use TanStack Query for data fetching | Accepted | [external-data-sources](../../research/external-data-sources.md) |
| [004](./ADR-004-state-management.md) | Use Zustand for state management | Accepted | [state-persistence](../../research/state-persistence.md) |
| [005](./ADR-005-theming-approach.md) | Use CSS Custom Properties for theming | Accepted | [customisation-options](../../research/customisation-options.md) |
| [006](./ADR-006-virtualisation.md) | Use TanStack Virtual for large lists | Accepted | [performance-virtualisation](../../research/performance-virtualisation.md) |
| [007](./ADR-007-unit-testing.md) | Use Vitest + React Testing Library | Accepted | [testing-strategies](../../research/testing-strategies.md) |
| [008](./ADR-008-e2e-testing.md) | Use Playwright for E2E testing | Accepted | [testing-strategies](../../research/testing-strategies.md) |
| [009](./ADR-009-security.md) | Implement CSP and DOMPurify | Accepted | [system-security](../../research/system-security.md) |
| [010](./ADR-010-component-patterns.md) | Use compound components pattern | Accepted | [modular-architecture](../../research/modular-architecture.md) |
| [011](./ADR-011-accessibility-standard.md) | Implement WCAG 2.2 AA compliance | Accepted | [accessibility](../../research/accessibility.md) |
| [012](./ADR-012-ethical-sourcing.md) | Use Wikimedia Commons for ethical sourcing | Accepted | [ethical-image-sourcing](../../research/ethical-image-sourcing.md) |
| [013](./ADR-013-external-data-repository.md) | Use External Data Repository | Accepted | [data-repository-architecture](../../research/data-repository-architecture.md) |
| [014](./ADR-014-entity-edit-architecture.md) | Use Overlay Store for entity edits | Accepted | [R-007-optimistic-updates](../../research/R-007-optimistic-updates.md) |
| [015](./ADR-015-edit-mode-ux.md) | Use Modal Edit Form pattern | Accepted | [R-004-form-handling](../../research/R-004-form-handling.md) |
| [016](./ADR-016-gaming-mechanics-plugin-architecture.md) | Use Registry + Factory for mechanics | Accepted | [R-006-plugin-state-isolation](../../research/R-006-plugin-state-isolation.md) |
| [017](./ADR-017-mechanic-state-management.md) | Use Scoped Zustand Stores per mechanic | Accepted | [R-005-gaming-mechanics-state](../../research/R-005-gaming-mechanics-state.md) |
| [018](./ADR-018-mechanic-ui-overlay.md) | Use Slot Props for mechanic overlays | Accepted | [R-005-gaming-mechanics-state](../../research/R-005-gaming-mechanics-state.md) |
| [019](./ADR-019-configuration-first-mechanics.md) | Use Configuration-First Mechanics | Accepted | [R-009-mechanic-app-integration](../../research/R-009-mechanic-app-integration.md) |
| [020](./ADR-020-mechanic-settings-isolation.md) | Use Settings Accessor for mechanic isolation | Accepted | [state-of-the-art-plugin-architecture](../../research/state-of-the-art-plugin-architecture.md) |
| [021](./ADR-021-internationalisation-library.md) | Use react-i18next for internationalisation | Accepted | [state-of-the-art-internationalisation](../../research/state-of-the-art-internationalisation.md) |
| [022](./ADR-022-icon-configuration-registry.md) | Use JSON registry for icon configuration | Accepted | [state-of-the-art-internationalisation](../../research/state-of-the-art-internationalisation.md) |

## ADR Template

```markdown
# ADR-XXX: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded]

## Context

[Why this decision is needed]

## Decision

[What we decided]

## Consequences

### Positive
- [Benefit 1]

### Negative
- [Trade-off 1]

## Alternatives Considered

- [Alternative 1]: [Why rejected]

---

## Related Documentation

- [Research](link)
- [Feature](link)
```

---

## Related Documentation

- [Decisions Overview](../README.md)
- [Research](../../research/)
