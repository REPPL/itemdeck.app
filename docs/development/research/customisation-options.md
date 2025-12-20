# Customisation Options

## Executive Summary

For Itemdeck's customisation system, implement a **CSS custom properties-based theming** approach with **design tokens**, supporting dark/light/auto modes. Provide **layout presets** (grid, masonry, list) with user-selectable card templates. Expose customisation through a structured settings UI.

Key recommendations:
1. Use CSS custom properties (variables) for all themeable values
2. Implement three-way theme switching: light, dark, system auto
3. Create layout presets with smooth transitions between views
4. Allow card template selection for different content types

## Current State in Itemdeck

Itemdeck currently uses:
- **CSS Modules** for component styling
- **SettingsContext** for card dimensions
- **CSS variables** defined in `:root` (limited)
- **No theme switching** capability
- **Single grid layout** - no alternatives

Basic customisation exists but is limited to card size.

## Research Findings

### Theming Approaches Comparison

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| CSS Custom Properties | No JS overhead, native | Limited transforms | Simple themes |
| styled-components Theme | Type-safe, dynamic | Bundle size, JS overhead | Complex themes |
| Tailwind CSS | Utility classes, JIT | Learning curve | Rapid development |
| Design Tokens + Style Dictionary | Cross-platform | Build complexity | Design systems |

**Recommendation:** CSS custom properties for Itemdeck's needs, with optional styled-components for complex dynamic theming.

### Design Token Structure

```typescript
// src/design-tokens/tokens.ts
export interface DesignTokens {
  colours: {
    // Semantic colours
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
    // Status colours
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
  card: {
    width: number;
    height: number;
    gap: number;
    borderRadius: string;
  };
}
```

### Theme Definitions

```typescript
// src/design-tokens/themes.ts
import type { DesignTokens } from './tokens';

const baseTokens = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  typography: {
    fontFamily: {
      sans: 'system-ui, -apple-system, sans-serif',
      mono: 'ui-monospace, "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px',
  },
  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
  card: {
    width: 300,
    height: 420,
    gap: 16,
    borderRadius: '0.5rem',
  },
};

export const lightTheme: DesignTokens = {
  ...baseTokens,
  colours: {
    background: '#ffffff',
    surface: '#f8fafc',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      muted: '#94a3b8',
    },
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

export const darkTheme: DesignTokens = {
  ...baseTokens,
  colours: {
    background: '#0f172a',
    surface: '#1e293b',
    primary: '#818cf8',
    secondary: '#a78bfa',
    accent: '#f472b6',
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#64748b',
    },
    border: '#334155',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  },
};
```

### CSS Custom Properties Implementation

```css
/* src/styles/theme.css */
:root {
  /* Colours - Light theme as default */
  --colour-background: #ffffff;
  --colour-surface: #f8fafc;
  --colour-primary: #6366f1;
  --colour-secondary: #8b5cf6;
  --colour-accent: #ec4899;
  --colour-text-primary: #1e293b;
  --colour-text-secondary: #475569;
  --colour-text-muted: #94a3b8;
  --colour-border: #e2e8f0;
  --colour-success: #22c55e;
  --colour-warning: #f59e0b;
  --colour-error: #ef4444;
  --colour-info: #3b82f6;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, "Fira Code", monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;

  /* Card Defaults */
  --card-width: 300px;
  --card-height: 420px;
  --card-gap: 16px;
  --card-radius: 0.5rem;
}

/* Dark theme */
[data-theme="dark"] {
  --colour-background: #0f172a;
  --colour-surface: #1e293b;
  --colour-primary: #818cf8;
  --colour-secondary: #a78bfa;
  --colour-accent: #f472b6;
  --colour-text-primary: #f1f5f9;
  --colour-text-secondary: #cbd5e1;
  --colour-text-muted: #64748b;
  --colour-border: #334155;
  --colour-success: #4ade80;
  --colour-warning: #fbbf24;
  --colour-error: #f87171;
  --colour-info: #60a5fa;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}

/* System preference detection */
@media (prefers-color-scheme: dark) {
  [data-theme="auto"] {
    --colour-background: #0f172a;
    --colour-surface: #1e293b;
    --colour-primary: #818cf8;
    --colour-secondary: #a78bfa;
    --colour-accent: #f472b6;
    --colour-text-primary: #f1f5f9;
    --colour-text-secondary: #cbd5e1;
    --colour-text-muted: #64748b;
    --colour-border: #334155;
    --colour-success: #4ade80;
    --colour-warning: #fbbf24;
    --colour-error: #f87171;
    --colour-info: #60a5fa;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  }
}
```

