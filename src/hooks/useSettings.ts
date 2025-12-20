import { useState, useCallback, useMemo } from "react";
import {
  type AppSettings,
  type CardSettings,
  DEFAULT_APP_SETTINGS,
  calculateCardHeight,
} from "@/types/settings";

interface UseSettingsResult {
  settings: AppSettings;
  cardDimensions: { width: number; height: number };
  updateCardSettings: (updates: Partial<CardSettings>) => void;
}

/**
 * Hook to manage application settings.
 *
 * TODO: Persist settings to localStorage
 * TODO: Load settings from URL parameters or config file
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  const cardDimensions = useMemo(() => {
    const { width, ratio } = settings.card;
    return {
      width,
      height: calculateCardHeight(width, ratio),
    };
  }, [settings.card]);

  const updateCardSettings = useCallback((updates: Partial<CardSettings>) => {
    setSettings((prev) => ({
      ...prev,
      card: {
        ...prev.card,
        ...updates,
      },
    }));
  }, []);

  return {
    settings,
    cardDimensions,
    updateCardSettings,
  };
}
