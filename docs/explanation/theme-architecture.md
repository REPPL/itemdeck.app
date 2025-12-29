# Theme Architecture

Learn how the theming system works in itemdeck.

## Theme System Overview

Itemdeck uses a layered theming system:

```
┌─────────────────────────────────────┐
│ User Customisations                 │
│ (colours, borders, animations)      │
├─────────────────────────────────────┤
│ Visual Theme                        │
│ (Retro / Modern / Minimal)          │
├─────────────────────────────────────┤
│ Colour Scheme                       │
│ (Light / Dark)                      │
├─────────────────────────────────────┤
│ Base Styles                         │
│ (CSS variables, defaults)           │
└─────────────────────────────────────┘
```

Each layer builds on the one below, allowing deep customisation while maintaining consistency.

## Theme Components

### Visual Themes

The three built-in visual themes:

| Theme | Aesthetic | Key Features |
|-------|-----------|--------------|
| **Retro** | Classic arcade | Sharp corners, strong shadows, no animations |
| **Modern** | Contemporary | Rounded corners, smooth animations, medium shadows |
| **Minimal** | Clean, focused | Subtle effects, small shadows, light animations |

### Colour Scheme

Separate from visual theme:

| Scheme | Background | Text | Use Case |
|--------|------------|------|----------|
| Light | Light colours | Dark text | Daytime, bright environments |
| Dark | Dark colours | Light text | Night, low-light environments |

Colour scheme applies independently of visual theme.

### Customisation Layer

Per-theme customisation includes:

| Category | Properties |
|----------|------------|
| Colours | Accent, hover, background, border, text |
| Borders | Radius, width |
| Shadows | Intensity |
| Animations | Style, per-element toggles |
| Typography | Font family, custom fonts |
| Backgrounds | Card back images |

## Theme Customisation

### Customisable Properties

Each visual theme stores its own customisation:

```typescript
interface ThemeCustomisation {
  // Colours
  accentColour: string;        // Hex colour
  hoverColour: string;
  cardBackgroundColour: string;
  borderColour: string;
  textColour: string;

  // Borders
  borderRadius: "none" | "small" | "medium" | "large";
  borderWidth: "none" | "small" | "medium" | "large";

  // Shadows
  shadowIntensity: "none" | "subtle" | "medium" | "strong";

  // Animations
  animationStyle: "none" | "subtle" | "smooth" | "bouncy";
  flipAnimation: boolean;
  detailAnimation: boolean;
  overlayAnimation: boolean;
  verdictAnimationStyle: "slide" | "flip";

  // Display
  overlayStyle: "dark" | "light";
  detailTransparency: "none" | "25" | "50" | "75";
  moreButtonLabel: string;
  autoExpandMore: boolean;
  zoomImage: boolean;

  // Typography (optional)
  fontFamily?: string;
  fontUrl?: string;

  // Backgrounds (optional)
  cardBackBackgroundImage?: string;
  cardBackBackgroundMode?: "full" | "tiled" | "none";
}
```

### Default Values

Each theme has carefully chosen defaults:

| Property | Retro | Modern | Minimal |
|----------|-------|--------|---------|
| Border Radius | none | medium | small |
| Border Width | small | none | small |
| Shadow Intensity | strong | medium | subtle |
| Animation Style | none | smooth | subtle |
| Overlay Style | dark | dark | dark |

### Persistence

Customisations persist to localStorage:
- Per-theme settings saved separately
- Switching themes loads that theme's customisation
- Survives browser restarts
- Can be exported/imported

## External Theme Loading

### Theme Sources

Itemdeck can load themes from:

| Source | Location | Trust Level |
|--------|----------|-------------|
| Built-in | Application bundle | Trusted |
| Local | `/themes/` folder | Trusted |
| Remote | Custom URL | Curated |

### Theme File Format

External themes are JSON files:

```json
{
  "id": "custom-theme",
  "name": "My Custom Theme",
  "version": "1.0.0",
  "description": "A custom theme",
  "author": "Theme Author",

  "base": "modern",

  "customisation": {
    "accentColour": "#FF6B6B",
    "hoverColour": "#FF8888",
    "borderRadius": "medium",
    "animationStyle": "bouncy"
  }
}
```

### Loading Process

1. Theme URL validated against allowed sources
2. JSON fetched and parsed
3. Schema validated
4. Applied on top of base theme
5. User can further customise

## Technical Implementation

### CSS Variables

Themes work via CSS custom properties:

```css
:root {
  --card-background: var(--theme-card-bg);
  --accent-colour: var(--theme-accent);
  --border-radius: var(--theme-border-radius);
}

[data-visual-theme="retro"] {
  --theme-border-radius: 0;
  --theme-shadow: 4px 4px 0 rgba(0,0,0,0.5);
}

[data-visual-theme="modern"] {
  --theme-border-radius: 12px;
  --theme-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

### Attribute-Based Switching

Themes apply via data attributes:

```html
<html
  data-visual-theme="modern"
  data-colour-scheme="dark"
>
```

JavaScript updates these attributes when user changes settings.

### Animation Control

Animations respect user preferences:

```css
[data-reduce-motion="on"] .card {
  transition: none !important;
  animation: none !important;
}
```

## Theme Presets

### Border Radius Presets

| Preset | Value |
|--------|-------|
| none | 0 |
| small | 4px |
| medium | 12px |
| large | 20px |

### Shadow Intensity Presets

| Preset | Light Mode | Dark Mode |
|--------|------------|-----------|
| none | none | none |
| subtle | 0 2px 4px rgba(0,0,0,0.1) | 0 2px 4px rgba(0,0,0,0.3) |
| medium | 0 4px 12px rgba(0,0,0,0.15) | 0 4px 12px rgba(0,0,0,0.4) |
| strong | 4px 4px 0 rgba(0,0,0,0.3) | 0 8px 24px rgba(0,0,0,0.5) |

### Animation Style Presets

| Preset | Hover Lift | Transition Timing |
|--------|------------|-------------------|
| none | 0 | instant |
| subtle | 2px | 150ms ease |
| smooth | 4px | 300ms ease-out |
| bouncy | 8px | 300ms spring |

---

## Related Documentation

- [Customising Themes](../tutorials/customising-themes.md) - Theme tutorial
- [Settings Reference](../reference/settings.md) - All theme settings
- [Accessibility Options](../guides/accessibility-options.md) - Motion preferences
