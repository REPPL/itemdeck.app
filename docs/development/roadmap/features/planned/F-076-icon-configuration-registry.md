# F-076: Icon Configuration Registry

## Problem Statement

Itemdeck currently has icons scattered across the codebase:
- 17 centralised icons in `src/components/Icons/Icons.tsx`
- 40+ inline SVG icons in individual component files
- No way to customise or swap icon sets
- No RTL mirroring support for directional icons

This creates challenges for:
1. Theme customisation (users cannot change icon style)
2. RTL support (directional icons need to mirror)
3. Maintenance (finding icons requires searching multiple files)
4. Consistency (inline icons may have different properties)

## Design Approach

Implement a **JSON-based icon registry** with a universal `<Icon>` component:

1. **JSON definitions**: Store icon SVG data in categorised JSON files
2. **Universal component**: Single `<Icon name="close" />` component
3. **RTL support**: Automatic mirroring for directional icons
4. **Type safety**: Icon names are typed, preventing typos
5. **Theme support**: Icon sets can be swapped at runtime

### Directory Structure

```
src/
├── icons/
│   ├── index.ts                    # Public exports
│   ├── registry.ts                 # Icon lookup and rendering
│   ├── types.ts                    # TypeScript interfaces
│   ├── Icon.tsx                    # Universal Icon component
│   └── definitions/
│       ├── ui.json                 # Close, settings, info, warning
│       ├── navigation.json         # Chevrons, arrows
│       ├── actions.json            # Edit, delete, share, plus, check
│       └── media.json              # Image, expand, zoom, external-link
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/Icons/Icons.tsx` | Remove after migration |
| `src/components/SourceIcon/SourceIcon.tsx` | Migrate to registry |
| 35+ component files | Update imports to use `<Icon>` |

### Icon Migration Table

| Current Component | Category | RTL Mirror |
|-------------------|----------|------------|
| `CloseIcon` | ui | No |
| `SettingsIcon` | ui | No |
| `InfoIcon` | ui | No |
| `WarningIcon` | ui | No |
| `ChevronLeftIcon` | navigation | Yes |
| `ChevronRightIcon` | navigation | Yes |
| `ChevronUpIcon` | navigation | No |
| `ChevronDownIcon` | navigation | No |
| `EditIcon` | actions | No |
| `TrashIcon` | actions | No |
| `PlusIcon` | actions | No |
| `CheckIcon` | actions | No |
| `DragGripIcon` | actions | No |
| `ExternalLinkIcon` | media | Yes |
| `ImageIcon` | media | No |
| `ZoomIcon` | media | No |
| `ExpandIcon` | media | No |

## Implementation Tasks

### Phase 1: Infrastructure
- [ ] Create `src/icons/types.ts` with IconDefinition interface
- [ ] Create `src/icons/registry.ts` with icon lookup
- [ ] Create `src/icons/Icon.tsx` universal component
- [ ] Create `src/icons/index.ts` with public exports
- [ ] Add path alias `@/icons` to tsconfig.json

### Phase 2: Icon Extraction
- [ ] Create `definitions/ui.json` (close, settings, info, warning)
- [ ] Create `definitions/navigation.json` (chevrons)
- [ ] Create `definitions/actions.json` (edit, delete, plus, check, drag)
- [ ] Create `definitions/media.json` (image, zoom, expand, external-link)
- [ ] Add `mirrorInRTL` flag to directional icons

### Phase 3: Component Migration
- [ ] Update SettingsPanel components
- [ ] Update NavigationHub components
- [ ] Update Card components
- [ ] Update SearchBar component
- [ ] Update HelpModal component
- [ ] Update SourceIcon component
- [ ] Update remaining 25+ components

### Phase 4: Cleanup
- [ ] Remove `src/components/Icons/Icons.tsx`
- [ ] Update component index exports
- [ ] Add tests for Icon component
- [ ] Add tests for RTL mirroring

## Technical Considerations

### Icon Definition Schema

```typescript
// src/icons/types.ts
interface IconDefinition {
  viewBox: string;
  elements: IconElement[];
  fill?: 'currentColor' | 'none';
  stroke?: 'currentColor' | 'none';
  strokeWidth?: number;
  mirrorInRTL?: boolean;
}

interface IconElement {
  type: 'path' | 'line' | 'circle' | 'polyline' | 'rect';
  d?: string;           // For path
  points?: string;      // For polyline
  x1?: number; y1?: number; x2?: number; y2?: number; // For line
  cx?: number; cy?: number; r?: number; // For circle
}

type IconName = keyof typeof allIcons;
```

### JSON Definition Example

```json
// src/icons/definitions/ui.json
{
  "close": {
    "viewBox": "0 0 24 24",
    "stroke": "currentColor",
    "strokeWidth": 2,
    "elements": [
      { "type": "line", "x1": 18, "y1": 6, "x2": 6, "y2": 18 },
      { "type": "line", "x1": 6, "y1": 6, "x2": 18, "y2": 18 }
    ]
  }
}
```

### Icon Component

```typescript
// src/icons/Icon.tsx
interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  const definition = getIcon(name);

  return (
    <svg
      viewBox={definition.viewBox}
      width={size}
      height={size}
      fill={definition.fill ?? 'none'}
      stroke={definition.stroke ?? 'currentColor'}
      strokeWidth={definition.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx(
        className,
        definition.mirrorInRTL && styles.mirrorRTL
      )}
      aria-hidden="true"
    >
      {definition.elements.map(renderElement)}
    </svg>
  );
}
```

### RTL Mirroring CSS

```css
/* src/icons/Icon.module.css */
[dir="rtl"] .mirrorRTL {
  transform: scaleX(-1);
}
```

### Usage Pattern

```typescript
// Before
import { CloseIcon } from '@/components/Icons';
<CloseIcon size={20} className={styles.icon} />

// After
import { Icon } from '@/icons';
<Icon name="close" size={20} className={styles.icon} />
```

## Success Criteria

- [ ] All 17 central icons extracted to JSON definitions
- [ ] All 40+ inline icons consolidated into registry
- [ ] `<Icon>` component works with all icon names
- [ ] TypeScript provides autocomplete for icon names
- [ ] Directional icons mirror correctly in RTL
- [ ] No SVG elements remain inline in components
- [ ] `src/components/Icons/` directory removed
- [ ] All existing tests pass
- [ ] Bundle size unchanged or reduced

## Dependencies

- **Requires**: None
- **Blocks**: [F-077 RTL Support](./F-077-rtl-support.md) (partial - icon mirroring)

## Complexity

**Medium** - Straightforward extraction and migration, but requires updating 50+ files.

---

## Related Documentation

- [ADR-022: Icon Configuration Registry](../../decisions/adrs/ADR-022-icon-configuration-registry.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)
- [Current Icons](../../../../src/components/Icons/Icons.tsx)

---

**Status**: Planned
