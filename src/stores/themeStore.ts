/**
 * Theme store using Zustand with persistence.
 *
 * Manages theme mode (light/dark/auto) and provides
 * the resolved theme based on system preference.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Theme mode options.
 */
export type ThemeMode = "light" | "dark" | "auto";

/**
 * Resolved theme (actual appearance).
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Theme store state and actions.
 */
interface ThemeState {
  /** Current theme mode setting */
  mode: ThemeMode;

  /** Resolved theme based on mode and system preference */
  resolvedTheme: ResolvedTheme;

  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;

  /** Toggle between light and dark (sets explicit mode) */
  toggleTheme: () => void;

  /** Update resolved theme when system preference changes */
  updateResolvedTheme: (systemPrefersDark: boolean) => void;
}

/**
 * Get initial resolved theme.
 */
function getInitialResolvedTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "auto") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }
  return mode;
}

/**
 * Theme store with localStorage persistence.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "auto",
      resolvedTheme: getInitialResolvedTheme("auto"),

      setMode: (mode) => {
        const resolvedTheme = getInitialResolvedTheme(mode);
        set({ mode, resolvedTheme });
      },

      toggleTheme: () => {
        const { resolvedTheme } = get();
        const newMode: ThemeMode = resolvedTheme === "light" ? "dark" : "light";
        set({ mode: newMode, resolvedTheme: newMode });
      },

      updateResolvedTheme: (systemPrefersDark) => {
        const { mode } = get();
        if (mode === "auto") {
          set({ resolvedTheme: systemPrefersDark ? "dark" : "light" });
        }
      },
    }),
    {
      name: "itemdeck-theme",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Update resolved theme after rehydration
          state.resolvedTheme = getInitialResolvedTheme(state.mode);
        }
      },
    }
  )
);
