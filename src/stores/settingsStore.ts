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
 * Whether drag-to-reorder mode is enabled.
 */
export type DragModeEnabled = boolean;

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

  /** Whether drag-to-reorder mode is enabled */
  dragModeEnabled: boolean;

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
  dragModeEnabled: false,
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

      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
      },
    }),
    {
      name: "itemdeck-settings",
      version: 1,
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
      }),
    }
  )
);

/**
 * Get default settings for comparison.
 */
export function getDefaultSettings() {
  return DEFAULT_SETTINGS;
}
