/**
 * Theme hook for accessing and managing theme state.
 *
 * Provides the theme mode, resolved theme, and actions
 * for changing the theme. Also handles system preference
 * change detection.
 */

import { useEffect } from "react";
import { useThemeStore, type ThemeMode, type ResolvedTheme } from "@/stores/themeStore";

/**
 * Hook return type for useTheme.
 */
interface UseThemeReturn {
  /** Current theme mode setting (light/dark/auto) */
  mode: ThemeMode;

  /** Resolved theme based on mode and system preference */
  resolvedTheme: ResolvedTheme;

  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;

  /** Toggle between light and dark */
  toggleTheme: () => void;

  /** Whether the resolved theme is dark */
  isDark: boolean;
}

/**
 * Hook for managing theme state.
 *
 * Automatically listens for system preference changes
 * when in auto mode.
 *
 * @returns Theme state and actions
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { mode, resolvedTheme, setMode, toggleTheme, isDark } = useTheme();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       {isDark ? 'Switch to Light' : 'Switch to Dark'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  const { mode, resolvedTheme, setMode, toggleTheme, updateResolvedTheme } =
    useThemeStore();

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event: MediaQueryListEvent) => {
      updateResolvedTheme(event.matches);
    };

    // Set initial value
    updateResolvedTheme(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [updateResolvedTheme]);

  // Apply colour scheme to document (separate from visual theme)
  useEffect(() => {
    document.documentElement.setAttribute("data-colour-scheme", resolvedTheme);
  }, [resolvedTheme]);

  return {
    mode,
    resolvedTheme,
    setMode,
    toggleTheme,
    isDark: resolvedTheme === "dark",
  };
}
