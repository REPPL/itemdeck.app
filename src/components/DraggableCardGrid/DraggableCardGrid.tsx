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
}

/**
 * Sortable card wrapper component.
 */
interface SortableCardProps {
  card: DisplayCard;
  isFlipped: boolean;
  onFlip: () => void;
  isDragging?: boolean;
}

function SortableCard({
  card,
  isFlipped,
  onFlip,
  isDragging,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSorting ? 0.5 : 1,
    zIndex: isSorting ? 100 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.cardWrapper ?? ""} ${isDragging ? (styles.dragging ?? "") : ""}`}
      {...attributes}
    >
      {/* Drag handle */}
      <div className={styles.dragHandle} {...listeners} aria-label="Drag to reorder">
        <DragHandleIcon />
      </div>
      <Card
        card={card}
        isFlipped={isFlipped}
        onFlip={onFlip}
        tabIndex={-1}
      />
    </div>
  );
}

/**
 * Drag and drop card grid for custom ordering.
 *
 * Features:
 * - Drag handle on each card
 * - Smooth reorder animations
 * - Keyboard reordering support
 * - Ghost card during drag
 * - Touch device support via long-press
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
}: DraggableCardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance
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
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              isFlipped={flippedCardIds.includes(card.id)}
              onFlip={() => { onFlip(card.id); }}
              isDragging={card.id === activeId}
            />
          ))}
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
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Drag handle icon
function DragHandleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={styles.dragIcon}
      aria-hidden="true"
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

export default DraggableCardGrid;
