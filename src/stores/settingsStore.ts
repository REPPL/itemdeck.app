/**
 * Settings store using Zustand with persistence.
 *
 * Manages user preferences for layout, card display, and accessibility.
 * Settings persist to localStorage and sync across tabs.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Collection config structure for applying defaults.
 * Mirrors CollectionConfig from types/schema.ts to avoid circular imports.
 */
export interface CollectionConfigForDefaults {
  defaults?: {
    theme?: "retro" | "modern" | "minimal";
    cardSize?: "small" | "medium" | "large";
    cardAspectRatio?: "3:4" | "5:7" | "1:1";
  };
  cards?: {
    maxVisibleCards?: number;
    shuffleOnLoad?: boolean;
    cardBackDisplay?: "year" | "logo" | "both" | "none";
  };
  fieldMapping?: {
    titleField?: string;
    subtitleField?: string;
    footerBadgeField?: string;
    logoField?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
  };
}

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
 * Border radius preset options.
 */
export type BorderRadiusPreset = "none" | "small" | "medium" | "large";

/**
 * Border width preset options.
 */
export type BorderWidthPreset = "none" | "small" | "medium" | "large";

/**
 * Shadow intensity options.
 */
export type ShadowIntensity = "none" | "subtle" | "medium" | "strong";

/**
 * Animation style options.
 */
export type AnimationStyle = "none" | "subtle" | "smooth" | "bouncy";

/**
 * Detail view transparency options.
 */
export type DetailTransparencyPreset = "none" | "25" | "50" | "75";

/**
 * Verdict animation style - how the "More/Verdict" overlay appears.
 */
export type VerdictAnimationStyle = "slide" | "flip";

/**
 * Theme customisation settings per theme.
 */
export interface ThemeCustomisation {
  /** Border radius preset */
  borderRadius: BorderRadiusPreset;
  /** Border width preset */
  borderWidth: BorderWidthPreset;
  /** Shadow intensity */
  shadowIntensity: ShadowIntensity;
  /** Animation style (controls hover lift effect) */
  animationStyle: AnimationStyle;
  /** Accent colour (hex) */
  accentColour: string;
  /** Hover colour (hex) - used for interactive element hover states */
  hoverColour: string;
  /** Card background colour (hex) */
  cardBackgroundColour: string;
  /** Card border colour (hex) */
  borderColour: string;
  /** Text colour (hex) - for titles, labels, and icons on card back */
  textColour: string;
  /** Detail view background transparency preset */
  detailTransparency: DetailTransparencyPreset;
  /** Footer overlay style (moved from Cards) */
  overlayStyle: OverlayStyle;
  /** Label for the 'More' button in detail view */
  moreButtonLabel: string;
  /** Whether to auto-expand the 'More' overlay if needed */
  autoExpandMore: boolean;
  /** Whether to zoom image to fill horizontal width */
  zoomImage: boolean;
  /** Whether to enable card flip animation */
  flipAnimation: boolean;
  /** Whether to enable detail view open/close animation */
  detailAnimation: boolean;
  /** Whether to enable overlay (More, Attribution, Platform) animations */
  overlayAnimation: boolean;
  /** Verdict overlay animation style - slide up or flip card */
  verdictAnimationStyle: VerdictAnimationStyle;
}

/**
 * Default theme customisation values per theme.
 */
