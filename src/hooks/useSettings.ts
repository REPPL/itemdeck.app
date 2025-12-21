import { useMemo } from "react";
import { useConfig } from "@/hooks/useConfig";
import {
  type AppSettings,
  type CardSettings,
  DEFAULT_APP_SETTINGS,
} from "@/types/settings";

interface UseSettingsResult {
  settings: AppSettings;
  cardDimensions: { width: number; height: number };
  updateCardSettings: (updates: Partial<CardSettings>) => void;
}

/**
 * Hook to manage application settings.
 *
 * Settings are now derived from ConfigContext.
 * This hook provides backwards compatibility with the existing SettingsContext API.
 */
export function useSettings(): UseSettingsResult {
  const { config, updateConfig } = useConfig();

  // Derive settings from config
  const settings = useMemo<AppSettings>(() => {
    return {
      card: {
        width: config.card.width,
        // Convert aspectRatio number to ratio tuple (approximate)
        ratio: [1, config.card.aspectRatio] as [number, number],
        logoUrl: config.card.logoUrl,
      },
    };
  }, [config.card]);

  // Calculate dimensions from config
  const cardDimensions = useMemo(() => {
    return {
      width: config.card.width,
      height: Math.round(config.card.width * config.card.aspectRatio),
    };
  }, [config.card.width, config.card.aspectRatio]);

  // Update config when card settings change
  const updateCardSettings = (updates: Partial<CardSettings>) => {
    const cardUpdates: Partial<typeof config.card> = {};

    if (updates.width !== undefined) {
      cardUpdates.width = updates.width;
    }

    if (updates.ratio !== undefined) {
      // Convert ratio tuple to aspectRatio number
      const [w, h] = updates.ratio;
      cardUpdates.aspectRatio = h / w;
    }

    if (updates.logoUrl !== undefined) {
      cardUpdates.logoUrl = updates.logoUrl;
    }

    if (Object.keys(cardUpdates).length > 0) {
      updateConfig({ card: cardUpdates });
    }
  };

  return {
    settings,
    cardDimensions,
    updateCardSettings,
  };
}

/**
 * Standalone hook for components that only need config.
 * Returns default settings when used outside ConfigProvider.
 */
export function useSettingsWithDefaults(): UseSettingsResult {
  try {
    return useSettings();
  } catch {
    // Fallback for components outside ConfigProvider
    return {
      settings: DEFAULT_APP_SETTINGS,
      cardDimensions: {
        width: DEFAULT_APP_SETTINGS.card.width,
        height: Math.round(
          DEFAULT_APP_SETTINGS.card.width *
            (DEFAULT_APP_SETTINGS.card.ratio[1] /
              DEFAULT_APP_SETTINGS.card.ratio[0])
        ),
      },
      updateCardSettings: () => {
        /* no-op outside provider */
      },
    };
  }
}
