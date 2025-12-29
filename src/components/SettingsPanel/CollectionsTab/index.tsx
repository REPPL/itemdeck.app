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
 *
 * @see F-107: Auto-switches to Add Source when no collections exist
 */

import { useState, useEffect } from "react";
import { useSources } from "@/stores/sourceStore";
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
  const sources = useSources();
  const hasNoSources = sources.length === 0;

  // Auto-switch to Add Source when no sources exist (F-107)
  const defaultTab: CollectionsSubTab = hasNoSources ? "add-source" : "sources";
  const [activeSubTab, setActiveSubTab] = useState<CollectionsSubTab>(defaultTab);

  // Handle navigation from search
  useEffect(() => {
    if (initialSubTab && subTabs.some((t) => t.id === initialSubTab)) {
      setActiveSubTab(initialSubTab as CollectionsSubTab);
    }
  }, [initialSubTab]);

  // Auto-switch to Add Source when sources become empty (F-107)
  useEffect(() => {
    if (hasNoSources && activeSubTab === "sources") {
      setActiveSubTab("add-source");
    }
  }, [hasNoSources, activeSubTab]);

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
        {subTabs.map(({ id, label }) => {
          // Disable Sources tab when no sources exist (F-107)
          const isDisabled = id === "sources" && hasNoSources;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeSubTab === id}
              aria-controls={`collections-subtab-${id}`}
              aria-disabled={isDisabled}
              className={[
                tabStyles.subTab,
                activeSubTab === id ? tabStyles.subTabActive : "",
                isDisabled ? tabStyles.subTabDisabled : "",
              ].filter(Boolean).join(" ")}
              onClick={() => { if (!isDisabled) setActiveSubTab(id); }}
              disabled={isDisabled}
              title={isDisabled ? "Add a source first" : undefined}
            >
              {label}
            </button>
          );
        })}
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
