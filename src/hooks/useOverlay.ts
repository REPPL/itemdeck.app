/**
 * Shared overlay hook for consistent modal/panel behaviour.
 *
 * Provides unified handling of:
 * - Escape key to close
 * - Click outside to close
 * - Focus trapping
 * - Body scroll prevention
 * - Focus restoration
 *
 * @see F-111: Overlay Consistency Review
 */

import { useEffect, useCallback, useRef, type RefObject } from "react";
import { useFocusTrap, type UseFocusTrapOptions } from "./useFocusTrap";

/**
 * Options for the overlay hook.
 */
export interface UseOverlayOptions {
  /** Whether the overlay is open */
  isOpen: boolean;
  /** Callback when the overlay should close */
  onClose: () => void;
  /** Whether to close when Escape is pressed (default: true) */
  closeOnEscape?: boolean;
  /** Whether to close when clicking outside (default: true) */
  closeOnClickOutside?: boolean;
  /** Whether to trap focus within the overlay (default: true) */
  trapFocus?: boolean;
  /** Whether to prevent body scroll when open (default: true) */
  preventScroll?: boolean;
  /** Initial element to focus when opened */
  initialFocus?: RefObject<HTMLElement>;
}

/**
 * Result from the overlay hook.
 */
export interface UseOverlayResult {
  /** Ref to attach to the overlay backdrop/container */
  overlayRef: RefObject<HTMLDivElement | null>;
  /** Ref to attach to the content panel (for click outside detection) */
  contentRef: RefObject<HTMLDivElement | null>;
  /** Props to spread on the overlay backdrop */
  overlayProps: {
    onClick: (event: React.MouseEvent) => void;
    role: string;
    "aria-hidden": boolean;
  };
  /** Props to spread on the content panel */
  contentProps: {
    onClick: (event: React.MouseEvent) => void;
    role: string;
    "aria-modal": boolean;
    tabIndex: number;
  };
}

/**
 * Hook for consistent overlay behaviour.
 *
 * Combines focus trapping, escape handling, click outside,
 * and scroll prevention into a single reusable hook.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const { overlayProps, contentProps, contentRef } = useOverlay({
 *     isOpen,
 *     onClose,
 *   });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div className="overlay" {...overlayProps}>
 *       <div ref={contentRef} className="content" {...contentProps}>
 *         <h2>Modal Title</h2>
 *         <button onClick={onClose}>Close</button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOverlay(options: UseOverlayOptions): UseOverlayResult {
  const {
    isOpen,
    onClose,
    closeOnEscape = true,
    closeOnClickOutside = true,
    trapFocus = true,
    preventScroll = true,
    initialFocus,
  } = options;

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap configuration
  const focusTrapOptions: UseFocusTrapOptions = {
    enabled: isOpen && trapFocus,
    onEscape: closeOnEscape ? onClose : undefined,
    restoreFocus: true,
    initialFocus,
  };

  const { containerRef: focusTrapRef } = useFocusTrap(focusTrapOptions);

  // Sync focus trap ref with content ref
  useEffect(() => {
    if (contentRef.current && trapFocus) {
      // @ts-expect-error - RefObject mismatch, but we're just syncing
      focusTrapRef.current = contentRef.current;
    }
  }, [isOpen, trapFocus, focusTrapRef]);

  // Handle Escape key (backup if focus trap is disabled)
  useEffect(() => {
    if (!isOpen || !closeOnEscape || trapFocus) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEscape, trapFocus, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (!preventScroll) return undefined;

    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }

    return undefined;
  }, [isOpen, preventScroll]);

  // Handle click on overlay (backdrop)
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      // Only close if clicking the overlay itself, not content
      if (closeOnClickOutside && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnClickOutside, onClose]
  );

  // Handle click on content (stop propagation)
  const handleContentClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  return {
    overlayRef,
    contentRef,
    overlayProps: {
      onClick: handleOverlayClick,
      role: "presentation",
      "aria-hidden": true,
    },
    contentProps: {
      onClick: handleContentClick,
      role: "dialog",
      "aria-modal": true,
      tabIndex: -1,
    },
  };
}

export default useOverlay;
