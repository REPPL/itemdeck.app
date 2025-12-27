/**
 * Floating help button component.
 *
 * Shows keyboard shortcuts and navigation help.
 * Positioned above the settings button.
 */

import { motion } from "framer-motion";
import styles from "./HelpButton.module.css";

/**
 * Question mark icon.
 */
function QuestionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

interface HelpButtonProps {
  /** Callback when button is clicked */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Floating help button component.
 *
 * Shows a question mark icon that opens the help modal
 * when clicked. Positioned above the settings gear.
 *
 * @example
 * ```tsx
 * <HelpButton onClick={() => setHelpOpen(true)} />
 * ```
 */
export function HelpButton({ onClick, disabled }: HelpButtonProps) {
  return (
    <motion.button
      type="button"
      className={[styles.button, disabled ? styles.buttonDisabled : ""].filter(Boolean).join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-label="Help and keyboard shortcuts"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: disabled ? 0.4 : 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      <QuestionIcon />
    </motion.button>
  );
}

export default HelpButton;
