# ADR-022: Icon Configuration Registry

## Status

Accepted

## Context

Itemdeck currently uses a custom-built SVG icon system with:
- 17 centralised icons in `src/components/Icons/Icons.tsx`
- 40+ inline SVG icons scattered across component files
- No external icon library dependencies

This approach has served well for development but presents challenges for:
1. **Customisation**: Users or themes cannot easily swap icon sets
2. **RTL Support**: Directional icons need to mirror in RTL languages
3. **Consistency**: Inline icons may have inconsistent properties
4. **Maintenance**: Finding and updating icons requires searching multiple files

## Decision

Implement a **JSON-based icon registry** with a universal `<Icon>` component.

### Registry Structure

```
src/
├── icons/
│   ├── index.ts                    # Public exports
│   ├── registry.ts                 # Icon lookup and rendering
│   ├── types.ts                    # TypeScript interfaces
│   ├── Icon.tsx                    # Universal Icon component
│   └── definitions/
│       ├── ui.json                 # Close, settings, info, etc.
│       ├── navigation.json         # Chevrons, arrows
│       ├── actions.json            # Edit, delete, share, plus
│       └── media.json              # Image, expand, zoom
```

### Icon Definition Schema

```typescript
// src/icons/types.ts
interface IconDefinition {
  viewBox: string;
  elements: IconElement[];
  fill?: 'currentColor' | 'none';
  stroke?: 'currentColor' | 'none';
  strokeWidth?: number;
  mirrorInRTL?: boolean;  // For directional icons
}

interface IconElement {
  type: 'path' | 'line' | 'circle' | 'polyline' | 'rect';
  d?: string;           // For path
  points?: string;      // For polyline
  [key: string]: unknown; // Other SVG attributes
}
```

### Usage Pattern

```typescript
// Before (current)
import { CloseIcon } from '@/components/Icons';
<CloseIcon size={20} className={styles.icon} />

// After (new)
import { Icon } from '@/icons';
<Icon name="close" size={20} className={styles.icon} />
```

## Consequences

### Positive

- **Theme Customisation**: Icon sets can be swapped by loading different definition files
- **RTL Support**: Registry handles icon mirroring based on `mirrorInRTL` flag
- **Type Safety**: Icon names are typed, preventing typos
- **Centralised Maintenance**: All icons in one location, easy to audit
- **Consistent Properties**: All icons share the same stroke width, viewBox
- **Plugin Support**: Plugins can register additional icons via manifest

### Negative

- **Migration Effort**: 50+ files need import updates
- **JSON Complexity**: Complex SVGs may be harder to express in JSON
- **Runtime Lookup**: Small performance cost for icon resolution (negligible)

### Mitigations

- Migration can be automated with codemod script
- Complex icons can use raw SVG fallback in registry
- Icon lookup is O(1) hash map access

## Implementation Details

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
  },
  "settings": {
    "viewBox": "0 0 24 24",
    "stroke": "currentColor",
    "strokeWidth": 2,
    "elements": [
      { "type": "circle", "cx": 12, "cy": 12, "r": 3 },
      { "type": "path", "d": "M19.4 15a1.65 1.65 0 0 0..." }
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
  const definition = registry.get(name);
  const { mirrorInRTL } = definition;

  // Use CSS for RTL mirroring
  const style = mirrorInRTL ? { transform: 'var(--icon-mirror)' } : undefined;

  return (
    <svg
      viewBox={definition.viewBox}
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {definition.elements.map(renderElement)}
    </svg>
  );
}
```

### RTL Mirroring

```css
/* src/styles/globals.css */
:root {
  --icon-mirror: scaleX(1);
}

[dir="rtl"] {
  --icon-mirror: scaleX(-1);
}
```

### Icons Requiring RTL Mirroring

| Icon | Mirrors | Reason |
|------|---------|--------|
| `chevronLeft` | Yes | Directional |
| `chevronRight` | Yes | Directional |
| `externalLink` | Yes | Arrow direction |
| `close` | No | Symmetric |
| `settings` | No | Non-directional |
| `edit` | No | Pencil is universal |

## Alternatives Considered

### Keep Current Pattern (TSX Components)

**Rejected because:**
- No runtime customisation possible
- RTL mirroring requires component-level changes
- Inline icons remain scattered

**Would choose if:**
- Customisation was not a requirement
- RTL support was not planned

### External Icon Library (lucide-react, react-icons)

**Rejected because:**
- Adds external dependency
- Large bundle impact (even with tree-shaking)
- Less control over icon appearance
- Theming requires CSS overrides

**Would choose if:**
- Needed hundreds of icons
- Rapid prototyping was priority

### SVG Sprite System

**Rejected because:**
- More complex build pipeline
- Harder to modify individual icons
- Browser caching benefits minimal for ~60 icons

**Would choose if:**
- Had 200+ icons
- Needed maximum performance

---

## Related Documentation

- [State-of-the-Art: Internationalisation](../../research/state-of-the-art-internationalisation.md) (RTL context)
- [F-076: Icon Configuration Registry](../../roadmap/features/planned/F-076-icon-configuration-registry.md)
- [v1.5.0 Milestone](../../roadmap/milestones/v1.5.0.md)
