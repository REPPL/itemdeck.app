/**
 * Settings store using Zustand with persistence.
 *
 * Manages user preferences for layout, card display, and accessibility.
 * Settings persist to localStorage and sync across tabs.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Layout type options.
 */
export type LayoutType = "grid" | "list" | "compact";

/**
 * Reduce motion preference.
 */
export type ReduceMotionPreference = "system" | "on" | "off";

/**
 * Card overlay style - controls contrast of the title footer.
 */
export type OverlayStyle = "dark" | "light";

/**
 * Title display mode - how to handle long titles.
 */
export type TitleDisplayMode = "truncate" | "wrap";

/**
 * Visual theme options.
 */
export type VisualTheme = "retro" | "modern" | "minimal";

/**
 * Card back style options.
 */
export type CardBackStyle = "bitmap" | "svg" | "colour";

/**
 * Settings store state.
 */
interface SettingsState {
  /** Current layout type */
  layout: LayoutType;

  /** Card dimensions */
  cardWidth: number;
  cardHeight: number;

  /** Grid gap in pixels */
  gap: number;

  /** Whether to shuffle cards on load */
  shuffleOnLoad: boolean;

  /** Reduce motion preference */
  reduceMotion: ReduceMotionPreference;

  /** High contrast mode */
  highContrast: boolean;

  /** Card overlay style (dark/light) */
  overlayStyle: OverlayStyle;

  /** Title display mode (truncate/wrap) */
  titleDisplayMode: TitleDisplayMode;

  /** Whether drag mode is enabled */
  dragModeEnabled: boolean;

  /** Visual theme */
  visualTheme: VisualTheme;

  /** Card back style */
  cardBackStyle: CardBackStyle;

  /** Whether to show rank badge on cards */
  showRankBadge: boolean;

  /** Whether to show device badge on cards */
  showDeviceBadge: boolean;

  /** Placeholder text for unranked cards */
  rankPlaceholderText: string;

  /** Actions */
  setLayout: (layout: LayoutType) => void;
  setCardDimensions: (width: number, height: number) => void;
  setGap: (gap: number) => void;
  setShuffleOnLoad: (shuffle: boolean) => void;
  setReduceMotion: (preference: ReduceMotionPreference) => void;
  setHighContrast: (enabled: boolean) => void;
  setOverlayStyle: (style: OverlayStyle) => void;
  setTitleDisplayMode: (mode: TitleDisplayMode) => void;
  setDragModeEnabled: (enabled: boolean) => void;
  setVisualTheme: (theme: VisualTheme) => void;
  setCardBackStyle: (style: CardBackStyle) => void;
  setShowRankBadge: (show: boolean) => void;
  setShowDeviceBadge: (show: boolean) => void;
  setRankPlaceholderText: (text: string) => void;
  resetToDefaults: () => void;
}

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS = {
  layout: "grid" as LayoutType,
  cardWidth: 140,
  cardHeight: 196,
  gap: 16,
  shuffleOnLoad: true,
  reduceMotion: "system" as ReduceMotionPreference,
  highContrast: false,
  overlayStyle: "dark" as OverlayStyle,
  titleDisplayMode: "truncate" as TitleDisplayMode,
  dragModeEnabled: true,
  visualTheme: "retro" as VisualTheme,
  cardBackStyle: "bitmap" as CardBackStyle,
  showRankBadge: true,
  showDeviceBadge: true,
  rankPlaceholderText: "The one that got away!",
};

/**
 * Settings store with localStorage persistence.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setLayout: (layout) => {
        set({ layout });
      },

      setCardDimensions: (cardWidth, cardHeight) => {
        set({ cardWidth, cardHeight });
      },

      setGap: (gap) => {
        set({ gap });
      },

      setShuffleOnLoad: (shuffleOnLoad) => {
        set({ shuffleOnLoad });
      },

      setReduceMotion: (reduceMotion) => {
        set({ reduceMotion });
      },

      setHighContrast: (highContrast) => {
        set({ highContrast });
      },

      setOverlayStyle: (overlayStyle) => {
        set({ overlayStyle });
      },

      setTitleDisplayMode: (titleDisplayMode) => {
        set({ titleDisplayMode });
      },

      setDragModeEnabled: (dragModeEnabled) => {
        set({ dragModeEnabled });
      },

      setVisualTheme: (visualTheme) => {
        set({ visualTheme });
      },

      setCardBackStyle: (cardBackStyle) => {
        set({ cardBackStyle });
      },

      setShowRankBadge: (showRankBadge) => {
        set({ showRankBadge });
      },

      setShowDeviceBadge: (showDeviceBadge) => {
        set({ showDeviceBadge });
      },

      setRankPlaceholderText: (rankPlaceholderText) => {
        set({ rankPlaceholderText });
      },

      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
      },
    }),
    {
      name: "itemdeck-settings",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        layout: state.layout,
        cardWidth: state.cardWidth,
        cardHeight: state.cardHeight,
        gap: state.gap,
        shuffleOnLoad: state.shuffleOnLoad,
        reduceMotion: state.reduceMotion,
        highContrast: state.highContrast,
        overlayStyle: state.overlayStyle,
        titleDisplayMode: state.titleDisplayMode,
        dragModeEnabled: state.dragModeEnabled,
        visualTheme: state.visualTheme,
        cardBackStyle: state.cardBackStyle,
        showRankBadge: state.showRankBadge,
        showDeviceBadge: state.showDeviceBadge,
        rankPlaceholderText: state.rankPlaceholderText,
      }),
      migrate: (persistedState: unknown, version: number) => {
        // Handle migration from version 1 to 2
        if (version === 1) {
          const state = persistedState as Record<string, unknown>;
          return {
            ...state,
            dragModeEnabled: DEFAULT_SETTINGS.dragModeEnabled,
            visualTheme: DEFAULT_SETTINGS.visualTheme,
            cardBackStyle: DEFAULT_SETTINGS.cardBackStyle,
            showRankBadge: DEFAULT_SETTINGS.showRankBadge,
            showDeviceBadge: DEFAULT_SETTINGS.showDeviceBadge,
            rankPlaceholderText: DEFAULT_SETTINGS.rankPlaceholderText,
          };
        }
        return persistedState as SettingsState;
      },
    }
  )
);

/**
 * Get default settings for comparison.
 */
export function getDefaultSettings() {
  return DEFAULT_SETTINGS;
}
