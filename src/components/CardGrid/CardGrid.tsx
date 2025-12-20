import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/Card/Card";
import { useCardData } from "@/hooks/useCardData";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import styles from "./CardGrid.module.css";

const GAP = 16; // var(--grid-gap) = 1rem = 16px

/**
 * Grid component that displays cards in a responsive layout.
 * Uses absolute positioning with JS-calculated positions.
 * CSS transitions handle smooth animation on resize.
 * Handles loading, error, and empty states.
 */
export function CardGrid() {
  const { cards, loading, error } = useCardData();
  const { cardDimensions } = useSettingsContext();
  const gridRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width
  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;

    const updateWidth = () => {
      const padding = parseFloat(getComputedStyle(container).paddingLeft) * 2;
      setContainerWidth(container.clientWidth - padding);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate grid layout
  const calculateLayout = () => {
    if (containerWidth === 0 || cards.length === 0) {
      return { positions: [] as { left: number; top: number }[], rows: 0 };
    }

    const cardWidth = cardDimensions.width;
    const cardHeight = cardDimensions.height;

    // Calculate how many columns fit
    const columns = Math.max(1, Math.floor((containerWidth + GAP) / (cardWidth + GAP)));

    // Calculate total grid width and offset to centre
    const totalGridWidth = columns * cardWidth + (columns - 1) * GAP;
    const offsetX = (containerWidth - totalGridWidth) / 2;

    // Calculate positions for each card
    const positions = cards.map((_, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      return {
        left: offsetX + col * (cardWidth + GAP),
        top: row * (cardHeight + GAP),
      };
    });

    const rows = Math.ceil(cards.length / columns);

    return { positions, rows };
  };

  const { positions, rows } = calculateLayout();
  const containerHeight = rows > 0
    ? rows * cardDimensions.height + (rows - 1) * GAP
    : 200;

  // Render loading/error/empty states inside the grid container
  // so the ref is always attached
  const renderContent = () => {
    if (loading) {
      return <div className={styles.loading}>Loading cards...</div>;
    }

    if (error) {
      return <div className={styles.error}>Error: {error}</div>;
    }

    if (cards.length === 0 || positions.length === 0) {
      return <div className={styles.empty}>No cards to display</div>;
    }

    return cards.map((card, index) => {
      const pos = positions[index];
      if (!pos) return null;

      return (
        <div
          key={card.id}
          className={styles.card}
          style={{
            left: `${String(pos.left)}px`,
            top: `${String(pos.top)}px`,
          }}
        >
          <Card card={card} />
        </div>
      );
    });
  };

  return (
    <section
      ref={gridRef}
      className={styles.grid}
      style={{ minHeight: `${String(containerHeight)}px` }}
    >
      {renderContent()}
    </section>
  );
}
