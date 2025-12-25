/**
 * Theme loader for external themes.
 *
 * Loads and validates theme JSON files from local or remote sources.
 * Supports theme discovery via index files and direct URLs.
 */

import {
  type Theme,
  type ThemeIndexEntry,
  safeValidateTheme,
  formatThemeValidationError,
  themeIndexSchema,
} from "@/schemas/theme.schema";
import { isFromTrustedSource } from "@/config/themeRegistry";

/**
 * Result of loading a theme.
 */
export interface ThemeLoadResult {
  success: boolean;
  theme?: Theme;
  error?: string;
}

/**
 * Result of loading a theme index.
 */
export interface ThemeIndexLoadResult {
  success: boolean;
  themes?: ThemeIndexEntry[];
  error?: string;
}

/**
 * Load a theme from a URL.
 *
 * @param url - URL to the theme JSON file
 * @returns Theme load result with validated theme or error
 */
export async function loadTheme(url: string): Promise<ThemeLoadResult> {
  try {
    // Security check for untrusted sources
    if (!isFromTrustedSource(url) && !url.startsWith("/")) {
      console.warn(`Loading theme from untrusted source: ${url}`);
    }

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch theme: ${String(response.status)} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return {
        success: false,
        error: `Invalid content type: expected application/json, got ${contentType ?? "unknown"}`,
      };
    }

    const data = await response.json() as unknown;
    const result = safeValidateTheme(data);

    if (!result.success) {
      return {
        success: false,
        error: formatThemeValidationError(result.error),
      };
    }

    // Generate ID from filename if not provided
    const theme = result.data;
    if (!theme.id) {
      const filename = url.split("/").pop()?.replace(/\.json$/, "");
      theme.id = filename ?? "custom-theme";
    }

    return {
      success: true,
      theme,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error loading theme",
    };
  }
}

/**
 * Load a theme index from a URL.
 *
 * Theme indexes list available themes from a source. The index URL
 * typically points to an `index.json` file.
 *
 * @param baseUrl - Base URL for the theme source
 * @returns Theme index load result with theme entries or error
 */
export async function loadThemeIndex(baseUrl: string): Promise<ThemeIndexLoadResult> {
  try {
    const indexUrl = baseUrl.endsWith("/")
      ? `${baseUrl}index.json`
      : `${baseUrl}/index.json`;

    const response = await fetch(indexUrl);

    if (!response.ok) {
      // Index not found is not an error - source may not have index
      if (response.status === 404) {
        return {
          success: true,
          themes: [],
        };
      }
      return {
        success: false,
        error: `Failed to fetch theme index: ${String(response.status)} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return {
        success: false,
        error: `Invalid content type for theme index: ${contentType ?? "unknown"}`,
      };
    }

    const data = await response.json() as unknown;
    const result = themeIndexSchema.safeParse(data);

    if (!result.success) {
      return {
        success: false,
        error: `Invalid theme index format`,
      };
    }

    // Resolve relative URLs to absolute
    const themes = result.data.themes.map((theme) => ({
      ...theme,
      url: theme.url.startsWith("http")
        ? theme.url
        : `${baseUrl}${theme.url.startsWith("/") ? theme.url.slice(1) : theme.url}`,
    }));

    return {
      success: true,
      themes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error loading theme index",
    };
  }
}

/**
 * Discover themes from the local themes folder.
 *
 * Attempts to load the theme index, or falls back to a list of
 * known theme files.
 *
 * @returns List of available local themes
 */
export async function discoverLocalThemes(): Promise<ThemeIndexEntry[]> {
  const result = await loadThemeIndex("/themes/");

  if (result.success && result.themes && result.themes.length > 0) {
    return result.themes;
  }

  // Fallback: try to load known example themes directly
  // In a real app, this would scan the directory
  const knownThemes = ["retro-warm", "modern-dark", "minimal-light"];
  const themes: ThemeIndexEntry[] = [];

  for (const themeName of knownThemes) {
    const url = `/themes/${themeName}.json`;
    const loadResult = await loadTheme(url);

    if (loadResult.success && loadResult.theme) {
      themes.push({
        id: loadResult.theme.id ?? themeName,
        name: loadResult.theme.name,
        url,
        description: loadResult.theme.description,
      });
    }
  }

  return themes;
}

/**
 * Check if a theme URL is valid and accessible.
 *
 * @param url - URL to check
 * @returns True if the URL points to a valid theme
 */
export async function isValidThemeUrl(url: string): Promise<boolean> {
  const result = await loadTheme(url);
  return result.success;
}
