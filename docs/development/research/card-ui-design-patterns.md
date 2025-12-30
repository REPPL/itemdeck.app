# State of the Art: Card UI Design Patterns

> **Note**: For general card UI design exploration, see [Card UI Design Patterns Exploration](../../exploration/card-ui-design-patterns.md). This document focuses on state-of-the-art patterns (2024-2025) with specific implementation recommendations for itemdeck.app.

## Executive Summary

This research document analyses current best practices for card-based UI design patterns, covering visual hierarchy, depth and elevation, glassmorphism, progressive disclosure, drag-and-drop interactions, badges, responsive typography, and touch gestures. These findings inform itemdeck.app's card component design decisions.

**Key Recommendations:**

1. **Elevation**: Use Material Design 3's tonal elevation by default; reserve shadow elevation for elements requiring strong visual separation
2. **Visual Hierarchy**: Apply progressive disclosure to show essential info first, with details on demand
3. **Glassmorphism**: Use sparingly with sufficient blur and high contrast text; prioritise accessibility over aesthetics
4. **Badges**: Use semantic colours with pill-shaped containers; position at top-right corner of cards
5. **Drag-and-Drop**: Provide visible drag handles, keyboard alternatives, and ghost previews for reordering
6. **Typography**: Implement fluid type scales with CSS `clamp()` for responsive text sizing
7. **Touch Gestures**: Support swipe actions with visual affordances and timing delays for grab detection

---

## Card UI Fundamentals

### What is Card UI?

A card component is a versatile UI design pattern that groups related information into a visually distinct, clickable container. Cards typically contain an image, title, description, call-to-action, and supplementary elements such as badges, icons, or metadata.

