# Modular Architecture

## Executive Summary

For Itemdeck's modular architecture, adopt a **compound component pattern** with **slot-based composition** for core extensibility. Use **React.lazy()** with **code splitting** for performance. Avoid complex plugin systems unless third-party extensions are required.

Key recommendations:
1. Use compound components for related component groups (Card, CardFront, CardBack)
2. Implement slot patterns for customisable card layouts
3. Apply code splitting with React.lazy() for optional features
4. Reserve full plugin architecture for future third-party extension needs

## Current State in Itemdeck

Itemdeck currently uses:
- **Flat component structure** - Card, CardGrid, MenuButton, Sidebar
- **No composition patterns** - components are self-contained
- **No code splitting** - entire app loads as single bundle
- **Context for state** - SettingsContext for configuration

The architecture is simple and suitable for the foundation stage.

## Research Findings

### Composition Patterns Comparison

| Pattern | Complexity | Use Case | TypeScript Support |
|---------|------------|----------|-------------------|
| **Compound Components** | Low-Medium | Related component groups | Excellent |
| **Slot Pattern** | Low | Customisable layouts | Excellent |
| **Render Props** | Medium | Behaviour sharing | Good |
| **HOCs** | Medium-High | Cross-cutting concerns | Moderate |
| **Plugin System** | High | Third-party extensions | Varies |
| **Module Federation** | Very High | Micro-frontends | Good |

### Compound Components Pattern

Compound components allow related components to share implicit state while maintaining a clean, declarative API.

```tsx
// src/components/Card/index.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface CardContextValue {
  isFlipped: boolean;
  flip: () => void;
}

const CardContext = createContext<CardContextValue | null>(null);

function useCardContext() {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card components must be used within a Card');
  }
  return context;
}

// Parent component manages state
interface CardProps {
  children: ReactNode;
  defaultFlipped?: boolean;
  onFlip?: (isFlipped: boolean) => void;
}

function Card({ children, defaultFlipped = false, onFlip }: CardProps) {
  const [isFlipped, setIsFlipped] = useState(defaultFlipped);

  const flip = () => {
    const newState = !isFlipped;
    setIsFlipped(newState);
    onFlip?.(newState);
  };

  return (
    <CardContext.Provider value={{ isFlipped, flip }}>
      <div className="card-container">
        {children}
      </div>
    </CardContext.Provider>
  );
}

// Child components consume state
function CardFront({ children }: { children: ReactNode }) {
  const { isFlipped } = useCardContext();
  return (
    <div className={`card-face card-front ${isFlipped ? 'hidden' : ''}`}>
      {children}
    </div>
  );
}

function CardBack({ children }: { children: ReactNode }) {
  const { isFlipped } = useCardContext();
  return (
    <div className={`card-face card-back ${isFlipped ? '' : 'hidden'}`}>
      {children}
    </div>
  );
}

function CardFlipButton({ children }: { children?: ReactNode }) {
  const { flip } = useCardContext();
  return (
    <button onClick={flip} className="card-flip-btn">
      {children ?? 'Flip'}
    </button>
  );
}

// Attach child components to parent
Card.Front = CardFront;
Card.Back = CardBack;
Card.FlipButton = CardFlipButton;

export { Card };
```

**Usage:**

```tsx
<Card onFlip={(flipped) => console.log('Flipped:', flipped)}>
  <Card.Front>
    <img src={card.imageUrl} alt={card.name} />
  </Card.Front>
  <Card.Back>
    <CardDetails card={card} />
  </Card.Back>
  <Card.FlipButton>View Details</Card.FlipButton>
</Card>
```

### Slot Pattern for Layouts

Slots allow customisable content placement within a component structure.

