/**
 * Settings panel component with tabbed interface.
 *
 * Provides a centralised interface for configuring user preferences
 * organised into System, Theme, Behaviour, and Card tabs.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshButton } from "@/components/RefreshButton";
import {
  useSettingsStore,
  // type LayoutType, // Not yet implemented
  type OverlayStyle,
  type TitleDisplayMode,
  type VisualTheme,
  // type CardBackStyle, // Not yet implemented
  type ReduceMotionPreference,
  type DragFace,
  type CardSizePreset,
  type CardAspectRatio,
  type CardBackDisplay,
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
type TabId = "system" | "theme" | "behaviour" | "card";

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

function BehaviourIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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
  { id: "behaviour", label: "Behaviour", icon: <BehaviourIcon /> },
  { id: "card", label: "Card", icon: <CardIcon /> },
];

// Layout Mode - not yet implemented
// const layoutOptions: { type: LayoutType; icon: React.ReactNode; label: string }[] = [
//   { type: "grid", icon: <GridIcon />, label: "Grid" },
//   { type: "list", icon: <ListIcon />, label: "List" },
//   { type: "compact", icon: <CompactIcon />, label: "Compact" },
// ];

const overlayStyleOptions: { value: OverlayStyle; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

const titleDisplayOptions: { value: TitleDisplayMode; label: string }[] = [
  { value: "truncate", label: "Single line" },
  { value: "wrap", label: "Wrap" },
];

const visualThemeOptions: { value: VisualTheme; label: string; description: string }[] = [
  { value: "retro", label: "Retro", description: "Pixel fonts, sharp corners, CRT shadows, neon accents" },
  { value: "modern", label: "Modern", description: "Rounded corners, soft shadows, smooth animations" },
  { value: "minimal", label: "Minimal", description: "Subtle styling, reduced shadows, clean typography" },
];

// Card Back Style - not yet implemented
// const cardBackStyleOptions: { value: CardBackStyle; label: string }[] = [
//   { value: "bitmap", label: "Bitmap" },
//   { value: "svg", label: "SVG" },
//   { value: "colour", label: "Colour" },
// ];

const reduceMotionOptions: { value: ReduceMotionPreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

const dragFaceOptions: { value: DragFace; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "both", label: "Both" },
];

const cardSizeOptions: { value: CardSizePreset; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const cardAspectRatioOptions: { value: CardAspectRatio; label: string }[] = [
  { value: "3:4", label: "3:4" },
  { value: "5:7", label: "5:7" },
  { value: "1:1", label: "1:1" },
];

const cardBackDisplayOptions: { value: CardBackDisplay; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "year", label: "Year" },
  { value: "logo", label: "Logo" },
  { value: "none", label: "None" },
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
    // layout, // Not yet implemented
    cardSizePreset,
    cardAspectRatio,
    maxVisibleCards,
    cardBackDisplay,
    shuffleOnLoad,
    reduceMotion,
    highContrast,
    overlayStyle,
    titleDisplayMode,
    dragModeEnabled,
    visualTheme,
    // cardBackStyle, // Not yet implemented
    showRankBadge,
    showDeviceBadge,
    rankPlaceholderText,
    dragFace,
    // setLayout, // Not yet implemented
    setCardSizePreset,
    setCardAspectRatio,
    setMaxVisibleCards,
    setCardBackDisplay,
    setShuffleOnLoad,
    setReduceMotion,
    setHighContrast,
    setOverlayStyle,
    setTitleDisplayMode,
    setDragModeEnabled,
    setVisualTheme,
    // setCardBackStyle, // Not yet implemented
    setShowRankBadge,
    setShowDeviceBadge,
    setRankPlaceholderText,
    setDragFace,
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

  // Handle placeholder text change
  const handlePlaceholderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRankPlaceholderText(event.target.value);
    },
    [setRankPlaceholderText]
  );

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "system":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Refresh Data</span>
              <RefreshButton size="small" />
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Theme</span>
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
          </>
        );

      case "theme":
        return (
          <>
            <h4 className={styles.subsectionTitle}>Visual Theme</h4>
            <div className={styles.themeCards} role="radiogroup" aria-label="Visual theme">
              {visualThemeOptions.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  className={[
                    styles.themeCard,
                    visualTheme === value ? styles.themeCardActive : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => { setVisualTheme(value); }}
                  role="radio"
                  aria-checked={visualTheme === value}
                >
                  <span className={styles.themeCardLabel}>{label}</span>
                  <span className={styles.themeCardDescription}>{description}</span>
                </button>
              ))}
            </div>

            <h4 className={styles.subsectionTitle}>Theme Properties</h4>
            <p className={styles.themeInfo}>
              Themes control: corner radius, shadows, animations, fonts, accent colours, and card borders.
            </p>
            {/* Layout Mode - not yet implemented
            <div className={styles.row}>
              <span className={styles.label}>Layout Mode</span>
              <div className={styles.layoutSwitcher} role="radiogroup" aria-label="Layout options">
                {layoutOptions.map(({ type, icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    className={[
                      styles.layoutButton,
                      layout === type ? styles.layoutButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setLayout(type); }}
                    role="radio"
                    aria-checked={layout === type}
                    aria-label={label}
                    title={label}
                  >
                    <span className={styles.layoutIcon}>{icon}</span>
                  </button>
                ))}
              </div>
            </div>
            */}
            {/* Card Back Style - not yet implemented
            <div className={styles.row}>
              <span className={styles.label}>Card Back Style</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Card back style">
                {cardBackStyleOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      cardBackStyle === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setCardBackStyle(value); }}
                    role="radio"
                    aria-checked={cardBackStyle === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            */}
          </>
        );

      case "behaviour":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Max Visible Cards</span>
              <div className={styles.numberControl}>
                <button
                  type="button"
                  className={styles.numberButton}
                  onClick={() => { setMaxVisibleCards(Math.max(1, maxVisibleCards - 1)); }}
                  aria-label="Decrease"
                  disabled={maxVisibleCards <= 1}
                >
                  −
                </button>
                <span className={styles.numberValue}>{maxVisibleCards}</span>
                <button
                  type="button"
                  className={styles.numberButton}
                  onClick={() => { setMaxVisibleCards(Math.min(10, maxVisibleCards + 1)); }}
                  aria-label="Increase"
                  disabled={maxVisibleCards >= 10}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Shuffle on load</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={shuffleOnLoad}
                  onChange={(e) => { setShuffleOnLoad(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Drag to reorder</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={dragModeEnabled}
                  onChange={(e) => { setDragModeEnabled(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            {dragModeEnabled && (
              <div className={styles.row}>
                <span className={styles.label}>Drag Face</span>
                <div className={styles.segmentedControl} role="radiogroup" aria-label="Drag face">
                  {dragFaceOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={[
                        styles.segmentButton,
                        dragFace === value ? styles.segmentButtonActive : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => { setDragFace(value); }}
                      role="radio"
                      aria-checked={dragFace === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case "card":
        return (
          <>
            <h4 className={styles.subsectionTitle}>General</h4>
            <div className={styles.row}>
              <span className={styles.label}>Size</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Card size">
                {cardSizeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      cardSizePreset === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setCardSizePreset(value); }}
                    role="radio"
                    aria-checked={cardSizePreset === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Aspect Ratio</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Card aspect ratio">
                {cardAspectRatioOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      cardAspectRatio === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setCardAspectRatio(value); }}
                    role="radio"
                    aria-checked={cardAspectRatio === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <h4 className={styles.subsectionTitle}>Front</h4>
            <div className={styles.row}>
              <span className={styles.label}>Footer Style</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Card overlay style">
                {overlayStyleOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      overlayStyle === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setOverlayStyle(value); }}
                    role="radio"
                    aria-checked={overlayStyle === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Title Display</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Title display mode">
                {titleDisplayOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      titleDisplayMode === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setTitleDisplayMode(value); }}
                    role="radio"
                    aria-checked={titleDisplayMode === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Show Rank Badge</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showRankBadge}
                  onChange={(e) => { setShowRankBadge(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Show Device Badge</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showDeviceBadge}
                  onChange={(e) => { setShowDeviceBadge(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Unranked Text</span>
              <input
                type="text"
                className={styles.textInput}
                value={rankPlaceholderText}
                onChange={handlePlaceholderChange}
                placeholder="The one that got away!"
                aria-label="Rank placeholder text"
              />
            </div>

            <h4 className={styles.subsectionTitle}>Back</h4>
            <div className={styles.row}>
              <span className={styles.label}>Display</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Card back display">
                {cardBackDisplayOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      cardBackDisplay === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setCardBackDisplay(value); }}
                    role="radio"
                    aria-checked={cardBackDisplay === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
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