### Theme Context

```tsx
// src/context/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'itemdeck-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }
  return 'auto';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const stored = getStoredTheme();
    return stored === 'auto' ? getSystemTheme() : stored;
  });

  // Update resolved theme when mode or system preference changes
  useEffect(() => {
    const updateResolved = () => {
      if (mode === 'auto') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(mode);
      }
    };

    updateResolved();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'auto') {
        setResolvedTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMode(nextMode);
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Theme Toggle Component

```tsx
// src/components/ThemeToggle/ThemeToggle.tsx
import { useTheme } from '../../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { mode, resolvedTheme, setMode } = useTheme();

  return (
    <div className={styles.container}>
      <button
        onClick={() => setMode('light')}
        className={`${styles.button} ${mode === 'light' ? styles.active : ''}`}
        aria-pressed={mode === 'light'}
        title="Light mode"
      >
        <SunIcon />
      </button>
      <button
        onClick={() => setMode('dark')}
        className={`${styles.button} ${mode === 'dark' ? styles.active : ''}`}
        aria-pressed={mode === 'dark'}
        title="Dark mode"
      >
        <MoonIcon />
      </button>
      <button
        onClick={() => setMode('auto')}
        className={`${styles.button} ${mode === 'auto' ? styles.active : ''}`}
        aria-pressed={mode === 'auto'}
        title={`Auto (currently ${resolvedTheme})`}
      >
        <SystemIcon />
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
```

### Layout Presets

```typescript
// src/types/layout.ts
export type LayoutType = 'grid' | 'masonry' | 'list' | 'compact';

export interface LayoutConfig {
  type: LayoutType;
  columns?: number;
  gap?: number;
  cardWidth?: number;
  cardHeight?: number;
  aspectRatio?: string;
}

export const layoutPresets: Record<LayoutType, LayoutConfig> = {
  grid: {
    type: 'grid',
    columns: 'auto', // auto-fill
    gap: 16,
    cardWidth: 300,
    cardHeight: 420,
  },
  masonry: {
    type: 'masonry',
    columns: 4,
    gap: 16,
    cardWidth: 280,
    // height varies
  },
  list: {
    type: 'list',
    columns: 1,
    gap: 8,
    cardWidth: undefined, // full width
    cardHeight: 100,
  },
  compact: {
    type: 'compact',
    columns: 'auto',
    gap: 8,
    cardWidth: 150,
    cardHeight: 210,
  },
};
```

### Layout Switcher Component

```tsx
// src/components/LayoutSwitcher/LayoutSwitcher.tsx
import { useSettings } from '../../context/SettingsContext';
import type { LayoutType } from '../../types/layout';
import styles from './LayoutSwitcher.module.css';

interface LayoutOption {
  type: LayoutType;
  label: string;
  icon: React.ReactNode;
}

const layoutOptions: LayoutOption[] = [
  { type: 'grid', label: 'Grid', icon: <GridIcon /> },
  { type: 'masonry', label: 'Masonry', icon: <MasonryIcon /> },
  { type: 'list', label: 'List', icon: <ListIcon /> },
  { type: 'compact', label: 'Compact', icon: <CompactIcon /> },
];

export function LayoutSwitcher() {
  const { layout, setLayout } = useSettings();

  return (
    <div className={styles.container} role="radiogroup" aria-label="Layout options">
      {layoutOptions.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => setLayout(type)}
          className={`${styles.button} ${layout === type ? styles.active : ''}`}
          role="radio"
          aria-checked={layout === type}
          title={label}
        >
          {icon}
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function MasonryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7" height="10" rx="1" />
      <rect x="14" y="3" width="7" height="6" rx="1" />
      <rect x="3" y="15" width="7" height="6" rx="1" />
      <rect x="14" y="11" width="7" height="10" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
    </svg>
  );
}

function CompactIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="10" y="3" width="5" height="5" rx="1" />
      <rect x="17" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="10" width="5" height="5" rx="1" />
      <rect x="10" y="10" width="5" height="5" rx="1" />
      <rect x="17" y="10" width="5" height="5" rx="1" />
    </svg>
  );
}
```

### Masonry Layout Component

```tsx
// src/components/MasonryGrid/MasonryGrid.tsx
import { useMemo, ReactNode, CSSProperties } from 'react';
import styles from './MasonryGrid.module.css';