```tsx
// src/components/CardLayout/CardLayout.tsx
import { ReactNode, Children, isValidElement } from 'react';

interface SlotProps {
  children: ReactNode;
  name: string;
}

// Named slot component for type safety
function Slot({ children }: SlotProps) {
  return <>{children}</>;
}

interface CardLayoutProps {
  children: ReactNode;
}

function CardLayout({ children }: CardLayoutProps) {
  const slots: Record<string, ReactNode> = {};

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === Slot) {
      const name = child.props.name as string;
      slots[name] = child.props.children;
    }
  });

  return (
    <div className="card-layout">
      <header className="card-header">
        {slots['header']}
      </header>
      <main className="card-body">
        {slots['body'] ?? slots['default']}
      </main>
      <footer className="card-footer">
        {slots['footer']}
      </footer>
    </div>
  );
}

CardLayout.Slot = Slot;

export { CardLayout };
```

**Usage:**

```tsx
<CardLayout>
  <CardLayout.Slot name="header">
    <h2>{card.name}</h2>
  </CardLayout.Slot>
  <CardLayout.Slot name="body">
    <img src={card.imageUrl} alt={card.name} />
  </CardLayout.Slot>
  <CardLayout.Slot name="footer">
    <CardActions card={card} />
  </CardLayout.Slot>
</CardLayout>
```

### TypeScript-Safe Slot Pattern

```tsx
// src/components/CardTemplate/types.ts
import { ReactNode } from 'react';

export interface CardTemplateSlots {
  image?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
}

export interface CardTemplateProps {
  slots: CardTemplateSlots;
  variant?: 'default' | 'compact' | 'detailed';
}

// src/components/CardTemplate/CardTemplate.tsx
export function CardTemplate({ slots, variant = 'default' }: CardTemplateProps) {
  return (
    <article className={`card-template card-template--${variant}`}>
      {slots.badge && (
        <div className="card-badge">{slots.badge}</div>
      )}
      <div className="card-image">
        {slots.image}
      </div>
      <div className="card-content">
        {slots.title && <h3 className="card-title">{slots.title}</h3>}
        {slots.description && <p className="card-desc">{slots.description}</p>}
      </div>
      {slots.actions && (
        <div className="card-actions">{slots.actions}</div>
      )}
    </article>
  );
}
```

**Usage with type safety:**

```tsx
<CardTemplate
  variant="detailed"
  slots={{
    image: <img src={card.imageUrl} alt={card.name} />,
    title: card.name,
    description: card.description,
    badge: card.rarity && <RarityBadge rarity={card.rarity} />,
    actions: <CardActions card={card} />,
  }}
/>
```

### Code Splitting with React.lazy()

```tsx
// src/App.tsx
import { Suspense, lazy } from 'react';
import { CardGrid } from './components/CardGrid';

// Lazy load optional features
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const CardDetail = lazy(() => import('./components/CardDetail'));
const GitHubSourceConfig = lazy(() => import('./components/GitHubSourceConfig'));

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  return (
    <div className="app">
      <CardGrid onCardSelect={setSelectedCard} />

      {/* Lazy-loaded settings panel */}
      {showSettings && (
        <Suspense fallback={<LoadingSpinner />}>
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </Suspense>
      )}

      {/* Lazy-loaded card detail modal */}
      {selectedCard && (
        <Suspense fallback={<LoadingSpinner />}>
          <CardDetail
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
```

### Feature-Based Module Structure

```
src/
├── features/
│   ├── cards/
│   │   ├── components/
│   │   │   ├── Card/
│   │   │   ├── CardGrid/
│   │   │   └── CardDetail/
│   │   ├── hooks/
│   │   │   ├── useCards.ts
│   │   │   └── useCardFilters.ts
│   │   ├── types/
│   │   │   └── card.ts
│   │   └── index.ts          # Public API
│   │
│   ├── settings/
│   │   ├── components/
│   │   │   └── SettingsPanel/
│   │   ├── context/
│   │   │   └── SettingsContext.tsx
│   │   └── index.ts
│   │
│   ├── data-sources/
│   │   ├── components/
│   │   │   ├── GitHubConfig/
│   │   │   └── UrlConfig/
│   │   ├── hooks/
│   │   │   ├── useGitHubCards.ts
│   │   │   └── useRemoteCards.ts
│   │   └── index.ts
│   │
│   └── themes/
│       ├── components/
│       │   └── ThemeToggle/
│       ├── context/
│       │   └── ThemeContext.tsx
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── Button/
│   │   ├── LoadingSpinner/
│   │   └── Modal/
│   ├── hooks/
│   │   └── useMediaQuery.ts
│   └── utils/
│       └── deepMerge.ts
│
└── App.tsx
```

