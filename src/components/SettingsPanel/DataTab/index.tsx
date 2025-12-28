/**
 * Data settings tab with sub-tabbed interface.
 *
 * Manages data storage, caching, themes, and settings import/export.
 *
 * Sub-tabs:
 * - About: Information about data types
 * - Image Cache: Cache statistics and management
 * - Themes: Theme import/export
 * - Settings: Settings import/export and reset
 */

import { useState, useEffect } from "react";
import { AboutTab } from "./AboutTab";
import { ImageCacheTab } from "./ImageCacheTab";
import { ThemesTab } from "./ThemesTab";
import { SettingsTab } from "./SettingsTab";
import tabStyles from "../CardSettingsTabs.module.css";

type DataSubTab = "about" | "cache" | "themes" | "settings";

const subTabs: { id: DataSubTab; label: string }[] = [
  { id: "about", label: "About" },
  { id: "cache", label: "Image Cache" },
  { id: "themes", label: "Themes" },
  { id: "settings", label: "Settings" },
];

interface DataTabProps {
  /** Initial sub-tab to navigate to (from search) */
  initialSubTab?: string;
}

/**
 * Data settings tab component with sub-navigation.
 */
export function DataTab({ initialSubTab }: DataTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<DataSubTab>("about");

  // Handle navigation from search
  useEffect(() => {
    if (initialSubTab && subTabs.some((t) => t.id === initialSubTab)) {
      setActiveSubTab(initialSubTab as DataSubTab);
    }
  }, [initialSubTab]);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "about":
        return <AboutTab />;
      case "cache":
        return <ImageCacheTab />;
      case "themes":
        return <ThemesTab />;
      case "settings":
        return <SettingsTab />;
    }
  };

  return (
    <div className={tabStyles.container}>
      {/* Sub-tab navigation */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="Data settings sections">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === id}
            aria-controls={`data-subtab-${id}`}
            className={[
              tabStyles.subTab,
              activeSubTab === id ? tabStyles.subTabActive : "",
            ].filter(Boolean).join(" ")}
            onClick={() => { setActiveSubTab(id); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div
        className={tabStyles.subTabContent}
        role="tabpanel"
        id={`data-subtab-${activeSubTab}`}
        aria-labelledby={`data-subtab-btn-${activeSubTab}`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
}
