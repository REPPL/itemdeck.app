/**
 * Hook for fit-to-viewport layout mode.
 *
 * Calculates optimal card size to display all cards without scrolling.
 */

import { useMemo, useState, useEffect, type RefObject } from "react";

/**
 * Options for fit-to-viewport calculation.
 */
interface UseFitToViewportOptions {
  /** Number of cards to display */
  cardCount: number;
  /** Minimum card width in pixels */
  minWidth?: number;
  /** Card aspect ratio (height / width) */
  aspectRatio?: number;
  /** Gap between cards in pixels */
  gap?: number;
  /** Whether fit-to-viewport is enabled */
  enabled?: boolean;
}

/**
 * Result of fit-to-viewport calculation.
 */
interface FitToViewportResult {
  /** Calculated card width */
  cardWidth: number;
  /** Calculated card height */
  cardHeight: number;
  /** Number of columns */
  columns: number;
  /** Number of rows */
  rows: number;
  /** Whether minimum size is being used (cards won't fit at larger size) */
  atMinimum: boolean;
}

/**
 * Calculate optimal card size to fit all cards in viewport.
 */
function calculateFitSize(
  viewportWidth: number,
  viewportHeight: number,
  cardCount: number,
  minWidth: number,
  aspectRatio: number,
  gap: number
): FitToViewportResult {
  if (cardCount === 0) {
    return {
      cardWidth: minWidth,
      cardHeight: minWidth * aspectRatio,
      columns: 1,
      rows: 0,
      atMinimum: false,
    };
  }

  // Start from square root for balanced grid
  const idealColumns = Math.ceil(Math.sqrt(cardCount));

  // Try different column counts, find best fit
  for (let cols = idealColumns; cols >= 1; cols--) {
    const rows = Math.ceil(cardCount / cols);
    const availableWidth = viewportWidth - gap * (cols + 1);
    const availableHeight = viewportHeight - gap * (rows + 1);

    const cardWidth = availableWidth / cols;
    const cardHeight = cardWidth * aspectRatio;

    // Check if cards fit
    if (cardWidth >= minWidth && cardHeight * rows <= availableHeight) {
      return {
        cardWidth: Math.floor(cardWidth),
        cardHeight: Math.floor(cardWidth * aspectRatio),
        columns: cols,
        rows,
        atMinimum: false,
      };
    }
  }

  // Fallback: calculate based on height constraint
  for (let cols = idealColumns; cols <= cardCount; cols++) {
    const rows = Math.ceil(cardCount / cols);
    const availableHeight = viewportHeight - gap * (rows + 1);
    const cardHeight = availableHeight / rows;
    const cardWidth = cardHeight / aspectRatio;

    if (cardWidth >= minWidth) {
      return {
        cardWidth: Math.floor(cardWidth),
        cardHeight: Math.floor(cardHeight),
        columns: cols,
        rows,
        atMinimum: false,
      };
    }
  }

  // Absolute fallback: use minimum width
  const cols = Math.max(
    1,
    Math.floor((viewportWidth - gap) / (minWidth + gap))
  );
  const rows = Math.ceil(cardCount / cols);

  return {
    cardWidth: minWidth,
    cardHeight: Math.floor(minWidth * aspectRatio),
    columns: cols,
    rows,
    atMinimum: true,
  };
}

/**
 * Hook for calculating fit-to-viewport card dimensions.
 *
 * @param containerRef - Ref to the container element
 * @param options - Configuration options
 * @returns Calculated dimensions and layout info
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const fit = useFitToViewport(containerRef, {
 *   cardCount: cards.length,
 *   minWidth: 80,
 *   aspectRatio: 1.4,
 *   gap: 8,
 *   enabled: fitMode,
 * });
 *
 * const cardStyle = fitMode ? { width: fit.cardWidth, height: fit.cardHeight } : defaultStyle;
 * ```
 */
export function useFitToViewport(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFitToViewportOptions
): FitToViewportResult {
  const {
    cardCount,
    minWidth = 80,
    aspectRatio = 1.4,
    gap = 8,
    enabled = true,
  } = options;

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track container dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: rect.height,
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);

    return () => { observer.disconnect(); };
  }, [containerRef, enabled]);

  // Calculate fit dimensions
  return useMemo(() => {
    if (!enabled || dimensions.width === 0 || dimensions.height === 0) {
      return {
        cardWidth: minWidth,
        cardHeight: Math.floor(minWidth * aspectRatio),
        columns: 1,
        rows: cardCount,
        atMinimum: false,
      };
    }

    return calculateFitSize(
      dimensions.width,
      dimensions.height,
      cardCount,
      minWidth,
      aspectRatio,
      gap
    );
  }, [
    enabled,
    dimensions.width,
    dimensions.height,
    cardCount,
    minWidth,
    aspectRatio,
    gap,
  ]);
}
