/**
 * Global keyboard shortcuts hook.
 *
 * Provides a centralised way to register and handle keyboard shortcuts
 * across the application.
 */

import { useEffect, useCallback } from "react";

/**
 * Keyboard shortcut configuration.
 */
interface KeyboardShortcut {
  /** Key code (e.g., "KeyA", "Escape") */
  key: string;

  /** Whether Ctrl/Cmd is required */
  ctrl?: boolean;

  /** Whether Shift is required */
  shift?: boolean;

  /** Whether Alt is required */
  alt?: boolean;

  /** Callback when shortcut is triggered */
  handler: () => void;

  /** Whether to prevent default browser behaviour */
  preventDefault?: boolean;
}

/**
 * Options for global keyboard hook.
 */
interface UseGlobalKeyboardOptions {
  /** Whether keyboard handling is enabled */
  enabled?: boolean;

  /** Keyboard shortcuts to register */
  shortcuts: KeyboardShortcut[];
}

/**
 * Check if the event target is an input element.
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

/**
 * Hook for registering global keyboard shortcuts.
 *
 * Features:
 * - Ctrl+A: Toggle admin mode
 * - Escape: Close modals/overlays
 * - /: Focus search (future)
 * - Ignores shortcuts when typing in inputs
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useGlobalKeyboard({
 *   shortcuts: [
 *     { key: "KeyA", ctrl: true, handler: toggleAdminMode },
 *     { key: "Escape", handler: closeModal },
 *   ],
 * });
 * ```
 */
export function useGlobalKeyboard(options: UseGlobalKeyboardOptions) {
  const { enabled = true, shortcuts } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if typing in an input
      if (isInputElement(event.target)) return;

      for (const shortcut of shortcuts) {
        // Check key match
        if (event.code !== shortcut.key) continue;

        // Check modifiers
        const ctrlMatch = (shortcut.ctrl ?? false) === (event.ctrlKey || event.metaKey);
        const shiftMatch = (shortcut.shift ?? false) === event.shiftKey;
        const altMatch = (shortcut.alt ?? false) === event.altKey;

        if (ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    // Use capture phase to intercept before browser's default handlers
    // This is especially important for Cmd-R which triggers browser reload
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Predefined keyboard shortcut for admin mode toggle.
 */
export function useAdminModeShortcut(
  onToggle: () => void,
  enabled = true
) {
  useGlobalKeyboard({
    enabled,
    shortcuts: [
      {
        key: "KeyA",
        ctrl: true,
        handler: onToggle,
        preventDefault: true,
      },
    ],
  });
}

/**
 * Predefined keyboard shortcut for escape to close.
 */
export function useEscapeShortcut(
  onEscape: () => void,
  enabled = true
) {
  useGlobalKeyboard({
    enabled,
    shortcuts: [
      {
        key: "Escape",
        handler: onEscape,
      },
    ],
  });
}

export default useGlobalKeyboard;
