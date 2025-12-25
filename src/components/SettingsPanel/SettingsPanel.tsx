/**
 * Settings panel component with tabbed interface.
 *
 * Provides a centralised interface for configuring user preferences
 * organised into System, Theme, and Cards tabs.
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshButton } from "@/components/RefreshButton";
import { CardSettingsTabs } from "./CardSettingsTabs";
import { ThemeSettingsTabs } from "./ThemeSettingsTabs";
import { ConfigSettingsTabs } from "./ConfigSettingsTabs";
import { StorageSettingsTabs } from "./StorageSettingsTabs";
import {
  useSettingsStore,
  type ReduceMotionPreference,
} from "@/stores/settingsStore";
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
 */
type TabId = "system" | "theme" | "cards" | "config" | "storage";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

/**
 * Icon components.
 */
function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5.1 15a1.65 1.65 0 0 0-1.51-1.08H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.17.58.26.91.26H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ThemeIcon() {
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

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function ConfigIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function StorageIcon() {
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

// Layout Mode icons - not yet implemented
// function GridIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
//       <rect x="3" y="3" width="7" height="7" rx="1" />
//       <rect x="14" y="3" width="7" height="7" rx="1" />
//       <rect x="3" y="14" width="7" height="7" rx="1" />
//       <rect x="14" y="14" width="7" height="7" rx="1" />
//     </svg>
//   );
// }
//
// function ListIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
//       <rect x="3" y="4" width="18" height="4" rx="1" />
//       <rect x="3" y="10" width="18" height="4" rx="1" />
//       <rect x="3" y="16" width="18" height="4" rx="1" />
//     </svg>
//   );
// }
//
// function CompactIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
//       <rect x="3" y="3" width="5" height="5" rx="0.5" />
//       <rect x="9.5" y="3" width="5" height="5" rx="0.5" />
//       <rect x="16" y="3" width="5" height="5" rx="0.5" />
//       <rect x="3" y="9.5" width="5" height="5" rx="0.5" />
//       <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
//       <rect x="16" y="9.5" width="5" height="5" rx="0.5" />
//       <rect x="3" y="16" width="5" height="5" rx="0.5" />
//       <rect x="9.5" y="16" width="5" height="5" rx="0.5" />
//       <rect x="16" y="16" width="5" height="5" rx="0.5" />
//     </svg>
//   );
// }

const tabs: Tab[] = [
  { id: "system", label: "System", icon: <SystemIcon /> },
  { id: "theme", label: "Theme", icon: <ThemeIcon /> },
  { id: "config", label: "Config", icon: <ConfigIcon /> },
  { id: "cards", label: "Cards", icon: <CardIcon /> },
  { id: "storage", label: "Storage", icon: <StorageIcon /> },
];

// Layout Mode - not yet implemented
// const layoutOptions: { type: LayoutType; icon: React.ReactNode; label: string }[] = [
//   { type: "grid", icon: <GridIcon />, label: "Grid" },
//   { type: "list", icon: <ListIcon />, label: "List" },
//   { type: "compact", icon: <CompactIcon />, label: "Compact" },
// ];

const reduceMotionOptions: { value: ReduceMotionPreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
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
  const [activeTab, setActiveTab] = useState<TabId>("system");

  const {
    reduceMotion,
    highContrast,
    showHelpButton,
    showSettingsButton,
    setReduceMotion,
    setHighContrast,
    setShowHelpButton,
    setShowSettingsButton,
    resetToDefaults,
  } = useSettingsStore();

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
      case "system":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Dark Mode</span>
              <ThemeToggle />
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Reduce Motion</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Reduce motion">
                {reduceMotionOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      reduceMotion === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setReduceMotion(value); }}
                    role="radio"
                    aria-checked={reduceMotion === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>High Contrast</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => { setHighContrast(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Show Help Button</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showHelpButton}
                  onChange={(e) => { setShowHelpButton(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Show Settings Button</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showSettingsButton}
                  onChange={(e) => { setShowSettingsButton(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            {onDevtoolsToggle && (
              <div className={styles.row}>
                <span className={styles.label}>TanStack DevTools</span>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={devtoolsEnabled}
                    onChange={onDevtoolsToggle}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            )}
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.label}>Refresh Data</span>
              <RefreshButton size="small" />
            </div>
          </>
        );

      case "theme":
        return <ThemeSettingsTabs />;

      case "cards":
        return <CardSettingsTabs />;

      case "config":
        return <ConfigSettingsTabs />;

      case "storage":
        return <StorageSettingsTabs />;
    }
  };

  const panelContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
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

        {/* Tab navigation */}
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
              onClick={() => { setActiveTab(tab.id); }}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>

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
