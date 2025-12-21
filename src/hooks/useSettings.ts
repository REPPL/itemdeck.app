import { useMemo } from "react";
import {
  type AppSettings,
  type CardSettings,
  DEFAULT_APP_SETTINGS,
} from "@/types/settings";
import {
  useSettingsStore,
  CARD_SIZE_WIDTHS,
  CARD_ASPECT_RATIOS,
} from "@/stores/settingsStore";

interface UseSettingsResult {
  settings: AppSettings;
  cardDimensions: { width: number; height: number };
  updateCardSettings: (updates: Partial<CardSettings>) => void;
}

/**
 * Hook to manage application settings.
 *
 * Settings are now derived from settingsStore (Zustand).
 * This hook provides the existing SettingsContext API.
 */
export function useSettings(): UseSettingsResult {
  const cardSizePreset = useSettingsStore((state) => state.cardSizePreset);
  const cardAspectRatio = useSettingsStore((state) => state.cardAspectRatio);

  // Calculate dimensions from size preset and aspect ratio
  const cardDimensions = useMemo(() => {
    const width = CARD_SIZE_WIDTHS[cardSizePreset];
    const aspectRatio = CARD_ASPECT_RATIOS[cardAspectRatio];
    return {
      width,
      height: Math.round(width * aspectRatio),
    };
  }, [cardSizePreset, cardAspectRatio]);

  // Derive settings for backwards compatibility
  const settings = useMemo<AppSettings>(() => {
    const aspectRatio = CARD_ASPECT_RATIOS[cardAspectRatio];
    return {
      card: {
        width: cardDimensions.width,
        ratio: [1, aspectRatio] as [number, number],
        logoUrl: undefined,
      },
    };
  }, [cardDimensions.width, cardAspectRatio]);

  // No-op - settings are managed via settingsStore now
  const updateCardSettings = (_updates: Partial<CardSettings>) => {
    // Deprecated: use setCardSizePreset/setCardAspectRatio directly
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
