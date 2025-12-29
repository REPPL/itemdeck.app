# Configuration Hierarchy

## Executive Summary

For Itemdeck's configuration system, implement a **cascading configuration pattern** inspired by CSS specificity: defaults → app config → user preferences → URL parameters. Use **Zod** for runtime validation and type inference, avoiding hard-coded defaults by externalising all configuration.

Key recommendations:
1. Define configuration schemas with Zod for both validation and TypeScript types
2. Implement a cascade of sources: bundled defaults → remote config → localStorage → URL params
3. Use React Context with deep merging for configuration propagation
4. Consider feature flags for experimental features via services like Flagsmith

## Current State in Itemdeck

Itemdeck currently uses:
- **SettingsContext** in `src/context/SettingsContext.tsx` for card dimensions
- **Hard-coded defaults** for card width (300), height (420), gap (16)
- **No persistence** - settings reset on page reload
- **No external configuration** loading

Configuration is minimal and entirely internal.

## Research Findings

### Configuration Cascade Pattern

Inspired by CSS specificity, configuration can be layered with later sources overriding earlier ones:

```
Priority (low → high):
1. Built-in defaults (bundled with app)
2. Remote/app configuration (fetched from URL/GitHub)
3. User preferences (localStorage)
4. URL parameters (shareable states)
5. Runtime overrides (feature flags, A/B tests)
```

#### Cascade Visualisation

```
┌─────────────────────────────────────────┐
│           URL Parameters                │ ← Highest priority
├─────────────────────────────────────────┤
│         User Preferences                │ ← localStorage
├─────────────────────────────────────────┤
│         Remote Configuration            │ ← Fetched config.json
├─────────────────────────────────────────┤
│         Built-in Defaults               │ ← Bundled with app
└─────────────────────────────────────────┘
```

### Zod for Schema Validation

Zod provides:
- **Runtime validation** for external data
- **TypeScript type inference** from schemas (single source of truth)
- **Transformation and coercion** for URL parameters
- **Error messages** for invalid configuration

#### Why Zod?

| Feature | Zod | io-ts | Yup |
|---------|-----|-------|-----|
| TypeScript-first | ✅ | ✅ | ⚠️ |
| Type inference | ✅ Excellent | ✅ | ⚠️ Limited |
| Zero dependencies | ✅ | ❌ | ❌ |
| Bundle size | ~12KB | ~8KB | ~20KB |
| Transforms | ✅ | ⚠️ | ✅ |
| Async validation | ✅ | ✅ | ✅ |

### Feature Flags Services

