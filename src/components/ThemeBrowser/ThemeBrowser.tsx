/**
 * ThemeBrowser component for browsing and selecting themes.
 *
 * Displays built-in themes and external themes from public/themes/.
 */

import { useState, useEffect, useCallback } from "react";
import { useSettingsStore, type VisualTheme } from "@/stores/settingsStore";
import {
  loadThemeIndex,
  loadTheme,
  type ThemeIndexEntry,
  type Theme,
} from "@/services/themeLoader";
import { ThemeCard } from "./ThemeCard";
import styles from "./ThemeBrowser.module.css";

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

const BUILT_IN_THEMES: { id: VisualTheme; name: string; description: string }[] = [
  { id: "retro", name: "Retro", description: "Classic nostalgic style with warm colours" },
  { id: "modern", name: "Modern", description: "Clean contemporary design" },
  { id: "minimal", name: "Minimal", description: "Simple and understated" },
];

/**
 * Theme browser with built-in and external themes.
 */
export function ThemeBrowser() {
  const [externalThemes, setExternalThemes] = useState<ThemeIndexEntry[]>([]);
  const [loadedThemes, setLoadedThemes] = useState<Map<string, Theme>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visualTheme = useSettingsStore((state) => state.visualTheme);
  const setVisualTheme = useSettingsStore((state) => state.setVisualTheme);
  const selectedExternalThemeId = useSettingsStore((state) => state.selectedExternalThemeId);
  const setSelectedExternalThemeId = useSettingsStore((state) => state.setSelectedExternalThemeId);
  const externalThemesLoaded = useSettingsStore((state) => state.externalThemesLoaded);
  const setExternalThemesLoaded = useSettingsStore((state) => state.setExternalThemesLoaded);

  // Load external themes on mount
  const loadExternalThemes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const index = await loadThemeIndex();
      setExternalThemes(index.themes);

      // Load all theme details
      const loaded = new Map<string, Theme>();
      for (const entry of index.themes) {
        try {
          const theme = await loadTheme(entry.url);
          loaded.set(entry.id, theme);
        } catch (err) {
          console.error(`Failed to load theme ${entry.id}:`, err);
        }
      }
      setLoadedThemes(loaded);
      setExternalThemesLoaded(true);
    } catch (err) {
      console.error("Failed to load theme index:", err);
      setError(err instanceof Error ? err.message : "Failed to load themes");
    } finally {
      setIsLoading(false);
    }
  }, [setExternalThemesLoaded]);

  useEffect(() => {
    if (!externalThemesLoaded) {
      void loadExternalThemes();
    }
  }, [externalThemesLoaded, loadExternalThemes]);

  const handleBuiltInSelect = useCallback(
    (themeId: VisualTheme) => {
      setVisualTheme(themeId);
      setSelectedExternalThemeId(null);
    },
    [setVisualTheme, setSelectedExternalThemeId]
  );

  const handleExternalSelect = useCallback(
    (themeId: string) => {
      const theme = loadedThemes.get(themeId);
      if (theme) {
        // Apply the external theme by using its base theme + customisations
        const baseTheme = theme.extends ?? "modern";
        setVisualTheme(baseTheme);
        setSelectedExternalThemeId(themeId);

        // Apply theme customisations (this would need additional store updates)
        // For now, just track the selection
      }
    },
    [loadedThemes, setVisualTheme, setSelectedExternalThemeId]
  );

  const handleRefresh = useCallback(() => {
    setExternalThemesLoaded(false);
    void loadExternalThemes();
  }, [loadExternalThemes, setExternalThemesLoaded]);

  return (
    <div className={styles.container}>
      {/* Built-in themes section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Built-in Themes</h3>
        <div className={styles.themeGrid}>
          {BUILT_IN_THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              id={theme.id}
              name={theme.name}
              description={theme.description}
              isSelected={visualTheme === theme.id && !selectedExternalThemeId}
              onSelect={() => { handleBuiltInSelect(theme.id); }}
            />
          ))}
        </div>
      </section>

      {/* External themes section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Community Themes</h3>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh themes"
          >
            <RefreshIcon />
          </button>
        </div>

        {isLoading && (
          <p className={styles.loading}>Loading themes...</p>
        )}

        {error && (
          <p className={styles.error}>{error}</p>
        )}

        {!isLoading && !error && externalThemes.length === 0 && (
          <p className={styles.empty}>No community themes available</p>
        )}

        {!isLoading && externalThemes.length > 0 && (
          <div className={styles.themeGrid}>
            {externalThemes.map((entry) => {
              const theme = loadedThemes.get(entry.id);
              return (
                <ThemeCard
                  key={entry.id}
                  id={entry.id}
                  name={entry.name}
                  description={entry.description ?? theme?.description ?? ""}
                  author={theme?.author}
                  isSelected={selectedExternalThemeId === entry.id}
                  onSelect={() => { handleExternalSelect(entry.id); }}
                  isExternal
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ThemeBrowser;