interface MasonryGridProps {
  children: ReactNode[];
  columns?: number;
  gap?: number;
}

export function MasonryGrid({ children, columns = 4, gap = 16 }: MasonryGridProps) {
  const columnItems = useMemo(() => {
    const cols: ReactNode[][] = Array.from({ length: columns }, () => []);

    children.forEach((child, index) => {
      cols[index % columns].push(child);
    });

    return cols;
  }, [children, columns]);

  const style: CSSProperties = {
    '--masonry-columns': columns,
    '--masonry-gap': `${gap}px`,
  } as CSSProperties;

  return (
    <div className={styles.container} style={style}>
      {columnItems.map((items, colIndex) => (
        <div key={colIndex} className={styles.column}>
          {items}
        </div>
      ))}
    </div>
  );
}
```

```css
/* src/components/MasonryGrid/MasonryGrid.module.css */
.container {
  display: flex;
  gap: var(--masonry-gap);
  width: 100%;
}

.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--masonry-gap);
}
```

### Card Template System

```typescript
// src/types/cardTemplate.ts
export type CardTemplateId = 'standard' | 'minimal' | 'detailed' | 'image-only';

export interface CardTemplate {
  id: CardTemplateId;
  name: string;
  description: string;
  slots: string[];
  aspectRatio: string;
}

export const cardTemplates: Record<CardTemplateId, CardTemplate> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Image with title overlay',
    slots: ['image', 'title', 'category'],
    aspectRatio: '5 / 7',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean image only',
    slots: ['image'],
    aspectRatio: '5 / 7',
  },
  detailed: {
    id: 'detailed',
    name: 'Detailed',
    description: 'Image with full metadata',
    slots: ['image', 'title', 'description', 'tags', 'actions'],
    aspectRatio: '3 / 4',
  },
  'image-only': {
    id: 'image-only',
    name: 'Image Only',
    description: 'Borderless image',
    slots: ['image'],
    aspectRatio: 'auto',
  },
};
```

### Settings Panel Component

```tsx
// src/components/SettingsPanel/SettingsPanel.tsx
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { LayoutSwitcher } from '../LayoutSwitcher/LayoutSwitcher';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { cardWidth, cardHeight, gap, setCardWidth, setCardHeight, setGap } = useSettings();

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h2>Settings</h2>
        <button onClick={onClose} aria-label="Close settings">×</button>
      </header>

      <section className={styles.section}>
        <h3>Theme</h3>
        <ThemeToggle />
      </section>

      <section className={styles.section}>
        <h3>Layout</h3>
        <LayoutSwitcher />
      </section>

      <section className={styles.section}>
        <h3>Card Size</h3>
        <div className={styles.sliderGroup}>
          <label>
            Width: {cardWidth}px
            <input
              type="range"
              min={150}
              max={500}
              value={cardWidth}
              onChange={(e) => setCardWidth(Number(e.target.value))}
            />
          </label>
          <label>
            Height: {cardHeight}px
            <input
              type="range"
              min={200}
              max={700}
              value={cardHeight}
              onChange={(e) => setCardHeight(Number(e.target.value))}
            />
          </label>
          <label>
            Gap: {gap}px
            <input
              type="range"
              min={0}
              max={50}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h3>Accessibility</h3>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          Reduce motion
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          High contrast
        </label>
      </section>
    </div>
  );
}
```

### User Custom Styles (Safe CSS Injection)

```typescript
// src/utils/customStyles.ts
import { z } from 'zod';

// Schema for safe CSS properties
const SafeCSSSchema = z.object({
  accentColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.enum(['system', 'serif', 'mono']).optional(),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional(),
  cardOpacity: z.number().min(0).max(1).optional(),
});

export type SafeCSS = z.infer<typeof SafeCSSSchema>;

export function applyCustomStyles(styles: SafeCSS): void {
  const result = SafeCSSSchema.safeParse(styles);
  if (!result.success) {
    console.warn('Invalid custom styles:', result.error);
    return;
  }

  const root = document.documentElement;
  const { data } = result;

  if (data.accentColour) {
    root.style.setProperty('--colour-primary', data.accentColour);
    root.style.setProperty('--colour-accent', data.accentColour);
  }

  if (data.backgroundColour) {
    root.style.setProperty('--colour-background', data.backgroundColour);
  }

  if (data.fontFamily) {
    const fontMap = {
      system: 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: 'ui-monospace, "Fira Code", monospace',
    };
    root.style.setProperty('--font-sans', fontMap[data.fontFamily]);
  }

  if (data.borderRadius) {
    const radiusMap = {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem',
      full: '9999px',
    };
    root.style.setProperty('--card-radius', radiusMap[data.borderRadius]);
  }
}

