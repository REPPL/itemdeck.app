# v0.12.5 Retrospective

## Overview

| Metric | Value |
|--------|-------|
| **Version** | v0.12.5 |
| **Theme** | URL Simplification, Plugin-Ready Architecture & Snap Ranking |
| **Features** | 3 completed (URL formats, Fit-to-Viewport, Snap Ranking) |
| **New Files** | 13 |
| **Modified Files** | 15 |
| **Tests** | 462 passing |

---

## What Went Well

- **Clean Architecture Decision** - The hybrid approach (Option C) for Snap Ranking worked well. Building internally with plugin-compatible structure means the mechanic is functional now but can be extracted to an external plugin in v0.13.0 with minimal changes.

- **Manifest Schema Design** - The Zod-based manifest schema provides strong validation and TypeScript types. It's flexible enough to support future plugin features (themes, sample collections, required fields) while keeping the core simple.

- **URL Format Simplification** - The new `/gh?u=USER&c=COLLECTION` and `/gh/USER/c/PATH` formats are much cleaner than the old full CDN URLs. Nested folder support was straightforward to add.

- **Effective Code Reuse** - The Snap Ranking mechanic follows the same patterns as Memory, making implementation predictable. The `effectiveDimensions` pattern for fit-to-viewport was clean and non-invasive.

- **Documentation Sync** - Running `/sync-docs` and `/verify-docs` caught feature specs in wrong directories before release. The documentation auditor scored 92/100.

---

## What Could Improve

- **Pre-existing Test Debt** - The ImageWithFallback tests were broken before this milestone. Tests should be updated when components change, not left as technical debt.

- **Feature Spec Locations** - F-057 and F-061 were still in `planned/` despite being completed. Need to be more diligent about moving specs when implementation finishes.

- **Mechanic Registry Integration** - The registry doesn't yet read manifests for display metadata. This was marked as done but is deferred - the manifests exist but aren't fully utilised.

---

## Lessons Learned

1. **Hybrid Plugin Architecture Works**

   Building features with plugin-compatible structure from the start (manifest.json, scoped styles, self-contained) makes future extraction trivial. The extra overhead is minimal compared to retrofitting.

2. **Path Type Indicators Enable Future Expansion**

   Using `/c/` for collections instead of `/collection/` keeps URLs short while reserving space for `/m/` (mechanics) and `/t/` (themes). Forward-thinking URL design pays off.

3. **Interface Extension for State Types**

   When a store type needs to satisfy a generic interface, extending that interface is cleaner than adding index signatures or type assertions.

4. **Documentation Audits Catch Drift**

   The `/verify-docs` command found issues that manual review missed. Automated documentation checks should be part of every release.

---

## Decisions Made

1. **Manifest Schema Over TypeScript Types**

   **Context:** Needed a way to define mechanic metadata that works for both internal and future external plugins.

   **Outcome:** Used Zod schema for runtime validation with TypeScript type inference. This allows validating JSON files loaded from URLs while maintaining type safety.

2. **Colour-Only Image Placeholders**

   **Context:** Tests were failing because they expected title text in image placeholders.

   **Outcome:** Confirmed that colour-only placeholders are intentional - title is shown in card overlay, not in the image component. Updated tests to match current behaviour.

3. **Deferred Full Registry Integration**

   **Context:** Originally planned to have registry read manifests for display.

   **Outcome:** Deferred to v0.13.0 when external plugins are implemented. Current internal mechanics work fine without it.

---

## Deferred Items

| Item | Reason | Target |
|------|--------|--------|
| External Plugin Loader | Requires security model design | v0.13.0 |
| Customisable Keyboard Shortcuts | Scope control | v0.13.0 |
| Full Registry Manifest Support | Not needed for internal mechanics | v0.13.0 |
| Mechanic Sample Collections | No external hosting yet | v0.13.0 |

---

## Metrics

| Category | Count |
|----------|-------|
| Lines Added | ~1,900 |
| New Components | 6 (Snap Ranking UI) |
| New Schemas | 1 (mechanic-manifest) |
| New Tests | 12 (useUrlCollection) |
| Test Coverage | 462/462 passing |

---

## Related Documentation

- [v0.12.5 Milestone](../../roadmap/milestones/v0.12.5.md)
- [v0.12.5 Devlog](../devlogs/v0.12.5/README.md)
- [F-061 Snap Ranking](../../roadmap/features/completed/F-061-snap-ranking-mechanic.md)
- [Implementation Prompt](../../../prompts/implementation/v0.12.5/README.md)