### Feature Module Public API

```typescript
// src/features/cards/index.ts

// Components
export { Card } from './components/Card';
export { CardGrid } from './components/CardGrid';
export { CardDetail } from './components/CardDetail';

// Hooks
export { useCards } from './hooks/useCards';
export { useCardFilters } from './hooks/useCardFilters';

// Types
export type { Card, CardCollection, CardSource } from './types/card';
```

### Plugin System (Advanced)

For future third-party extension support:

```typescript
// src/plugins/types.ts
import { ReactNode, ComponentType } from 'react';
import type { Card } from '../types/card';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
}

export interface CardLayoutPlugin extends PluginManifest {
  type: 'card-layout';
  component: ComponentType<CardLayoutProps>;
}

export interface DataSourcePlugin extends PluginManifest {
  type: 'data-source';
  fetchCards: () => Promise<Card[]>;
  configComponent?: ComponentType<DataSourceConfigProps>;
}

export interface ThemePlugin extends PluginManifest {
  type: 'theme';
  styles: Record<string, string>;
  variables: Record<string, string>;
}

export type Plugin = CardLayoutPlugin | DataSourcePlugin | ThemePlugin;

// src/plugins/PluginRegistry.ts
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered, replacing`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  unregister(pluginId: string): boolean {
    return this.plugins.delete(pluginId);
  }

  get<T extends Plugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T | undefined;
  }

  getByType<T extends Plugin>(type: T['type']): T[] {
    return Array.from(this.plugins.values()).filter(
      (p): p is T => p.type === type
    );
  }

  list(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(
      ({ id, name, version, author, description }) => ({
        id, name, version, author, description,
      })
    );
  }
}

export const pluginRegistry = new PluginRegistry();
```

### Dynamic Plugin Loading

```typescript
// src/plugins/loader.ts
import { Plugin } from './types';
import { pluginRegistry } from './PluginRegistry';

interface PluginConfig {
  id: string;
  url: string;
  enabled: boolean;
}

export async function loadPlugin(config: PluginConfig): Promise<void> {
  if (!config.enabled) return;

  try {
    // Dynamic import from URL (requires proper CORS and CSP)
    const module = await import(/* webpackIgnore: true */ config.url);
    const plugin: Plugin = module.default;

    // Validate plugin structure
    if (!plugin.id || !plugin.name || !plugin.type) {
      throw new Error(`Invalid plugin structure: ${config.id}`);
    }

    pluginRegistry.register(plugin);
    console.log(`Plugin loaded: ${plugin.name} v${plugin.version}`);
  } catch (error) {
    console.error(`Failed to load plugin ${config.id}:`, error);
  }
}

export async function loadPlugins(configs: PluginConfig[]): Promise<void> {
  await Promise.allSettled(configs.map(loadPlugin));
}
```

### Inversion of Control with Context

React's Context API provides lightweight dependency injection:

```typescript
// src/context/ServicesContext.tsx
import { createContext, useContext, ReactNode } from 'react';

interface CardDataService {
  fetchCards(): Promise<Card[]>;
  fetchCard(id: string): Promise<Card>;
}

interface ImageService {
  getImageUrl(card: Card): string;
  preloadImage(url: string): Promise<void>;
}

interface Services {
  cardData: CardDataService;
  images: ImageService;
}

const ServicesContext = createContext<Services | null>(null);

interface ServicesProviderProps {
  children: ReactNode;
  services: Services;
}

export function ServicesProvider({ children, services }: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): Services {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return context;
}

// Usage for testing - inject mocks
const mockServices: Services = {
  cardData: {
    fetchCards: async () => mockCards,
    fetchCard: async (id) => mockCards.find(c => c.id === id)!,
  },
  images: {
    getImageUrl: (card) => card.imageUrl,
    preloadImage: async () => {},
  },
};

