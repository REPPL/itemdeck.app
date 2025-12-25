/**
 * Theme registry configuration.
 *
 * Defines available theme sources: local folder and curated remote registries.
 * Only themes from trusted sources are loaded by default.
 */

/**
 * A source for external themes.
 */
export interface ThemeSource {
  /** Unique source identifier */
  id: string;
  /** Display name */
  name: string;
  /** Base URL for theme files */
  url: string;
  /** Whether this source is trusted (pre-approved) */
  trusted: boolean;
  /** Description of the source */
  description?: string;
}

/**
 * Curated list of theme sources.
 *
 * Local themes are always trusted. Remote sources are curated
 * and must be explicitly added to this list.
 */
export const CURATED_THEME_SOURCES: ThemeSource[] = [
  {
    id: "local",
    name: "Local Themes",
    url: "/themes/",
    trusted: true,
    description: "Themes from your local themes folder",
  },
  // Future: Add curated remote sources
  // {
  //   id: "itemdeck-community",
  //   name: "Itemdeck Community",
  //   url: "https://themes.itemdeck.dev/",
  //   trusted: true,
  //   description: "Community-curated themes",
  // },
];

/**
 * Get a theme source by ID.
 */
export function getThemeSource(id: string): ThemeSource | undefined {
  return CURATED_THEME_SOURCES.find((source) => source.id === id);
}

/**
 * Get all trusted theme sources.
 */
export function getTrustedSources(): ThemeSource[] {
  return CURATED_THEME_SOURCES.filter((source) => source.trusted);
}

/**
 * Check if a URL is from a trusted source.
 */
export function isFromTrustedSource(url: string): boolean {
  return CURATED_THEME_SOURCES.some(
    (source) => source.trusted && url.startsWith(source.url)
  );
}
