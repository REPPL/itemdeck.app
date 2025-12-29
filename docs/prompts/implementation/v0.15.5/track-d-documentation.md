# Track D: User Documentation (F-073)

## Features

- F-073: User Documentation Suite

## Implementation Prompt

```
Complete the User Documentation Suite for itemdeck following the Diataxis framework.

## Context

Current documentation status (~30% complete):
- 1 of 4 tutorials written (getting-started.md)
- 2 of 8 guides written (keyboard-shortcuts.md, search-and-filters.md)
- 0 of 3 explanation docs written
- Reference docs incomplete

Screenshots will be captured manually by the user.

## Phase 1: Remaining Tutorials (3 files)

### docs/tutorials/playing-memory-game.md

Structure:
```markdown
# Playing the Memory Game

## What You'll Learn

In this tutorial, you'll learn how to play the Memory matching game with your card collection.

## Prerequisites

- A loaded collection with at least 4 cards
- Basic familiarity with the itemdeck interface

## Starting a Memory Game

### Step 1: Open the Mechanics Menu

Click the game controller icon in the Navigation Hub...

### Step 2: Select Memory

From the mechanics list, click "Memory"...

### Step 3: Configure Game Options

Before starting, you can adjust:
- Number of pairs
- Time limit (optional)
- Difficulty level

## How to Play

### Flipping Cards
...

### Making Matches
...

### Score and Timer
...

## Completing a Game
...

## Tips for Success
...

## Related Documentation

- [Mechanics System](../explanation/mechanics-system.md)
- [Keyboard Shortcuts](../guides/keyboard-shortcuts.md)
```

### docs/tutorials/customising-themes.md

Structure:
```markdown
# Customising Themes

## What You'll Learn

How to personalise the appearance of itemdeck with theme customisation.

## Prerequisites
...

## Understanding Themes

### Built-in Themes
- Retro: Classic arcade aesthetic
- Modern: Clean, contemporary design
- Minimal: Focused, distraction-free

### Theme Components
- Colours (accent, hover, background)
- Borders (radius, width)
- Shadows
- Animations

## Changing Your Theme
...

## Customising Theme Elements
...

## Saving Your Customisations
...

## Loading External Themes
...

## Related Documentation

- [Theme Architecture](../explanation/theme-architecture.md)
- [Theme Export](../guides/exporting-data.md)
```

### docs/tutorials/first-collection.md

Structure:
```markdown
# Your First Collection

## What You'll Learn

How to load and explore your first card collection.

## Prerequisites

- itemdeck running in your browser
- (Optional) A GitHub repository with collection data

## Understanding Collections
...

## Loading a Built-in Collection
...

## Loading a Remote Collection
...

## Creating Your Own Collection

### Basic JSON Structure
...

### Required Fields
...

### Image References
...

## Related Documentation

- [Data Sources](../explanation/data-sources.md)
- [Adding Remote Source](../guides/adding-remote-source.md)
- [Creating Collection](../guides/creating-collection.md)
```

## Phase 2: Remaining Guides (6 files)

### docs/guides/view-modes.md

```markdown
# View Modes

Learn about the different ways to display your card collection.

## Available View Modes

### Grid View
The default view showing cards in a responsive grid...

### List View
A vertical list with larger cards and more detail...

### Compact View
Smaller cards for browsing large collections...

### Fit View
Cards sized to fit the viewport...

## Switching View Modes
...

## When to Use Each Mode
...

## Combining with Card Sizes
...

## Related Documentation
- [Settings Reference](../reference/settings.md)
```

### docs/guides/edit-mode.md

```markdown
# Edit Mode

How to modify card data within itemdeck.

## What is Edit Mode?
...

## Entering Edit Mode
- Keyboard shortcut: E
- Settings toggle

## Editing Card Data
...

## Viewing Your Edits
...

## Exporting Edited Data
...

## Related Documentation
- [Exporting Data](./exporting-data.md)
```

### docs/guides/exporting-data.md

```markdown
# Exporting Data

How to export your edits, settings, and themes.

## What Can Be Exported?
- Card edits (JSON)
- Application settings (JSON)
- Theme customisations (JSON)

## Export Formats
...

## Accessing Export
...

## Using Exported Data
...

## Related Documentation
- [Edit Mode](./edit-mode.md)
- [Settings Reference](../reference/settings.md)
```

### docs/guides/adding-remote-source.md

```markdown
# Adding a Remote Source

How to load collections from GitHub repositories.

## Supported Sources
- GitHub repositories (public)
- Raw URLs

## Adding a GitHub Collection

### URL Format Requirements
...

### Repository Structure
...

## Managing Sources
...

## Troubleshooting
...

## Related Documentation
- [Data Sources](../explanation/data-sources.md)
```

### docs/guides/creating-collection.md

```markdown
# Creating a Collection

How to create your own collection for itemdeck.

## Collection Structure
...

## JSON Schema
...

## Image Assets
...

## Validating Your Collection
...

## Hosting on GitHub
...

