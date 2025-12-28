/**
 * Collection-specific settings types.
 *
 * Defines the structure for per-collection settings files that can
 * force or default certain settings when loading a collection.
 *
 * @see v0.11.5 Phase 1: Foundation
 */

import type {
  VisualTheme,
  CardSizePreset,
  CardAspectRatio,
  CardBackDisplay,
  CardBackStyle,
  TitleDisplayMode,
  ThemeCustomisation,
  FieldMappingConfig,
} from "@/stores/settingsStore";

/**
 * Settings that are FORCED - collection always uses these values.
 * User cannot override; applied on every load.
 */
export interface ForcedSettings {
  fieldMapping?: Partial<FieldMappingConfig>;
  defaultCardFace?: "front" | "back";
  cardBackDisplay?: CardBackDisplay;
  cardBackStyle?: CardBackStyle;
  titleDisplayMode?: TitleDisplayMode;
  showRankBadge?: boolean;
  showDeviceBadge?: boolean;
  rankPlaceholderText?: string;
}

/**
 * Settings that are DEFAULTS - applied on first load only.
 * User can change after first load.
 */
export interface DefaultSettings {
  visualTheme?: VisualTheme;
  cardSizePreset?: CardSizePreset;
  cardAspectRatio?: CardAspectRatio;
  maxVisibleCards?: number;
  shuffleOnLoad?: boolean;
  themeCustomisations?: Partial<Record<VisualTheme, Partial<ThemeCustomisation>>>;
  searchFields?: string[];
  groupByField?: string | null;
}

/**
 * Complete per-collection settings file structure.
 */
export interface CollectionSettings {
  version: number;
  forced?: ForcedSettings;
  defaults?: DefaultSettings;
}

export const COLLECTION_SETTINGS_VERSION = 1;
