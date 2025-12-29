/**
 * Help modal component.
 *
 * Displays keyboard shortcuts grouped by category.
 * Uses centralised keyboard shortcuts config for consistency.
 *
 * @see F-110: Keyboard Shortcuts Review
 * @see F-111: Overlay Consistency Review
 */

import { useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useOverlay } from "@/hooks/useOverlay";
import {
  SHORTCUT_CATEGORIES,
  type KeyboardShortcut,
  type ShortcutCategory,
} from "@/config/keyboardShortcuts";
import styles from "./HelpModal.module.css";

/**
 * Close icon.
 */
function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Render a single keyboard shortcut row.
 */
function ShortcutRow({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <tr>
      <td className={styles.keysCell}>
        {shortcut.displayKeys.map((key, keyIndex) => (
          <span key={keyIndex}>
            <kbd className={styles.key}>{key}</kbd>
            {keyIndex < shortcut.displayKeys.length - 1 && (
              <span className={styles.keyPlus}> + </span>
            )}
          </span>
        ))}
      </td>
      <td className={styles.descriptionCell}>{shortcut.description}</td>
    </tr>
  );
}

/**
 * Render a shortcut category section.
 */
function ShortcutSection({ category }: { category: ShortcutCategory }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{category.label}</h3>
      <table className={styles.shortcutsTable}>
        <tbody>
          {category.shortcuts.map((shortcut, index) => (
            <ShortcutRow key={index} shortcut={shortcut} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface HelpModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback when the modal should close */
  onClose: () => void;
}

/**
 * Help modal displaying keyboard shortcuts grouped by category.
 *
 * @example
 * ```tsx
 * <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
 * ```
 */
export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Use shared overlay hook for consistent behaviour
  const { overlayProps, contentProps } = useOverlay({
    isOpen,
    onClose,
    closeOnEscape: true,
    closeOnClickOutside: true,
    trapFocus: true,
    preventScroll: true,
  });

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={overlayProps.onClick}
          role={overlayProps.role}
          aria-hidden={overlayProps["aria-hidden"]}
        >
          <motion.div
            ref={panelRef}
            className={styles.panel}
            role={contentProps.role}
            aria-modal={contentProps["aria-modal"]}
            aria-labelledby="help-modal-title"
            tabIndex={contentProps.tabIndex}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={contentProps.onClick}
          >
            {/* Header */}
            <div className={styles.header}>
              <h2 id="help-modal-title" className={styles.title}>
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Shortcuts grouped by category */}
            <div className={styles.content}>
              {SHORTCUT_CATEGORIES.map((category, index) => (
                <ShortcutSection key={index} category={category} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default HelpModal;
