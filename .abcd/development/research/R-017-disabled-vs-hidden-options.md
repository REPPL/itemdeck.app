# R-017: Disabled vs Hidden Options UX Pattern

## Executive Summary

When options become unavailable due to user selections or context, should they be shown as disabled or hidden entirely? This research analyses the trade-offs and provides guidance for Itemdeck's ViewPopover and similar UI components.

## Problem Statement

The ViewPopover currently shows disabled options with reduced opacity when they're unavailable (e.g., Sort is disabled in Fit view, Group By is disabled in Grid view). An alternative approach would be to hide unavailable options entirely.

**Key question:** Which pattern provides better UX - disabled visibility or hidden options?

## Landscape Overview

### Industry Patterns

| Application | Pattern | Context |
|-------------|---------|---------|
| **macOS Finder** | Disabled | Menu items greyed out when unavailable |
| **VS Code** | Disabled | Context menu shows all options, disables invalid ones |
| **Figma** | Hidden | Right-click menus show only applicable options |
| **Google Docs** | Disabled | Format menu shows greyed options for empty selection |
| **Notion** | Hidden | Block menus show only compatible options |
| **Adobe Creative Suite** | Disabled | All tools visible, disabled when not applicable |

### Academic Research

1. **Nielsen Norman Group (2021)**: "Disabled controls are acceptable when they inform users about potential actions and provide a path to enabling them."

2. **Baymard Institute (2022)**: "Hidden options reduce cognitive load but can cause users to wonder why certain features 'disappeared'."

3. **Microsoft Fluent Design Guidelines**: "Prefer disabled over hidden when the option is part of a predictable set that users expect to see."

## Options Evaluated

### Option A: Always Disabled (Current Implementation)

**Description:** Show all options at all times; grey out unavailable ones.

| Aspect | Assessment |
|--------|------------|
| **Discoverability** | ✅ High - users always see full capability |
| **Learnability** | ✅ High - consistent mental model |
| **Cognitive load** | ⚠️ Medium - more items to scan |
| **Visual noise** | ⚠️ Medium - disabled items add clutter |
| **Predictability** | ✅ High - UI structure never changes |
| **Accessibility** | ✅ High - disabled state conveyed to screen readers |

**Pros:**
- Users learn the full feature set
- No "where did that option go?" confusion
- Predictable UI structure aids muscle memory
- Clear feedback: "this exists but isn't available now"

**Cons:**
- Visual clutter with many disabled options
- Users may wonder "why can't I use this?"
- Takes up screen space

### Option B: Always Hidden

**Description:** Remove options that are currently unavailable.

| Aspect | Assessment |
|--------|------------|
| **Discoverability** | ❌ Low - users don't see hidden features |
| **Learnability** | ⚠️ Medium - harder to build mental model |
| **Cognitive load** | ✅ Low - fewer items to process |
| **Visual noise** | ✅ Low - clean, minimal interface |
| **Predictability** | ❌ Low - UI changes based on context |
| **Accessibility** | ✅ High - only actionable items presented |

**Pros:**
- Clean, focused interface
- Only shows what's actionable
- Reduces decision paralysis

**Cons:**
- Users may not discover features
- "Why isn't X available?" - no visual hint it exists
- Context-dependent UI is harder to learn
- Can feel inconsistent

### Option C: Hybrid Approach (Recommended)

**Description:** Contextually choose based on predictability and frequency.

**Rules:**
1. **Stable sets → Disabled**: Options that are always part of the same group
2. **Variable sets → Hidden**: Options that depend on data availability
3. **Rare unavailability → Disabled**: Usually available, occasionally not
4. **Frequent unavailability → Hidden**: Often not applicable

**For ViewPopover specifically:**

| Section | Recommendation | Rationale |
|---------|----------------|-----------|
| **View modes** | Always visible | Fixed set (Grid/List/Compact/Fit) |
| **Sort options** | Disabled when unavailable | Fixed set, users expect to see all |
| **Group By options** | Disabled when unavailable | Fixed set based on view mode |
| **Group By values** | Hidden if no data | Variable based on collection data |

## Detailed Analysis

### When to Use Disabled

1. **Fixed option sets** - The options are predetermined and don't change
2. **Infrequent unavailability** - Options are usually available
3. **Learning contexts** - Users need to discover the full feature set
4. **Parallel choices** - Options form a cohesive group (e.g., radio buttons)
5. **Explanation available** - Tooltip can explain why disabled

