/**
 * Settings button component.
 *
 * Provides a button to open the settings panel.
 */

import { useState } from "react";
import { SettingsPanel } from "@/components/SettingsPanel";
import styles from "./SettingsButton.module.css";

/**
 * Gear/cog icon for settings.
 */
function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

interface SettingsButtonProps {
  /** Optional external click handler (for centralised settings control) */
  onClick?: () => void;
}

/**
 * Settings button that opens the settings panel.
 *
 * If onClick prop is provided, uses external state management.
 * Otherwise manages its own panel state.
 */
export function SettingsButton({ onClick }: SettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // If external onClick provided, don't manage own panel
  if (onClick) {
    return (
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        aria-label="Open settings"
        aria-haspopup="dialog"
      >
        <SettingsIcon />
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          setIsOpen(true);
        }}
        aria-label="Open settings"
        aria-haspopup="dialog"
      >
        <SettingsIcon />
      </button>
      <SettingsPanel
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </>
  );
}