## Related Documentation
- [Your First Collection](../tutorials/first-collection.md)
```

### docs/guides/accessibility-options.md

```markdown
# Accessibility Options

How to customise itemdeck for your accessibility needs.

## Motion Preferences
...

## High Contrast Mode
...

## Keyboard Navigation
...

## Screen Reader Support
...

## Customising for Your Needs
...

## Related Documentation
- [Keyboard Shortcuts](./keyboard-shortcuts.md)
- [Settings Reference](../reference/settings.md)
```

## Phase 3: Explanation Documents (3 files)

### docs/explanation/mechanics-system.md

```markdown
# Understanding the Mechanics System

How interactive game mechanics work in itemdeck.

## What Are Mechanics?

Mechanics are interactive modes that transform your card collection into games...

## How Mechanics Work

### Activation and Deactivation
...

### State Management
...

### Display Preferences
...

## Available Mechanics

### Memory Game
...

### Quiz Mode
...

### Top Trumps
...

### Guess the Value
...

### Collection Tracker
...

## Mechanic Settings
...

## Technical Architecture
...

## Related Documentation
- [Playing Memory Game](../tutorials/playing-memory-game.md)
```

### docs/explanation/theme-architecture.md

```markdown
# Theme Architecture

How the theming system works in itemdeck.

## Theme System Overview
...

## Theme Components
...

## Theme Customisation
...

## External Theme Loading
...

## Technical Implementation
...

## Related Documentation
- [Customising Themes](../tutorials/customising-themes.md)
```

### docs/explanation/data-sources.md

```markdown
# Data Sources

How itemdeck loads and manages collection data.

## What Are Data Sources?
...

## Collection Loading
...

## Data Schema
...

## Offline Support
...

## Security Considerations
...

## Related Documentation
- [Adding Remote Source](../guides/adding-remote-source.md)
```

## Phase 4: Reference Documents (2 files)

### docs/reference/settings.md

Complete reference table of all settings with:
- Setting name
- Location in UI
- Options/values
- Default value
- Description

### docs/reference/keyboard-shortcuts-reference.md

Complete lookup table of all keyboard shortcuts:
- Global shortcuts
- Card navigation
- Card actions
- Search bar
- Settings panel
- Mechanics-specific

## Phase 5: Update Index Files

### docs/README.md

Add links to new documentation sections.

### docs/tutorials/README.md

```markdown
# Tutorials

Step-by-step learning guides for itemdeck.

| Tutorial | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Set up and explore itemdeck |
| [Your First Collection](./first-collection.md) | Load and create collections |
| [Playing Memory Game](./playing-memory-game.md) | Learn the Memory mechanic |
| [Customising Themes](./customising-themes.md) | Personalise your experience |
```

### docs/guides/README.md

Update with all 8 guides listed.

### docs/explanation/README.md

Update with all 3 explanation docs listed.

## Files to Create

- docs/tutorials/playing-memory-game.md
- docs/tutorials/customising-themes.md
- docs/tutorials/first-collection.md
- docs/guides/view-modes.md
- docs/guides/edit-mode.md
- docs/guides/exporting-data.md
- docs/guides/adding-remote-source.md
- docs/guides/creating-collection.md
- docs/guides/accessibility-options.md
- docs/explanation/mechanics-system.md
- docs/explanation/theme-architecture.md
- docs/explanation/data-sources.md
- docs/reference/settings.md
- docs/reference/keyboard-shortcuts-reference.md

## Files to Modify

- docs/README.md
- docs/tutorials/README.md
- docs/guides/README.md
- docs/explanation/README.md

## Success Criteria

- [ ] 4/4 tutorials complete
  - [ ] getting-started.md (existing)
  - [ ] playing-memory-game.md
  - [ ] customising-themes.md
  - [ ] first-collection.md
- [ ] 8/8 guides complete
  - [ ] keyboard-shortcuts.md (existing)
  - [ ] search-and-filters.md (existing)
  - [ ] view-modes.md
  - [ ] edit-mode.md
  - [ ] exporting-data.md
  - [ ] adding-remote-source.md
  - [ ] creating-collection.md
  - [ ] accessibility-options.md
- [ ] 3/3 explanation docs complete
  - [ ] mechanics-system.md
  - [ ] theme-architecture.md
  - [ ] data-sources.md
- [ ] Reference docs complete
  - [ ] settings.md
  - [ ] keyboard-shortcuts-reference.md
- [ ] All index files updated
  - [ ] docs/README.md
  - [ ] docs/tutorials/README.md
  - [ ] docs/guides/README.md
  - [ ] docs/explanation/README.md
- [ ] All cross-references verified
- [ ] British English used throughout
```

---

## Related Documentation

- [F-073 Feature Spec](../../../development/roadmap/features/planned/F-073-user-documentation.md)
- [Getting Started Tutorial](../../../../tutorials/getting-started.md)
- [Keyboard Shortcuts Guide](../../../../guides/keyboard-shortcuts.md)
