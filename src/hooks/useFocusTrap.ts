/**
 * Focus trap hook for modal and overlay accessibility.
 *
 * Keeps focus contained within a specific element, cycling between
 * the first and last focusable elements when Tab is pressed.
 *
 * @see F-111: Overlay Consistency Review
 */

import { useEffect, useCallback, useRef, type RefObject } from "react";

/**
 * Selector for focusable elements within a container.
 */
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

/**
 * Options for the focus trap hook.
 */
export interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Whether to restore focus when trap is disabled */
  restoreFocus?: boolean;
  /** Initial element to focus (defaults to first focusable) */
  initialFocus?: RefObject<HTMLElement>;
}

/**
 * Result from the focus trap hook.
 */
export interface UseFocusTrapResult {
  /** Ref to attach to the container element */
  containerRef: RefObject<HTMLElement | null>;
  /** Function to manually focus the first focusable element */
  focusFirst: () => void;
  /** Function to manually focus the last focusable element */
  focusLast: () => void;
}

/**
 * Hook to trap focus within a container element.
 *
 * Features:
 * - Tab cycles between first and last focusable elements
 * - Shift+Tab cycles in reverse
 * - Escape key calls onEscape callback
 * - Stores and restores focus when enabled/disabled
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const { containerRef } = useFocusTrap({
 *     enabled: isOpen,
 *     onEscape: onClose,
 *   });
 *
 *   return (
 *     <div ref={containerRef} role="dialog">
 *       <button>First</button>
 *       <button>Last</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}): UseFocusTrapResult {
  const {
    enabled = true,
    onEscape,
    restoreFocus = true,
    initialFocus,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  /**
   * Get all focusable elements within the container.
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
  }, []);

  /**
   * Focus the first focusable element.
   */
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0]?.focus();
    } else if (containerRef.current) {
      // If no focusable elements, focus the container itself
      containerRef.current.focus();
    }
  }, [getFocusableElements]);

  /**
   * Focus the last focusable element.
   */
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1]?.focus();
    }
  }, [getFocusableElements]);

  // Store previous focus and set initial focus when enabled
  useEffect(() => {
    if (enabled) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the initial element or first focusable
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else {
        // Small delay to ensure container is rendered
        requestAnimationFrame(() => {
          focusFirst();
        });
      }
    } else if (restoreFocus && previousActiveElement.current) {
      // Restore focus when trap is disabled
      previousActiveElement.current.focus();
    }
  }, [enabled, restoreFocus, initialFocus, focusFirst]);

  // Handle keyboard events for focus trap
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab for focus trapping
      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onEscape, getFocusableElements]);

  return {
    containerRef,
    focusFirst,
    focusLast,
  };
}

export default useFocusTrap;