export const DEFAULT_THEME_CUSTOMISATIONS: Record<VisualTheme, ThemeCustomisation> = {
  retro: {
    borderRadius: "none",
    borderWidth: "small",
    shadowIntensity: "strong",
    animationStyle: "none",
    accentColour: "#ff6b6b",
    hoverColour: "#ff8888",
    cardBackgroundColour: "#1a1a2e",
    borderColour: "#ffffff33",
    textColour: "#ffffff",
    detailTransparency: "25",
    overlayStyle: "dark",
    moreButtonLabel: "Verdict",
    autoExpandMore: false,
    zoomImage: true,
    flipAnimation: true,
    detailAnimation: true,
    overlayAnimation: true,
    verdictAnimationStyle: "flip",
  },
  modern: {
    borderRadius: "medium",
    borderWidth: "none",
    shadowIntensity: "medium",
    animationStyle: "smooth",
    accentColour: "#4f9eff",
    hoverColour: "#7ab8ff",
    cardBackgroundColour: "#1e293b",
    borderColour: "#ffffff20",
    textColour: "#ffffff",
    detailTransparency: "50",
    overlayStyle: "dark",
    moreButtonLabel: "Verdict",
    autoExpandMore: false,
    zoomImage: true,
    flipAnimation: true,
    detailAnimation: true,
    overlayAnimation: true,
    verdictAnimationStyle: "slide",
  },
  minimal: {
    borderRadius: "small",
    borderWidth: "small",
    shadowIntensity: "subtle",
    animationStyle: "subtle",
    accentColour: "#6b7280",
    hoverColour: "#9ca3af",
    cardBackgroundColour: "#374151",
    borderColour: "#ffffff15",
    textColour: "#ffffff",
    detailTransparency: "75",
    overlayStyle: "dark",
    moreButtonLabel: "Verdict",
    autoExpandMore: false,
    zoomImage: true,
    flipAnimation: true,
    detailAnimation: true,
    overlayAnimation: true,
    verdictAnimationStyle: "slide",
  },
};

/**
 * Card back style options.
 */
export type CardBackStyle = "bitmap" | "svg" | "colour";

/**
 * Which card face allows dragging.
 */
export type DragFace = "front" | "back" | "both";

/**
 * Which card face to show by default (all cards start on this face).
 */
export type DefaultCardFace = "front" | "back";

/**
 * Field mapping configuration for card display.
 * Maps UI elements to entity field paths.
 */