### When to Use Hidden

1. **Data-dependent options** - Options only exist when data supports them
2. **Context-specific actions** - Actions only make sense in certain contexts
3. **Long option lists** - Many potentially unavailable items
4. **Expert interfaces** - Users already know the feature set
5. **No reasonable path to enable** - User can't change what enables it

### Accessibility Considerations

**Disabled options MUST:**
- Use `aria-disabled="true"` (not just visual styling)
- Remain focusable for screen reader users
- Provide explanation via `aria-describedby` or tooltip
- Have sufficient contrast (WCAG AA: 4.5:1 for text)

**Hidden options SHOULD:**
- Not break tab order expectations
- Not cause layout shift when revealed
- Be documented somewhere users can discover them

## Recommendation for Itemdeck

### ViewPopover (F-037)

**Use disabled pattern** for all three columns:

```
┌─────────────────────────────────────────────────────┐
│ View Mode     │ Sort           │ Group By           │
├───────────────┼────────────────┼────────────────────┤
│ Grid          │ Shuffle        │ None               │
│ List      ✓   │ By Rank    ✓   │ Platform           │
│ Compact       │ By Year        │ Year           ✓   │
│ Fit  (dim)    │ By Title       │ Decade   (dim)     │
│               │        (dim)   │ Genre    (dim)     │
└───────────────┴────────────────┴────────────────────┘

(dim) = disabled option, shown with reduced opacity
```

**Rationale:**
- All three are fixed option sets
- Users benefit from seeing full capability
- Consistent with current implementation
- Matches macOS/Windows design patterns

### Invalid Combinations

The bigger issue in F-037 is **invalid option combinations**, not visibility.

**Example:** List | By Rank | Year

This combination is ambiguous:
- Does "By Rank" mean sort within groups?
- Does "Year" as group override "By Rank" sort?

**Solution approaches:**

1. **Mutual exclusion**: Selecting Group By clears/changes Sort
2. **Dependent disabling**: Some Sort options disabled when grouped
3. **Clear hierarchy**: Sort always means "within group"
4. **Compound UI**: "Sort by: [Rank] within groups of: [Year]"

**Recommendation:** Implement clear hierarchy (option 3):
- Group By creates visual sections
- Sort applies within each section
- UI label clarifies: "Sort within groups" when grouped

### Tooltip Guidance

When options are disabled, provide tooltips explaining why:

| Option | Disabled When | Tooltip |
|--------|---------------|---------|
| Sort (all) | Fit view | "Sort unavailable in Fit view (shows all cards)" |
| Group By (all) | Grid/Fit view | "Grouping available in List and Compact views" |

## Implementation Guidance

### CSS for Disabled State

```css
.optionDisabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none; /* Prevent click */
}

/* Ensure sufficient contrast for accessibility */
.optionDisabled .optionLabel {
  color: var(--colour-text-secondary);
}
```

### React Pattern

```typescript
<button
  type="button"
  className={getOptionClass(isActive, !isEnabled)}
  onClick={() => { if (isEnabled) handleChange(value); }}
  aria-disabled={!isEnabled}
  aria-describedby={!isEnabled ? `${value}-disabled-reason` : undefined}
  disabled={!isEnabled}
>
  {label}
</button>

{!isEnabled && (
  <span id={`${value}-disabled-reason`} className="sr-only">
    {disabledReason}
  </span>
)}
```

## Conclusion

**For Itemdeck:** Continue using the **disabled pattern** for ViewPopover options. The current implementation is correct UX.

**Priority fix:** The Sort/Group By interaction bug (F-037) where selecting both produces unexpected results. This is a logic issue, not a visibility issue.

## References

1. Nielsen Norman Group. "Disabled Controls." nngroup.com, 2021.
2. Baymard Institute. "Form Usability: Hidden vs Disabled Fields." baymard.com, 2022.
3. Microsoft. "Fluent Design: Disabled States." docs.microsoft.com.
4. Apple Human Interface Guidelines. "Controls: States." developer.apple.com.
5. WCAG 2.2. "Success Criterion 1.4.3: Contrast (Minimum)." w3.org.

---

## Related Documentation

- [F-037: Card Sorting](../roadmap/features/planned/F-037-card-sorting.md)
- [v1.0.0 Milestone](../roadmap/milestones/v1.0.0.md)
- [ViewPopover Component](../../src/components/ViewPopover/ViewPopover.tsx)

---

**Status**: Complete
