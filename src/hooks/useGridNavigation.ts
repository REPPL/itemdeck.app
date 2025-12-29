import { useState, useCallback, useEffect, useRef } from "react";
import { isNavigationKey } from "@/config/keyboardShortcuts";

interface UseGridNavigationOptions {
  /** Total number of items in the grid */
  totalItems: number;
  /** Number of columns in the grid */
  columns: number;
  /** Callback when an item is selected (Enter/Space) */
  onSelect: (index: number) => void;
  /** Whether navigation is enabled */
  enabled?: boolean;
}

interface UseGridNavigationResult {
  /** Currently focused item index */
  focusedIndex: number;
  /** Set focused index programmatically */
  setFocusedIndex: (index: number) => void;
  /** Keyboard event handler */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Get tabIndex for an item (roving tabindex) */
  getTabIndex: (index: number) => 0 | -1;
  /** Ref to attach to the grid container */
  gridRef: React.RefObject<HTMLElement | null>;
}

/**
 * Hook for grid keyboard navigation using roving tabindex pattern.
 *
 * Supports:
 * - Arrow keys for navigation
 * - Vim-style keys (h/j/k/l) for navigation
 * - Home/End for first/last item
 * - Enter/Space to select
 */
export function useGridNavigation({
  totalItems,
  columns,
  onSelect,
  enabled = true,
}: UseGridNavigationOptions): UseGridNavigationResult {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const gridRef = useRef<HTMLElement>(null);

  // Clamp focused index when totalItems changes
  useEffect(() => {
    if (totalItems > 0 && focusedIndex >= totalItems) {
      setFocusedIndex(totalItems - 1);
    }
  }, [totalItems, focusedIndex]);

  // Reset focus when disabled
  useEffect(() => {
    if (!enabled) {
      setFocusedIndex(0);
    }
  }, [enabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled || totalItems === 0) return;

      const { code, key } = event;
      let newIndex = focusedIndex;
      let handled = false;

      // Navigation: Arrow keys and vim-style (h/j/k/l)
      if (isNavigationKey(code, "right") || key === "ArrowRight") {
        if (focusedIndex < totalItems - 1) {
          newIndex = focusedIndex + 1;
          handled = true;
        }
      } else if (isNavigationKey(code, "left") || key === "ArrowLeft") {
        if (focusedIndex > 0) {
          newIndex = focusedIndex - 1;
          handled = true;
        }
      } else if (isNavigationKey(code, "down") || key === "ArrowDown") {
        if (focusedIndex + columns < totalItems) {
          newIndex = focusedIndex + columns;
          handled = true;
        }
      } else if (isNavigationKey(code, "up") || key === "ArrowUp") {
        if (focusedIndex - columns >= 0) {
          newIndex = focusedIndex - columns;
          handled = true;
        }
      } else {
        // Non-vim navigation keys
        switch (key) {
          case "Home":
            newIndex = 0;
            handled = true;
            break;

          case "End":
            newIndex = totalItems - 1;
            handled = true;
            break;

          case "Enter":
          case " ":
            event.preventDefault();
            onSelect(focusedIndex);
            handled = true;
            break;

          default:
            break;
        }
      }

      if (handled) {
        event.preventDefault();

        if (newIndex !== focusedIndex) {
          setFocusedIndex(newIndex);

          // Focus the new item
          const container = gridRef.current;
          if (container) {
            const items = container.querySelectorAll("[data-card-id]");
            const targetItem = items[newIndex] as HTMLElement | undefined;
            targetItem?.focus();
          }
        }
      }
    },
    [enabled, totalItems, columns, focusedIndex, onSelect]
  );

  const getTabIndex = useCallback(
    (index: number): 0 | -1 => {
      if (!enabled) return -1;
      return index === focusedIndex ? 0 : -1;
    },
    [enabled, focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex,
    gridRef,
  };
}
