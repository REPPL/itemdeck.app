/**
 * Drag and drop card grid for custom ordering.
 *
 * Wraps cards with @dnd-kit for reordering via drag and drop.
 */

import { useCallback, useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/Card/Card";
import type { DisplayCard } from "@/hooks/useCollection";
import type { DragFace, CardBackDisplay } from "@/stores/settingsStore";
import styles from "./DraggableCardGrid.module.css";

/**
 * Props for DraggableCardGrid component.
 */
interface DraggableCardGridProps {
  /** Cards to display */
  cards: DisplayCard[];
  /** Callback when cards are reordered */
  onReorder: (newOrder: string[]) => void;
  /** Card dimensions */
  cardWidth: number;
  /** Gap between cards */
  gap: number;
  /** IDs of cards that are flipped */
  flippedCardIds: string[];
  /** Callback when a card is flipped */
  onFlip: (cardId: string) => void;
  /** Whether to show the rank badge */
  showRankBadge?: boolean;
  /** Whether to show the device badge */
  showDeviceBadge?: boolean;
  /** Placeholder text for unranked items */
  rankPlaceholderText?: string;
  /** Which card face allows dragging */
  dragFace?: DragFace;
  /** What to display on card back */
  cardBackDisplay?: CardBackDisplay;
}

/**
 * Sortable card wrapper component.
 */
interface SortableCardProps {
  card: DisplayCard;
  isFlipped: boolean;
  onFlip: () => void;
  isDragging?: boolean;
  showRankBadge?: boolean;
  showDeviceBadge?: boolean;
  rankPlaceholderText?: string;
  canDrag: boolean;
  cardBackDisplay?: CardBackDisplay;
}

function SortableCard({
  card,
  isFlipped,
  onFlip,
  isAnyDragging,
  showRankBadge,
  showDeviceBadge,
  rankPlaceholderText,
  canDrag,
  cardBackDisplay,
}: SortableCardProps & { isAnyDragging: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: card.id, disabled: !canDrag });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSorting ? 0.5 : 1,
    zIndex: isSorting ? 100 : "auto",
    cursor: canDrag ? (isSorting ? "grabbing" : "grab") : "pointer",
    // Only apply touch-action: none when actively dragging
    // This allows normal scrolling until a drag starts
    touchAction: isAnyDragging ? "none" : "manipulation",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        styles.cardWrapper,
        isSorting ? styles.sorting : "",
      ].filter(Boolean).join(" ")}
      {...attributes}
      {...(canDrag ? listeners : {})}
    >
      <Card
        card={card}
        isFlipped={isFlipped}
        onFlip={onFlip}
        tabIndex={-1}
        showRankBadge={showRankBadge}
        showDeviceBadge={showDeviceBadge}
        rankPlaceholderText={rankPlaceholderText}
        cardBackDisplay={cardBackDisplay}
      />
    </div>
  );
}

/**
 * Drag and drop card grid for custom ordering.
 *
 * Features:
 * - Entire card is draggable (no separate handle)
 * - Smooth reorder animations
 * - Keyboard reordering support
 * - Ghost card during drag
 * - Touch device support via long-press (250ms)
 * - Desktop drag via click-and-move (8px threshold)
 *
 * @example
 * ```tsx
 * <DraggableCardGrid
 *   cards={cards}
 *   onReorder={(newOrder) => setCustomOrder(newOrder)}
 *   cardWidth={140}
 *   gap={16}
 *   flippedCardIds={flipped}
 *   onFlip={handleFlip}
 * />
 * ```
 */
export function DraggableCardGrid({
  cards,
  onReorder,
  cardWidth,
  gap,
  flippedCardIds,
  onFlip,
  showRankBadge,
  showDeviceBadge,
  rankPlaceholderText,
  dragFace = "back",
  cardBackDisplay,
}: DraggableCardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag detection
  // Desktop: small distance threshold for immediate drag
  // Touch: short delay to distinguish from scroll
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Short delay for touch
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Card IDs for sortable context
  const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

  // Find active card for overlay
  const activeCard = useMemo(
    () => cards.find((c) => c.id === activeId),
    [cards, activeId]
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = cardIds.indexOf(String(active.id));
        const newIndex = cardIds.indexOf(String(over.id));

        const newOrder = [...cardIds];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, String(active.id));

        onReorder(newOrder);
      }
    },
    [cardIds, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={cardIds} strategy={rectSortingStrategy}>
        <div
          className={styles.grid}
          style={{
            gap: `${String(gap)}px`,
            gridTemplateColumns: `repeat(auto-fill, ${String(cardWidth)}px)`,
          }}
          role="grid"
          aria-label="Draggable card collection"
        >
          {cards.map((card) => {
            const isFlipped = flippedCardIds.includes(card.id);
            // Determine if dragging is allowed based on dragFace setting
            // isFlipped means front is showing (card has been clicked)
            // !isFlipped means back is showing (default state)
            const canDrag =
              dragFace === "both" ||
              (dragFace === "front" && isFlipped) ||
              (dragFace === "back" && !isFlipped);
            return (
              <SortableCard
                key={card.id}
                card={card}
                isFlipped={isFlipped}
                onFlip={() => { onFlip(card.id); }}
                isAnyDragging={activeId !== null}
                showRankBadge={showRankBadge}
                showDeviceBadge={showDeviceBadge}
                rankPlaceholderText={rankPlaceholderText}
                canDrag={canDrag}
                cardBackDisplay={cardBackDisplay}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Drag overlay (ghost card) */}
      <DragOverlay adjustScale={false}>
        {activeCard && (
          <div className={styles.overlay}>
            <Card
              card={activeCard}
              isFlipped={flippedCardIds.includes(activeCard.id)}
              tabIndex={-1}
              showRankBadge={showRankBadge}
              showDeviceBadge={showDeviceBadge}
              rankPlaceholderText={rankPlaceholderText}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default DraggableCardGrid;
