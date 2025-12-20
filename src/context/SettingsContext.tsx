import { createContext, type ReactNode } from "react";
import { useSettings } from "@/hooks/useSettings";
import {
  type AppSettings,
  type CardSettings,
  DEFAULT_APP_SETTINGS,
  calculateCardHeight,
} from "@/types/settings";

interface SettingsContextValue {
  settings: AppSettings;
  cardDimensions: { width: number; height: number };
  updateCardSettings: (updates: Partial<CardSettings>) => void;
}

const defaultCardDimensions = {
  width: DEFAULT_APP_SETTINGS.card.width,
  height: calculateCardHeight(
    DEFAULT_APP_SETTINGS.card.width,
    DEFAULT_APP_SETTINGS.card.ratio
  ),
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_APP_SETTINGS,
  cardDimensions: defaultCardDimensions,
  updateCardSettings: () => {
    /* no-op */
  },
});

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const value = useSettings();

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook exported via separate module to avoid fast refresh issues
export { SettingsContext };
