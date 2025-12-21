/**
 * Hook for applying visual themes.
 *
 * Syncs the visual theme from the settings store to the document.
 */

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { applyVisualTheme } from "@/styles/themes";

/**
 * Apply the visual theme from settings to the document.
 *
 * This hook should be used at the app root level to ensure
 * the visual theme is always synced with settings.
 *
 * @example
 * ```tsx
 * function App() {
 *   useVisualTheme();
 *   return <MyApp />;
 * }
 * ```
 */
export function useVisualTheme(): void {
  const visualTheme = useSettingsStore((state) => state.visualTheme);

  useEffect(() => {
    applyVisualTheme(visualTheme);
  }, [visualTheme]);
}

export default useVisualTheme;
