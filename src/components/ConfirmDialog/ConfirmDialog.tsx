/**
 * ConfirmDialog component.
 *
 * A reusable confirmation dialog with support for warning and danger variants.
 * Uses the same patterns as CacheConsentDialog for consistency.
 *
 * @see v0.11.5 Phase 1: Foundation
 */

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./ConfirmDialog.module.css";

/**
 * Props for ConfirmDialog.
 */
interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message (can include JSX) */
  message: React.ReactNode;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Visual variant - danger uses red accent */
  variant?: "warning" | "danger";
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * A reusable confirmation dialog.
 *
 * Features:
 * - Keyboard accessible (Enter confirms, Escape cancels)
 * - Focus trap (Tab cycles through buttons)
 * - Warning and danger variants
 * - Animated entrance/exit
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const visualTheme = useSettingsStore((s) => s.visualTheme);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onCancel();
          break;
        case "Enter":
          // Only confirm if not focused on cancel button
          if (document.activeElement !== cancelButtonRef.current) {
            event.preventDefault();
            onConfirm();
          }
          break;
        case "Tab": {
          // Simple focus trap between the two buttons
          if (!dialogRef.current) return;
          const focusableElements = dialogRef.current.querySelectorAll("button");
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            (lastElement as HTMLElement).focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            (firstElement as HTMLElement).focus();
          }
          break;
        }
      }
    },
    [isOpen, onConfirm, onCancel]
  );

  // Add keyboard event listener
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const containerClass = [
    styles.overlay,
    styles[visualTheme as keyof typeof styles],
  ]
    .filter(Boolean)
    .join(" ");

  const confirmButtonClass = [
    styles.confirmButton,
    variant === "danger" && styles.confirmButtonDanger,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={containerClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            className={styles.dialog}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => { e.stopPropagation(); }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
          >
            <h2 id="confirm-dialog-title" className={styles.title}>
              {title}
            </h2>

            <div id="confirm-dialog-message" className={styles.message}>
              {message}
            </div>

            <div className={styles.actions}>
              <button
                ref={cancelButtonRef}
                type="button"
                className={styles.cancelButton}
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                className={confirmButtonClass}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
