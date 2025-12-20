# F-002: Configuration System

## Problem Statement

Card dimensions and layout settings are currently hardcoded or managed through React Context without validation. The application needs a robust configuration system that:

1. Validates configuration values with TypeScript types
2. Supports multiple configuration sources (defaults, remote, user)
3. Provides sensible fallbacks when values are missing
4. Enables runtime configuration changes

## Design Approach

Implement a **cascade configuration system** using **Zod** for schema validation:

```
Priority (highest to lowest):
1. User preferences (localStorage)
2. Remote configuration (URL)
3. Environment variables
4. Application defaults
```

### Configuration Schema

```typescript
import { z } from 'zod';

export const CardConfigSchema = z.object({
  width: z.number().min(100).max(600).default(300),
  height: z.number().min(140).max(840).default(420),
  gap: z.number().min(0).max(100).default(16),
  borderRadius: z.number().min(0).max(50).default(8),
});

export const LayoutConfigSchema = z.object({
  maxColumns: z.number().min(1).max(20).optional(),
  minColumns: z.number().min(1).max(10).default(1),
  centreGrid: z.boolean().default(true),
});

export const AnimationConfigSchema = z.object({
  flipDuration: z.number().min(0).max(2).default(0.6),
  transitionDuration: z.number().min(0).max(1).default(0.3),
  enableAnimations: z.boolean().default(true),
});

export const AppConfigSchema = z.object({
  card: CardConfigSchema.default({}),
  layout: LayoutConfigSchema.default({}),
  animation: AnimationConfigSchema.default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
```

### Configuration Provider

```tsx
import { createContext, useContext, useMemo } from 'react';

interface ConfigContextValue {
  config: AppConfig;
  updateConfig: (updates: DeepPartial<AppConfig>) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children, initialConfig }) {
  const [userConfig, setUserConfig] = useState<Partial<AppConfig>>({});

  const config = useMemo(() => {
    const merged = deepMerge(DEFAULT_CONFIG, initialConfig, userConfig);
    return AppConfigSchema.parse(merged);
  }, [initialConfig, userConfig]);

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
}
```

### Deep Merge Utility

```typescript
function deepMerge<T extends object>(...sources: Array<Partial<T> | undefined>): T {
  const result = {} as T;

  for (const source of sources) {
    if (!source) continue;

    for (const key in source) {
      const value = source[key];
      if (value !== undefined) {
        if (isObject(value) && isObject(result[key])) {
          result[key] = deepMerge(result[key], value);
        } else {
          result[key] = value;
        }
      }
    }
  }

  return result;
}
```

## Implementation Tasks

- [ ] Install Zod: `npm install zod`
- [ ] Create `src/schemas/config.ts` with Zod schemas
- [ ] Create `src/utils/deepMerge.ts` utility
- [ ] Create `ConfigProvider` component
- [ ] Create `useConfig` hook
- [ ] Migrate SettingsContext to use ConfigProvider
- [ ] Add validation error handling and logging
- [ ] Create config loading from localStorage
- [ ] Add config reset functionality
- [ ] Write unit tests for schema validation
- [ ] Write tests for deep merge utility

## Success Criteria

- [ ] All config values validated at runtime
- [ ] Invalid values fall back to defaults (no crashes)
- [ ] TypeScript types inferred from Zod schemas
- [ ] Config persists across page refreshes
- [ ] Config can be updated at runtime
- [ ] Validation errors logged in development
- [ ] Tests pass with edge cases

## Dependencies

- **Requires**: None (can be developed in parallel with F-001)
- **Blocks**: F-003 Image Fallback (uses config for defaults)

## Complexity

**Medium** - New dependency and architectural pattern, but isolated scope.

---

## Related Documentation

- [Configuration Hierarchy Research](../../../../research/configuration-hierarchy.md)
- [ADR-002: Schema Validation](../../../decisions/adrs/ADR-002-schema-validation.md)
- [v0.1.0 Milestone](../../milestones/v0.1.0.md)
