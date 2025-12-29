# Settings Reference

Complete reference of all settings in itemdeck.

## Quick Settings

Commonly used settings, accessible from the main Quick tab.

| Setting | Location | Options | Default | Description |
|---------|----------|---------|---------|-------------|
| Current Theme | Quick | Retro, Modern, Minimal | Modern | Visual theme preset |
| Card Size | Quick | Small, Medium, Large | Medium | Card display size |
| View Mode | Quick | Grid, List, Compact, Fit | Grid | Layout arrangement |
| Shuffle on Load | Quick | On/Off | On | Randomise card order |
| Random Selection | Quick | On/Off | Off | Show subset of cards |
| Selection Count | Quick | 1 to collection size | 10 | Cards to show when random |

## System Settings

Core application preferences.

### Top Level

| Setting | Location | Options | Default | Description |
|---------|----------|---------|---------|-------------|
| Dark Mode | System | On/Off | System | Colour scheme preference |

### Accessibility Sub-tab

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Reduce Motion | System/On/Off | System | Control animations |
| High Contrast | On/Off | Off | Increase visual contrast |

### UI Visibility Sub-tab

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Show Help Button | On/Off | On | Display help in navigation |
| Show Settings Button | On/Off | On | Display settings in navigation |
| Show Search Button | On/Off | On | Display search in navigation |
| Show View Button | On/Off | On | Display view toggle |
| Show Statistics Bar | On/Off | On | Display stats above grid |

### Developer Sub-tab

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Edit Mode | On/Off | Off | Enable card data editing |
| TanStack DevTools | On/Off | Off | Show query devtools |

## Appearance Settings

Visual customisation options.

### Theme Sub-tab

Per-theme customisation (each theme stores its own values):

#### Colours

| Setting | Type | Default (Modern) | Description |
|---------|------|------------------|-------------|
| Accent Colour | Hex | #4f9eff | Highlight colour |
| Hover Colour | Hex | #7ab8ff | Mouse-over colour |
| Card Background | Hex | #1e293b | Card back colour |
| Border Colour | Hex | #ffffff20 | Card edge colour |
| Text Colour | Hex | #ffffff | Label colour |

#### Borders and Shadows

| Setting | Options | Default (Modern) | Description |
|---------|---------|------------------|-------------|
| Border Radius | None/Small/Medium/Large | Medium | Corner roundness |
| Border Width | None/Small/Medium/Large | None | Edge thickness |
| Shadow Intensity | None/Subtle/Medium/Strong | Medium | Drop shadow |

#### Animations

| Setting | Options | Default (Modern) | Description |
|---------|---------|------------------|-------------|
| Animation Style | None/Subtle/Smooth/Bouncy | Smooth | Hover lift effect |
| Flip Animation | On/Off | On | Card flip effect |
| Detail Animation | On/Off | On | Detail view transition |
| Overlay Animation | On/Off | On | More/attribution slide |
| Verdict Animation | Slide/Flip | Slide | Verdict reveal style |

#### Display

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Overlay Style | Dark/Light | Dark | Footer contrast |
| Detail Transparency | None/25/50/75 | 50 | Background opacity |
| More Button Label | Text | "Verdict" | Button text |
| Auto-Expand More | On/Off | Off | Auto-show verdict |
| Zoom Image | On/Off | On | Fill card width |

#### Typography (Optional)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Font Family | Text | (none) | Custom font name |
| Font URL | URL | (none) | Custom font source |

#### Background (Optional)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Card Back Image | URL | (none) | Background image |
| Background Mode | Full/Tiled/None | None | Image display mode |

### Cards Sub-tab

Card display configuration.

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Card Aspect Ratio | 3:4, 5:7, 1:1 | 5:7 | Card proportions |
| Max Visible Cards | 1-10 | 2 | Face-up limit |
| Card Back Display | Year/Logo/Both/None | Logo | Back content |
| Default Card Face | Front/Back | Back | Starting face |
| Show Rank Badge | On/Off | On | Display rank corner |
| Show Device Badge | On/Off | On | Display platform badge |
| Rank Placeholder | Text | "The one that got away!" | Unranked text |
| Title Display | Truncate/Wrap | Truncate | Long title handling |
| Use Placeholders | On/Off | On | Show placeholder images |

### Field Mapping Sub-tab

Map card fields to display elements.

| Setting | Default | Description |
|---------|---------|-------------|
| Title Field | title | Primary display field |
| Subtitle Field | year | Secondary display field |
| Footer Badge | platform.shortTitle | Bottom corner badge |
| Logo Field | logoUrl | Card back logo |
| Sort Field | order | Default sort order |
| Sort Direction | Ascending | Asc/Desc |
| Top Badge Field | order | Top corner badge |

## Collections Settings

Source and collection management.

### Sources Tab

| Action | Description |
|--------|-------------|
| Add Source | Add new GitHub or URL source |
| Edit Source | Modify existing source |
| Remove Source | Delete a source |
| Switch Source | Load different collection |

### Import/Export Tab

| Action | Description |
|--------|-------------|
| Export Edits | Download card modifications |
| Import Edits | Load card modifications |
| Export Settings | Download all preferences |
| Import Settings | Load preferences |

## Data Settings

Storage and cache management.

### Settings Tab

| Action | Description |
|--------|-------------|
| Export Settings | Download configuration |
| Reset to Defaults | Clear all customisations |

### Image Cache Tab

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Cache Preference | Always/Ask/Never | Ask | Image caching behaviour |
| View Cache | (action) | - | See cached images |
| Clear Cache | (action) | - | Remove cached images |

### Themes Tab

| Setting | Description |
|---------|-------------|
| External Theme | Select loaded external theme |
| Theme Browser | Browse available themes |

### About Tab

Displays version and application information.

## Mechanics Settings

Game and tool configuration.

### Memory Game

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Difficulty | Easy/Medium/Hard | Easy | Game difficulty |
| Pair Count | 4-12 | 6 | Number of pairs |

### Knowledge Quiz

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Question Count | 5-20 | 10 | Questions per round |
| Question Types | Multiple | All | Enabled question types |
| Timer Mode | None/Per-Question/Total | None | Time limit mode |
| Difficulty | Easy/Medium/Hard | Easy | Answer difficulty |

### Top Trumps

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Difficulty | Easy/Medium/Hard | Easy | CPU difficulty |
| Round Limit | None/10/20/30 | None | Maximum rounds |
| Show CPU Thinking | On/Off | On | Display CPU delay |
| Auto Advance | On/Off | Off | Auto-progress rounds |

### Guess the Value

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Show Timer | On/Off | On | Display elapsed time |
| Card Count | 5-20 | 10 | Cards per round |

### Collection Tracker

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Show Stats | On/Off | On | Display summary |
| Export Format | JSON | JSON | Export file type |

## URL Parameters

Override settings via URL query parameters.

| Parameter | Values | Example |
|-----------|--------|---------|
| `reset` | 1 | `?reset=1` - Clear all settings |
| `layout` | grid/list/compact/fit | `?layout=list` |
| `theme` | retro/modern/minimal | `?theme=retro` |

---

## Related Documentation

- [Getting Started](../tutorials/getting-started.md) - Basic settings
- [Customising Themes](../tutorials/customising-themes.md) - Theme settings
- [Accessibility Options](../guides/accessibility-options.md) - Accessibility settings
- [Keyboard Shortcuts Reference](keyboard-shortcuts-reference.md) - All shortcuts
