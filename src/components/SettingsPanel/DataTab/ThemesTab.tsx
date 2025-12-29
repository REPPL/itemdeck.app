/**
 * Themes sub-tab for Data settings.
 *
 * Manages theme import/export and custom theme management.
 * Exports only customisation overrides, not full theme data.
 */

import { useRef, useState, useCallback } from "react";
import {
  useSettingsStore,
  DEFAULT_THEME_CUSTOMISATIONS,
  type VisualTheme,
} from "@/stores/settingsStore";
import {
  exportThemeToFile,
  importThemeFromFile,
  hasThemeCustomisations,
  countThemeOverrides,
} from "@/utils/themeExport";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Toast } from "@/components/Toast";
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
  const [switchToBaseTheme, setSwitchToBaseTheme] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "info";
    visible: boolean;
  }>({ message: "", type: "info", visible: false });

  const visualTheme = useSettingsStore((s) => s.visualTheme);
  const setThemeCustomisation = useSettingsStore((s) => s.setThemeCustomisation);

  const showToast = useCallback(
    (message: string, type?: "success" | "warning" | "info") => {
      setToast({ message, type: type ?? "info", visible: true });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleExportTheme = useCallback(() => {
    try {
      exportThemeToFile(visualTheme);
      const overrideCount = countThemeOverrides(visualTheme);
      showToast(
        `Exported ${String(overrideCount)} customisation${overrideCount !== 1 ? "s" : ""} for ${themeLabels[visualTheme]}`,
        "success"
      );
    } catch {
      showToast("Failed to export theme", "warning");
    }
  }, [visualTheme, showToast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const result = await importThemeFromFile(file, switchToBaseTheme);
        const themeName = result.name ?? themeLabels[result.baseTheme];
        const switchedMessage = switchToBaseTheme
          ? ` (switched to ${themeLabels[result.baseTheme]})`
          : "";
        showToast(
          `Imported "${themeName}" with ${String(result.overrideCount)} customisation${result.overrideCount !== 1 ? "s" : ""}${switchedMessage}`,
          "success"
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to import theme";
        showToast(message, "warning");
      } finally {
        setIsImporting(false);
        // Reset input to allow re-importing the same file
        e.target.value = "";
      }
    },
    [switchToBaseTheme, showToast]
  );

  const handleResetClick = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    setThemeCustomisation(visualTheme, DEFAULT_THEME_CUSTOMISATIONS[visualTheme]);
    setShowResetConfirm(false);
    showToast(`${themeLabels[visualTheme]} theme reset to defaults`, "success");
  }, [visualTheme, setThemeCustomisation, showToast]);

  const handleResetCancel = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  // Check if current theme has been modified from defaults
  const isModified = hasThemeCustomisations(visualTheme);
  const overrideCount = countThemeOverrides(visualTheme);

  return (
    <>
      <h3 className={styles.sectionHeader}>Current Theme</h3>

      <div className={styles.row}>
        <span className={styles.label}>Active Theme</span>
        <span className={styles.value}>{themeLabels[visualTheme]}</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Customisations</span>
        <span className={styles.value}>
          {isModified ? `${String(overrideCount)} override${overrideCount !== 1 ? "s" : ""}` : "None"}
        </span>
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
        {isModified
          ? `Exports ${String(overrideCount)} customisation override${overrideCount !== 1 ? "s" : ""} as a JSON file.`
          : "Exports your current theme customisations (currently using defaults)."}
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Import Theme</h3>

      <div className={styles.row}>
        <span className={styles.label}>Switch to base theme</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={switchToBaseTheme}
            onChange={(e) => { setSwitchToBaseTheme(e.target.checked); }}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      <div className={styles.helpText}>
        {switchToBaseTheme
          ? "Automatically switch to the theme specified in the import file."
          : "Apply customisations to the current theme, ignoring the import file's base theme."}
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Load from file</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import Theme"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={(e) => { void handleFileChange(e); }}
          style={{ display: "none" }}
        />
      </div>

      <div className={styles.helpText}>
        Imports theme customisations from a JSON file.
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
        message={`This will reset the "${themeLabels[visualTheme]}" theme to its default settings. Your ${String(overrideCount)} customisation${overrideCount !== 1 ? "s" : ""} will be lost.`}
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
      />

      {/* Toast notification */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
        duration={3000}
      />
    </>
  );
}
