# v0.12.0 Retrospective

## Overview

| Metric | Value |
|--------|-------|
| **Version** | v0.12.0 |
| **Theme** | UI Polish & Statistics |
| **Features** | Statistics BarChart, Memory Settings |
| **Bug Fixes** | 12 |
| **UI Improvements** | 10 |

---

## What Went Well

### 1. Comprehensive UI Polish Session

A focused bug-fixing session tackled 12+ issues efficiently:
- Dark mode fixes across multiple components
- Responsive scaling for card elements
- iPhone-specific platform fixes
- All issues identified and resolved in single session

### 2. Statistics BarChart Component

The new BarChart component provides clean distribution visualisation:
- Horizontal bars with labels and values
- Configurable maximum bars with "Other" aggregation
- Integrates seamlessly with existing StatisticsBar

### 3. Memory Game Settings

Created dedicated settings component for Memory mechanic:
- Card count selection
- Difficulty options
- Clean integration with mechanic system

### 4. Dynamic Collection Discovery

Removed hardcoded collection sources:
- Collections now discovered via REPPL/MyPlausibleMe
- Cleaner architecture without static data
- Better separation of concerns

### 5. Inline SVG Pattern Established

Successfully converted app logo to inline SVG:
- Enables `currentColor` inheritance
- Works correctly in both light and dark modes
- Pattern documented for future SVG usage

---

## What Could Improve

### 1. CSS Variable Naming Inconsistency

**Problem:** Components used non-existent variable `--colour-text-primary` instead of `--colour-text`.

**Root Cause:** No single source of truth for CSS variable names; different patterns emerged over time.

**Action:**
- Document all CSS variables in a single reference file
- Use IDE autocomplete or a CSS variables linter
- Audit existing components for incorrect variable usage

### 2. Dark Mode Testing Gaps

**Problem:** Multiple components showed black text on black background in dark mode.

**Root Cause:** CSS Modules require explicit dark mode selectors for each element; parent selectors don't cascade to child classes.

**Action:**
- Test every component in both light and dark modes before commit
- Add explicit dark mode overrides for all text elements
- Consider using CSS custom properties that automatically adapt to theme

### 3. SVG Import vs Inline Confusion

**Problem:** App logo SVG wouldn't show when imported as URL and used in `<img>` tag.

**Root Cause:** `<img>` tags can't inherit CSS `currentColor` from parent elements. The SVG used `fill="currentColor"` which rendered as black (default) instead of the expected colour.

**Action:**
- Use inline SVG components when `currentColor` inheritance is needed
- Document when to use `<img src={svg}>` vs inline `<svg>` components
- Test SVG rendering in both light and dark modes

### 4. z-index Layer Conflicts

**Problem:** Game completion modal was hidden behind stats bar on iPhone.

**Root Cause:** No documented z-index hierarchy; layers added ad-hoc.

**Action:**
- Document z-index values for all overlay components
- Use CSS variables for z-index layers
- Test overlay stacking on mobile devices

---

## Lessons Learned

### Technical Lessons

1. **SVG Import Methods Matter**
   - `<img src={svgUrl}>` cannot inherit `currentColor` - renders as black
   - Inline `<svg>` components can use `fill="currentColor"` and inherit from CSS
   - Inline SVGs require explicit `width` and `height` when parent uses `width: auto`
   - Choose import method based on whether dynamic colour is needed

2. **CSS Modules Dark Mode Gotchas**
   - Parent dark mode selectors (e.g., `[data-theme="dark"] .parent`) don't cascade to child class names
   - Each CSS Module class that needs dark mode styling requires its own explicit selector
   - Use `[data-theme="dark"] .className, [data-colour-scheme="dark"] .className` pattern
   - Hardcode colours in dark mode overrides - CSS variables may not be reliable

3. **Early Keyboard Interception**
   - Browser shortcuts like Cmd-R fire before React event handlers
   - Use `window.addEventListener("keydown", handler, true)` (capture phase) in entry file
   - Must run before React mounts to intercept browser defaults
   - Use custom events (`window.dispatchEvent(new CustomEvent(...))`) to communicate with React

4. **z-index Layer Management**
   - Document z-index values for overlapping components
   - Use CSS variables for z-index layers when possible
   - Game overlays, modals, and status bars need explicit ordering
   - Test on mobile where screen real estate is limited

