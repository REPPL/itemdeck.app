/**
 * Edit Source sub-tab for Collections settings.
 *
 * Manages local edits to card data including:
 * - Viewing modified card count
 * - Exporting/importing edits
 * - Reverting all edits
 */

import { useState, useRef } from "react";
import { useEditsStore } from "@/stores/editsStore";
import { exportEditsToFile, importEditsFromFile } from "@/utils/editExport";
import styles from "../SettingsPanel.module.css";

/**
 * Edit Source tab component - manages local edits.
 */
export function EditSourceTab() {
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const editsFileInputRef = useRef<HTMLInputElement>(null);

  // Edits store
  const edits = useEditsStore((s) => s.edits);
  const revertAll = useEditsStore((s) => s.revertAll);
  const importEdits = useEditsStore((s) => s.importEdits);
  const editCount = Object.keys(edits).length;

  const handleExportEdits = () => {
    exportEditsToFile(edits, "itemdeck");
  };

  const handleEditsImportClick = () => {
    editsFileInputRef.current?.click();
  };

  const handleEditsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    void (async () => {
      try {
        const imported = await importEditsFromFile(file);
        const editCountStr = String(imported.editCount);
        const action = window.confirm(
          `Import ${editCountStr} edits?\n\nClick OK to merge with existing edits.\nClick Cancel to replace all edits.`
        );
        importEdits(imported, action ? "merge" : "replace");
        alert(`Successfully imported ${editCountStr} edits.`);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to import edits");
      }

      // Reset input
      e.target.value = "";
    })();
  };

  const handleRevertAllEdits = () => {
    if (showRevertConfirm) {
      revertAll();
      setShowRevertConfirm(false);
    } else {
      setShowRevertConfirm(true);
    }
  };

  const handleCancelRevert = () => {
    setShowRevertConfirm(false);
  };

  return (
    <>
      <h3 className={styles.sectionHeader}>Local Edits</h3>
      <p className={styles.sectionDescription}>
        View and manage local changes made to card data.
      </p>

      <div className={styles.row}>
        <span className={styles.label}>Modified Cards</span>
        <span className={styles.value}>{editCount}</span>
      </div>

      <div className={styles.divider} />

      {/* Export Edits */}
      <div className={styles.row}>
        <span className={styles.label}>Export Edits</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleExportEdits}
          disabled={editCount === 0}
        >
          Export JSON
        </button>
      </div>

      {/* Import Edits */}
      <div className={styles.row}>
        <span className={styles.label}>Import Edits</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleEditsImportClick}
        >
          Import JSON
        </button>
        <input
          ref={editsFileInputRef}
          type="file"
          accept=".json"
          onChange={handleEditsFileChange}
          style={{ display: "none" }}
        />
      </div>

      <div className={styles.divider} />

      {/* Revert All */}
      <div className={styles.row}>
        <span className={styles.label}>
          {showRevertConfirm ? "Are you sure?" : "Revert All Edits"}
        </span>
        <div className={styles.buttonGroup}>
          {showRevertConfirm ? (
            <>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleRevertAllEdits}
              >
                Confirm
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelRevert}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleRevertAllEdits}
              disabled={editCount === 0}
            >
              Revert All
            </button>
          )}
        </div>
      </div>

      <div className={styles.helpText}>
        This will discard all local changes and restore original data.
      </div>
    </>
  );
}
