# v0.7.1 Retrospective - Settings Fixes & Visual Polish

## Summary

v0.7.1 is a patch release fixing settings that weren't working and making visual refinements to the detail view. The focus was on ensuring the user's configured preferences actually apply.

## What Went Well

### 1. Settings Store Architecture
The Zustand settings store with theme customisations was well-structured. Once identified, wiring up the missing connections was straightforward - just needed to read from the store.

### 2. Focused Scope
By treating this as a patch release focused on fixes rather than new features, we avoided scope creep and delivered working functionality quickly.

### 3. Clean CSS Approach
The 3% zoom approach for first images is elegant - using percentage-based sizing that works across all container dimensions rather than pixel offsets.

### 4. State Reset Pattern
Adding overlay reset on close prevents stale UI state from persisting between views. This is a good pattern to apply to other modal/overlay components.

## What Could Improve

### 1. Settings Testing Gap
Three settings were implemented in the store but never wired up to components. This suggests a need for integration tests that verify settings actually affect the UI.

**Potential improvement:** Add Playwright tests that change settings and verify the UI responds.

### 2. Large Plan Scope
The original v0.7.1 plan included 30+ items across 8 phases. Most were deferred. Future planning should be more realistic about patch release scope.

**Lesson:** Patch releases should focus on 5-10 targeted fixes, not comprehensive overhauls.

### 3. Icon Component Library
Adding the Acknowledgement info icon revealed we're defining SVG icons inline in each component. A shared icon library would reduce duplication.

**Status:** Deferred - InfoIcon, CloseIcon, ExternalLinkIcon could be extracted.

## Lessons Learned

### 1. Verify Settings Work End-to-End
When adding a new setting, trace the full path: store → component → UI effect. Don't assume the component reads from the store.

### 2. Reset Modal State on Close
Modals and overlays should reset internal state when closed. Users expect a fresh state each time they open.

### 3. Use Percentage-Based Sizing for Responsive Images
Pixel-based offsets (e.g., `top: -2px`) don't scale well. Percentage-based sizing (e.g., `width: 103%`) adapts to container size.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Changed autoExpandMore default to false | Users prefer to click to expand rather than having it auto-expand |
| Changed moreButtonLabel default to "Verdict" | Matches the collection's domain (game verdicts) |
| Icon-only for Acknowledgement button | Reduces visual clutter, tooltip provides context |
| 3% zoom for first image | Eliminates edge artefacts while preserving aspect ratio |

## Metrics

| Metric | Value |
|--------|-------|
| Files modified | 7 |
| Settings fixed | 3 (moreButtonLabel, autoExpandMore, zoomImage) |
| Visual fixes | 6 (logo sizing, image zoom, rank width, overlay reset, info icons) |
| CSS classes added | 1 (.iconButton) |
| Components modified | 4 (CardExpanded, ImageGallery, Card, RankBadge) |

## Follow-Up Items

1. **Wikipedia/MobyGames icons** - Add logo-based links for common sources
2. **Full settings audit** - Verify all settings in store actually work
3. **Icon component extraction** - Create shared icon library
4. **Integration tests** - Add tests that verify settings affect UI
5. **Border width setting** - Add UI control for card borders

---

## Related Documentation

- [v0.7.1 Devlog](../../devlogs/v0.7.1/README.md)
- [v0.7.0 Milestone](../../../roadmap/milestones/v0.7.0.md)
- [v0.7.0 Retrospective](../v0.7.0/README.md)
