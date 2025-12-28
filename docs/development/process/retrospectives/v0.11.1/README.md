# v0.11.1 Retrospective

## Overview

**Version**: v0.11.1 - UX Polish, Video Support & Documentation
**Date**: 28 December 2025
**Theme**: Settings redesign, YouTube integration, navigation improvements, and user documentation

---

## What Went Well

### 1. Settings Panel Redesign (F-072)

The complete settings panel overhaul significantly improved UX:
- Reorganised from 5 tabs to 4 clear categories (Quick, System, Appearance, Data)
- Settings search with fuzzy matching enables quick access
- Quick Settings tab provides one-click access to common actions
- Visual hierarchy improved with consistent spacing and grouping

### 2. YouTube Video Support (F-069)

YouTube integration was cleaner than expected:
- Privacy-conscious design: thumbnails only, no auto-loading embeds
- Seamless integration into existing ImageGallery component
- No schema changes required - works with existing `videos` array
- YouTubeEmbed component is self-contained and reusable

### 3. Navigation Hub Component

The NavigationHub provides a much-needed collection switching mechanism:
- Visual previews of available collections
- Consistent with overall design language
- CollectionPicker modal offers full collection details

### 4. Documentation Foundation

User documentation finally has proper structure:
- Diataxis framework adopted (tutorials, guides, explanation, reference)
- Getting started tutorial created
- Keyboard shortcuts reference
- Search and filters guide

### 5. MyPlausibleMe Integration

The strict URL format (F-071) simplifies data hosting:
- Clear pattern: `github.com/{user}/MyPlausibleMe/data/{folder}`
- Auto-discovery of collections
- Works perfectly with the retro-adverts collection created today

---

## What Could Improve

### 1. Parallel Development Context

Working on itemdeck and MyPlausibleMe simultaneously in one session created context complexity.

**Action**: Consider separate sessions for different repositories.

### 2. PII in Git History

A significant incident occurred during MyPlausibleMe commits where local git config leaked PII (username, email, machine name). Required force push and history rewrite.

**Action**:
- Always verify `git config user.name` and `git config user.email` before first commit in a repo
- Run PII scan before every commit, not just periodically

### 3. Feature Scope Creep

Several unplanned components emerged (CacheConsentDialog, SourcesOverlay, ViewPopover) that weren't in original specs.

**Action**: Accept that UX improvements often require supporting components; factor this into estimates.

### 4. Documentation Audit Drift

The roadmap README became out of sync with actual feature completion status.

**Action**: Update roadmap README immediately when moving features between folders.

---

## Lessons Learned

### Technical Lessons

1. **YouTube Embed Privacy**
   - Always use `youtube-nocookie.com` domain
   - Defer iframe loading until explicit user interaction
   - Thumbnails via `img.youtube.com/vi/{id}/hqdefault.jpg`

2. **Settings Architecture**
   - Tabbed interface with search is better than monolithic panel
   - Quick Settings for power users, detailed tabs for full control
   - Search should filter across all tabs, not just current

3. **CSS Custom Properties**
   - Theme variables for destructive actions improve consistency
   - `--colour-destructive-*` pattern works well

4. **Component Composition**
   - NavigationHub + CollectionPicker pattern is reusable
   - Overlay components should be self-contained with their own stores

### Process Lessons

1. **Verify Git Identity First**
   - Check git config before any commits in new/unfamiliar repos
   - PII leaks require history rewrites which are disruptive

2. **Update Documentation Indices**
   - When moving feature files, update README.md in same commit
   - Prevents status synchronisation drift

3. **Cross-Repository Work**
   - Syncing between repos (itemdeck public/data to MyPlausibleMe) works well
   - Keep .gitignore strict to prevent accidental commits

---

## Decisions Made

### Architecture Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 4-tab settings layout | Reduced cognitive load from 5 tabs | Cleaner organisation |
| Settings search across all tabs | Users shouldn't need to know which tab | Better discoverability |
| YouTubeEmbed as separate component | Isolation for privacy controls | Clean separation |
| NavigationHub with modal picker | Full-screen picker for details | Good mobile UX |

### Implementation Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Thumbnail-only YouTube | Privacy first, explicit consent | User trust |
| Strict MyPlausibleMe URL format | Reduce configuration errors | Simpler setup |
| Diataxis for docs | Industry standard | Scalable structure |

---

## Metrics

### Features

| Metric | Value |
|--------|-------|
| Features planned | 7 |
| Features completed | 6 |
| Features in progress | 1 (F-073) |
| Completion rate | 86% |

### Code

| Metric | Value |
|--------|-------|
| Files changed | 80 |
| Lines added | ~9,222 |
| Lines removed | ~767 |
| Net change | +8,455 lines |
| New components | 9 |

### New Components

1. YouTubeEmbed
2. CacheConsentDialog
3. CollectionPicker
4. NavigationHub
5. SourcesOverlay
6. ViewPopover
7. AddMyPlausibleMeForm
8. AppearanceSettingsTabs
9. SettingsSearch

### Quality

| Metric | Value |
|--------|-------|
| TypeScript errors | 0 |
| ESLint warnings | 0 |
| Documentation audit score | 82/100 |

---

## Action Items

### Immediate (Before Push)

- [x] Fix roadmap README status synchronisation
- [x] Create retrospective
- [x] Create devlog
- [ ] Complete F-073 (User Documentation Suite)

### Near Term (v0.12.0)

- [ ] Implement F-037 (Card Sorting Expanded)
- [ ] Implement F-067 (Statistics Dashboard)
- [ ] Add settings export functionality (F-081, F-082)

### Long Term

- [ ] Automated documentation status verification
- [ ] Cross-browser testing before release
- [ ] Performance profiling for video-heavy collections

---

## Related Documentation

- [v0.11.1 Milestone](../../roadmap/milestones/v0.11.1.md)
- [v0.11.1 Devlog](../devlogs/v0.11.1/README.md)
- [R-010: Settings UX Patterns](../../research/R-010-settings-ux-patterns.md)
- [v0.11.0 Retrospective](../v0.11.0/README.md)
