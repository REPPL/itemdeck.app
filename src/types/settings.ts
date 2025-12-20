/**
 * Application settings for card display configuration.
 */
export interface CardSettings {
  /**
   * Card width in pixels.
   * @default 500
   */
  width: number;

  /**
   * Card aspect ratio as [width, height].
   * Common ratios:
   * - [5, 7] - Poker/Bridge card (2.5" x 3.5")
   * - [3, 4] - Standard photo
   * - [2, 3] - Tarot card
   * - [1, 1] - Square
   * @default [5, 7]
   */
  ratio: [number, number];

  /**
   * URL to custom logo for card backs.
   * If undefined, uses the default placeholder logo.
   */
  logoUrl?: string;
}

/**
 * Full application settings.
 */
export interface AppSettings {
  card: CardSettings;
}

/**
 * Default card settings using poker card ratio.
 */
export const DEFAULT_CARD_SETTINGS: CardSettings = {
  width: 300,
  ratio: [5, 7],
};

/**
 * Default application settings.
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  card: DEFAULT_CARD_SETTINGS,
};

/**
 * Calculate card height from width and ratio.
 */
export function calculateCardHeight(width: number, ratio: [number, number]): number {
  const [ratioWidth, ratioHeight] = ratio;
  return Math.round((width / ratioWidth) * ratioHeight);
}
