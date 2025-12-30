/**
 * Settings store using Zustand with persistence.
 *
 * Manages user preferences for layout, card display, and accessibility.
 * Settings persist to localStorage and sync across tabs.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ForcedSettings, CollectionSettings } from "@/types/collectionSettings";
import type { MechanicDisplayPreferences } from "@/mechanics/types";

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
export type LayoutType = "grid" | "list" | "compact" | "fit";

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
  /** Custom font family name (optional) */
  fontFamily?: string;
  /** URL to load custom font from (optional) */
  fontUrl?: string;
  /** Card back background image URL (optional) */
  cardBackBackgroundImage?: string;
  /** Card back background image mode: full (cover), tiled (repeat), or none */
  cardBackBackgroundMode?: "full" | "tiled" | "none";
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
    moreButtonLabel: "More",
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
    moreButtonLabel: "More",
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
    moreButtonLabel: "More",
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
  /** Field path for top badge (e.g., "order", "myRank", "myVerdict", "none") */
  topBadgeField: string;
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
/**
 * Card size widths in pixels.
 *
 * Optimised for different device sizes:
 * - small: 130px - iPhone vertical (2 cards per row with gap on 320px+ screens)
 * - medium: 260px - iPad horizontal (comfortable viewing)
 * - large: 360px - Studio Display (utilise large screen)
 */
export const CARD_SIZE_WIDTHS: Record<CardSizePreset, number> = {
  small: 130,
  medium: 260,
  large: 360,
};

/**
 * Get the responsive default card size based on screen width.
 *
 * @returns "small" for mobile (<600px), "medium" otherwise
 */
export function getResponsiveCardSizeDefault(): CardSizePreset {
  if (typeof window !== "undefined" && window.innerWidth < 600) {
    return "small";
  }
  return "medium";
}

/**
 * Compute smart default for random selection count based on collection size.
 *
 * Returns 50% of cards, minimum 8 (if deck > 8), otherwise the deck size.
 *
 * @param totalCards - Total number of cards in the collection
 * @returns Smart default for selection count
 */
export function computeSmartSelectionDefault(totalCards: number): number {
  if (totalCards <= 8) return totalCards;
  return Math.max(8, Math.ceil(totalCards * 0.5));
}

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
 * Keys that can be stored in draft state.
 * Excludes functions and internal state.
 */
type DraftableSettingsKeys =
  | "layout"
  | "cardSizePreset"
  | "cardAspectRatio"
  | "maxVisibleCards"
  | "cardBackDisplay"
  | "shuffleOnLoad"
  | "reduceMotion"
  | "highContrast"
  | "titleDisplayMode"
  | "dragModeEnabled"
  | "visualTheme"
  | "cardBackStyle"
  | "cardBackBackground"
  | "showRankBadge"
  | "showDeviceBadge"
  | "rankPlaceholderText"
  | "dragFace"
  | "fieldMapping"
  | "themeCustomisations"
  | "showHelpButton"
  | "showSettingsButton"
  | "showDragIcon"
  | "customThemeUrl"
  | "randomSelectionEnabled"
  | "randomSelectionCount"
  | "defaultCardFace"
  | "showStatisticsBar"
  | "showSearchBar"
  | "searchBarMinimised"
  | "showViewButton"
  | "usePlaceholderImages";

/**
 * Type for draft settings (subset of SettingsState).
 */
