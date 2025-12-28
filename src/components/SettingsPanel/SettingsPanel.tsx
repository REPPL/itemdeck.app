/**
 * Settings panel component with tabbed interface.
 *
 * Provides a centralised interface for configuring user preferences
 * organised into Quick, System, Appearance, and Data tabs.
 *
 * v0.11.1 Redesign: Reduced from 5 tabs to 4 for improved UX.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { QuickSettings } from "./QuickSettings";
import { SystemSettings } from "./SystemSettings";
import { AppearanceSettingsTabs } from "./AppearanceSettingsTabs";
import { StorageSettingsTabs } from "./StorageSettingsTabs";
import { SettingsSearch } from "./SettingsSearch";
import { useSettingsStore } from "@/stores/settingsStore";
import { useViewportSize } from "@/hooks/useViewportSize";
import styles from "./SettingsPanel.module.css";

interface SettingsPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;

  /** Called when the panel should close */
  onClose: () => void;

  /** Whether TanStack devtools are enabled */
  devtoolsEnabled?: boolean;

  /** Callback to toggle devtools */
  onDevtoolsToggle?: () => void;
}

/**
 * Tab configuration.
 * v0.11.1: 4 tabs (Quick | System | Appearance | Data)
 */
type TabId = "quick" | "system" | "appearance" | "data";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

/**
 * Icon components.
 */
function QuickIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5.1 15a1.65 1.65 0 0 0-1.51-1.08H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.17.58.26.91.26H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function DataIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const tabs: Tab[] = [
  { id: "quick", label: "Quick", icon: <QuickIcon /> },
  { id: "system", label: "System", icon: <SystemIcon /> },
  { id: "appearance", label: "Appearance", icon: <AppearanceIcon /> },
  { id: "data", label: "Data", icon: <DataIcon /> },
];

/**
 * Settings panel with tabbed navigation.
 */
export function SettingsPanel({
  isOpen,
  onClose,
  devtoolsEnabled = false,
  onDevtoolsToggle,
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("quick");
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);

  const { resetToDefaults } = useSettingsStore();

  // Viewport size for responsive behaviour
  const { width } = useViewportSize();
  const isNarrowScreen = width < 360;
  const isFullWidthScreen = width < 440;

  // Handle navigation from search results
  const handleSearchNavigate = useCallback((tab: TabId, subTab?: string) => {
    setActiveTab(tab);
    setActiveSubTab(subTab);
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "quick":
        return <QuickSettings />;

      case "system":
        return (
          <SystemSettings
            devtoolsEnabled={devtoolsEnabled}
            onDevtoolsToggle={onDevtoolsToggle}
          />
        );

      case "appearance":
        return <AppearanceSettingsTabs initialSubTab={activeSubTab} />;

      case "data":
        return <StorageSettingsTabs initialSubTab={activeSubTab} />;
    }
  };

  // Get panel class names based on viewport width
  const panelClassName = [
    styles.panel,
    isFullWidthScreen ? styles.panelFullWidth : "",
  ].filter(Boolean).join(" ");

  const panelContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <header className={styles.header}>
          <h2 id="settings-title" className={styles.title}>Settings</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            <CloseIcon />
          </button>
        </header>

        {/* Search */}
        <SettingsSearch onNavigate={handleSearchNavigate} />

        {/* Tab navigation - show dropdown on very narrow screens */}
        {isNarrowScreen ? (
          <div className={styles.tabDropdownContainer}>
            <select
              className={styles.tabDropdown}
              value={activeTab}
              onChange={(e) => { setActiveTab(e.target.value as TabId); setActiveSubTab(undefined); }}
              aria-label="Select settings section"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <nav className={styles.tabs} role="tablist" aria-label="Settings sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                className={[
                  styles.tab,
                  activeTab === tab.id ? styles.tabActive : "",
                ].filter(Boolean).join(" ")}
                onClick={() => { setActiveTab(tab.id); setActiveSubTab(undefined); }}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Tab content */}
        <div
          className={styles.content}
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {renderTabContent()}
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerButtons}>
            <button type="button" className={styles.resetButton} onClick={resetToDefaults}>
              Reset
            </button>
            <div className={styles.footerRight}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button type="button" className={styles.acceptButton} onClick={onClose}>
                Accept
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(panelContent, document.body);
}