| Service | Open Source | Self-hosted | React SDK | Free Tier |
|---------|-------------|-------------|-----------|-----------|
| [Flagsmith](https://flagsmith.com/) | ✅ | ✅ | ✅ | 50k requests/mo |
| [LaunchDarkly](https://launchdarkly.com/) | ❌ | ❌ | ✅ | Trial only |
| [Unleash](https://www.getunleash.io/) | ✅ | ✅ | ✅ | Unlimited (self-hosted) |
| [ConfigCat](https://configcat.com/) | ❌ | ❌ | ✅ | 10 flags |
| [Split.io](https://www.split.io/) | ❌ | ❌ | ✅ | 10 seats |

**Recommendation:** Flagsmith for its open-source option and generous free tier.

### Code Examples

#### Configuration Schema with Zod

```typescript
// src/config/schema.ts
import { z } from 'zod';

// Card display configuration
export const CardConfigSchema = z.object({
  width: z.number().min(100).max(600).default(300),
  height: z.number().min(140).max(840).default(420),
  gap: z.number().min(0).max(100).default(16),
  borderRadius: z.number().min(0).max(50).default(8),
});

// Animation configuration
export const AnimationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  flipDuration: z.number().min(100).max(2000).default(600),
  hoverScale: z.number().min(1).max(1.2).default(1.02),
  reducedMotion: z.enum(['auto', 'always', 'never']).default('auto'),
});

// Data source configuration
export const DataSourceConfigSchema = z.object({
  type: z.enum(['local', 'github', 'url']).default('local'),
  github: z.object({
    owner: z.string().optional(),
    repo: z.string().optional(),
    path: z.string().optional(),
    branch: z.string().default('main'),
  }).optional(),
  url: z.string().url().optional(),
  cacheTime: z.number().min(0).default(300000), // 5 minutes
});

// Theme configuration
export const ThemeConfigSchema = z.object({
  mode: z.enum(['light', 'dark', 'auto']).default('auto'),
  accentColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
  backgroundColour: z.string().optional(),
});

// Complete app configuration
export const AppConfigSchema = z.object({
  card: CardConfigSchema.default({}),
  animation: AnimationConfigSchema.default({}),
  dataSource: DataSourceConfigSchema.default({}),
  theme: ThemeConfigSchema.default({}),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
});

// Infer TypeScript types from schemas
export type CardConfig = z.infer<typeof CardConfigSchema>;
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;
export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
```

#### Configuration Provider with Cascade

```typescript
// src/config/ConfigProvider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppConfig, AppConfigSchema } from './schema';
import { deepMerge } from '../utils/deepMerge';

interface ConfigContextValue {
  config: AppConfig;
  updateConfig: (partial: Partial<AppConfig>) => void;
  isLoading: boolean;
  error: Error | null;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

// Default configuration (bundled with app)
const BUNDLED_DEFAULTS: AppConfig = AppConfigSchema.parse({});

interface ConfigProviderProps {
  children: ReactNode;
  remoteConfigUrl?: string;
}

export function ConfigProvider({ children, remoteConfigUrl }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig>(BUNDLED_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        // Layer 1: Start with bundled defaults
        let mergedConfig = { ...BUNDLED_DEFAULTS };

        // Layer 2: Load remote configuration (if provided)
        if (remoteConfigUrl) {
          const remoteConfig = await fetchRemoteConfig(remoteConfigUrl);
          mergedConfig = deepMerge(mergedConfig, remoteConfig);
        }

        // Layer 3: Load user preferences from localStorage
        const userPrefs = loadUserPreferences();
        if (userPrefs) {
          mergedConfig = deepMerge(mergedConfig, userPrefs);
        }

        // Layer 4: Parse URL parameters
        const urlConfig = parseUrlParams();
        mergedConfig = deepMerge(mergedConfig, urlConfig);

        // Validate final merged configuration
        const validated = AppConfigSchema.parse(mergedConfig);
        setConfig(validated);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Config load failed'));
        // Fall back to bundled defaults on error
        setConfig(BUNDLED_DEFAULTS);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [remoteConfigUrl]);

  const updateConfig = (partial: Partial<AppConfig>) => {
    setConfig(prev => {
      const updated = deepMerge(prev, partial);
      const validated = AppConfigSchema.parse(updated);
      // Persist user preferences
      saveUserPreferences(validated);
      return validated;
    });
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
```

#### Deep Merge Utility

```typescript
// src/utils/deepMerge.ts
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export function deepMerge<T extends object>(
  target: T,
  source: DeepPartial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null
    ) {
      // Recursively merge nested objects
      (result as any)[key] = deepMerge(
        targetValue as object,
        sourceValue as DeepPartial<typeof targetValue>
      );
    } else if (sourceValue !== undefined) {
      // Override with source value
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}
```

#### Remote Configuration Fetching

```typescript
// src/config/remote.ts
import { AppConfigSchema, AppConfig } from './schema';

export async function fetchRemoteConfig(url: string): Promise<Partial<AppConfig>> {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-cache', // Always fetch fresh config
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.warn('Remote config not found, using defaults');
      return {};
    }
    throw new Error(`Failed to fetch config: ${response.status}`);
  }

  const data = await response.json();

  // Partial validation - allow missing fields
  const partialSchema = AppConfigSchema.deepPartial();
  const result = partialSchema.safeParse(data);

  if (!result.success) {
    console.error('Invalid remote config:', result.error.issues);
    throw new Error('Remote configuration validation failed');
  }

  return result.data;
}
```

#### User Preferences Persistence

```typescript
// src/config/storage.ts
import { AppConfig, AppConfigSchema } from './schema';

const STORAGE_KEY = 'itemdeck-preferences';

export function loadUserPreferences(): Partial<AppConfig> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const partialSchema = AppConfigSchema.deepPartial();
    const result = partialSchema.safeParse(parsed);

    if (!result.success) {
      console.warn('Invalid stored preferences, clearing');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

export function saveUserPreferences(config: AppConfig): void {
  try {
    // Only save user-customisable fields
    const userPrefs = {
      card: config.card,
      animation: config.animation,
      theme: config.theme,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPrefs));
  } catch (error) {
    console.warn('Failed to save preferences:', error);
  }
}

export function clearUserPreferences(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

#### URL Parameter Parsing

```typescript
// src/config/urlParams.ts
import { z } from 'zod';
import { AppConfig } from './schema';

// URL-safe schema with string coercion
const UrlConfigSchema = z.object({
  'card.width': z.coerce.number().min(100).max(600).optional(),
  'card.height': z.coerce.number().min(140).max(840).optional(),
  'card.gap': z.coerce.number().min(0).max(100).optional(),
  'theme.mode': z.enum(['light', 'dark', 'auto']).optional(),
  'animation.enabled': z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  'source': z.enum(['local', 'github', 'url']).optional(),
  'source.url': z.string().url().optional(),
});

export function parseUrlParams(): Partial<AppConfig> {
  const params = new URLSearchParams(window.location.search);
  const raw: Record<string, string> = {};

  params.forEach((value, key) => {
    raw[key] = value;
  });

  const result = UrlConfigSchema.safeParse(raw);
  if (!result.success) {
    console.warn('Invalid URL params:', result.error.issues);
    return {};
  }

  // Convert flat keys to nested object
  const config: Partial<AppConfig> = {};

  if (result.data['card.width'] || result.data['card.height'] || result.data['card.gap']) {
    config.card = {
      width: result.data['card.width'],
      height: result.data['card.height'],
      gap: result.data['card.gap'],
    } as any;
  }

  if (result.data['theme.mode']) {
    config.theme = { mode: result.data['theme.mode'] };
  }

  if (result.data['animation.enabled'] !== undefined) {
    config.animation = { enabled: result.data['animation.enabled'] };
  }

  return config;
}

export function updateUrlParams(config: Partial<AppConfig>): void {
  const params = new URLSearchParams(window.location.search);

  // Update URL without page reload
  if (config.card?.width) params.set('card.width', String(config.card.width));
  if (config.card?.height) params.set('card.height', String(config.card.height));
  if (config.theme?.mode) params.set('theme.mode', config.theme.mode);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}
```

#### Environment Variable Validation

```typescript
// src/config/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
  VITE_GITHUB_TOKEN: z.string().optional(),
  VITE_DEFAULT_CONFIG_URL: z.string().url().optional(),
  VITE_FEATURE_FLAGS_ENABLED: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .default('false'),
});

// Validate at startup
const result = EnvSchema.safeParse(import.meta.env);

if (!result.success) {
  console.error('Environment validation failed:', result.error.issues);
}

export const env = result.success ? result.data : EnvSchema.parse({});
```

#### Feature Flags with Flagsmith

```typescript
// src/config/featureFlags.ts
import flagsmith from 'flagsmith';
import { useEffect, useState } from 'react';

const FLAGSMITH_KEY = import.meta.env.VITE_FLAGSMITH_KEY;

interface FeatureFlags {
  enableCardFlip: boolean;
  enableDarkMode: boolean;
  enableGitHubSource: boolean;
  experimentalAnimations: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableCardFlip: true,
  enableDarkMode: true,
  enableGitHubSource: false,
  experimentalAnimations: false,
};

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);

  useEffect(() => {
    if (!FLAGSMITH_KEY) {
      console.warn('Flagsmith key not configured, using defaults');
      return;
    }

    flagsmith.init({
      environmentID: FLAGSMITH_KEY,
      onChange: () => {
        setFlags({
          enableCardFlip: flagsmith.hasFeature('enable_card_flip'),
          enableDarkMode: flagsmith.hasFeature('enable_dark_mode'),
          enableGitHubSource: flagsmith.hasFeature('enable_github_source'),
          experimentalAnimations: flagsmith.hasFeature('experimental_animations'),
        });
      },
    });
  }, []);

  return flags;
}

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[flag];
}
```

### Configuration File Formats

#### JSON Configuration (config.json)

```json
{
  "version": "1.0.0",
  "card": {
    "width": 280,
    "height": 392,
    "gap": 20,
    "borderRadius": 12
  },
  "animation": {
    "enabled": true,
    "flipDuration": 500,
    "reducedMotion": "auto"
  },
  "theme": {
    "mode": "auto",
    "accentColour": "#8b5cf6"
  },
  "dataSource": {
    "type": "github",
    "github": {
      "owner": "example",
      "repo": "card-collection",
      "path": "cards.json"
    }
  }
}
```

#### YAML Configuration (config.yaml)

```yaml
version: "1.0.0"

