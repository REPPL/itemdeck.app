# v0.4.1 Retrospective

## Overview

| Aspect | Details |
|--------|---------|
| Milestone | v0.4.1 - Settings & Themes |
| Type | Patch release |
| Features | 2 new settings, 1 fix |
| Breaking Changes | None |

---

## What Happened

| Phase | Plan | Actual | Notes |
|-------|------|--------|-------|
| New Settings | Add missing controls | 2 controls added | Max Visible Cards, Card Back Display |
| Theme Fix | Investigate no effect | Root cause: missing fonts | Added Google Fonts |
| Theme UX | Improve discoverability | Theme cards with descriptions | Shows what each theme controls |

## Manual Interventions

| Intervention | Cause | Could Be Automated? |
|--------------|-------|---------------------|
| Store version bump | New state fields | Yes - could auto-increment |
| Props drilling | New setting through component tree | No - architectural requirement |

## Documentation Drift

| Drift Type | Files Affected | Root Cause |
|------------|----------------|------------|
| None detected | - | Patch release, minimal scope |

---

## What Went Well

### Root Cause Analysis

The visual theme "bug" was actually a missing asset issue. The CSS was correctly structured with `[data-visual-theme="retro"]` selectors, but the pixel fonts weren't loaded. Systematic investigation:

1. Verified theme CSS in built output (17 selectors found)
2. Checked font-family declarations in retro.css
3. Confirmed fonts weren't imported anywhere
4. Added Google Fonts to fix

### Minimal Scope

Patch release stayed focused:
- Two new settings that users requested
- One legitimate fix (fonts)
- One UX improvement (theme cards)

No scope creep into unrelated features.

### Store Migration Pattern

Zustand's persist middleware handled version migration cleanly. New fields get default values automatically.

---

## What Needs Improvement

### Font Loading Strategy

External font dependencies (Google Fonts) introduce:
- Network dependency
- Potential FOUT (Flash of Unstyled Text)
- Privacy considerations

Could consider self-hosting fonts or using system font stacks.

### Visual Theme Testing

No visual regression tests exist. Theme changes are difficult to verify automatically.

### Settings Panel Size

Panel now has 4 tabs with growing content. May need:
- Scrolling within tabs (already implemented)
- Settings search/filter
- Collapsible sections

---

## Lessons Learned

### What to Keep Doing

1. **Investigate before assuming** - Theme "not working" was actually working, just missing assets
2. **Descriptive UI** - Theme cards showing what they control is better than bare labels
3. **Focused patch releases** - Small scope, quick turnaround

### What to Start Doing

1. **Asset dependency checklist** - Verify fonts, images, icons are available
2. **Visual diff testing** - Screenshot comparison for theme changes
3. **Settings Panel audit** - Review which settings are missing or unclear

### What to Stop Doing

1. **Assuming CSS-only solutions** - Some features need external assets
2. **Bare labels for complex options** - Add descriptions where helpful

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use Google Fonts | Quick fix, widely cached, includes Inter for modern theme |
| Theme cards over segmented control | Better discoverability of what themes do |
| Number control pattern | Cleaner than slider for small integer ranges |
| CardBackDisplay enum | More expressive than multiple booleans |

---

## Metrics

| Metric | Value |
|--------|-------|
| New settings | 2 |
| Bugs fixed | 1 (font loading) |
| Files modified | 10 |
| New files | 0 |
| Tests added | 0 |
| Build size change | +0.3 KB (CSS) |

---

## Process Improvements Proposed

1. **Asset Audit** - Before release, verify all referenced assets load correctly
2. **Theme Preview** - Add live preview in Settings Panel showing theme effect
3. **Font Subset** - Consider subsetting Google Fonts to reduce payload

---

## Related Documentation

- [v0.4.1 Devlog](../../devlogs/v0.4.1/README.md)
