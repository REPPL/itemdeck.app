# Features

Feature specifications for Itemdeck development.

## Feature Index

### v0.1.0 - Animation Foundation

| ID | Feature | Status |
|----|---------|--------|
| [F-001](./completed/F-001-card-flip-animation.md) | Card Flip Animation | ✅ Complete |
| [F-002](./completed/F-002-configuration-system.md) | Configuration System | ✅ Complete |
| [F-003](./completed/F-003-image-fallback-system.md) | Image Fallback System | ✅ Complete |
| [F-004](./completed/F-004-keyboard-navigation.md) | Keyboard Navigation | ✅ Complete |
| [F-005](./completed/F-005-reduced-motion-support.md) | Reduced Motion Support | ✅ Complete |

### v0.2.0 - External Data

| ID | Feature | Status |
|----|---------|--------|
| [F-006](./completed/F-006-tanstack-query-setup.md) | TanStack Query Setup | ✅ Complete |
| [F-007](./completed/F-007-github-data-source.md) | GitHub Data Source | ✅ Complete |
| [F-008](./completed/F-008-card-data-schema.md) | Card Data Schema | ✅ Complete |
| [F-009](./completed/F-009-offline-caching.md) | Offline Caching | ✅ Complete |

### v0.3.0 - Customisation

| ID | Feature | Status |
|----|---------|--------|
| [F-010](./completed/F-010-theme-system.md) | Theme System | ✅ Complete |
| [F-011](./completed/F-011-layout-presets.md) | Layout Presets | ✅ Complete |
| [F-012](./completed/F-012-state-persistence.md) | State Persistence | ✅ Complete |
| [F-013](./completed/F-013-settings-panel.md) | Settings Panel | ✅ Complete |
| [F-021](./completed/F-021-eslint-typescript-fixes.md) | ESLint/TypeScript Fixes | ✅ Complete |
| [F-022](./completed/F-022-test-coverage-reporting.md) | Test Coverage Reporting | ✅ Complete |
| [F-023](./completed/F-023-manual-refresh-button.md) | Manual Refresh Button | ✅ Complete |
| [F-024](./completed/F-024-aria-live-regions.md) | ARIA Live Regions | ✅ Complete |
| [F-027](./completed/F-027-shuffle-by-default.md) | Shuffle by Default | ✅ Complete |
| [F-029](./completed/F-029-card-info-button.md) | Card Info Button | ✅ Complete |
| [F-030](./completed/F-030-enhanced-card-front-design.md) | Enhanced Card Front Design | ✅ Complete |
| [F-033](./completed/F-033-card-elevation-system.md) | Card Elevation System | ✅ Complete |
| [F-034](./completed/F-034-card-badges.md) | Card Badges | ✅ Complete |
| [F-039](./completed/F-039-responsive-typography.md) | Responsive Typography | ✅ Complete |

### v0.4.0 - Performance & Interaction

| ID | Feature | Status |
|----|---------|--------|
| [F-016](./completed/F-016-bundle-optimisation.md) | Bundle Optimisation | ✅ Complete |
| [F-025](./completed/F-025-bundle-size-monitoring.md) | Bundle Size Monitoring | ✅ Complete |
| [F-031](./completed/F-031-fit-to-viewport.md) | Fit to Viewport Mode | ✅ Complete |
| [F-040](./completed/F-040-touch-gestures.md) | Touch Gestures | ✅ Complete |

### v0.5.0 - Schema Design

*Schema design milestone - no individual feature files (spec-based)*

### v0.6.0 - Schema Loader

*Schema loader milestone - no individual feature files (implementation-based)*

### v0.7.0 - Schema Flexibility

| ID | Feature | Status |
|----|---------|--------|
| - | Schema Type Definitions (Rating, DetailLink) | ✅ Complete |
| - | Zod Validation Schemas | ✅ Complete |
| - | Loader Updates (isPrimary, ratings, detailUrls) | ✅ Complete |
| - | Dynamic Field Discovery | ✅ Complete |
| - | Terminology Generalisation (platform → category) | ✅ Complete |
| [F-020](./completed/F-020-attribution-system.md) | Attribution Display Component | ✅ Complete |
| - | Demo Data Migration (81 games, individual files) | ✅ Complete |
| - | Schema v2 Reference Documentation | ✅ Complete |

### v0.8.0 - Visual Overhaul & Caching

*Configuration and caching milestone - no individual feature files (infrastructure-based)*

### v0.8.1 - Random Selection & Accessibility

