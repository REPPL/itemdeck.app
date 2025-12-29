/**
 * Modal component for displaying overlays.
 *
 * Handles focus trapping, keyboard navigation, and accessibility.
 * Uses shared useOverlay hook for consistent behaviour.
 *
 * @see F-111: Overlay Consistency Review
 */

import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOverlay } from "@/hooks/useOverlay";
import styles from "./Modal.module.css";

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Called when the modal should close */
  onClose: () => void;

  /** Modal title for accessibility */
  title: string;

  /** Modal content */
  children: ReactNode;

  /** Additional CSS class */
  className?: string;
}

/**
 * Modal component with focus trapping and accessibility.
 */
export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Use shared overlay hook for consistent behaviour
  const { overlayProps, contentProps } = useOverlay({
    isOpen,
    onClose,
    closeOnEscape: true,
    closeOnClickOutside: true,
    trapFocus: true,
    preventScroll: true,
  });

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={styles.overlay}
      onClick={overlayProps.onClick}
      role={overlayProps.role}
      aria-hidden={overlayProps["aria-hidden"]}
    >
      <div
        ref={modalRef}
        className={[styles.modal, className].filter(Boolean).join(" ")}
        role={contentProps.role}
        aria-modal={contentProps["aria-modal"]}
        aria-labelledby="modal-title"
        tabIndex={contentProps.tabIndex}
        onClick={contentProps.onClick}
      >
        <header className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
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
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
