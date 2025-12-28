/**
 * Help modal component.
 *
 * Displays keyboard shortcuts and navigation help.
 */

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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

interface ShortcutItem {
  keys: string[];
  description: string;
}

const keyboardShortcuts: ShortcutItem[] = [
  { keys: ["Enter", "Space"], description: "Flip focused card" },
  { keys: ["←", "→"], description: "Navigate between cards" },
  { keys: ["↑", "↓"], description: "Navigate grid rows" },
  { keys: ["Escape"], description: "Close expanded card / settings" },
  { keys: ["?"], description: "Open help modal" },
  { keys: ["S"], description: "Toggle settings panel" },
  { keys: ["R"], description: "Shuffle cards" },
  { keys: ["Ctrl", "A"], description: "Toggle settings (alternative)" },
];

interface HelpModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback when the modal should close */
  onClose: () => void;
}

/**
 * Help modal displaying keyboard shortcuts.
 *
 * @example
 * ```tsx
 * <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
 * ```
 */
export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Escape key to close
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

  // Prevent body scroll when open
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

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        >
          <motion.div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
            }}
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

            {/* Shortcuts list */}
            <div className={styles.content}>
              <table className={styles.shortcutsTable}>
                <tbody>
                  {keyboardShortcuts.map((shortcut, index) => (
                    <tr key={index}>
                      <td className={styles.keysCell}>
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd className={styles.key}>{key}</kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className={styles.keyPlus}> / </span>
                            )}
                          </span>
                        ))}
                      </td>
                      <td className={styles.descriptionCell}>
                        {shortcut.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default HelpModal;
