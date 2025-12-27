/**
 * Theme loader service for fetching external themes.
 *
 * Loads themes from public/themes/ or remote URLs.
 */

import {
  themeIndexSchema,
  themeSchema,
  type Theme,
  type ThemeIndex,
  type ThemeIndexEntry,
} from "@/schemas/theme.schema";

const DEFAULT_THEMES_URL = "/themes/index.json";

// Cache for loaded themes
const themeCache = new Map<string, Theme>();

/**
 * Load theme index from URL.
 *
 * @param url - URL to theme index (defaults to public/themes/index.json)
 * @returns Theme index with list of available themes
 */
export async function loadThemeIndex(url: string = DEFAULT_THEMES_URL): Promise<ThemeIndex> {
  const response = await fetch(url, {
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load theme index: HTTP ${String(response.status)}`);
  }

  const data: unknown = await response.json();
  return themeIndexSchema.parse(data);
}

/**
 * Load a specific theme from URL.
 *
 * @param urlOrPath - URL or path to theme JSON file
 * @returns Validated theme object
 */
export async function loadTheme(urlOrPath: string): Promise<Theme> {
  // Check cache first
  const cached = themeCache.get(urlOrPath);
  if (cached) {
    return cached;
  }

  // Resolve relative paths
  const url = urlOrPath.startsWith("http") ? urlOrPath : `/themes/${urlOrPath}`;

  const response = await fetch(url, {
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load theme: HTTP ${String(response.status)}`);
  }

  const data: unknown = await response.json();
  const theme = themeSchema.parse(data);

  // Cache the loaded theme
  themeCache.set(urlOrPath, theme);

  return theme;
}

/**
 * Load a theme from the index by ID.
 *
 * @param themeId - Theme ID to load
 * @param index - Theme index (optional, will be fetched if not provided)
 * @returns Theme object or null if not found
 */
export async function loadThemeById(
  themeId: string,
  index?: ThemeIndex
): Promise<Theme | null> {
  const themeIndex = index ?? (await loadThemeIndex());
  const entry = themeIndex.themes.find((t) => t.id === themeId);

  if (!entry) {
    return null;
  }

  return loadTheme(entry.url);
}

/**
 * Get default themes URL.
 */
export function getDefaultThemesUrl(): string {
  return DEFAULT_THEMES_URL;
}

/**
 * Clear theme cache.
 */
export function clearThemeCache(): void {
  themeCache.clear();
}

/**
 * Load all themes from index.
 *
 * @param index - Theme index (optional, will be fetched if not provided)
 * @returns Array of theme entries with loaded theme data
 */
export async function loadAllThemes(
  index?: ThemeIndex
): Promise<(ThemeIndexEntry & { theme?: Theme; error?: string })[]> {
  const themeIndex = index ?? (await loadThemeIndex());

  const results = await Promise.all(
    themeIndex.themes.map(async (entry) => {
      try {
        const theme = await loadTheme(entry.url);
        return { ...entry, theme };
      } catch (error) {
        return {
          ...entry,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return results;
}

export type { Theme, ThemeIndex, ThemeIndexEntry };