export interface FieldMappingConfig {
  /** Field path for card title (e.g., "title") */
  titleField: string;
  /** Field path for card subtitle (e.g., "year", "playedSince") */
  subtitleField: string;
  /** Field path for footer badge (e.g., "platform.shortTitle", "device") */
  footerBadgeField: string;
  /** Field path for card back logo (e.g., "platform.logoUrl") */
  logoField: string;
  /** Field path for default sort order when shuffle is off (e.g., "rank", "year", "title") */
  sortField: string;
  /** Sort direction */
  sortDirection: "asc" | "desc";
}

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
  small: 160,
  medium: 220,
  large: 300,
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

  /** Field mapping configuration */
  fieldMapping: FieldMappingConfig;

  /** Theme customisation per theme */
  themeCustomisations: Record<VisualTheme, ThemeCustomisation>;

  /** Whether to show the help button */
  showHelpButton: boolean;

  /** Whether to show the settings button */
  showSettingsButton: boolean;

  /** Whether to show drag icon on cards */
  showDragIcon: boolean;

  /** Custom theme URL (null = use built-in theme) */
  customThemeUrl: string | null;

  /** Whether collection defaults have been applied (prevents re-applying on subsequent loads) */
  hasAppliedCollectionDefaults: boolean;

  /** Whether random selection is enabled */
  randomSelectionEnabled: boolean;

  /** Number of cards to randomly select (when enabled) */
  randomSelectionCount: number;

  /** Which face cards show by default (front or back) */
  defaultCardFace: DefaultCardFace;

  /** Whether to show the statistics bar above the grid */
  showStatisticsBar: boolean;

  /** Whether edit mode is enabled (allows editing entity data) */
  editModeEnabled: boolean;

  /** Actions */
  setLayout: (layout: LayoutType) => void;
  setCardSizePreset: (preset: CardSizePreset) => void;
  setCardAspectRatio: (ratio: CardAspectRatio) => void;
  setMaxVisibleCards: (count: number) => void;
  setCardBackDisplay: (display: CardBackDisplay) => void;
  setShuffleOnLoad: (shuffle: boolean) => void;
  setReduceMotion: (preference: ReduceMotionPreference) => void;
  setHighContrast: (enabled: boolean) => void;
  setTitleDisplayMode: (mode: TitleDisplayMode) => void;
  setDragModeEnabled: (enabled: boolean) => void;
  setVisualTheme: (theme: VisualTheme) => void;
  setCardBackStyle: (style: CardBackStyle) => void;
  setShowRankBadge: (show: boolean) => void;
  setShowDeviceBadge: (show: boolean) => void;
  setRankPlaceholderText: (text: string) => void;
  setDragFace: (face: DragFace) => void;
  setFieldMapping: (mapping: Partial<FieldMappingConfig>) => void;
  setThemeCustomisation: (theme: VisualTheme, customisation: Partial<ThemeCustomisation>) => void;
  setShowHelpButton: (show: boolean) => void;
  setShowSettingsButton: (show: boolean) => void;
  setShowDragIcon: (show: boolean) => void;
  setCustomThemeUrl: (url: string | null) => void;
  setHasAppliedCollectionDefaults: (applied: boolean) => void;
  applyCollectionDefaults: (config: CollectionConfigForDefaults) => void;
  setRandomSelectionEnabled: (enabled: boolean) => void;
  setRandomSelectionCount: (count: number) => void;
  setDefaultCardFace: (face: DefaultCardFace) => void;
  setShowStatisticsBar: (show: boolean) => void;
  setEditModeEnabled: (enabled: boolean) => void;
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
  titleDisplayMode: "truncate" as TitleDisplayMode,
  dragModeEnabled: true,
  visualTheme: "modern" as VisualTheme,
  cardBackStyle: "bitmap" as CardBackStyle,
  showRankBadge: true,
  showDeviceBadge: true,
  rankPlaceholderText: "The one that got away!",
  dragFace: "back" as DragFace,
  fieldMapping: {
    titleField: "title",
    subtitleField: "year",
    footerBadgeField: "platform.shortTitle",
    logoField: "logoUrl",
    sortField: "order",
    sortDirection: "asc" as const,
  },
  themeCustomisations: { ...DEFAULT_THEME_CUSTOMISATIONS },
  showHelpButton: true,
  showSettingsButton: true,
  showDragIcon: true,
  customThemeUrl: null,
  hasAppliedCollectionDefaults: false,
  randomSelectionEnabled: false,
  randomSelectionCount: 10,
  defaultCardFace: "back" as DefaultCardFace,
  showStatisticsBar: true,
  editModeEnabled: false,
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

      setFieldMapping: (mapping) => {
        set((state) => ({
          fieldMapping: { ...state.fieldMapping, ...mapping },
        }));
      },

      setThemeCustomisation: (theme, customisation) => {
        set((state) => ({
          themeCustomisations: {
            ...state.themeCustomisations,
            [theme]: { ...state.themeCustomisations[theme], ...customisation },
          },
        }));
      },

      setShowHelpButton: (showHelpButton) => {
        set({ showHelpButton });
      },

      setShowSettingsButton: (showSettingsButton) => {
        set({ showSettingsButton });
      },

      setShowDragIcon: (showDragIcon) => {
        set({ showDragIcon });
      },

      setCustomThemeUrl: (customThemeUrl) => {
        set({ customThemeUrl });
      },

      setHasAppliedCollectionDefaults: (hasAppliedCollectionDefaults) => {
        set({ hasAppliedCollectionDefaults });
      },

      setRandomSelectionEnabled: (randomSelectionEnabled) => {
        set({ randomSelectionEnabled });
      },

      setRandomSelectionCount: (randomSelectionCount) => {
        set({ randomSelectionCount });
      },

      setDefaultCardFace: (defaultCardFace) => {
        set({ defaultCardFace });
      },

      setShowStatisticsBar: (showStatisticsBar) => {
        set({ showStatisticsBar });
      },

      setEditModeEnabled: (editModeEnabled) => {
        set({ editModeEnabled });
      },

      applyCollectionDefaults: (config) => {
        set((state) => {
          // Only apply if not already applied
          if (state.hasAppliedCollectionDefaults) {
            return state;
          }

          const updates: Partial<SettingsState> = {
            hasAppliedCollectionDefaults: true,
          };

          // Apply visual defaults
          if (config.defaults?.theme) {
            updates.visualTheme = config.defaults.theme;
          }
          if (config.defaults?.cardSize) {
            updates.cardSizePreset = config.defaults.cardSize;
          }
          if (config.defaults?.cardAspectRatio) {
            updates.cardAspectRatio = config.defaults.cardAspectRatio;
          }

          // Apply card defaults
          if (config.cards?.maxVisibleCards !== undefined) {
            updates.maxVisibleCards = config.cards.maxVisibleCards;
          }
          if (config.cards?.shuffleOnLoad !== undefined) {
            updates.shuffleOnLoad = config.cards.shuffleOnLoad;
          }
          if (config.cards?.cardBackDisplay) {
            updates.cardBackDisplay = config.cards.cardBackDisplay;
          }

          // Apply field mapping defaults
          if (config.fieldMapping) {
            updates.fieldMapping = {
              ...state.fieldMapping,
              ...config.fieldMapping,
            } as FieldMappingConfig;
          }

          return updates;
        });
      },

      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
      },
    }),
    {
      name: "itemdeck-settings",
      version: 18,
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
        titleDisplayMode: state.titleDisplayMode,
        dragModeEnabled: state.dragModeEnabled,
        visualTheme: state.visualTheme,
        cardBackStyle: state.cardBackStyle,
        showRankBadge: state.showRankBadge,
        showDeviceBadge: state.showDeviceBadge,
        rankPlaceholderText: state.rankPlaceholderText,
        dragFace: state.dragFace,
        fieldMapping: state.fieldMapping,
        themeCustomisations: state.themeCustomisations,
        showHelpButton: state.showHelpButton,
        showSettingsButton: state.showSettingsButton,
        showDragIcon: state.showDragIcon,
        customThemeUrl: state.customThemeUrl,
        hasAppliedCollectionDefaults: state.hasAppliedCollectionDefaults,
        randomSelectionEnabled: state.randomSelectionEnabled,
        randomSelectionCount: state.randomSelectionCount,
        defaultCardFace: state.defaultCardFace,
        showStatisticsBar: state.showStatisticsBar,
        editModeEnabled: state.editModeEnabled,
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

        // Handle migration from version 4 to 5 (field mapping)
        if (version < 5) {
          state = {
            ...state,
            fieldMapping: DEFAULT_SETTINGS.fieldMapping,
          };
        }

        // Handle migration from version 5 to 6 (theme customisations)
        if (version < 6) {
          state = {
            ...state,
            themeCustomisations: DEFAULT_SETTINGS.themeCustomisations,
          };
        }

        // Handle migration from version 6 to 7 (new System settings, move overlayStyle to theme)
        if (version < 7) {
          // Remove overlayStyle from top-level (now in themeCustomisations)
          const { overlayStyle: _os, ...rest } = state;
          state = {
            ...rest,
            showHelpButton: DEFAULT_SETTINGS.showHelpButton,
            showSettingsButton: DEFAULT_SETTINGS.showSettingsButton,
            showDragIcon: DEFAULT_SETTINGS.showDragIcon,
            themeCustomisations: DEFAULT_SETTINGS.themeCustomisations,
          };
        }

        // Handle migration from version 7 to 8 (add borderWidth and animation settings to theme customisations)
        if (version < 8) {
          const existingCustomisations = state.themeCustomisations as Record<string, Record<string, unknown>> | undefined;
          if (existingCustomisations) {
            // Add borderWidth and animation settings to each theme's customisation
            const updatedCustomisations = Object.fromEntries(
              Object.entries(existingCustomisations).map(([theme, customisation]) => [
                theme,
                {
                  ...customisation,
                  borderWidth: customisation.borderWidth ?? "small",
                  flipAnimation: customisation.flipAnimation ?? true,
                  detailAnimation: customisation.detailAnimation ?? true,
                  overlayAnimation: customisation.overlayAnimation ?? true,
                },
              ])
            );
            state = { ...state, themeCustomisations: updatedCustomisations };
          }
        }

        // Handle migration from version 8 to 9 (enable zoomImage by default)
        if (version < 9) {
          const existingCustomisations = state.themeCustomisations as Record<string, Record<string, unknown>> | undefined;
          if (existingCustomisations) {
            // Set zoomImage to true for all themes
            const updatedCustomisations = Object.fromEntries(
              Object.entries(existingCustomisations).map(([theme, customisation]) => [
                theme,
                {
                  ...customisation,
                  zoomImage: true,
                },
              ])
            );
            state = { ...state, themeCustomisations: updatedCustomisations };
          }
        }

        // Handle migration from version 9 to 10 (add verdictAnimationStyle)
        if (version < 10) {
          const existingCustomisations = state.themeCustomisations as Record<string, Record<string, unknown>> | undefined;
          if (existingCustomisations) {
            // Add verdictAnimationStyle to each theme - default to flip for retro, slide for others
            const updatedCustomisations = Object.fromEntries(
              Object.entries(existingCustomisations).map(([theme, customisation]) => [
                theme,
                {
                  ...customisation,
                  verdictAnimationStyle: customisation.verdictAnimationStyle ?? (theme === "retro" ? "flip" : "slide"),
                },
              ])
            );
            state = { ...state, themeCustomisations: updatedCustomisations };
          }
        }

        // Handle migration from version 10 to 11 (add borderColour and textColour)
        if (version < 11) {
          const existingCustomisations = state.themeCustomisations as Record<string, Record<string, unknown>> | undefined;
          if (existingCustomisations) {
            // Add borderColour and textColour to each theme
            const updatedCustomisations = Object.fromEntries(
              Object.entries(existingCustomisations).map(([theme, customisation]) => [
                theme,
                {
                  ...customisation,
                  borderColour: customisation.borderColour ?? "#ffffff33",
                  textColour: customisation.textColour ?? "#ffffff",
                },
              ])
            );
            state = { ...state, themeCustomisations: updatedCustomisations };
          }
        }

        // Handle migration from version 11 to 12 (add customThemeUrl)
        if (version < 12) {
          state = {
            ...state,
            customThemeUrl: null,
          };
        }

        // Handle migration from version 12 to 13 (add hasAppliedCollectionDefaults)
        // For existing users (who have localStorage data), mark as true so collection
        // defaults don't override their existing settings
        if (version < 13) {
          state = {
            ...state,
            hasAppliedCollectionDefaults: true,
          };
        }

        // Handle migration from version 13 to 14 (add random selection)
        if (version < 14) {
          state = {
            ...state,
            randomSelectionEnabled: false,
            randomSelectionCount: 10,
          };
        }

        // Handle migration from version 14 to 15 (add defaultCardFace)
        if (version < 15) {
          state = {
            ...state,
            defaultCardFace: "back",
          };
        }

        // Handle migration from version 15 to 16 (add showStatisticsBar)
        if (version < 16) {
          state = {
            ...state,
            showStatisticsBar: true,
          };
        }

        // Handle migration from version 16 to 17 (add editModeEnabled)
        if (version < 17) {
          state = {
            ...state,
            editModeEnabled: false,
          };
        }

        // Handle migration from version 17 to 18 (change default theme to modern)
        // Note: Existing users keep their current theme; this only affects new users
        // No action needed for existing users - they keep their persisted visualTheme

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