| ID | Feature | Status |
|----|---------|--------|
| [F-042](./completed/F-042-collection-display-driver.md) | Collection Display Driver | ✅ Complete |
| [F-043](./completed/F-043-settings-panel-subtabs.md) | Settings Panel Sub-tabs | ✅ Complete |
| [F-044](./completed/F-044-random-card-sampling.md) | Random Card Sampling | ✅ Complete |

### v0.9.0 - Remote Source Intelligence

| ID | Feature | Status |
|----|---------|--------|
| [F-045](./completed/F-045-remote-source-health-check.md) | Remote Source Health Check | ✅ Complete |
| [F-046](./completed/F-046-collection-discovery-ui.md) | Collection Discovery UI | ✅ Complete |
| [F-047](./completed/F-047-remote-source-management.md) | Remote Source Management | ✅ Complete |
| [F-062](./completed/F-062-collection-statistics.md) | Collection Statistics Summary | ✅ Complete |
| [F-063](./completed/F-063-collection-export.md) | Collection Export | ✅ Complete |

### v0.10.0 - Data Editing

| ID | Feature | Status |
|----|---------|--------|
| [F-048](./completed/F-048-edit-mode-toggle.md) | Edit Mode Toggle | ✅ Complete |
| [F-049](./completed/F-049-entity-edits-store.md) | Entity Edits Store | ✅ Complete |
| [F-050](./completed/F-050-edit-form-component.md) | Edit Form Component | ✅ Complete |
| [F-051](./completed/F-051-edit-button-integration.md) | Edit Button Integration | ✅ Complete |
| [F-052](./completed/F-052-edit-export-import.md) | Edit Export/Import | ✅ Complete |

### v0.10.1 - UI Polish & Data Model Refinement

*Bug-fix release - no individual feature files*

| Fix | Description | Status |
|-----|-------------|--------|
| Gallery Rounded Corners | `border-radius: inherit` for nested elements | ✅ Complete |
| Spacebar in EditForm | Stop keyboard event propagation in overlay | ✅ Complete |
| Image Source Pluralisation | Dynamic pluralisation based on count | ✅ Complete |
| Verdict Text Overflow | CSS line clamping (2 lines max) | ✅ Complete |
| Edit Metadata Display | Simplified data model to single `_editedAt` field | ✅ Complete |

### v0.10.5 - Field Descriptions & Demo Data

| Feature | Description | Status |
|---------|-------------|--------|
| Field Description Infrastructure | Add descriptions to FIELD_DEFINITIONS | ✅ Complete |
| InfoTooltip Component | CSS-only accessible tooltip component | ✅ Complete |
| Platform Data Enhancement | Add MobyGames URLs to all 13 platforms | ✅ Complete |
| Data Consistency Audit | Verify all games have required fields | ✅ Complete |

### v0.10.6 - Documentation Sync & Forgotten Features

*Documentation-only release recognising features implemented but not documented*

| ID | Feature | Status |
|----|---------|--------|
| [F-014](./completed/F-014-virtual-scrolling.md) | Virtual Scrolling | ✅ Complete |
| [F-015](./completed/F-015-image-lazy-loading.md) | Image Lazy Loading | ✅ Complete |
| [F-028](./completed/F-028-card-drag-and-drop.md) | Card Drag and Drop | ✅ Complete |
| [F-032](./completed/F-032-card-stack-view.md) | Card Stack View | ✅ Complete |
| [F-035](./completed/F-035-card-quick-actions.md) | Card Quick Actions | ✅ Complete |
| [F-038](./completed/F-038-card-carousel-mode.md) | Card Carousel Mode | ✅ Complete |

### v0.11.0 - Mechanics Foundation & Discovery

| ID | Feature | Status |
|----|---------|--------|
| [F-036](./completed/F-036-card-filtering.md) | Card Filtering (with Search) | ✅ Complete |
| [F-053](./completed/F-053-mechanic-plugin-registry.md) | Mechanic Plugin Registry | ✅ Complete |
| [F-054](./completed/F-054-mechanic-context-provider.md) | Mechanic Context Provider | ✅ Complete |
| [F-055](./completed/F-055-mechanic-overlay-system.md) | Mechanic Overlay System | ✅ Complete |
| [F-056](./completed/F-056-settings-mechanic-selector.md) | Settings Mechanic Selector | ✅ Complete |
| [F-065](./completed/F-065-card-grouping.md) | Card Grouping | ✅ Complete |
| [F-066](./completed/F-066-view-mode-toggle.md) | View Mode Toggle | ✅ Complete |

### v0.11.1 - UX Polish, Video & Documentation

