/**
 * Themes sub-tab for Data settings.
 *
 * Manages theme import/export and custom theme management.
 */

import { useRef, useState, useCallback } from "react";
import {
  useSettingsStore,
  DEFAULT_THEME_CUSTOMISATIONS,
  type VisualTheme,
} from "@/stores/settingsStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import styles from "../SettingsPanel.module.css";

/**
 * Theme label mapping.
 */
const themeLabels: Record<VisualTheme, string> = {
  retro: "Retro",
  modern: "Modern",
  minimal: "Minimal",
};

/**
 * Themes tab component - manages theme import/export.
 */
export function ThemesTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const visualTheme = useSettingsStore((s) => s.visualTheme);
  const themeCustomisations = useSettingsStore((s) => s.themeCustomisations);
  const setThemeCustomisation = useSettingsStore((s) => s.setThemeCustomisation);

  const handleExportTheme = () => {
    const currentCustomisation = themeCustomisations[visualTheme];
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      theme: visualTheme,
      customisation: currentCustomisation,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itemdeck-theme-${visualTheme}-${new Date().toISOString().split("T")[0] ?? "export"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content) as {
          version?: number;
          theme?: VisualTheme;
          customisation?: Record<string, unknown>;
        };

        // Validate import format
        if (!imported.customisation) {
          throw new Error("Invalid theme file: missing customisation data");
        }

        // Apply to current theme
        setThemeCustomisation(visualTheme, imported.customisation);
        alert("Theme imported successfully!");
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to import theme");
      }

      // Reset input
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleResetClick = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    setThemeCustomisation(visualTheme, DEFAULT_THEME_CUSTOMISATIONS[visualTheme]);
    setShowResetConfirm(false);
  }, [visualTheme, setThemeCustomisation]);

  const handleResetCancel = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  // Check if current theme has been modified from defaults
  const isModified = JSON.stringify(themeCustomisations[visualTheme]) !==
    JSON.stringify(DEFAULT_THEME_CUSTOMISATIONS[visualTheme]);

  return (
    <>
      <h3 className={styles.sectionHeader}>Current Theme</h3>

      <div className={styles.row}>
        <span className={styles.label}>Active Theme</span>
        <span className={styles.value}>{themeLabels[visualTheme]}</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Customised</span>
        <span className={styles.value}>{isModified ? "Yes" : "No"}</span>
      </div>

      <div className={styles.helpText}>
        Theme customisations are made in Appearance &gt; Theme.
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Export Theme</h3>

      <div className={styles.row}>
        <span className={styles.label}>Save to file</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleExportTheme}
        >
          Export Theme
        </button>
      </div>

      <div className={styles.helpText}>
        Exports your current theme customisations as a JSON file.
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Import Theme</h3>

      <div className={styles.row}>
        <span className={styles.label}>Load from file</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleImportClick}
        >
          Import Theme
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      <div className={styles.helpText}>
        Imports theme customisations from a JSON file and applies them to the current theme.
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Reset Theme</h3>

      <div className={styles.row}>
        <span className={styles.label}>Reset to defaults</span>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={handleResetClick}
          disabled={!isModified}
        >
          Reset Theme
        </button>
      </div>

      <div className={styles.helpText}>
        Resets the current theme to its default settings.
      </div>

      {/* Reset confirmation dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Theme"
        message={`This will reset the "${themeLabels[visualTheme]}" theme to its default settings. Your customisations will be lost.`}
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
      />
    </>
  );
}