card:
  width: 280
  height: 392
  gap: 20
  borderRadius: 12

animation:
  enabled: true
  flipDuration: 500
  reducedMotion: auto

theme:
  mode: auto
  accentColour: "#8b5cf6"

dataSource:
  type: github
  github:
    owner: example
    repo: card-collection
    path: cards.json
```

### Combining Context Providers

```typescript
// src/providers/AppProviders.tsx
import { ReactNode, FC, ComponentProps } from 'react';
import { QueryProvider } from './QueryProvider';
import { ConfigProvider } from '../config/ConfigProvider';
import { ThemeProvider } from './ThemeProvider';

// Utility to combine providers without nesting hell
function combineProviders(...providers: FC<{ children: ReactNode }>[]): FC<{ children: ReactNode }> {
  return providers.reduce(
    (Accumulated, Current) => {
      return ({ children }: { children: ReactNode }) => (
        <Accumulated>
          <Current>{children}</Current>
        </Accumulated>
      );
    },
    ({ children }) => <>{children}</>
  );
}

const AppProviders = combineProviders(
  QueryProvider,
  ConfigProvider,
  ThemeProvider
);

export { AppProviders };

// Usage in main.tsx:
// <AppProviders>
//   <App />
// </AppProviders>
```

## Recommendations for Itemdeck

### Priority 1: Zod Schema Foundation

1. **Install Zod**: `npm install zod`
2. **Define configuration schemas** with sensible defaults
3. **Infer TypeScript types** from schemas (single source of truth)
4. **Add validation** for all external configuration

### Priority 2: Configuration Provider

1. **Create ConfigContext** with cascade loading
2. **Implement deep merge** utility for config layers
3. **Add localStorage persistence** for user preferences
4. **Support URL parameters** for shareable states

### Priority 3: Remote Configuration

1. **Support config.json** fetching from URL
2. **Add GitHub config** loading for collection-specific settings
3. **Implement graceful fallback** to defaults on error
4. **Cache remote config** with appropriate TTL

### Priority 4: Feature Flags (Optional)

1. **Evaluate Flagsmith** for experimental features
2. **Create useFeatureFlag hook** for conditional rendering
3. **Use for A/B testing** new UI patterns
4. **Keep flags short-lived** - remove after feature stabilises

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "zod": "^3.x"
  },
  "optionalDependencies": {
    "flagsmith": "^4.x"
  }
}
```

