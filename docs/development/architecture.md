# Architecture

Technical architecture and project structure for itemdeck.app.

---

## Technology Stack

- **React 18** - UI framework with functional components and hooks
- **TypeScript** - Type-safe JavaScript with strict mode
- **Vite** - Fast build tool and dev server
- **CSS Modules** - Scoped component styling
- **Zustand** - State management
- **TanStack Query** - Server state and caching
- **Framer Motion** - Animations

---

## Project Structure

```
src/
├── main.tsx                    # Application entry point
├── App.tsx                     # Root component with providers
├── components/
│   ├── Card/                   # Individual card display
│   ├── CardGrid/               # Responsive grid layout
│   ├── SettingsPanel/          # Configuration UI
│   ├── CollectionBrowser/      # Collection selection
│   └── ...                     # Other components
├── mechanics/
│   ├── registry.ts             # Mechanic plugin registry
│   ├── context.tsx             # Mechanic React context
│   ├── types.ts                # Type definitions
│   └── memory/                 # Memory game mechanic
├── stores/
│   ├── settingsStore.ts        # User preferences
│   └── entityEditsStore.ts     # Local entity edits
├── context/
│   ├── CollectionDataContext/  # Collection data provider
│   └── ...                     # Other contexts
├── hooks/
│   ├── useCollection.ts        # Collection data hook
│   ├── useShuffledCards.ts     # Card shuffling
│   └── ...                     # Other hooks
├── types/
│   ├── entity.ts               # Entity data types
│   ├── collection.ts           # Collection types
│   └── ...                     # Other types
├── loaders/
│   └── collectionLoader.ts     # Remote collection loading
└── styles/
    └── global.css              # CSS reset and variables
```

---

## Key Patterns

### Mechanic Plugin System

Gaming mechanics are implemented as plugins with lazy loading:

```typescript
// Register a mechanic
mechanicRegistry.register("memory", async () => {
  const { memoryMechanic } = await import("./memory");
  return memoryMechanic;
});

// Activate in components
const { activateMechanic } = useMechanicContext();
await activateMechanic("memory");
```

See ADR-016, ADR-017, ADR-018, ADR-020 for details.

### State Management

- **Zustand** for client state (settings, edits)
- **TanStack Query** for server state (collections, entities)
- **Per-mechanic stores** for game state

### Collection Loading

1. Parse URL for collection path
2. Fetch `collection.json` for metadata
3. Fetch entity index and individual entities
4. Cache images for offline use

---

## Related Documentation

- [Development Guide](./README.md)
- [Available Scripts](./scripts.md)
- [ADRs](./decisions/adrs/)
- [Research](./research/)
