/**
 * Hook to track viewport dimensions.
 *
 * Returns current window width and height, updating on resize.
 * Includes debouncing to prevent excessive re-renders.
 */

import { useState, useEffect, useCallback } from "react";

interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Custom hook to get and track viewport size.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Current viewport dimensions
 *
 * @example
 * ```tsx
 * const { width, height } = useViewportSize();
 * const isCompact = height < 500 || width < 400;
 * ```
 */
export function useViewportSize(debounceMs = 100): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  }));

  const handleResize = useCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, debounceMs);
    };

    // Set initial size
    handleResize();

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize, debounceMs]);

  return size;
}

/**
 * Viewport mode based on dimensions.
 */
export type ViewportMode = "compact" | "medium" | "full";

/**
 * Get viewport mode based on dimensions.
 *
 * - compact: height < 500px or width < 400px
 * - medium: height 500-700px
 * - full: height > 700px
 */
export function getViewportMode(width: number, height: number): ViewportMode {
  if (height < 500 || width < 400) {
    return "compact";
  }
  if (height <= 700) {
    return "medium";
  }
  return "full";
}

export default useViewportSize;
