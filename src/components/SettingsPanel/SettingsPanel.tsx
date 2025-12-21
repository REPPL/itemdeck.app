/**
 * Settings panel component.
 *
 * Provides a centralised interface for configuring user preferences
 * including theme, layout, card size, and accessibility options.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  useSettingsStore,
  type LayoutType,
  type OverlayStyle,
  type TitleDisplayMode,
} from "@/stores/settingsStore";
import styles from "./SettingsPanel.module.css";

interface SettingsPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;

  /** Called when the panel should close */
  onClose: () => void;
}

/**
 * Layout icon SVG components.
 */
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
    </svg>
  );
}

function CompactIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="5" height="5" rx="0.5" />
      <rect x="9.5" y="3" width="5" height="5" rx="0.5" />
      <rect x="16" y="3" width="5" height="5" rx="0.5" />
      <rect x="3" y="9.5" width="5" height="5" rx="0.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      <rect x="16" y="9.5" width="5" height="5" rx="0.5" />
      <rect x="3" y="16" width="5" height="5" rx="0.5" />
      <rect x="9.5" y="16" width="5" height="5" rx="0.5" />
      <rect x="16" y="16" width="5" height="5" rx="0.5" />
    </svg>
  );
}

const layoutOptions: { type: LayoutType; icon: React.ReactNode; label: string }[] = [
  { type: "grid", icon: <GridIcon />, label: "Grid" },
  { type: "list", icon: <ListIcon />, label: "List" },
  { type: "compact", icon: <CompactIcon />, label: "Compact" },
];

const overlayStyleOptions: { value: OverlayStyle; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

const titleDisplayOptions: { value: TitleDisplayMode; label: string }[] = [
  { value: "truncate", label: "Single line" },
  { value: "wrap", label: "Wrap" },
];

/**
 * Settings panel with grouped configuration sections.
 */
export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const {
    layout,
    cardWidth,
    cardHeight,
    gap,
    shuffleOnLoad,
    overlayStyle,
    titleDisplayMode,
    setLayout,
    setCardDimensions,
    setGap,
    setShuffleOnLoad,
    setOverlayStyle,
    setTitleDisplayMode,
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

  const panelContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <header className={styles.header}>
          <h2 id="settings-title" className={styles.title}>
            Settings
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className={styles.content}>
          {/* Appearance Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Appearance</h3>
            <div className={styles.row}>
              <span className={styles.label}>Theme</span>
              <div className={styles.control}>
                <ThemeToggle />
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Card Footer</span>
              <div
                className={styles.segmentedControl}
                role="radiogroup"
                aria-label="Card overlay style"
              >
                {overlayStyleOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      overlayStyle === value ? styles.segmentButtonActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setOverlayStyle(value);
                    }}
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
              <div
                className={styles.segmentedControl}
                role="radiogroup"
                aria-label="Title display mode"
              >
                {titleDisplayOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      titleDisplayMode === value ? styles.segmentButtonActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setTitleDisplayMode(value);
                    }}
                    role="radio"
                    aria-checked={titleDisplayMode === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Layout Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Layout</h3>
            <div className={styles.row}>
              <span className={styles.label}>Display Mode</span>
              <div
                className={styles.layoutSwitcher}
                role="radiogroup"
                aria-label="Layout options"
              >
                {layoutOptions.map(({ type, icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    className={[
                      styles.layoutButton,
                      layout === type ? styles.layoutButtonActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setLayout(type);
                    }}
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
          </section>

          {/* Card Size Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Card Size</h3>
            <div className={styles.row}>
              <span className={styles.label}>Width: {cardWidth}px</span>
              <input
                type="range"
                min={100}
                max={300}
                value={cardWidth}
                onChange={(e) => {
                  setCardDimensions(Number(e.target.value), cardHeight);
                }}
                className={styles.slider}
                aria-label="Card width"
              />
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Height: {cardHeight}px</span>
              <input
                type="range"
                min={140}
                max={420}
                value={cardHeight}
                onChange={(e) => {
                  setCardDimensions(cardWidth, Number(e.target.value));
                }}
                className={styles.slider}
                aria-label="Card height"
              />
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Gap: {gap}px</span>
              <input
                type="range"
                min={4}
                max={32}
                value={gap}
                onChange={(e) => {
                  setGap(Number(e.target.value));
                }}
                className={styles.slider}
                aria-label="Card gap"
              />
            </div>
          </section>

          {/* Behaviour Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Behaviour</h3>
            <div className={styles.row}>
              <span className={styles.label}>Shuffle on load</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={shuffleOnLoad}
                  onChange={(e) => {
                    setShuffleOnLoad(e.target.checked);
                  }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.resetButton}
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(panelContent, document.body);
}
