# Research Documentation

This directory contains comprehensive research reports informing the next phase of Itemdeck development.

## Purpose

These reports provide:
- State-of-the-art analysis of relevant technologies and patterns
- React/TypeScript-specific implementations and library comparisons
- Actionable recommendations tailored to Itemdeck's architecture
- Code examples ready for adaptation

## Research Parameters

| Parameter | Value |
|-----------|-------|
| **Depth** | Comprehensive (deep dive with code examples, library comparisons) |
| **Stack Focus** | React 18 / TypeScript 5 (strict mode) |
| **Use Case** | General collection viewer (cards from various sources) |
| **Current Version** | v0.0.0-foundation |

## Research Reports

### Core Topics

| # | Topic | File | Status |
|---|-------|------|--------|
| 1 | Card Layouts & Animations | [card-layouts-animations.md](./card-layouts-animations.md) | ✅ Complete |
| 2 | External Data Sources | [external-data-sources.md](./external-data-sources.md) | ✅ Complete |
| 3 | Configuration Hierarchy | [configuration-hierarchy.md](./configuration-hierarchy.md) | ✅ Complete |
| 4 | Modular Architecture | [modular-architecture.md](./modular-architecture.md) | ✅ Complete |
| 5 | Customisation Options | [customisation-options.md](./customisation-options.md) | ✅ Complete |
| 6 | Image Handling & Security | [image-handling-security.md](./image-handling-security.md) | ✅ Complete |
| 7 | System Security | [system-security.md](./system-security.md) | ✅ Complete |
| 8 | Asset Management | [asset-management.md](./asset-management.md) | ✅ Complete |

### Additional Topics

| # | Topic | File | Status |
|---|-------|------|--------|
| 9 | Accessibility (a11y) | [accessibility.md](./accessibility.md) | ✅ Complete |
| 10 | Performance & Virtualisation | [performance-virtualisation.md](./performance-virtualisation.md) | ✅ Complete |
| 11 | Testing Strategies | [testing-strategies.md](./testing-strategies.md) | ✅ Complete |
| 12 | State Persistence | [state-persistence.md](./state-persistence.md) | ✅ Complete |
| 13 | Ethical Image Sourcing | [ethical-image-sourcing.md](./ethical-image-sourcing.md) | ✅ Complete |
| 14 | Data Repository Architecture | [data-repository-architecture.md](./data-repository-architecture.md) | ✅ Complete |

### State-of-the-Art Reports

| Topic | File | Status |
|-------|------|--------|
| Remote Data Assessment | [state-of-the-art-remote-data-assessment.md](./state-of-the-art-remote-data-assessment.md) | ✅ Complete |
| Plugin Architecture | [state-of-the-art-plugin-architecture.md](./state-of-the-art-plugin-architecture.md) | ✅ Complete |
| Internationalisation | [state-of-the-art-internationalisation.md](./state-of-the-art-internationalisation.md) | ✅ Complete |
| Web Security Sandboxing | [state-of-the-art-web-security-sandbox.md](./state-of-the-art-web-security-sandbox.md) | ✅ Complete |
| Visual Consistency | [state-of-the-art-visual-consistency.md](./state-of-the-art-visual-consistency.md) | ✅ Complete |

### Numbered Research

| ID | Topic | File | Status |
|----|-------|------|--------|
| R-003 | External Scores Integration | [R-003-external-scores.md](./R-003-external-scores.md) | ✅ Complete |
| R-004 | Form Handling in React | [R-004-form-handling.md](./R-004-form-handling.md) | ✅ Complete |
| R-005 | Gaming Mechanics State Patterns | [R-005-gaming-mechanics-state.md](./R-005-gaming-mechanics-state.md) | ✅ Complete |
| R-006 | Plugin State Isolation | [R-006-plugin-state-isolation.md](./R-006-plugin-state-isolation.md) | ✅ Complete |
| R-007 | Optimistic Updates | [R-007-optimistic-updates.md](./R-007-optimistic-updates.md) | ✅ Complete |
| R-008 | Fuzzy Matching | [R-008-fuzzy-matching.md](./R-008-fuzzy-matching.md) | ✅ Complete |
| R-009 | Mechanic App Integration | [R-009-mechanic-app-integration.md](./R-009-mechanic-app-integration.md) | ✅ Complete |
| R-010 | Settings UX Patterns | [R-010-settings-ux-patterns.md](./R-010-settings-ux-patterns.md) | ✅ Complete |

## Report Structure

Each report follows a consistent template:

```markdown
# [Topic Title]

## Executive Summary
Brief overview of findings and key recommendations.

## Current State in Itemdeck
What exists now and how it relates to this topic.

## Research Findings
### Approaches & Patterns
### Library Comparison (React/TypeScript)
### Code Examples

## Recommendations for Itemdeck
Specific, actionable recommendations ranked by priority.

## Implementation Considerations
- Dependencies
- Breaking changes
- Migration path

## References
Links to documentation, articles, examples.
```

## Methodology

For each topic:
1. Web search for current best practices (2024-2025)
2. Review React/TypeScript-specific implementations
3. Evaluate libraries (npm trends, GitHub stars, maintenance status)
4. Create code examples relevant to Itemdeck
5. Formulate specific recommendations

## How to Use These Reports

1. **Before implementing a feature**: Read the relevant report for context
2. **When choosing libraries**: Refer to the library comparison tables
3. **For code patterns**: Adapt the provided examples to your needs
4. **For architecture decisions**: Consider the recommendations and trade-offs

## Related Documentation

- [Exploration Research](../../exploration/) - User-facing design explorations
- [Project Standards](../../.claude/CLAUDE.md)
- [Design Specification](../prompts/setup/v2.md)
- [Documentation Hub](../README.md)

---

**Applies to**: Itemdeck v0.1.0+
