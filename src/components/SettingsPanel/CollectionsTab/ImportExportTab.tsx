/**
 * Import/Export sub-tab for Collections settings.
 *
 * Handles collection-level import and export operations.
 */

import { useState, useRef } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { importCollection, exportCollectionWithFormat, type ExportFormat } from "@/lib/collectionExport";
import styles from "../SettingsPanel.module.css";

/**
 * Import/Export tab component.
 */
export function ImportExportTab() {
  const { cards, collection } = useCollectionData();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (collection) {
      exportCollectionWithFormat(collection, { format: exportFormat });
    }
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExportFormat(e.target.value as ExportFormat);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    void (async () => {
      try {
        const imported = await importCollection(file);

        // Store to localStorage for persistence
        const IMPORT_KEY = "itemdeck-imported-collection";
        localStorage.setItem(IMPORT_KEY, JSON.stringify(imported));

        // Notify user and reload to apply changes
        if (window.confirm("Collection imported successfully! The page will reload to apply changes.")) {
          window.location.reload();
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to import collection");
      }

      // Reset input
      e.target.value = "";
    })();
  };

  return (
    <>
      <h3 className={styles.sectionHeader}>Collection</h3>
      <p className={styles.sectionDescription}>
        Export the current collection or import a previously exported collection.
      </p>

      {/* Export Collection */}
      <div className={styles.row}>
        <span className={styles.label}>Export Collection</span>
        <div className={styles.buttonGroup}>
          <select
            className={styles.formatSelect}
            value={exportFormat}
            onChange={handleFormatChange}
            aria-label="Export format"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="markdown">Markdown</option>
          </select>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleExport}
            disabled={!collection || cards.length === 0}
          >
            Export
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Import Collection */}
      <div className={styles.row}>
        <span className={styles.label}>Import Collection</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleImportClick}
        >
          Import JSON
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
        Export saves the current collection. Import loads a previously exported collection.
      </div>
    </>
  );
}
