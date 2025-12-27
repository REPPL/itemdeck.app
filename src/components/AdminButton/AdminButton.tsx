/**
 * Floating admin button component.
 *
 * Toggleable button for accessing admin/settings functionality.
 * Visibility controlled via Ctrl+A keyboard shortcut.
 */

import { motion } from "framer-motion";
import styles from "./AdminButton.module.css";

/**
 * Gear/cog icon for settings.
 */
function GearIcon() {
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

interface AdminButtonProps {
  /** Callback when button is clicked */
  onClick: () => void;

  /** Position of the button */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";

  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Floating admin button component.
 *
 * Always visible gear icon in the corner for accessing settings.
 *
 * Features:
 * - Gear/cog icon
 * - Configurable position
 * - Opens SettingsPanel when clicked
 *
 * @example
 * ```tsx
 * <AdminButton onClick={() => setSettingsOpen(true)} />
 * ```
 */
export function AdminButton({
  onClick,
  position = "bottom-right",
  disabled = false,
}: AdminButtonProps) {
  const positionStyles: Record<string, string> = {
    "bottom-right": styles["bottom-right"] ?? "",
    "bottom-left": styles["bottom-left"] ?? "",
    "top-right": styles["top-right"] ?? "",
    "top-left": styles["top-left"] ?? "",
  };
  const positionClass = positionStyles[position] ?? positionStyles["bottom-right"];

  return (
    <motion.button
      type="button"
      className={[
        styles.button,
        positionClass,
        disabled ? styles.buttonDisabled : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-label="Open settings"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: disabled ? 0.4 : 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      <GearIcon />
    </motion.button>
  );
}

export default AdminButton;
