# F-010: Theme System

## Problem Statement

Users have different visual preferences and accessibility needs. Currently:

1. No dark/light mode switching
2. Hard-coded colours throughout the codebase
3. System preference (prefers-color-scheme) not respected
4. No way to customise appearance

## Design Approach

Implement a **CSS custom properties-based theming** system with three modes: light, dark, and auto (system):

### Design Tokens

```typescript
// src/design-tokens/tokens.ts
export interface DesignTokens {
  colours: {
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
}
```

### CSS Custom Properties

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

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

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
    --colour-text-primary: #f1f5f9;
    /* ... other dark values */
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      setModeState(stored);
    }
  }, []);

  useEffect(() => {
    const updateResolved = () => {
      if (mode === 'auto') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(mode);
      }
    };

    updateResolved();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolved);
    return () => mediaQuery.removeEventListener('change', updateResolved);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'auto'];
    const nextMode = modes[(modes.indexOf(mode) + 1) % modes.length];
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

export function ThemeToggle() {
  const { mode, resolvedTheme, setMode } = useTheme();

  return (
    <div role="radiogroup" aria-label="Theme selection">
      <button
        onClick={() => setMode('light')}
        aria-pressed={mode === 'light'}
        title="Light mode"
      >
        <SunIcon />
      </button>
      <button
        onClick={() => setMode('dark')}
        aria-pressed={mode === 'dark'}
        title="Dark mode"
      >
        <MoonIcon />
      </button>
      <button
        onClick={() => setMode('auto')}
        aria-pressed={mode === 'auto'}
        title={`Auto (currently ${resolvedTheme})`}
      >
        <SystemIcon />
      </button>
    </div>
  );
}
```

## Implementation Tasks

- [ ] Create `src/design-tokens/tokens.ts` with TypeScript interfaces
- [ ] Create `src/design-tokens/themes.ts` with light/dark definitions
- [ ] Create `src/styles/theme.css` with CSS custom properties
- [ ] Create `ThemeContext` and `ThemeProvider` components
- [ ] Create `useTheme` hook
- [ ] Create `ThemeToggle` component with icons
- [ ] Add `ThemeProvider` to main.tsx
- [ ] Persist theme preference to localStorage
- [ ] Listen for system preference changes
- [ ] Update existing components to use CSS variables
- [ ] Ensure WCAG contrast compliance in both themes
- [ ] Write unit tests for ThemeContext
- [ ] Write visual regression tests for themes

## Success Criteria

- [ ] Three-way theme toggle works (light/dark/auto)
- [ ] Auto mode respects system preference
- [ ] System preference changes detected in real-time
- [ ] Theme persists across page reloads
- [ ] All colours use CSS custom properties
- [ ] Smooth transitions between themes
- [ ] WCAG 2.1 AA contrast requirements met
- [ ] Screen readers announce theme changes
- [ ] Tests pass

## Dependencies

- **Requires**: v0.2.0 complete
- **Blocks**: F-013 Settings Panel

## Complexity

**Medium** - Requires systematic replacement of hard-coded colours and careful accessibility testing.

---

## Related Documentation

- [Customisation Options Research](../../../../research/customisation-options.md)
- [Accessibility Research](../../../../research/accessibility.md)
- [ADR-005: CSS Custom Properties for Theming](../../../decisions/adrs/ADR-005-theming-approach.md)
- [v0.3.0 Milestone](../../milestones/v0.3.md)