| ID | Feature | Status |
|----|---------|--------|
| [F-068](./completed/F-068-memory-status-bar-relocation.md) | Memory Game Status Bar Relocation | ✅ Complete |
| [F-069](./completed/F-069-youtube-video-support.md) | YouTube Video Gallery Support | ✅ Complete |
| [F-070](./completed/F-070-image-retrieval-validation.md) | Image Retrieval Validation | ✅ Complete |
| [F-071](./completed/F-071-myplausibleme-url-format.md) | MyPlausibleMe Strict URL Format | ✅ Complete |
| [F-072](./completed/F-072-settings-panel-redesign.md) | Settings Panel Redesign | ✅ Complete |
| [F-073](./completed/F-073-user-documentation.md) | User Documentation Suite | ✅ Complete |
| [F-074](./completed/F-074-destructive-action-styling.md) | Destructive Action Button Styling | ✅ Complete |
| [F-017](./completed/F-017-testing-infrastructure.md) | Testing Infrastructure | ✅ Complete |
| [F-018](./completed/F-018-security-hardening.md) | Security Hardening | ✅ Complete |

### v0.15.0 - User Experience & Polish (Partial)

| ID | Feature | Status |
|----|---------|--------|
| [F-109](./completed/F-109-launch-screen.md) | Launch Screen with Logo | ✅ Complete |
| [F-110](./completed/F-110-keyboard-shortcuts-review.md) | Keyboard Shortcuts Review | ✅ Complete |
| [F-111](./completed/F-111-overlay-consistency.md) | Overlay Consistency Review | ✅ Complete |
| [F-114](./completed/F-114-update-checking.md) | Update Checking | ✅ Complete |
| [F-115](./completed/F-115-caching-transparency.md) | Caching Transparency | ✅ Complete |

### v0.15.5 - Infrastructure & Documentation

| ID | Feature | Status |
|----|---------|--------|
| [F-019](./completed/F-019-accessibility-audit.md) | Accessibility Audit | ✅ Complete |
| [F-026](./completed/F-026-component-storybook.md) | Component Storybook | ✅ Complete |
| [F-073](./completed/F-073-user-documentation.md) | User Documentation Suite | ✅ Complete |
| [F-081](./completed/F-081-settings-json-export.md) | Settings JSON Export/Import | ✅ Complete |
| [F-082](./completed/F-082-theme-json-export.md) | Theme JSON Export/Import | ✅ Complete |
| [F-091](./completed/F-091-entity-auto-discovery.md) | Entity Auto-Discovery | ✅ Complete |
| [F-102](./completed/F-102-mechanic-display-preferences.md) | Mechanic Display Preferences | ✅ Complete |

### v1.0.0 - First Production Release

| ID | Feature | Status |
|----|---------|--------|
| [F-064](./planned/F-064-collection-comparison.md) | Collection Comparison Mode | 📋 Planned |
| [F-107](./planned/F-107-empty-collection-handling.md) | Empty Collection Handling | 📋 Planned |
| [F-108](./planned/F-108-top-trumps-review.md) | Top Trumps Mechanic Review | 📋 Planned |
| [F-112](./planned/F-112-example-loading.md) | Example Loading | 📋 Planned |
| [F-113](./planned/F-113-lazy-loading-indicator.md) | Lazy Loading Indicator | 📋 Planned |
| [F-116](./planned/F-116-settings-reorganisation.md) | Settings Reorganisation | 📋 Planned |
| [F-117](./planned/F-117-navigation-standardisation.md) | Navigation Standardisation | 📋 Planned |
| [F-118](./planned/F-118-mechanics-ux-review.md) | Mechanics UX Review | 📋 Planned |
| [F-037](./planned/F-037-card-sorting.md) | Card Sorting (Expanded) | 📋 Planned |
| [F-041](./planned/F-041-card-animations-polish.md) | Card Animation Polish | 📋 Planned |
| [F-067](./planned/F-067-statistics-dashboard.md) | Statistics Dashboard | 📋 Planned |
| [F-119](./planned/F-119-drag-drop-keyboard-accessibility.md) | Drag-Drop Keyboard Accessibility | 📋 Planned |

## Status Legend

- 📋 Planned - In `planned/` directory
- 🔄 Active - In `active/` directory
- ✅ Complete - In `completed/` directory

## Contents

- [active/](./active/) - Features currently in progress
- [planned/](./planned/) - Features queued for future
- [completed/](./completed/) - Completed features archive

---

## Related Documentation

- [Roadmap Overview](../README.md)
- [Milestones](../milestones/)
