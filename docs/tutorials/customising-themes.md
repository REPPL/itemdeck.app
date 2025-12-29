# Customising Themes

Learn how to personalise the appearance of itemdeck with theme customisation.

## What You'll Learn

In this tutorial, you'll learn how to:

- Switch between built-in themes
- Customise theme elements
- Adjust colours, borders, and animations
- Save your customisations

## Prerequisites

- itemdeck running in your browser
- Basic familiarity with the Settings panel (see [Getting Started](getting-started.md))

## Understanding Themes

### Built-in Themes

Itemdeck comes with three visual themes:

| Theme | Style | Best For |
|-------|-------|----------|
| **Retro** | Classic arcade aesthetic with sharp corners | Nostalgic, gaming collections |
| **Modern** | Clean, contemporary design with rounded corners | Professional, general use |
| **Minimal** | Focused, distraction-free with subtle effects | Reading, productivity |

### Theme Components

Each theme controls multiple visual elements:

- **Colours**: Accent, hover, background, text, and border colours
- **Borders**: Corner radius and border width
- **Shadows**: Shadow intensity (none to strong)
- **Animations**: Flip, detail view, and overlay animations

## Changing Your Theme

### Quick Theme Switch

1. Press `S` or click the gear icon to open Settings
2. In the **Quick** tab, find "Current Theme"
3. Select Retro, Modern, or Minimal from the dropdown
4. Changes preview immediately

### Dark Mode

Toggle dark mode separately from the visual theme:

1. Go to Settings > **System** tab
2. Toggle "Dark Mode" on or off
3. This affects the overall colour scheme

## Customising Theme Elements

For deeper customisation, use the Appearance settings:

### Step 1: Open Theme Customisation

1. Go to Settings > **Appearance** tab
2. Select the **Theme** sub-tab
3. You'll see customisation options for the current theme

### Step 2: Adjust Colours

| Setting | Purpose | Tip |
|---------|---------|-----|
| Accent Colour | Highlights and interactive elements | Choose a colour that pops |
| Hover Colour | Mouse-over effects | Usually lighter than accent |
| Card Background | Card back colour | Match your content style |
| Border Colour | Card edges | Subtle usually works best |
| Text Colour | Labels and titles | Ensure readability |

Click any colour swatch to open a colour picker, or enter a hex value directly.

### Step 3: Adjust Visual Effects

**Border Settings:**
- **Border Radius**: None, Small, Medium, Large
- **Border Width**: None, Small, Medium, Large

**Shadow Settings:**
- **Shadow Intensity**: None, Subtle, Medium, Strong

**Animation Settings:**
- **Animation Style**: None, Subtle, Smooth, Bouncy
- **Flip Animation**: Enable/disable card flip effect
- **Detail Animation**: Enable/disable detail view transitions
- **Overlay Animation**: Enable/disable overlay transitions
- **Verdict Animation**: Slide or Flip style

### Step 4: Additional Options

| Setting | Description |
|---------|-------------|
| Overlay Style | Dark or Light footer on cards |
| More Button Label | Custom text for the verdict button |
| Auto-Expand More | Automatically show verdict overlay |
| Zoom Image | Fit images to card width |

## Saving Your Customisations

Changes are saved automatically when you close the Settings panel. Your customisations persist across browser sessions.

### Per-Theme Customisation

Each theme maintains its own customisation settings. You can:

- Customise Retro with sharp, pixelated effects
- Customise Modern with smooth gradients
- Customise Minimal with subtle, muted tones

Switching themes loads that theme's customised settings.

## Resetting to Defaults

To restore a theme's original settings:

1. Go to Settings > **System** tab > **Developer** sub-tab
2. Add `?reset=1` to the URL and reload
3. This clears all settings including theme customisations

**Caution**: This resets all settings, not just themes.

## Loading External Themes

Itemdeck supports loading themes from external sources:

### Local Themes

Place theme files in the `/themes/` folder of your deployment. These appear automatically in the theme browser.

### Theme Files

A theme file is a JSON document containing:

- Theme metadata (name, version, description)
- Colour definitions
- Border and shadow presets
- Animation configurations

See [Theme Architecture](../explanation/theme-architecture.md) for technical details.

---

## Related Documentation

- [Theme Architecture](../explanation/theme-architecture.md) - How themes work
- [Settings Reference](../reference/settings.md) - All settings explained
- [Accessibility Options](../guides/accessibility-options.md) - Motion and contrast settings