<ServicesProvider services={mockServices}>
  <App />
</ServicesProvider>
```

### Module Boundaries and Public APIs

```typescript
// src/features/cards/index.ts
// ✅ Export only public API

// Components - what consumers can render
export { Card } from './components/Card';
export { CardGrid } from './components/CardGrid';

// Hooks - what consumers can use
export { useCards } from './hooks/useCards';

// Types - what consumers need for TypeScript
export type { Card, CardCollection } from './types';

// ❌ Don't export internal implementation
// export { CardInner } from './components/Card/CardInner';
// export { calculateCardPosition } from './utils/positioning';
```

### Barrel Files and Tree Shaking

```typescript
// src/features/index.ts
// Re-export from feature modules for convenient imports

// Named exports for tree shaking
export { Card, CardGrid, useCards } from './cards';
export { SettingsProvider, useSettings } from './settings';
export { ThemeProvider, useTheme } from './themes';

// Types
export type { Card as CardType, CardCollection } from './cards';
export type { Settings } from './settings';
export type { Theme } from './themes';
```

## Recommendations for Itemdeck

### Priority 1: Compound Components for Card

1. **Refactor Card** into compound component (Card.Front, Card.Back, Card.FlipButton)
2. **Use Context** for shared flip state
3. **Export via index.ts** for clean imports

### Priority 2: Feature-Based Structure

1. **Organise by feature** (cards, settings, themes, data-sources)
2. **Define public APIs** via index.ts barrel files
3. **Keep internal implementation private**

### Priority 3: Code Splitting

1. **Lazy load settings panel** - not needed on initial render
2. **Lazy load card detail modal** - loaded on demand
3. **Use Suspense** with loading fallbacks

### Priority 4: Slot-Based Customisation (Future)

1. **Create CardTemplate** with typed slots
2. **Allow custom layouts** via configuration
3. **Support user-defined templates**

### Priority 5: Plugin System (Future)

1. **Design plugin interface** when third-party needs emerge
2. **Start with layout plugins** for custom card templates
3. **Add data source plugins** for new integrations

## Implementation Considerations

### Dependencies

No additional dependencies for core patterns. Optional:

```json
{
  "devDependencies": {
    "@loadable/component": "^5.x"
  }
}
```

### Bundle Size Impact

- Compound components: No additional bundle size
- Code splitting: Reduces initial bundle size
- Plugin system: Adds ~2KB for registry

### Security Considerations

- **Validate plugin sources** before loading
- **Use CSP** to restrict script sources
- **Sanitise plugin configurations**

See [System Security](./system-security.md) for detailed security requirements.

### Breaking Changes

Refactoring to compound components:
- Old: `<Card card={card} />` → New: `<Card><Card.Front>...</Card.Front></Card>`
- Provide migration guide
- Consider backwards-compatible wrapper

### Migration Path

1. Create new compound Card alongside existing
2. Update CardGrid to support both patterns
3. Migrate usage incrementally
4. Remove old Card component

## References

- [React Compound Components](https://www.patterns.dev/react/compound-pattern/)
- [Building Component Slots in React](https://sandroroth.com/blog/react-slots/)
- [React Pluggable](https://react-pluggable.github.io/)
- [Code Splitting - React](https://legacy.reactjs.org/docs/code-splitting.html)
- [React.lazy Documentation](https://react.dev/reference/react/lazy)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [InversifyJS](https://github.com/inversify/InversifyJS)
- [React Built-in DI](https://marmelab.com/blog/2019/03/13/react-dependency-injection.html)

---

## Related Documentation

### Research
- [Customisation Options](./customisation-options.md) - User-facing configuration
- [Testing Strategies](./testing-strategies.md) - Testing modular components
- [Performance & Virtualisation](./performance-virtualisation.md) - Code splitting benefits

### Milestones
- [v1.5.0](../roadmap/milestones/v1.5.0.md) - Plugin ecosystem milestone

### Decisions
- [ADR-016: Gaming Mechanics Plugin Architecture](../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md) - Plugin system design

---

**Applies to**: Itemdeck v0.1.0+