### Bundle Size Impact

- Zod: ~12KB gzipped
- Flagsmith: ~8KB gzipped

### Security Considerations

- **Never store secrets** in client-side config
- **Validate all external data** with Zod schemas
- **Use HTTPS** for remote configuration
- **Sanitise user input** before storing in localStorage

See [System Security](./system-security.md) for detailed security requirements.

### Breaking Changes

Migrating from current SettingsContext:
- Old: `useSettings()` → New: `useConfig().config.card`
- Add deprecation warning to old hook
- Provide migration guide

### Migration Path

1. Create new config system alongside existing SettingsContext
2. Migrate SettingsContext to use ConfigProvider internally
3. Update components to use new `useConfig()` hook
4. Remove SettingsContext after migration complete

## References

- [Zod Documentation](https://zod.dev/)
- [Zod TypeScript Schema Validation](https://blog.logrocket.com/schema-validation-typescript-zod/)
- [Flagsmith React SDK](https://docs.flagsmith.com/clients/react)
- [LaunchDarkly React SDK](https://docs.launchdarkly.com/sdk/client-side/react/react-web)
- [cascade-config npm](https://www.npmjs.com/package/cascade-config)
- [React Context Composition](https://www.sohamkamani.com/reactjs/combining-context/)

---

## Related Documentation

### Research
- [External Data Sources](./external-data-sources.md) - Remote config fetching
- [State Persistence](./state-persistence.md) - localStorage patterns
- [Customisation Options](./customisation-options.md) - User-facing settings

### Features
- [F-002: Configuration System](../roadmap/features/completed/F-002-configuration-system.md) - Configuration implementation
- [F-012: State Persistence](../roadmap/features/completed/F-012-state-persistence.md) - Persistence implementation

---

**Applies to**: Itemdeck v0.1.0+
