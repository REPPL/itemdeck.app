/**
 * Collections settings tab with sub-tabbed interface.
 *
 * Manages data sources, adding new sources, editing local changes,
 * and collection import/export.
 *
 * Sub-tabs:
 * - Sources: View and manage configured data sources
 * - Add Source: Add new MyPlausibleMe collections
 * - Edit Source: Manage local edits to card data
 * - Import/Export: Collection-level import and export
 */

import { useState, useEffect } from "react";
import { SourcesTab } from "./SourcesTab";
import { AddSourceTab } from "./AddSourceTab";
import { EditSourceTab } from "./EditSourceTab";
import { ImportExportTab } from "./ImportExportTab";
import tabStyles from "../CardSettingsTabs.module.css";

type CollectionsSubTab = "sources" | "add-source" | "edit-source" | "import-export";

const subTabs: { id: CollectionsSubTab; label: string }[] = [
  { id: "sources", label: "Sources" },
  { id: "add-source", label: "Add Source" },
  { id: "edit-source", label: "Edit Source" },
  { id: "import-export", label: "Import/Export" },
];

interface CollectionsTabProps {
  /** Initial sub-tab to navigate to (from search) */
  initialSubTab?: string;
}

/**
 * Collections settings tab component with sub-navigation.
 */
export function CollectionsTab({ initialSubTab }: CollectionsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<CollectionsSubTab>("sources");

  // Handle navigation from search
  useEffect(() => {
    if (initialSubTab && subTabs.some((t) => t.id === initialSubTab)) {
      setActiveSubTab(initialSubTab as CollectionsSubTab);
    }
  }, [initialSubTab]);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "sources":
        return <SourcesTab />;
      case "add-source":
        return <AddSourceTab />;
      case "edit-source":
        return <EditSourceTab />;
      case "import-export":
        return <ImportExportTab />;
    }
  };

  return (
    <div className={tabStyles.container}>
      {/* Sub-tab navigation */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="Collections settings sections">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === id}
            aria-controls={`collections-subtab-${id}`}
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
        id={`collections-subtab-${activeSubTab}`}
        aria-labelledby={`collections-subtab-btn-${activeSubTab}`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
}
