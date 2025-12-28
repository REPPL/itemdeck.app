/**
 * About sub-tab for Data settings.
 *
 * Provides information about the different data types used by the application:
 * - Image Cache: storage type, eviction policy, cache limit
 * - Themes: how to import/export theme files
 * - Settings: how to import/export settings
 */

import { useState } from "react";
import { DEFAULT_MAX_CACHE_SIZE, formatBytes } from "@/hooks/useImageCache";
import styles from "../SettingsPanel.module.css";
import tabStyles from "../CardSettingsTabs.module.css";

type AboutDataType = "image-cache" | "themes" | "settings";

const dataTypes: { id: AboutDataType; label: string }[] = [
  { id: "image-cache", label: "Image Cache" },
  { id: "themes", label: "Themes" },
  { id: "settings", label: "Settings" },
];

/**
 * About tab component - explains data types.
 */
export function AboutTab() {
  const [activeDataType, setActiveDataType] = useState<AboutDataType>("image-cache");

  const renderContent = () => {
    switch (activeDataType) {
      case "image-cache":
        return (
          <>
            <div className={styles.helpText}>
              Images are automatically cached in your browser using IndexedDB
              storage for faster loading and offline access.
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Storage Type</span>
              <span className={styles.value}>IndexedDB</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Cache Limit</span>
              <span className={styles.value}>{formatBytes(DEFAULT_MAX_CACHE_SIZE)}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Eviction Policy</span>
              <span className={styles.value}>LRU (Least Recently Used)</span>
            </div>

            <div className={styles.helpText}>
              The cache persists across browser sessions. Clearing browser data
              or using private/incognito mode will clear the cache.
            </div>
          </>
        );

      case "themes":
        return (
          <>
            <div className={styles.helpText}>
              Themes customise the visual appearance of the application.
              You can import community themes or export your custom theme settings.
            </div>

            <h3 className={styles.sectionHeader}>Theme Format</h3>

            <div className={styles.helpText}>
              Themes are stored as JSON files containing colour values,
              border settings, animation preferences, and other visual properties.
            </div>

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Importing Themes</h3>

            <div className={styles.helpText}>
              To import a theme, go to Data &gt; Themes and click &quot;Import Theme&quot;.
              Select a valid theme JSON file from your device.
            </div>

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Exporting Themes</h3>

            <div className={styles.helpText}>
              To export your current theme, go to Data &gt; Themes and click &quot;Export Theme&quot;.
              This saves your theme customisations as a JSON file.
            </div>
          </>
        );

      case "settings":
        return (
          <>
            <div className={styles.helpText}>
              Settings control application behaviour, layout preferences,
              and accessibility options.
            </div>

            <h3 className={styles.sectionHeader}>Settings Format</h3>

            <div className={styles.helpText}>
              Settings are stored as JSON containing layout preferences,
              card display options, field mappings, and UI visibility toggles.
            </div>

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Exporting Settings</h3>

            <div className={styles.helpText}>
              To export your settings, go to Data &gt; Settings and click &quot;Export Settings&quot;.
              This creates a backup of all your preferences.
            </div>

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Importing Settings</h3>

            <div className={styles.helpText}>
              To import settings, go to Data &gt; Settings and click &quot;Import Settings&quot;.
              This will replace your current settings with the imported values.
            </div>

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Resetting Settings</h3>

            <div className={styles.helpText}>
              To reset all settings to defaults, use the &quot;Reset&quot; button at the bottom
              of the settings panel, or go to Data &gt; Settings and click &quot;Reset to Defaults&quot;.
            </div>
          </>
        );
    }
  };

  return (
    <>
      <h3 className={styles.sectionHeader}>Data Types</h3>

      {/* Third-level tabs for data types */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="Data type information">
        {dataTypes.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeDataType === id}
            className={[
              tabStyles.subTab,
              activeDataType === id ? tabStyles.subTabActive : "",
            ].filter(Boolean).join(" ")}
            onClick={() => { setActiveDataType(id); }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={tabStyles.subTabContent}>
        {renderContent()}
      </div>
    </>
  );
}
