<p align="center">
  <img src="docs/assets/img/logo.png" alt="itemdeck.app Logo" width="200">
</p>

<h1 align="center">itemdeck.app</h1>

<p align="center">
  <strong>Interactive Card Collection Viewer</strong><br>
  Display, explore, and play with card collections from any GitHub repository.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node.js >= 20.0.0">
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" alt="TypeScript Strict">
  <a href="https://claude.ai/claude-code"><img src="https://img.shields.io/badge/Built_with-Claude_Code-6B5CE7?logo=anthropic" alt="Built with Claude Code"></a>
</p>

---

## What is itemdeck.app?

itemdeck.app is a browser-based card display system that loads collections from GitHub repositories. Perfect for:

- **Collectors** - Browse and organise your collections
- **Curators** - Share themed collections with others
- **Gamers** - Play memory games with your cards

<p align="center">
  <img src="docs/assets/img/screenshot.gif" alt="itemdeck.app Demo" width="600">
</p>

## Features

- **Card Display** - Responsive grid with smooth animations and flip effects
- **Multiple Views** - Grid, Stack, Carousel, and Fit-to-Viewport layouts
- **Discovery Tools** - Search, filter by category/platform/year, and grouping
- **Gaming Mechanics** - Memory game with more mechanics coming soon
- **Remote Collections** - Load any GitHub-hosted collection via URL
- **Keyboard Navigation** - Full keyboard support with customisable shortcuts
- **Theme Support** - Light, dark, and high contrast modes
- **Offline Caching** - Collections cached locally for fast reloading
- **Accessibility** - WCAG 2.1 AA compliant with reduced motion support

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Load a Collection

Add a collection URL parameter to load remote collections:

```
http://localhost:5173/?collection=https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games
```

## Documentation

- **[Getting Started](./docs/tutorials/getting-started.md)** - Quick start tutorial
- **[Keyboard Shortcuts](./docs/guides/keyboard-shortcuts.md)** - Navigation reference
- **[Search and Filters](./docs/guides/search-and-filters.md)** - Finding cards
- **[Schema Reference](./docs/reference/schemas/)** - Collection data format

## Contributing

For developers and contributors:

- **[Development Guide](./docs/development/README.md)** - Technical documentation
- **[Available Scripts](./docs/development/scripts.md)** - npm commands
- **[Architecture](./docs/development/architecture.md)** - Project structure and patterns
- **[Roadmap](./docs/development/roadmap/)** - Planned features

## Requirements

- **Node.js** 20.0.0 or higher
- **npm** (included with Node.js)

## Licence

MIT
