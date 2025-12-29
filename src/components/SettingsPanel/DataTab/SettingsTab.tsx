/**
 * Settings sub-tab for Data settings.
 *
 * Manages settings import/export and reset functionality.
 * Uses Zod validation for import and supports Replace/Merge modes.
 */

import { useRef, useState, useCallback } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  exportSettingsToFile,
  importSettingsFromFile,
  type ImportMode,
} from "@/utils/settingsExport";
import { Toast } from "@/components/Toast";
import styles from "../SettingsPanel.module.css";

/**
 * Settings tab component - manages settings import/export.
 */
export function SettingsTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "info";
    visible: boolean;
  }>({ message: "", type: "info", visible: false });

  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);

  const showToast = useCallback(
    (message: string, type?: "success" | "warning" | "info") => {
      setToast({ message, type: type ?? "info", visible: true });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleExportSettings = useCallback(() => {
    try {
      exportSettingsToFile();
      showToast("Settings exported successfully", "success");
    } catch {
      showToast("Failed to export settings", "warning");
    }
  }, [showToast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const result = await importSettingsFromFile(file, importMode);
        const modeLabel = importMode === "replace" ? "replaced" : "merged";
        showToast(
          `Imported ${String(result.settingsCount)} settings (${modeLabel}) from v${String(result.version)}`,
          "success"
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to import settings";
        showToast(message, "warning");
      } finally {
        setIsImporting(false);
        // Reset input to allow re-importing the same file
        e.target.value = "";
      }
    },
    [importMode, showToast]
  );

  const handleResetToDefaults = useCallback(() => {
    if (showResetConfirm) {
      resetToDefaults();
      setShowResetConfirm(false);
      showToast("Settings reset to defaults", "success");
    } else {
      setShowResetConfirm(true);
    }
  }, [showResetConfirm, resetToDefaults, showToast]);

  const handleCancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  return (
    <>
      <h3 className={styles.sectionHeader}>Export Settings</h3>

      <div className={styles.row}>
        <span className={styles.label}>Save all settings</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleExportSettings}
        >
          Export Settings
        </button>
      </div>

      <div className={styles.helpText}>
        Exports all your preferences, layout settings, and theme customisations.
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Import Settings</h3>

      <div className={styles.row}>
        <span className={styles.label}>Import mode</span>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentButton ?? ""} ${importMode === "merge" ? (styles.segmentButtonActive ?? "") : ""}`}
            onClick={() => { setImportMode("merge"); }}
            aria-pressed={importMode === "merge"}
          >
            Merge
          </button>
          <button
            type="button"
            className={`${styles.segmentButton ?? ""} ${importMode === "replace" ? (styles.segmentButtonActive ?? "") : ""}`}
            onClick={() => { setImportMode("replace"); }}
            aria-pressed={importMode === "replace"}
          >
            Replace
          </button>
        </div>
      </div>

      <div className={styles.helpText}>
        {importMode === "merge"
          ? "Merge keeps your current settings and only updates values from the file."
          : "Replace resets to defaults first, then applies the imported settings."}
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Load from file</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import Settings"}
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
        Imports settings from a previously exported JSON file.
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Reset Settings</h3>

      <div className={styles.row}>
        <span className={styles.label}>
          {showResetConfirm ? "Are you sure?" : "Reset all settings"}
        </span>
        <div className={styles.buttonGroup}>
          {showResetConfirm ? (
            <>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleResetToDefaults}
              >
                Confirm
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelReset}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleResetToDefaults}
            >
              Reset to Defaults
            </button>
          )}
        </div>
      </div>

      <div className={styles.helpText}>
        Resets all settings to their default values. This cannot be undone.
      </div>

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