5. **Responsive CSS with Custom Properties**
   - Use `--card-border-width-scale` pattern for size-relative values
   - `calc(var(--base-value) * var(--scale))` enables proportional scaling
   - Define scale values per size variant: small=0.5, medium=1, large=1.5
   - Works for border-radius, border-width, padding, font-size

### Process Lessons

1. **Dark Mode Testing is Non-Negotiable**
   - Every UI change must be tested in both modes
   - CSS variable typos fail silently
   - Manual testing catches what linters miss

2. **Mobile Testing Reveals Hidden Issues**
   - z-index conflicts only visible on small screens
   - Touch targets need explicit sizing
   - Platform-specific CSS sometimes needed

3. **Iterative Polish Sessions Work**
   - Focused bug-fixing sessions are highly productive
   - 12+ fixes in one session demonstrates efficiency
   - Grouping related issues helps find patterns

---

## Decisions Made

### Architecture Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Inline SVG for app logo | Enable currentColor inheritance | Works in all themes |
| CSS variable scaling | Proportional sizing for card elements | Cleaner responsive design |
| Early keyboard interception | Capture Cmd-R before browser | Smooth refresh flow |
| Remove hardcoded sources | Dynamic discovery is cleaner | Better architecture |

### Process Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Document CSS variables | Prevent naming inconsistencies | Future reference file |
| Dark mode testing requirement | Prevent visibility issues | Better QA process |
| z-index documentation | Prevent layer conflicts | Clearer stacking context |

---

## Metrics

### Session 2 Fixes (Detailed)

| Fix | Category | Complexity |
|-----|----------|------------|
| Cmd-R soft refresh interception | UX | Medium |
| Dark mode text (CollectionToast) | Bug | Low |
| Dark mode text (CollectionPicker) | Bug | Low |
| App logo inline SVG conversion | Bug | Medium |
| Card border width scaling | Enhancement | Low |
| Rank badge size scaling | Enhancement | Medium |
| iPhone large cards disabled | Platform | Low |
| Game overlay z-index | Bug | Low |
| Settings footer repositioned | UX | Low |
| Reset button removed | UX | Low |
| Hardcoded sources removed | Architecture | Medium |
| Drag handle during flip | UX | Low |
| Background image zoom | Visual | Low |
| YouTube thumbnail in compact mode | Bug | Medium |

### Code Quality

| Metric | Value |
|--------|-------|
| TypeScript errors | 0 |
| ESLint warnings | 0 |
| Files changed | 50+ |
| New components | 3 |

---

## Action Items

### Completed (This Milestone)

- [x] Cmd-R soft refresh interception
- [x] Dark mode text fixes (CollectionToast, CollectionPicker)
- [x] App logo inline SVG conversion
- [x] Card border width scaling
- [x] Rank badge size scaling
- [x] iPhone large cards disabled
- [x] Game overlay z-index fix
- [x] Settings footer repositioned
- [x] Reset button removed
- [x] Hardcoded sources removed
- [x] Drag handle visibility during flip
- [x] Background image zoom fix
- [x] YouTube thumbnail in compact mode
- [x] Statistics BarChart component
- [x] Memory game settings component

### Process Improvements

- [ ] Document CSS variables in reference file
- [ ] Create dark mode testing checklist
- [ ] Document z-index layer hierarchy
- [ ] Add inline SVG vs img guidance to style guide

---

## Key Takeaways

1. **Dark mode requires explicit testing**: CSS Modules don't cascade dark mode styles - each class needs explicit selectors. Test both modes before committing.

2. **SVG rendering context matters**: `<img>` tags cannot inherit CSS colours. When using `currentColor`, inline SVG components are required.

3. **CSS variable consistency is critical**: Using non-existent variable names fails silently. Document variables and audit usage regularly.

4. **Mobile-first catches issues early**: Testing on iPhone revealed z-index conflicts and layout issues that weren't visible on desktop.

5. **Iterative polish sessions work**: Session 2's focused bug-fixing approach was highly productive - 14 fixes in one session.

---

## Related Documentation

- [v0.12.0 Milestone](../../roadmap/milestones/v0.12.0.md)
- [v0.12.0 Devlog](../devlogs/v0.12.0/README.md)
- [v0.11.5 Retrospective](../v0.11.5/README.md)