export function resetCustomStyles(): void {
  const root = document.documentElement;
  root.style.removeProperty('--colour-primary');
  root.style.removeProperty('--colour-accent');
  root.style.removeProperty('--colour-background');
  root.style.removeProperty('--font-sans');
  root.style.removeProperty('--card-radius');
}
```

### Masonry Library Comparison

| Library | Weekly Downloads | Bundle Size | TypeScript | Virtual Scroll |
|---------|-----------------|-------------|------------|----------------|
| [react-masonry-css](https://www.npmjs.com/package/react-masonry-css) | 150k | 2KB | ⚠️ @types | ❌ |
| [masonic](https://github.com/jaredLunde/masonic) | 30k | 8KB | ✅ Native | ✅ |
| [react-plock](https://github.com/askides/react-plock) | 5k | 1KB | ✅ Native | ❌ |
| MUI Masonry | Part of MUI | ~10KB | ✅ Native | ❌ |

**Recommendation:** Start with CSS-based masonry (no dependency), evaluate `masonic` if virtualisation needed.

## Recommendations for Itemdeck

### Priority 1: CSS Custom Properties Theme

1. **Define design tokens** as CSS custom properties
2. **Implement light/dark/auto themes** with `data-theme` attribute
3. **Create ThemeContext** for React access
4. **Persist preference** in localStorage

### Priority 2: Theme Toggle UI

1. **Create ThemeToggle component** with three-way selection
2. **Listen for system preference** changes
3. **Animate transitions** between themes
4. **Show resolved theme** for auto mode

### Priority 3: Layout Presets

1. **Implement grid, masonry, list, compact** layouts
2. **Create LayoutSwitcher component** for selection
3. **Animate between layouts** smoothly
4. **Persist layout preference**

### Priority 4: Settings Panel

1. **Create comprehensive settings UI**
2. **Group settings** by category
3. **Provide visual previews** where useful
4. **Allow reset to defaults**

### Priority 5: External Configuration

1. **Support accent colour** from external config
2. **Allow card template** selection
3. **Validate custom styles** with Zod
4. **Never execute arbitrary CSS**

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {},
  "optionalDependencies": {
    "masonic": "^3.x"
  }
}
```

### Bundle Size Impact

- CSS custom properties: 0KB JS
- ThemeContext: ~1KB
- Masonry (CSS-only): 0KB

### Accessibility

- Ensure sufficient colour contrast in all themes
- Respect `prefers-reduced-motion`
- Announce theme changes to screen readers
- Keyboard-navigable settings

See [Accessibility](./accessibility.md) for detailed requirements.

### Breaking Changes

None - additive features to existing system.

### Migration Path

1. Add CSS custom properties to existing styles
2. Wrap app in ThemeProvider
3. Replace hard-coded values with variables
4. Add layout switching capability

## References

- [CSS Variables for React Devs - Josh W. Comeau](https://www.joshwcomeau.com/css/css-variables-for-react-devs/)
- [Design Tokens and Theming](https://debbie.codes/blog/design-tokens-and-theming/)
- [Dark Mode Toggle with React](https://css-tricks.com/a-dark-mode-toggle-with-react-and-themeprovider/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [Theming styled-components with CSS custom properties](https://daily.dev/blog/theming-styled-components-with-css-custom-properties)
- [masonic - High-performance masonry](https://github.com/jaredLunde/masonic)
- [react-masonry-css](https://www.npmjs.com/package/react-masonry-css)

---

## Related Documentation

### Research
- [Configuration Hierarchy](./configuration-hierarchy.md) - External theme configuration
- [Accessibility](./accessibility.md) - Theme accessibility requirements
- [State Persistence](./state-persistence.md) - Storing user preferences

### Features (implement this research)
- [F-010: Theme System](../development/roadmap/features/planned/F-010-theme-system.md)
- [F-011: Layout Presets](../development/roadmap/features/planned/F-011-layout-presets.md)
- [F-012: State Persistence](../development/roadmap/features/planned/F-012-state-persistence.md)
- [F-013: Settings Panel](../development/roadmap/features/planned/F-013-settings-panel.md)

### Decisions
- [ADR-005: CSS Custom Properties for Theming](../development/decisions/adrs/ADR-005-theming-approach.md)
