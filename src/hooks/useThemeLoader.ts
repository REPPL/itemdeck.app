/**
 * React hook for loading external themes.
 *
 * Uses TanStack Query for caching and loading states.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  loadTheme,
  discoverLocalThemes,
  type ThemeLoadResult,
} from "@/loaders/themeLoader";
import type { Theme, ThemeIndexEntry } from "@/schemas/theme.schema";

/**
 * Query keys for theme loading.
 */
export const themeKeys = {
  all: ["themes"] as const,
  index: (sourceId: string) => [...themeKeys.all, "index", sourceId] as const,
  theme: (url: string) => [...themeKeys.all, "theme", url] as const,
  local: () => [...themeKeys.all, "local"] as const,
};

/**
 * Hook for discovering available local themes.
 *
 * @param options - Additional query options
 * @returns Query result with theme index entries
 *
 * @example
 * ```tsx
 * const { data: themes, isLoading } = useLocalThemes();
 *
 * if (isLoading) return <Loading />;
 *
 * return (
 *   <ThemeList themes={themes ?? []} />
 * );
 * ```
 */
export function useLocalThemes(
  options?: Omit<
    UseQueryOptions<ThemeIndexEntry[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: themeKeys.local(),
    queryFn: discoverLocalThemes,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook for loading a specific theme.
 *
 * @param url - Theme URL to load
 * @param options - Additional query options
 * @returns Query result with loaded theme or error
 *
 * @example
 * ```tsx
 * const { data: result, isLoading } = useTheme("/themes/retro-warm.json");
 *
 * if (isLoading) return <Loading />;
 * if (!result?.success) return <Error message={result?.error} />;
 *
 * return <ThemePreview theme={result.theme} />;
 * ```
 */
export function useTheme(
  url: string | null,
  options?: Omit<
    UseQueryOptions<ThemeLoadResult>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: themeKeys.theme(url ?? ""),
    queryFn: () => loadTheme(url ?? ""),
    enabled: !!url,
    staleTime: 30 * 60 * 1000, // 30 minutes (themes change rarely)
    ...options,
  });
}

/**
 * Get the CSS variable overrides for a theme.
 *
 * Converts theme configuration to CSS custom properties.
 *
 * @param theme - Theme to convert
 * @returns Object of CSS variable names to values
 */
export function getThemeCssVariables(theme: Theme): Record<string, string> {
  const variables: Record<string, string> = {};

  // Colour overrides
  if (theme.colours) {
    const { colours } = theme;
    if (colours.accent) variables["--theme-accent"] = colours.accent;
    if (colours.hover) variables["--theme-hover"] = colours.hover;
    if (colours.cardBackground) variables["--theme-card-bg"] = colours.cardBackground;
    if (colours.border) variables["--theme-border"] = colours.border;
    if (colours.text) variables["--theme-text"] = colours.text;
    if (colours.textSecondary) variables["--theme-text-secondary"] = colours.textSecondary;
  }

  // Animation overrides
  if (theme.animations) {
    const { animations } = theme;
    if (animations.flip?.duration !== undefined) {
      variables["--theme-flip-duration"] = `${String(animations.flip.duration)}s`;
    }
    if (animations.flip?.easing) {
      variables["--theme-flip-easing"] = animations.flip.easing;
    }
    if (animations.detail?.duration !== undefined) {
      variables["--theme-detail-duration"] = `${String(animations.detail.duration)}s`;
    }
    if (animations.overlay?.duration !== undefined) {
      variables["--theme-overlay-duration"] = `${String(animations.overlay.duration)}s`;
    }
  }

  // Border overrides
  if (theme.borders) {
    const { borders } = theme;
    if (borders.radius) {
      const radiusMap: Record<string, string> = {
        none: "0",
        small: "4px",
        medium: "8px",
        large: "16px",
        pill: "9999px",
      };
      variables["--theme-border-radius"] = radiusMap[borders.radius] ?? "8px";
    }
    if (borders.width) {
      const widthMap: Record<string, string> = {
        none: "0",
        small: "1px",
        medium: "2px",
        large: "3px",
      };
      variables["--theme-border-width"] = widthMap[borders.width] ?? "1px";
    }
  }

  // Shadow overrides
  if (theme.shadows) {
    const { shadows } = theme;
    if (shadows.intensity) {
      const shadowMap: Record<string, string> = {
        none: "none",
        subtle: "0 2px 4px rgba(0, 0, 0, 0.1)",
        medium: "0 4px 8px rgba(0, 0, 0, 0.15)",
        strong: "0 8px 16px rgba(0, 0, 0, 0.25)",
      };
      variables["--theme-shadow"] = shadowMap[shadows.intensity] ?? "0 4px 8px rgba(0, 0, 0, 0.15)";
    }
  }

  return variables;
}

/**
 * Apply theme CSS variables to a DOM element.
 *
 * @param element - DOM element to apply variables to
 * @param theme - Theme to apply
 */
export function applyThemeToElement(element: HTMLElement, theme: Theme): void {
  const variables = getThemeCssVariables(theme);

  for (const [key, value] of Object.entries(variables)) {
    element.style.setProperty(key, value);
  }
}

/**
 * Remove theme CSS variables from a DOM element.
 *
 * @param element - DOM element to clean
 */
export function removeThemeFromElement(element: HTMLElement): void {
  const themeVariables = [
    "--theme-accent",
    "--theme-hover",
    "--theme-card-bg",
    "--theme-border",
    "--theme-text",
    "--theme-text-secondary",
    "--theme-flip-duration",
    "--theme-flip-easing",
    "--theme-detail-duration",
    "--theme-overlay-duration",
    "--theme-border-radius",
    "--theme-border-width",
    "--theme-shadow",
  ];

  for (const variable of themeVariables) {
    element.style.removeProperty(variable);
  }
}