type DraftSettings = {
  [K in DraftableSettingsKeys]?: SettingsState[K];
};

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

  /** Selected card back background option value (from BACKGROUND_OPTIONS) */
  cardBackBackground: string;

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

  /** Whether to show the search bar */
  showSearchBar: boolean;

  /** Whether the search bar is minimised to a button */
  searchBarMinimised: boolean;

  // ============================================================================
  // v0.11.0: Search & Filter State
  // ============================================================================

  /** Current search query text */
  searchQuery: string;

  /** Fields to search in (e.g., ['title', 'summary', 'verdict']) */
  searchFields: string[];

  /** Search scope: 'all' searches all cards, 'visible' searches only filtered/selected cards */
  searchScope: "all" | "visible";

  /** Active filters as field-values pairs */
  activeFilters: { field: string; values: string[] }[];

  // ============================================================================
  // v0.11.0: Grouping State
  // ============================================================================

  /** Field to group cards by (null = no grouping) */
  groupByField: string | null;

  /** List of collapsed group keys */
  collapsedGroups: string[];

  // ============================================================================
  // v0.11.0: Mechanics State
  // ============================================================================

  /** Currently active mechanic ID (null = no mechanic active) */
  activeMechanicId: string | null;

  // ============================================================================
  // v0.11.0: External Theme State
  // ============================================================================

  /** Whether external themes have been loaded */
  externalThemesLoaded: boolean;

  /** Currently selected external theme ID (null = using built-in) */
  selectedExternalThemeId: string | null;

  // ============================================================================
  // v0.11.2: Navigation Hub State
  // ============================================================================

  /** Whether the navigation hub is expanded */
  navExpanded: boolean;

  // ============================================================================
  // v0.11.5: Collection Settings State
  // ============================================================================

  /** Whether to show the View button in the navigation hub */
  showViewButton: boolean;

  /** Whether to use placeholder images for cards without images */
  usePlaceholderImages: boolean;

  /** Collection forced settings (applied on every load, user cannot override) */
  collectionForcedSettings: ForcedSettings | null;

  /** Source ID of the collection whose defaults were applied (prevents re-applying) */
  appliedCollectionDefaultsSourceId: string | null;

  // ============================================================================
  // v0.14.0: Draft State Management (F-090)
  // ============================================================================

  /** Draft copy of settings (null when not editing) */
  _draft: DraftSettings | null;

  /** Whether draft differs from committed state */
  isDirty: boolean;

  // ============================================================================
  // v0.15.5: Mechanic Display Preferences (F-102)
  // ============================================================================

  /** Backup of settings before mechanic override (transient, not persisted) */
  _mechanicOverridesBackup: Partial<{
    cardSizePreset: CardSizePreset;
    cardAspectRatio: CardAspectRatio;
    layout: LayoutType;
    maxVisibleCards: number;
  }> | null;

  /** Whether mechanic overrides are currently active */
  mechanicOverridesActive: boolean;

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
  setCardBackBackground: (background: string) => void;
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
  setShowSearchBar: (show: boolean) => void;
  setSearchBarMinimised: (minimised: boolean) => void;
  toggleSearchBarMinimised: () => void;
  resetToDefaults: () => void;

  // v0.11.0: Search & Filter Actions
  setSearchQuery: (query: string) => void;
  setSearchFields: (fields: string[]) => void;
  setSearchScope: (scope: "all" | "visible") => void;
  setFilter: (field: string, values: string[]) => void;
  clearFilter: (field: string) => void;
  clearAllFilters: () => void;
  clearSearch: () => void;

  // v0.11.0: Grouping Actions
  setGroupByField: (field: string | null) => void;
  toggleGroupCollapse: (groupKey: string) => void;
  expandAllGroups: () => void;
  collapseAllGroups: (groupKeys: string[]) => void;

  // v0.11.0: Mechanics Actions
  setActiveMechanicId: (id: string | null) => void;

  // v0.11.0: External Theme Actions
  setExternalThemesLoaded: (loaded: boolean) => void;
  setSelectedExternalThemeId: (id: string | null) => void;

  // v0.11.2: Navigation Hub Actions
  setNavExpanded: (expanded: boolean) => void;
  toggleNavExpanded: () => void;

  // v0.11.5: Collection Settings Actions
  setShowViewButton: (show: boolean) => void;
  setUsePlaceholderImages: (use: boolean) => void;
  applyCollectionSettings: (sourceId: string, settings: CollectionSettings) => void;
  clearCollectionForcedSettings: () => void;

  // v0.14.0: Draft State Actions (F-090)
  /** Start editing - creates draft from current committed state */
  startEditing: () => void;
  /** Update draft with partial settings (does not persist) */
  updateDraft: (partial: DraftSettings) => void;
  /** Commit draft to committed state and persist */
  commitDraft: () => void;
  /** Discard draft and reset to committed state */
  discardDraft: () => void;
  /** Get effective value (draft if editing, committed otherwise) */
  getEffective: <K extends DraftableSettingsKeys>(key: K) => SettingsState[K];

  // v0.15.5: Mechanic Display Preferences Actions (F-102)
  /** Apply display preferences from active mechanic. Stores current values for restoration. */
  applyMechanicOverrides: (prefs: MechanicDisplayPreferences) => void;
  /** Restore original settings after mechanic deactivation. */
  restoreMechanicOverrides: () => void;

  // ============================================================================
  // v0.11.2: Cache Consent State (F-080)
  // ============================================================================

  /** Global cache consent preference: 'always' | 'ask' | 'never' */
  cacheConsentPreference: "always" | "ask" | "never";

  /** Source IDs that have been granted cache consent */
  cacheConsentGranted: string[];

  /** Source IDs that have been denied cache consent */
  cacheConsentDenied: string[];

  // v0.11.2: Cache Consent Actions
  setCacheConsentPreference: (preference: "always" | "ask" | "never") => void;
  grantCacheConsent: (sourceId: string) => void;
  denyCacheConsent: (sourceId: string) => void;
  revokeCacheConsent: (sourceId: string) => void;
  hasCacheConsent: (sourceId: string) => boolean;
}

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS = {
  layout: "grid" as LayoutType,
  cardSizePreset: getResponsiveCardSizeDefault(),
  cardAspectRatio: "5:7" as CardAspectRatio,
  maxVisibleCards: 2,
  cardBackDisplay: "logo" as CardBackDisplay,
  shuffleOnLoad: true,
  reduceMotion: "system" as ReduceMotionPreference,
  highContrast: false,
  titleDisplayMode: "truncate" as TitleDisplayMode,
  dragModeEnabled: true,
  visualTheme: "modern" as VisualTheme,
  cardBackStyle: "bitmap" as CardBackStyle,
  cardBackBackground: "app-logo",
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
    topBadgeField: "order",
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
  showSearchBar: true,
  searchBarMinimised: false,
  // v0.11.0: Search & Filter defaults
  searchQuery: "",
  searchFields: ["title", "summary", "verdict"],
  searchScope: "all" as const,
  activeFilters: [],
  // v0.11.0: Grouping defaults
  groupByField: null,
  collapsedGroups: [],
  // v0.11.0: Mechanics defaults
  activeMechanicId: null,
  // v0.11.0: External Theme defaults
  externalThemesLoaded: false,
  selectedExternalThemeId: null,
  // v0.11.2: Navigation Hub defaults
  navExpanded: false,
  // v0.11.2: Cache Consent defaults (F-080)
  cacheConsentPreference: "ask" as const,
  cacheConsentGranted: [] as string[],
  cacheConsentDenied: [] as string[],
  // v0.11.5: Collection Settings defaults
  showViewButton: true,
  usePlaceholderImages: true,
  collectionForcedSettings: null as ForcedSettings | null,
  appliedCollectionDefaultsSourceId: null as string | null,
  // v0.14.0: Draft State defaults (F-090)
  _draft: null as DraftSettings | null,
  isDirty: false,
  // v0.15.5: Mechanic Display Preferences defaults (F-102)
  _mechanicOverridesBackup: null as Partial<{
    cardSizePreset: CardSizePreset;
    cardAspectRatio: CardAspectRatio;
    layout: LayoutType;
    maxVisibleCards: number;
  }> | null,
  mechanicOverridesActive: false,
};

