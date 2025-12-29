# Explanation

Background information and conceptual understanding. Learn why things work the way they do.

## Core Concepts

| Topic | Description |
|-------|-------------|
| [Mechanics System](mechanics-system.md) | How games and tools work |
| [Theme Architecture](theme-architecture.md) | Visual themes and customisation |
| [Data Sources](data-sources.md) | Collection loading and management |

## Understanding itemdeck

itemdeck is a responsive card grid viewer designed for displaying collections. Whether you're cataloguing games, books, media, or any other items, itemdeck provides:

- **Flexible display**: Grid, list, compact, and fit views
- **Powerful search**: Boolean operators and filters
- **Mechanics**: Interactive games like Memory and Quiz
- **Customisation**: Multiple themes and deep personalisation
- **Offline support**: Progressive Web App capabilities

## Key Architectural Concepts

### Layered System

itemdeck uses a layered architecture:

```
┌─────────────────────────────────┐
│     Mechanics (Games/Tools)     │
├─────────────────────────────────┤
│     User Interface (Cards)      │
├─────────────────────────────────┤
│     Data Layer (Collections)    │
├─────────────────────────────────┤
│     Theme System (Styling)      │
└─────────────────────────────────┘
```

Each layer can be customised independently.

### Data Flow

Collections flow through the system:

1. **Source** - Remote or local data location
2. **Loading** - Fetch, validate, cache
3. **Processing** - Join with categories, apply edits
4. **Rendering** - Display with current settings
5. **Interaction** - User actions, mechanics

### State Management

itemdeck manages multiple types of state:

| State Type | Persistence | Scope |
|------------|-------------|-------|
| Settings | localStorage | Global |
| Edits | localStorage | Per-collection |
| Mechanics | Memory | Session |
| UI | Memory | Transient |

## Learning Path

For comprehensive understanding:

1. Start with [Data Sources](data-sources.md) to understand how content loads
2. Read [Theme Architecture](theme-architecture.md) for visual customisation
3. Explore [Mechanics System](mechanics-system.md) for interactive features

---

## Related Documentation

- [Documentation Hub](../README.md)
- [Tutorials](../tutorials/) - Step-by-step learning
- [Guides](../guides/) - Task-focused instructions
- [Reference](../reference/) - Technical specifications
