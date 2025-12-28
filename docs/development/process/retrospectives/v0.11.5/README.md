# v0.11.5 Retrospective

## Overview

**Version**: v0.11.5 - UI Refinements & Documentation Sync
**Date**: 28 December 2025
**Theme**: Field mapping flexibility, visual polish, and comprehensive documentation audit

---

## What Went Well

### 1. Top Badge Field Selector

Replacing the binary "Show Rank Badge" toggle with a flexible field selector was a significant UX improvement:
- Users can now display any suitable field in the top badge
- "None" option provides clear way to hide the badge
- Field discovery from entity data enables custom fields
- Backwards compatible via derived `showRankBadge`

### 2. Collection Toast Redesign

The modal-style toast with backdrop is impossible to miss:
- Clear visual feedback when switching collections
- Blur effect creates focus on the notification
- "Click to dismiss" is intuitive
- Professional appearance

### 3. Comprehensive Documentation Audit

The documentation synchronisation effort was thorough:
- Identified all missing index entries (3 ADRs, 2 research docs)
- Fixed all broken cross-reference links
- Updated feature checkboxes to reflect reality
- Created future planning (F-091, v0.12.0 additions)

### 4. Quick Bug Fixes

Both bugs were identified and fixed efficiently:
- App logo fallback chain bug was subtle but quickly diagnosed
- High contrast mode text visibility was a straightforward CSS fix

---

## What Could Improve

### 1. Documentation Index Maintenance

**Problem:** Multiple documentation indices were out of sync. Files existed but weren't listed in README tables.

**Root Cause:** Adding new files (ADRs, research docs) without updating indices.

**Action:**
- Always update index files in the same commit as new documentation
- Consider automated verification in pre-commit hook
- Add "/sync-docs" to regular workflow

### 2. Feature Checkbox Staleness

**Problem:** Completed features still had unchecked task boxes.

**Root Cause:** Moving feature files to `completed/` folder without updating internal checkboxes.

**Action:**
- When moving to `completed/`, verify all checkboxes are ticked
- Consider success criteria as the true completion indicator, not internal tasks

### 3. Fallback Chain Complexity

**Problem:** The CardBack logo fallback chain had edge cases.

**Root Cause:** Multiple levels of fallback (`undefined` vs `null` vs missing) created ambiguity.

**Action:**
- Prefer explicit values over fallback chains where possible
- Document fallback behaviour in component comments
- Test edge cases (empty string, null, undefined)

### 4. Settings Organisation Drift

**Problem:** Edit Mode was in wrong settings tab (Appearance vs Developer).

**Root Cause:** Feature creep during earlier development put it in user-facing settings.

**Action:**
- Review settings placement during feature implementation
- Developer features belong in Developer tab only
- User research on settings discoverability needed

---

## Lessons Learned

### Technical Lessons

1. **Derived State Pattern**
   - `showRankBadge = topBadgeField !== 'none'` is cleaner than maintaining two separate values
   - Reduces state synchronisation bugs
   - Makes intent clear

2. **Modal vs Toast Patterns**
   - Toasts for quick, dismissible notifications
   - Modals with backdrop for important state changes
   - Blur effect adds focus without being intrusive

3. **Fallback Chain Best Practices**
   - Check for explicit values before entering fallback logic
   - Document the fallback order
   - Test with `undefined`, `null`, empty string, and valid values

4. **High Contrast Mode Testing**
   - Test all text elements in high contrast mode
   - Consider colour contrast ratios (WCAG AA requires 4.5:1)
   - Grey text on dark backgrounds is problematic

### Documentation Lessons

1. **Index Files Are Critical**
   - README files serve as navigation hubs
   - Missing entries make documentation undiscoverable
   - Treat index updates as mandatory, not optional

2. **Cross-Reference Validation**
   - Relative paths are fragile (`../../` vs `../../../`)
   - Use consistent patterns across all files
   - Consider path aliases or absolute references

3. **Checkbox Semantics**
   - Implementation tasks track work done
   - Success criteria track verification of outcomes
   - Both serve different purposes

4. **Documentation Audit Value**
   - `/verify-docs` finds issues humans miss
   - Run before every release
   - Fix issues immediately, don't defer

### Process Lessons

1. **Sync Docs Regularly**
   - Run `/sync-docs` after any significant changes
   - Drift accumulates quickly without regular checks
   - Easier to fix small amounts of drift

2. **PII Vigilance**
   - Run `/pii-scan` before commits
   - Personal paths and emails are easy to miss
   - Prevention is easier than history rewriting

---

## Decisions Made

### Architecture Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Derived `showRankBadge` | Reduce state, prevent sync issues | Cleaner implementation |
| Modal toast pattern | Ensure visibility of state changes | Better UX feedback |
| 100% placeholder opacity | Visibility during drag | Clearer drag feedback |

### Process Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix all audit issues before release | Prevent drift accumulation | Clean documentation |
| Add F-091 to v0.12.0 | Remove index.json requirement | Simplified collections |
| Selection count smart default | Better UX for random selection | 50% / min 8 rule |

---

## Metrics

### Features

| Metric | Value |
|--------|-------|
| UI improvements | 4 |
| Bug fixes | 2 |
| Documentation fixes | 9 files |
| New feature specs | 1 (F-091) |
| Completion rate | 100% |

### Documentation Audit

| Category | Before | After |
|----------|--------|-------|
| Missing ADR entries | 3 | 0 |
| Missing research entries | 2 | 0 |
| Broken links | 13 | 0 |
| Stale checkboxes | ~20 | 0 |
| Audit score | ~85 | 98 |

### Code Quality

| Metric | Value |
|--------|-------|
| TypeScript errors | 0 |
| ESLint warnings | 0 |
| Files changed | 18 |

---

## Action Items

### Completed (This Milestone)

- [x] Top Badge Field selector
- [x] Collection Toast redesign
- [x] Drag placeholder visibility
- [x] App logo display fix
- [x] High contrast mode fix
- [x] Settings panel cleanup
- [x] ADR index fixes
- [x] Research index fixes
- [x] Feature checkbox updates
- [x] v0.12.0 planning
- [x] F-091 feature spec

### Near Term (v0.12.0)

- [ ] F-091: Entity Auto-Discovery
- [ ] Bug: Card Back Logo display
- [ ] Bug: Drag Handle Overlay
- [ ] Enhancement: Cache Notification
- [ ] Enhancement: Selection Count Default

### Process Improvements

- [ ] Add index update reminder to new file workflow
- [ ] Run `/sync-docs` after every session
- [ ] Run `/verify-docs` before releases
- [ ] Consider automated documentation CI checks

---

## Key Takeaways

1. **Small refinements matter**: The top badge selector and toast redesign significantly improved UX without major code changes.

2. **Documentation debt compounds**: A few missing index entries became nine files needing updates. Regular maintenance prevents accumulation.

3. **Derived state simplifies**: Converting `showRankBadge` from stored to derived eliminated a class of bugs.

4. **Audit tools are essential**: `/verify-docs` found issues that manual review would miss.

5. **Planning ahead pays off**: Adding F-091 and bug fixes to v0.12.0 while context is fresh makes future work easier.

---

## Related Documentation

- [v0.11.5 Milestone](../../roadmap/milestones/v0.11.5.md)
- [v0.11.5 Devlog](../devlogs/v0.11.5/README.md)
- [v0.11.1 Retrospective](../v0.11.1/README.md)
- [v0.12.0 Milestone](../../roadmap/milestones/v0.12.0.md)
