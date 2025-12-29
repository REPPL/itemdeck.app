# View Modes

Learn about the different ways to display your card collection.

## Available View Modes

Itemdeck offers four view modes, each optimised for different use cases.

### Grid View

The default view showing cards in a responsive grid layout.

**Best for:**
- Browsing visually
- Comparing multiple cards
- General exploration

**Characteristics:**
- Cards arranged in rows and columns
- Adapts to screen width
- Shows card faces with flip interaction

### List View

A vertical list with larger cards and more detail visible.

**Best for:**
- Reading detailed information
- Sequential browsing
- Smaller collections

**Characteristics:**
- Single-column layout
- Larger card display
- More content visible per card

### Compact View

Smaller cards for browsing large collections efficiently.

**Best for:**
- Large collections (100+ items)
- Quick scanning
- Overview browsing

**Characteristics:**
- Smaller card thumbnails
- More cards visible at once
- Reduced detail level

### Fit View

Cards sized to fit the viewport, showing one or few cards at full size.

**Best for:**
- Detailed examination
- Presentation mode
- Focus on individual cards

**Characteristics:**
- Cards fill available space
- Minimal distraction
- Maximum detail

## Switching View Modes

### Using the Navigation Hub

1. Look for the View button in the bottom-left navigation
2. Click to cycle through available modes
3. Or use the Settings panel for direct selection

### Using Settings

1. Press `S` to open Settings
2. In the **Quick** tab, find "View Mode"
3. Click Grid, List, Compact, or Fit

### Using the URL

You can bookmark specific views by adding a parameter:
```
?layout=grid
?layout=list
?layout=compact
?layout=fit
```

## When to Use Each Mode

| Mode | Collection Size | Primary Task |
|------|-----------------|--------------|
| Grid | Any | General browsing |
| List | Small-Medium | Reading details |
| Compact | Large | Finding items quickly |
| Fit | Any | Focused viewing |

## Combining with Card Sizes

View modes work alongside card size settings:

| Card Size | Grid Columns | Use Case |
|-----------|--------------|----------|
| Small (130px) | Many | Mobile, dense browsing |
| Medium (260px) | Moderate | Default, balanced |
| Large (360px) | Few | Large screens, detail focus |

### Recommended Combinations

- **Grid + Medium**: Best all-round experience
- **List + Large**: Maximum readability
- **Compact + Small**: Maximum density
- **Fit + Any**: Presentation mode

## Responsive Behaviour

### Mobile Devices

On narrow screens:
- Grid adapts to fewer columns
- Card size may switch to Small automatically
- List view uses full width

### Desktop

On wide screens:
- Grid shows many columns
- Fit view centres single cards
- More whitespace around content

---

## Related Documentation

- [Getting Started](../tutorials/getting-started.md) - Basic navigation
- [Settings Reference](../reference/settings.md) - All display settings
- [Accessibility Options](accessibility-options.md) - Motion and visual preferences