// Check for reset parameter in URL - force clear localStorage
if (typeof window !== "undefined" && window.location.search.includes("reset=1")) {
  localStorage.removeItem("itemdeck-settings");
  // Remove the parameter and reload
  window.history.replaceState({}, "", window.location.pathname);
  window.location.reload();
}

/**
 * Settings store with localStorage persistence.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
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

      setCardBackBackground: (cardBackBackground) => {
        set({ cardBackBackground });
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

      setShowSearchBar: (showSearchBar) => {
        set({ showSearchBar });
      },

      setSearchBarMinimised: (searchBarMinimised) => {
        set({ searchBarMinimised });
      },

      toggleSearchBarMinimised: () => {
        set((state) => ({ searchBarMinimised: !state.searchBarMinimised }));
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

      // v0.11.0: Search & Filter Actions
      setSearchQuery: (searchQuery) => {
        set({ searchQuery });
      },

      setSearchFields: (searchFields) => {
        set({ searchFields });
      },

      setSearchScope: (searchScope) => {
        set({ searchScope });
      },

      setFilter: (field, values) => {
        set((state) => {
          const existingIndex = state.activeFilters.findIndex((f) => f.field === field);
          if (existingIndex >= 0) {
            // Update existing filter
            const newFilters = [...state.activeFilters];
            if (values.length === 0) {
              // Remove filter if no values
              newFilters.splice(existingIndex, 1);
            } else {
              newFilters[existingIndex] = { field, values };
            }
            return { activeFilters: newFilters };
          } else if (values.length > 0) {
            // Add new filter
            return { activeFilters: [...state.activeFilters, { field, values }] };
          }
          return state;
        });
      },

      clearFilter: (field) => {
        set((state) => ({
          activeFilters: state.activeFilters.filter((f) => f.field !== field),
        }));
      },

      clearAllFilters: () => {
        set({ activeFilters: [] });
      },

      clearSearch: () => {
        set({ searchQuery: "", activeFilters: [] });
      },

      // v0.11.0: Grouping Actions
      setGroupByField: (groupByField) => {
        set({ groupByField, collapsedGroups: [] }); // Reset collapsed when changing group
      },

      toggleGroupCollapse: (groupKey) => {
        set((state) => {
          if (state.collapsedGroups.includes(groupKey)) {
            return { collapsedGroups: state.collapsedGroups.filter((k) => k !== groupKey) };
          } else {
            return { collapsedGroups: [...state.collapsedGroups, groupKey] };
          }
        });
      },

      expandAllGroups: () => {
        set({ collapsedGroups: [] });
      },

      collapseAllGroups: (groupKeys) => {
        set({ collapsedGroups: groupKeys });
      },

      // v0.11.0: Mechanics Actions
      setActiveMechanicId: (activeMechanicId) => {
        set({ activeMechanicId });
      },

      // v0.11.0: External Theme Actions
      setExternalThemesLoaded: (externalThemesLoaded) => {
        set({ externalThemesLoaded });
      },

      setSelectedExternalThemeId: (selectedExternalThemeId) => {
        set({ selectedExternalThemeId });
      },

      // v0.11.2: Navigation Hub Actions
      setNavExpanded: (navExpanded) => {
        set({ navExpanded });
      },

      toggleNavExpanded: () => {
        set((state) => ({ navExpanded: !state.navExpanded }));
      },

      // v0.11.5: Collection Settings Actions
      setShowViewButton: (showViewButton) => {
        set({ showViewButton });
      },

      setUsePlaceholderImages: (usePlaceholderImages) => {
        set({ usePlaceholderImages });
      },

      applyCollectionSettings: (sourceId, settings) => {
        set((state) => {
          const updates: Partial<SettingsState> = {};

          // Always apply forced settings (user cannot override)
          if (settings.forced) {
            updates.collectionForcedSettings = settings.forced;

            // Apply forced field mapping
            if (settings.forced.fieldMapping) {
              updates.fieldMapping = {
                ...state.fieldMapping,
                ...settings.forced.fieldMapping,
              } as FieldMappingConfig;
            }

            // Apply forced card settings
            if (settings.forced.defaultCardFace !== undefined) {
              updates.defaultCardFace = settings.forced.defaultCardFace;
            }
            if (settings.forced.cardBackDisplay !== undefined) {
              updates.cardBackDisplay = settings.forced.cardBackDisplay;
            }
            if (settings.forced.cardBackStyle !== undefined) {
              updates.cardBackStyle = settings.forced.cardBackStyle;
            }
            if (settings.forced.titleDisplayMode !== undefined) {
              updates.titleDisplayMode = settings.forced.titleDisplayMode;
            }
            if (settings.forced.showRankBadge !== undefined) {
              updates.showRankBadge = settings.forced.showRankBadge;
            }
            if (settings.forced.showDeviceBadge !== undefined) {
              updates.showDeviceBadge = settings.forced.showDeviceBadge;
            }
            if (settings.forced.rankPlaceholderText !== undefined) {
              updates.rankPlaceholderText = settings.forced.rankPlaceholderText;
            }
          }

          // Only apply defaults if not already applied for this source
          if (settings.defaults && state.appliedCollectionDefaultsSourceId !== sourceId) {
            updates.appliedCollectionDefaultsSourceId = sourceId;

            // Apply default visual settings
            if (settings.defaults.visualTheme !== undefined) {
              updates.visualTheme = settings.defaults.visualTheme;
            }
            if (settings.defaults.cardSizePreset !== undefined) {
              updates.cardSizePreset = settings.defaults.cardSizePreset;
            }
            if (settings.defaults.cardAspectRatio !== undefined) {
              updates.cardAspectRatio = settings.defaults.cardAspectRatio;
            }
            if (settings.defaults.maxVisibleCards !== undefined) {
              updates.maxVisibleCards = settings.defaults.maxVisibleCards;
            }
            if (settings.defaults.shuffleOnLoad !== undefined) {
              updates.shuffleOnLoad = settings.defaults.shuffleOnLoad;
            }

            // Apply default theme customisations (merge with existing)
            if (settings.defaults.themeCustomisations) {
              const mergedCustomisations = { ...state.themeCustomisations };
              for (const [theme, customisation] of Object.entries(settings.defaults.themeCustomisations)) {
                // customisation is guaranteed to exist from Object.entries
                mergedCustomisations[theme as VisualTheme] = {
                  ...mergedCustomisations[theme as VisualTheme],
                  ...customisation,
                };
              }
              updates.themeCustomisations = mergedCustomisations;
            }

            // Apply default search/grouping settings
            if (settings.defaults.searchFields !== undefined) {
              updates.searchFields = settings.defaults.searchFields;
            }
            if (settings.defaults.groupByField !== undefined) {
              updates.groupByField = settings.defaults.groupByField;
            }
          }

          return Object.keys(updates).length > 0 ? updates : state;
        });
      },

      clearCollectionForcedSettings: () => {
        set({
          collectionForcedSettings: null,
          appliedCollectionDefaultsSourceId: null,
        });
      },

      // v0.11.2: Cache Consent Actions (F-080)
      setCacheConsentPreference: (cacheConsentPreference) => {
        set({ cacheConsentPreference });
      },

      grantCacheConsent: (sourceId) => {
        set((state) => ({
          cacheConsentGranted: state.cacheConsentGranted.includes(sourceId)
            ? state.cacheConsentGranted
            : [...state.cacheConsentGranted, sourceId],
          cacheConsentDenied: state.cacheConsentDenied.filter((id) => id !== sourceId),
        }));
      },

      denyCacheConsent: (sourceId) => {
        set((state) => ({
          cacheConsentDenied: state.cacheConsentDenied.includes(sourceId)
            ? state.cacheConsentDenied
            : [...state.cacheConsentDenied, sourceId],
          cacheConsentGranted: state.cacheConsentGranted.filter((id) => id !== sourceId),
        }));
      },

      revokeCacheConsent: (sourceId) => {
        set((state) => ({
          cacheConsentGranted: state.cacheConsentGranted.filter((id) => id !== sourceId),
          cacheConsentDenied: state.cacheConsentDenied.filter((id) => id !== sourceId),
        }));
      },

      hasCacheConsent: (sourceId) => {
        const state = get();
        if (state.cacheConsentPreference === "always") return true;
        if (state.cacheConsentPreference === "never") return false;
        // "ask" mode: check per-source consent
        return state.cacheConsentGranted.includes(sourceId);
      },

      // v0.14.0: Draft State Actions (F-090)
      startEditing: () => {
        const state = get();
        // Create a shallow copy of draftable settings
        const draft: DraftSettings = {
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
          cardBackBackground: state.cardBackBackground,
          showRankBadge: state.showRankBadge,
          showDeviceBadge: state.showDeviceBadge,
          rankPlaceholderText: state.rankPlaceholderText,
          dragFace: state.dragFace,
          fieldMapping: { ...state.fieldMapping },
          themeCustomisations: structuredClone(state.themeCustomisations),
          showHelpButton: state.showHelpButton,
          showSettingsButton: state.showSettingsButton,
          showDragIcon: state.showDragIcon,
          customThemeUrl: state.customThemeUrl,
          randomSelectionEnabled: state.randomSelectionEnabled,
          randomSelectionCount: state.randomSelectionCount,
          defaultCardFace: state.defaultCardFace,
          showStatisticsBar: state.showStatisticsBar,
          showSearchBar: state.showSearchBar,
          searchBarMinimised: state.searchBarMinimised,
          showViewButton: state.showViewButton,
          usePlaceholderImages: state.usePlaceholderImages,
        };
        set({ _draft: draft, isDirty: false });
      },

      updateDraft: (partial) => {
        set((state) => {
          if (!state._draft) {
            // Not editing, ignore
            return state;
          }

          // Merge partial into draft
          const newDraft = { ...state._draft, ...partial };

          // Handle nested objects (fieldMapping, themeCustomisations)
          if (partial.fieldMapping) {
            newDraft.fieldMapping = { ...state._draft.fieldMapping, ...partial.fieldMapping };
          }
          if (partial.themeCustomisations) {
            newDraft.themeCustomisations = {
              ...state._draft.themeCustomisations,
              ...partial.themeCustomisations,
            };
          }

          // Check if draft differs from committed state
          const isDirty = (Object.keys(newDraft) as DraftableSettingsKeys[]).some((key) => {
            const draftValue = newDraft[key];
            const committedValue = state[key];
            // Deep comparison for objects
            if (typeof draftValue === "object" && draftValue !== null) {
              return JSON.stringify(draftValue) !== JSON.stringify(committedValue);
            }
            return draftValue !== committedValue;
          });

          return { _draft: newDraft, isDirty };
        });
      },

      commitDraft: () => {
        const state = get();
        if (!state._draft) {
          return;
        }

        // Merge draft into main state
        const updates: Partial<SettingsState> = {
          ...state._draft,
          _draft: null,
          isDirty: false,
        };

        set(updates);
      },

      discardDraft: () => {
        set({ _draft: null, isDirty: false });
      },

      getEffective: <K extends DraftableSettingsKeys>(key: K): SettingsState[K] => {
        const state = get();
        if (state._draft && key in state._draft) {
          return state._draft[key] as SettingsState[K];
        }
        return state[key];
      },

      // v0.15.5: Mechanic Display Preferences Actions (F-102)
      applyMechanicOverrides: (prefs) => {
        const current = get();

        // Store current values for restoration
        set({
          _mechanicOverridesBackup: {
            cardSizePreset: current.cardSizePreset,
            cardAspectRatio: current.cardAspectRatio,
            maxVisibleCards: current.maxVisibleCards,
          },
          mechanicOverridesActive: true,
        });

        // Apply preferences
        const updates: Partial<SettingsState> = {};
        if (prefs.cardSizePreset) {
          updates.cardSizePreset = prefs.cardSizePreset;
        }
        if (prefs.cardAspectRatio) {
          updates.cardAspectRatio = prefs.cardAspectRatio;
        }
        if (prefs.maxVisibleCards) {
          updates.maxVisibleCards = prefs.maxVisibleCards;
        }

        if (Object.keys(updates).length > 0) {
          set(updates);
        }
      },

      restoreMechanicOverrides: () => {
        const state = get();
        const backup = state._mechanicOverridesBackup;
        if (!backup) return;

        set({
          cardSizePreset: backup.cardSizePreset ?? state.cardSizePreset,
          cardAspectRatio: backup.cardAspectRatio ?? state.cardAspectRatio,
          maxVisibleCards: backup.maxVisibleCards ?? state.maxVisibleCards,
          _mechanicOverridesBackup: null,
          mechanicOverridesActive: false,
        });
      },
    }),
    {
      name: "itemdeck-settings",
      version: 26,
      storage: createJSONStorage(() => localStorage),
      // Force-clear activeMechanicId after rehydration - games should never auto-start
      onRehydrateStorage: () => (state) => {
        if (state?.activeMechanicId) {
          state.activeMechanicId = null;
        }
      },
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
        showSearchBar: state.showSearchBar,
        searchBarMinimised: state.searchBarMinimised,
        // v0.11.0: New persisted fields
        searchFields: state.searchFields,
        searchScope: state.searchScope,
        groupByField: state.groupByField,
        // Note: activeMechanicId is intentionally NOT persisted
        // Games should start fresh on page reload
        selectedExternalThemeId: state.selectedExternalThemeId,
        // v0.11.2: Navigation Hub
        navExpanded: state.navExpanded,
        // v0.11.2: Cache Consent (F-080)
        cacheConsentPreference: state.cacheConsentPreference,
        cacheConsentGranted: state.cacheConsentGranted,
        cacheConsentDenied: state.cacheConsentDenied,
        // v0.11.5: Collection Settings
        showViewButton: state.showViewButton,
        // Note: collectionForcedSettings is intentionally NOT persisted
        // Forced settings are applied fresh from collection on each load
        appliedCollectionDefaultsSourceId: state.appliedCollectionDefaultsSourceId,
        // v0.14.0: Draft state is intentionally NOT persisted
        // _draft and isDirty are excluded - editing session is transient
        // v0.15.5: Mechanic override backup is intentionally NOT persisted
        // _mechanicOverridesBackup and mechanicOverridesActive are excluded - transient state
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

        // Handle migration from version 18 to 19 (v0.11.0: Search, Filter, Grouping, Mechanics, External Themes)
        if (version < 19) {
          state = {
            ...state,
            searchFields: DEFAULT_SETTINGS.searchFields,
            groupByField: null,
            activeMechanicId: null,
            selectedExternalThemeId: null,
          };
        }

        // Handle migration from version 19 to 20 (add showSearchBar)
        if (version < 20) {
          state = {
            ...state,
            showSearchBar: true,
          };
        }

        // Handle migration from version 20 to 21 (add searchScope)
        if (version < 21) {
          state = {
            ...state,
            searchScope: "all",
          };
        }

        // Handle migration from version 21 to 22 (add searchBarMinimised)
        if (version < 22) {
          state = {
            ...state,
            searchBarMinimised: false,
          };
        }

        // Handle migration from version 22 to 23 (clear activeMechanicId - no longer persisted)
        if (version < 23) {
          // Remove activeMechanicId from persisted state
          // Games should start fresh on page reload
          const { activeMechanicId: _, ...rest } = state;
          state = rest;
        }

        // Handle migration from version 23 to 24 (v0.11.2: Navigation Hub)
        if (version < 24) {
          state = {
            ...state,
            navExpanded: false,
          };
        }

        // Handle migration from version 24 to 25 (v0.11.2: Cache Consent F-080)
        if (version < 25) {
          state = {
            ...state,
            cacheConsentPreference: "ask" as const,
            cacheConsentGranted: [] as string[],
            cacheConsentDenied: [] as string[],
          };
        }

        // Handle migration from version 25 to 26 (v0.11.5: Collection Settings)
        if (version < 26) {
          state = {
            ...state,
            showViewButton: true,
            usePlaceholderImages: true,
            // collectionForcedSettings is not persisted
            appliedCollectionDefaultsSourceId: null,
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

/**
 * Export draft settings type for use in components.
 */
export type { DraftableSettingsKeys, DraftSettings };