**Sources:** [NN/g Card Component Definition](https://www.nngroup.com/articles/cards-component/), [Eleken Card UI Examples](https://www.eleken.co/blog-posts/card-ui-examples-and-best-practices-for-product-owners)

### When to Use Cards

Cards are particularly effective for:

- **Browsing over searching**: When users explore content rather than look for specific items
- **Heterogeneous collections**: Displaying varied content types on the same page
- **Dashboard applications**: Aggregating multiple data types
- **Responsive layouts**: Cards resize smoothly across viewport sizes

**Source:** [ui-patterns.com Cards Pattern](https://ui-patterns.com/patterns/cards)

### Best Practices

| Practice | Rationale |
|----------|-----------|
| Use sufficient negative space | Avoids visual clutter; aids scanability |
| Keep cards simple | Don't undercut structural simplicity with complexity |
| Make entire card clickable | Fitt's Law - larger target areas reduce errors |
| Add visual separation | Borders, shadows, or colour distinguish cards from background |
| Maintain consistent spacing | Balanced density and purposeful interactions |

**Source:** [UXPin Card Design Guide](https://www.uxpin.com/studio/blog/card-design-ui/)

---

## Depth and Elevation

### Material Design 3 Elevation

Material Design 3 (2024-2025) distinguishes between two types of elevation:

| Type | Description | Use Case |
|------|-------------|----------|
| **Tonal Elevation** | Adjusts surface colour by blending with a tint; no shadows | Default for most components (Surface, Card) |
| **Shadow Elevation** | Traditional drop shadows for depth perception | Elements needing strong focus or separation |

**Key Insight:** "Tonal = depth through colour. Shadow = depth through light. Both are valid tools — the key is knowing when to use each."

**Source:** [Material Design 3 Elevation](https://m3.material.io/styles/elevation/applying-elevation)

### Elevation Levels

Most design systems define 5-6 elevation levels:

| Level | Use Case | Visual Treatment |
|-------|----------|-----------------|
| 0 | Base layout, flat content | No elevation |
| 1 | Cards, list items | Subtle tonal shift or soft shadow |
| 2 | Dropdowns, popovers | Medium tonal shift |
| 3 | Modal overlays | Strong separation |
| 4-5 | Dialogs, tooltips | Maximum prominence |

**Source:** [Design Systems Surf - Elevation Patterns](https://designsystems.surf/articles/depth-with-purpose-how-elevation-adds-realism-and-hierarchy)

### Card Types in Material 3

Material Design 3 offers three card variants:

1. **Elevated Card**: Uses shadow for depth (traditional approach)
2. **Filled Card**: Solid background colour, no shadow
3. **Outlined Card**: Border defines container, no fill or shadow

**Source:** [Material Design 3 Cards Specs](https://m3.material.io/components/cards/specs)

### Accessibility Considerations

> "Relying on shadows alone to communicate hierarchy can create barriers, especially in low-contrast environments or for users with visual impairments."

**Recommendation:** If two layers have different meanings, they should look meaningfully different—not just by a soft shadow blur. Combine elevation with colour, borders, or other visual cues.

---

## Glassmorphism

### Definition

Glassmorphism is a visual design trend featuring translucent interface components that mimic frosted glass. Core characteristics include:

- Semi-transparent surfaces
- Soft background blur (CSS `backdrop-filter: blur()`)
- Layered depth
- Subtle borders

**Source:** [NN/g Glassmorphism Definition](https://www.nngroup.com/articles/glassmorphism/)

### 2025 Developments: Apple's Liquid Glass

In June 2025, Apple announced "Liquid Glass" — an evolution of glassmorphism with:

- Real-time depth perception
- Motion-responsive behaviour
- Adaptive contrast across platforms
- Light diffusion and reflection effects

**Source:** [EverydayUX - Apple Liquid Glass](https://www.everydayux.net/glassmorphism-apple-liquid-glass-interface-design/)

### Implementation Guidelines

| Guideline | Rationale |
|-----------|-----------|
| Use more blur, not less | Busy backgrounds reduce readability; strong blur improves focus |
| Ensure WCAG contrast | Semi-transparent elements may fail colour contrast requirements |
| Limit to accent elements | Don't apply to entire interfaces; use for hero sections, feature cards |
| Test with varied backgrounds | Glass effects behave differently over photos, gradients, solid colours |

**CSS Implementation:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

**Sources:** [Ramotion Glassmorphism Guide](https://www.ramotion.com/blog/what-is-glassmorphism/), [Interaction Design Foundation](https://www.interaction-design.org/literature/topics/glassmorphism)

### Glassmorphism vs. Material Design

| Aspect | Glassmorphism | Material Design |
|--------|---------------|-----------------|
| Clarity | Can compromise readability | Clear, simple layouts |
| Contrast | Requires careful management | Built-in high contrast |
| Consistency | Variable across contexts | Consistent cross-platform |
| Accessibility | Challenging | Strong accessibility defaults |

**Recommendation for itemdeck:** Use glassmorphism sparingly for card overlays and modals where background context adds value. Ensure fallbacks for reduced motion and high contrast modes.

---

## Visual Hierarchy Techniques

### Progressive Disclosure

Progressive disclosure reduces cognitive load by revealing information as needed rather than all at once.

**Key Principles:**

1. Show essential information first
2. Reveal details on user interaction
3. Use clear visual cues (icons, arrows) to indicate more content
4. Limit to one layer of additional information per interaction

**Source:** [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)

### UI Patterns for Progressive Disclosure

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Accordions** | Expandable sections within cards | FAQ sections, settings panels |
| **Modals** | Full detail views on demand | Card info button, edit forms |
| **Dropdowns** | Revealing options | Filter selections, action menus |
| **Tabs** | Organising related content | Card back sections |
| **Hover/Focus** | Quick preview information | Tooltips, metadata |

**Source:** [LogRocket Progressive Disclosure Guide](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)

### Progressive vs. Staged Disclosure

| Aspect | Progressive Disclosure | Staged Disclosure |
|--------|----------------------|-------------------|
| Initial view | Most important features | First step of process |
| Navigation | Hierarchical | Linear (wizard-style) |
| Information priority | By importance | By sequence |
| Best for | Feature discovery | Multi-step workflows |

**Source:** [UX Database Newsletter](https://www.uxdatabase.io/newsletter-issue/04-staged-vs-progressive-disclosure)

### Application to Card UI

For itemdeck cards:

1. **Card Front**: Title, primary image, key badges (essential info)
2. **Card Back/Info**: Ratings, descriptions, metadata (secondary info)
3. **Modal/Expanded View**: Full details, edit form, related items (tertiary info)

This hierarchy aligns with the existing card flip mechanism.

---

## Card Stack and Wallet Metaphors

### Apple Wallet Design Pattern

The Apple Wallet card stack is a widely-recognised interaction pattern featuring:

- **Stacked presentation**: Cards overlap like a fanned deck
- **Tap to expand**: Selected card rises and expands
- **Drag to reorder**: Long-press enables repositioning
- **Gesture navigation**: Swipe to dismiss, scroll to browse

**Source:** [Apple Human Interface Guidelines - Wallet](https://developer.apple.com/design/human-interface-guidelines/wallet)

### Implementation Approaches

| Platform | Library/Approach |
|----------|-----------------|
| React/Web | Framer Motion with gesture handler |
| React Native | React Native Reanimated |
| iOS Native | SwiftUI animations |
| CSS Only | Transform + transition with state |

**Implementation Challenges:**
- Maintaining clickable areas as cards stack/unstack
- Coordinate changes during scroll animations
- Performance with many cards

**Sources:** [React Native Wallet Clone](https://staging.notjust.dev/projects/apple-wallet), [AppCoda SwiftUI Tutorial](https://www.appcoda.com/learnswiftui/swiftui-advanced-animations.html)

### Recommendations for itemdeck

The existing card stack view (F-032) should:

1. Use Framer Motion for orchestrated animations
2. Implement "lift and flip" keyframe for realistic feel
3. Provide visual feedback during drag operations
4. Support both mouse and touch interactions

---

## Drag and Drop Patterns

### Visual Feedback Requirements

| Feedback Type | Description | Timing |
|---------------|-------------|--------|
| Cursor change | Grab/grabbing cursor | On hover/drag |
| Ghost image | Semi-transparent clone follows cursor | During drag |
| Drop preview | Background items animate to show insertion point | ~100ms animation |
| Tilt effect | Subtle rotation on grabbed card | During drag (Trello-style) |

**Source:** [Smart Interface Design Patterns - Drag and Drop](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)

### Drag Handle Design

| Approach | When to Use |
|----------|-------------|
| Always visible handle | Lists, tables, explicit reordering contexts |
| Implicit (no handle) | Kanban boards, card-based layouts where drag is expected |
| Revealed on hover | Clean interfaces with discoverable drag |

**Common icon:** 6-dot or 12-dot grip pattern (Gmail-style)

**Source:** [Pencil & Paper - Drag and Drop UX](https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop)

### Accessibility Patterns

Four major patterns for accessible drag-and-drop:

1. **Keyboard Navigation**
   - Spacebar to pick up
   - Arrow keys to move
   - Spacebar to drop
   - Escape to cancel

2. **Menu-Based Alternative**
   - Drag handle becomes menu button
   - Menu offers "Move up", "Move down", "Move to..."

3. **Button-Based Reordering**
   - Up/down buttons adjacent to each item
   - Simpler than drag for some users

4. **"Move to" Bulk Action**
   - Select items, then use "Move to" button
   - Reduces precision requirements

**Source:** [Salesforce UX - Accessible Drag and Drop](https://medium.com/salesforce-ux/4-major-patterns-for-accessible-drag-and-drop-1d43f64ebf09)

### ARIA Implementation

```html
<div role="listbox" aria-label="Reorderable cards">
  <div role="option"
       aria-grabbed="false"
       aria-dropeffect="move"
       tabindex="0">
    <span class="sr-only">Press Spacebar to reorder</span>
    <!-- Card content -->
  </div>
</div>
```

**Source:** [Atlassian Design System - Drag and Drop](https://atlassian.design/components/pragmatic-drag-and-drop/design-guidelines/)

---

## Badge and Indicator Patterns

### Badge Types

| Type | Visual | Use Case |
|------|--------|----------|
| **Dot** | Small coloured circle | Status changes, unread notifications |
| **Numeric** | Number in container | Counts (messages, items) |
| **Text** | Label in container | Categories, status ("New", "Featured") |
| **Icon** | Icon in container | Type indicators, achievements |
| **Combination** | Icon + text/number | Detailed status information |

**Source:** [Mobbin Badge UI Design](https://mobbin.com/glossary/badge)

### Positioning

| Position | Use Case |
|----------|----------|
| Top-right corner | Notification counts, status dots |
| Inline with title | Category tags, metadata |
| Bottom-left | Type indicators |
| Overlapping edge | Call attention to updates |

Standard size: 16px container height minimum for readability.

**Source:** [SetProduct Badge Design](https://www.setproduct.com/blog/badge-ui-design)

### Colour Semantics

| Colour | Meaning | Example Use |
|--------|---------|-------------|
| Red | Error, urgent, destructive | Unread notifications requiring action |
| Amber/Orange | Warning, pending | Processing, needs attention |
| Green | Success, positive | Online status, completed |
| Blue | Information, new | New content, updates available |
| Grey | Neutral, inactive | Archived, disabled |

**Source:** [PatternFly Notification Badge](https://www.patternfly.org/components/notification-badge/design-guidelines/)

### Badges vs. Tags/Chips

| Element | Interactive? | Purpose |
|---------|-------------|---------|
| **Badge** | No | Status indicator, count |
| **Tag** | Yes (removable) | Categorisation, filtering |
| **Chip** | Yes (actionable) | Selection, input |
| **Pill** | Varies | Container shape for any above |

**Source:** [Smart Interface Design Patterns - Badges vs Pills](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/)

---

## Typography for Cards

### Fluid Type Scales

Modern responsive typography uses CSS `clamp()` for viewport-adaptive sizing without breakpoints:

```css
:root {
  --text-sm: clamp(0.875rem, 0.8rem + 0.25vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.35vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.5rem);
  --text-xl: clamp(1.5rem, 1.2rem + 1vw, 2.25rem);
}
```

**Source:** [Design Shack - Responsive Typography Guide](https://designshack.net/articles/typography/guide-to-responsive-typography-sizing-and-scales/)

### Container Queries for Card Typography

Container queries (CSS `@container`) allow card text to adapt based on card width rather than viewport:

```css
.card {
  container-type: inline-size;
}

@container (max-width: 200px) {
  .card-title {
    font-size: var(--text-sm);
  }
}

@container (min-width: 300px) {
  .card-title {
    font-size: var(--text-lg);
  }
}
```

**Source:** [UX Collective - Typography in Design Systems](https://uxdesign.cc/mastering-typography-in-design-systems-with-semantic-tokens-and-responsive-scaling-6ccd598d9f21)

### Mobile Type Scale Considerations

| Screen Size | Approach |
|-------------|----------|
| Mobile (< 480px) | Conservative variation; prioritise legibility |
| Tablet (480-1024px) | Moderate scaling |
| Desktop (> 1024px) | Dramatic variation for visual impact |

**Recommendation:** Use relative units (rem) for scalability; maintain minimum 16px base for body text.

**Source:** [WebUpon - Type Scale for Mobile](https://webupon.com/blog/type-scale-for-mobile/)

---

## Touch and Mobile Considerations

### Core Gestures for Cards

| Gesture | Action | Implementation |
|---------|--------|----------------|
| **Tap** | Select/flip card | Standard click handler |
| **Long Press** | Context menu, reorder mode | 500ms-2000ms hold detection |
| **Swipe Left/Right** | Delete, archive, reveal actions | Horizontal threshold crossing |
| **Swipe Up/Down** | Dismiss, expand | Vertical threshold crossing |
| **Pinch** | Zoom (for images) | Two-finger scale detection |
| **Drag** | Reorder | Requires timing delay to distinguish from scroll |

**Source:** [Material Design 3 Gestures](https://m3.material.io/foundations/interaction/gestures)

### Touch Target Sizing

| Element | Minimum Size |
|---------|-------------|
| Primary actions | 48x48px (iOS), 48dp (Android) |
| Drag handles | 44x44px minimum |
| Card buttons | Full card width for primary action |

> "Due to the fat-finger problem, ensure draggable objects have at least 1cm x 1cm of unused space for dragging."

**Source:** [Medium - Designing for Touch](https://medium.com/@rosalie24/designing-for-touch-mobile-ux-principles-that-matter-524e4323459b)

### Gesture Affordances

Visual cues that suggest available gestures:

| Affordance | Gesture Indicated |
|------------|-------------------|
| Horizontal lines | Swipe left/right |
| Grab handle dots | Draggable |
| Subtle animations | Interactive element |
| Edge peeking | Content extends beyond visible area |
| Arrows/chevrons | Direction of interaction |

**Source:** [Codebridge - Gestures in Mobile UX](https://www.codebridge.tech/articles/the-impact-of-gestures-on-mobile-user-experience)

### Haptic Feedback

For touch interfaces, haptic feedback enhances gesture interactions:

- Light tap on selection
- Medium impact on successful drop
- Error vibration on invalid action

**Recommendation:** Implement using Vibration API with user preference respect.

---

## Recommendations for itemdeck.app

### Immediate Priorities (v1.0.0)

| Area | Recommendation | Feature Reference |
|------|----------------|-------------------|
| **Elevation** | Adopt tonal elevation as default; use shadows for modals only | F-033 |
| **Badges** | Standardise on pill shape, semantic colours, top-right positioning | F-034 |
| **Drag-Drop** | Add keyboard alternative with Spacebar/Arrow controls | F-028 |
| **Typography** | Implement fluid type scale with `clamp()` | F-039 |
| **Touch** | Add 500ms delay for grab detection; distinguish from scroll | F-040 |

### Future Considerations (v1.5.0+)

| Area | Opportunity |
|------|-------------|
| **Glassmorphism** | Optional theme with glass-style overlays |
| **Container Queries** | Card-width-responsive typography |
| **Haptic Feedback** | PWA vibration for touch interactions |
| **Liquid Glass** | Investigate Apple's new design system for iOS integration |

### Accessibility Checklist

- [ ] All drag-and-drop has keyboard alternative
- [ ] Badges have sufficient colour contrast
- [ ] Touch targets minimum 44x44px
- [ ] Gestures have visual affordances
- [ ] Reduced motion preference respected
- [ ] Screen reader announcements for state changes

---

## References

### Card UI Fundamentals
- [NN/g Cards Component Definition](https://www.nngroup.com/articles/cards-component/)
- [UI Patterns - Cards](https://ui-patterns.com/patterns/cards)
- [Eleken - Card UI Examples](https://www.eleken.co/blog-posts/card-ui-examples-and-best-practices-for-product-owners)
- [UXPin - Card Design Guide](https://www.uxpin.com/studio/blog/card-design-ui/)
- [Mobbin - Card UI Design](https://mobbin.com/glossary/card)

### Elevation & Material Design
- [Material Design 3 - Elevation](https://m3.material.io/styles/elevation/applying-elevation)
- [Material Design 3 - Cards](https://m3.material.io/components/cards/specs)
- [Design Systems Surf - Elevation Patterns](https://designsystems.surf/articles/depth-with-purpose-how-elevation-adds-realism-and-hierarchy)

### Glassmorphism
- [NN/g - Glassmorphism Definition](https://www.nngroup.com/articles/glassmorphism/)
- [Ramotion - What is Glassmorphism](https://www.ramotion.com/blog/what-is-glassmorphism/)
- [EverydayUX - Apple Liquid Glass](https://www.everydayux.net/glassmorphism-apple-liquid-glass-interface-design/)
- [Interaction Design Foundation - Glassmorphism](https://www.interaction-design.org/literature/topics/glassmorphism)

### Progressive Disclosure
- [NN/g - Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [LogRocket - Progressive Disclosure Types](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)
- [UX Database - Progressive vs Staged Disclosure](https://www.uxdatabase.io/newsletter-issue/04-staged-vs-progressive-disclosure)

### Drag and Drop
- [Smart Interface Design Patterns - Drag and Drop](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)
- [Salesforce UX - Accessible Drag and Drop](https://medium.com/salesforce-ux/4-major-patterns-for-accessible-drag-and-drop-1d43f64ebf09)
- [Atlassian Design - Drag and Drop Guidelines](https://atlassian.design/components/pragmatic-drag-and-drop/design-guidelines/)
- [NN/g - Drag Drop Design](https://www.nngroup.com/articles/drag-drop/)

### Badges
- [Mobbin - Badge UI Design](https://mobbin.com/glossary/badge)
- [PatternFly - Notification Badge](https://www.patternfly.org/components/notification-badge/design-guidelines/)
- [SetProduct - Badge UI Design](https://www.setproduct.com/blog/badge-ui-design)
- [Smart Interface Design Patterns - Badges vs Pills](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/)

### Typography
- [Design Shack - Responsive Typography Guide](https://designshack.net/articles/typography/guide-to-responsive-typography-sizing-and-scales/)
- [UX Collective - Typography in Design Systems](https://uxdesign.cc/mastering-typography-in-design-systems-with-semantic-tokens-and-responsive-scaling-6ccd598d9f21)
- [WebUpon - Type Scale for Mobile](https://webupon.com/blog/type-scale-for-mobile/)
- [Clearleft - Fluid Type Scales](https://clearleft.com/thinking/designing-with-fluid-type-scales)

### Touch & Gestures
- [Material Design 3 - Gestures](https://m3.material.io/foundations/interaction/gestures)
- [LogRocket - Swipe Interactions](https://blog.logrocket.com/ux-design/accessible-swipe-contextual-action-triggers/)
- [NumberAnalytics - Long Press Gestures](https://www.numberanalytics.com/blog/ultimate-guide-long-press-gestures-interaction-design)
- [Codebridge - Gestures in Mobile UX](https://www.codebridge.tech/articles/the-impact-of-gestures-on-mobile-user-experience)

### Apple Wallet Pattern
- [Apple HIG - Wallet](https://developer.apple.com/design/human-interface-guidelines/wallet)
- [NotJust.dev - Apple Wallet Clone](https://staging.notjust.dev/projects/apple-wallet)
- [AppCoda - SwiftUI Wallet Animation](https://www.appcoda.com/learnswiftui/swiftui-advanced-animations.html)

---

## Related Documentation

- [ADR-029: Card Elevation Strategy](../decisions/adrs/ADR-029-card-elevation-strategy.md)
- [Card Layouts & Animations Research](./card-layouts-animations.md)
- [Card UI Design Patterns Exploration](../../exploration/card-ui-design-patterns.md) - General design exploration
- [F-028: Card Drag and Drop](../roadmap/features/completed/F-028-card-drag-and-drop.md)
- [F-032: Card Stack View](../roadmap/features/completed/F-032-card-stack-view.md)
- [F-033: Card Elevation System](../roadmap/features/completed/F-033-card-elevation-system.md)
- [F-034: Card Badges](../roadmap/features/completed/F-034-card-badges.md)
- [F-039: Responsive Typography](../roadmap/features/completed/F-039-responsive-typography.md)
- [F-040: Touch Gestures](../roadmap/features/completed/F-040-touch-gestures.md)
- [F-041: Card Animation Polish](../roadmap/features/planned/F-041-card-animations-polish.md)
- [F-119: Drag-Drop Keyboard Accessibility](../roadmap/features/planned/F-119-drag-drop-keyboard-accessibility.md)

---

**Status**: Complete
