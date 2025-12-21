/**
 * Configuration context provider.
 *
 * Provides validated application configuration with:
 * - localStorage persistence
 * - Runtime updates with validation
 * - Reset to defaults functionality
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type AppConfig,
  type DeepPartialAppConfig,
  DEFAULT_CONFIG,
  parseConfig,
  validatePartialConfig,
} from "@/schemas/config.schema";
import { deepMerge } from "@/utils/deepMerge";

const STORAGE_KEY = "itemdeck-config";

interface ConfigContextValue {
  /** Current validated configuration */
  config: AppConfig;

  /** Update configuration with partial values (validated and persisted) */
  updateConfig: (partial: DeepPartialAppConfig) => void;

  /** Reset configuration to defaults */
  resetConfig: () => void;

  /** Whether config has been modified from defaults */
  isModified: boolean;
}

export const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  children: ReactNode;

  /** Optional initial config override (for testing) */
  initialConfig?: Partial<AppConfig>;
}

/**
 * Load configuration from localStorage.
 */
function loadFromStorage(): AppConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      return parseConfig(parsed);
    }
  } catch {
    // Ignore storage errors, use defaults
    if (import.meta.env.DEV) {
      console.warn("Failed to load config from localStorage");
    }
  }
  return DEFAULT_CONFIG;
}

/**
 * Save configuration to localStorage.
 */
function saveToStorage(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    if (import.meta.env.DEV) {
      console.warn("Failed to save config to localStorage");
    }
  }
}

/**
 * Check if config differs from defaults.
 */
function hasModifications(config: AppConfig): boolean {
  return JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG);
}

export function ConfigProvider({
  children,
  initialConfig,
}: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig>(() => {
    // Use initial override if provided, otherwise load from storage
    if (initialConfig) {
      return parseConfig(deepMerge(DEFAULT_CONFIG, initialConfig));
    }
    return loadFromStorage();
  });

  // Persist config changes to localStorage
  useEffect(() => {
    saveToStorage(config);
  }, [config]);

  const updateConfig = useCallback((partial: DeepPartialAppConfig) => {
    const validated = validatePartialConfig(partial);
    if (validated) {
      setConfig((current) => {
        const updated = deepMerge(current, validated);
        return parseConfig(updated);
      });
    }
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const isModified = useMemo(() => hasModifications(config), [config]);

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      updateConfig,
      resetConfig,
      isModified,
    }),
    [config, updateConfig, resetConfig, isModified]
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}
