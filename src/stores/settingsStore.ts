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
 * Which card face allows dragging.
 */
export type DragFace = "front" | "back" | "both";

/**
 * Card size preset options.
 */
export type CardSizePreset = "small" | "medium" | "large";

/**
 * Card aspect ratio options.
 */
export type CardAspectRatio = "3:4" | "5:7" | "1:1";

/**
 * Card size preset pixel widths.
 */
export const CARD_SIZE_WIDTHS: Record<CardSizePreset, number> = {
  small: 180,
  medium: 280,
  large: 400,
};

/**
 * Card aspect ratio values (height/width).
 */
export const CARD_ASPECT_RATIOS: Record<CardAspectRatio, number> = {
  "3:4": 4 / 3,      // ~1.33
  "5:7": 7 / 5,      // 1.4
  "1:1": 1,          // Square
};

/**
 * Card back display options.
 */
export type CardBackDisplay = "year" | "logo" | "both" | "none";

/**
 * Settings store state.
 */
interface SettingsState {
  /** Current layout type */
  layout: LayoutType;

  /** Card size preset */
  cardSizePreset: CardSizePreset;

  /** Card aspect ratio */
  cardAspectRatio: CardAspectRatio;

  /** Maximum number of face-up cards at once */
  maxVisibleCards: number;

  /** What to show on card back */
  cardBackDisplay: CardBackDisplay;

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

  /** Which card face allows dragging */
  dragFace: DragFace;

  /** Actions */
  setLayout: (layout: LayoutType) => void;
  setCardSizePreset: (preset: CardSizePreset) => void;
  setCardAspectRatio: (ratio: CardAspectRatio) => void;
  setMaxVisibleCards: (count: number) => void;
  setCardBackDisplay: (display: CardBackDisplay) => void;
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
  setDragFace: (face: DragFace) => void;
  resetToDefaults: () => void;
}

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS = {
  layout: "grid" as LayoutType,
  cardSizePreset: "medium" as CardSizePreset,
  cardAspectRatio: "5:7" as CardAspectRatio,
  maxVisibleCards: 2,
  cardBackDisplay: "year" as CardBackDisplay,
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
  dragFace: "back" as DragFace,
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

      setCardSizePreset: (cardSizePreset) => {
        set({ cardSizePreset });
      },

      setCardAspectRatio: (cardAspectRatio) => {
        set({ cardAspectRatio });
      },

      setMaxVisibleCards: (maxVisibleCards) => {
        set({ maxVisibleCards });
      },

      setCardBackDisplay: (cardBackDisplay) => {
        set({ cardBackDisplay });
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

      setDragFace: (dragFace) => {
        set({ dragFace });
      },

      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
      },
    }),
    {
      name: "itemdeck-settings",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        layout: state.layout,
        cardSizePreset: state.cardSizePreset,
        cardAspectRatio: state.cardAspectRatio,
        maxVisibleCards: state.maxVisibleCards,
        cardBackDisplay: state.cardBackDisplay,
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
        dragFace: state.dragFace,
      }),
      migrate: (persistedState: unknown, version: number) => {
        let state = persistedState as Record<string, unknown>;

        // Handle migration from version 1 to 2
        if (version < 2) {
          state = {
            ...state,
            dragModeEnabled: DEFAULT_SETTINGS.dragModeEnabled,
            visualTheme: DEFAULT_SETTINGS.visualTheme,
            cardBackStyle: DEFAULT_SETTINGS.cardBackStyle,
            showRankBadge: DEFAULT_SETTINGS.showRankBadge,
            showDeviceBadge: DEFAULT_SETTINGS.showDeviceBadge,
            rankPlaceholderText: DEFAULT_SETTINGS.rankPlaceholderText,
          };
        }

        // Handle migration from version 2 to 3
        if (version < 3) {
          state = {
            ...state,
            dragFace: DEFAULT_SETTINGS.dragFace,
          };
        }

        // Handle migration from version 3 to 4 (size presets + new settings)
        if (version < 4) {
          // Remove old cardWidth/cardHeight/gap, use presets
          const { cardWidth: _w, cardHeight: _h, gap: _g, ...rest } = state;
          state = {
            ...rest,
            cardSizePreset: DEFAULT_SETTINGS.cardSizePreset,
            cardAspectRatio: DEFAULT_SETTINGS.cardAspectRatio,
            maxVisibleCards: DEFAULT_SETTINGS.maxVisibleCards,
            cardBackDisplay: DEFAULT_SETTINGS.cardBackDisplay,
          };
        }

        return state as unknown as SettingsState;
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
