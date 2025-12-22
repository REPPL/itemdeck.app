import { useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import { useConfig } from "@/hooks/useConfig";
import { CardBack } from "./CardBack";
import { CardFront } from "./CardFront";
import { CardInner } from "./CardInner";
import { CardExpanded } from "@/components/CardExpanded";
import { resolveFieldPathAsString, resolveFieldPathAsNumber } from "@/loaders/fieldPath";
import type { DisplayCard } from "@/hooks/useCollection";
import type { CardBackDisplay } from "@/stores/settingsStore";
import type { CardDisplayConfig } from "@/types/display";
import type { ResolvedEntity } from "@/types/schema";
import styles from "./Card.module.css";

/**
 * Props for card display.
 * Accepts any object with the required card fields.
 */
interface CardDisplayData {
  id: string;
  title: string;
  year?: string;
  imageUrl: string;
  imageUrls?: string[];
  logoUrl?: string;
  summary?: string;
  detailUrl?: string;
  categoryTitle?: string;
  rank?: number | null;
  device?: string;
  metadata?: Record<string, string>;
}

interface CardProps {
  /** Card data to display */
  card: CardDisplayData;
  /** Card number for display (1-indexed) */
  cardNumber?: number;
  /** Whether the card is flipped to show front */
  isFlipped?: boolean;
  /** Callback when card is clicked */
  onFlip?: () => void;
  /** Tab index for keyboard navigation (roving tabindex) */
  tabIndex?: 0 | -1;
  /** What to display on card back */
  cardBackDisplay?: CardBackDisplay;
  /** Whether to show the rank badge */
  showRankBadge?: boolean;
  /** Whether to show the device badge */
  showDeviceBadge?: boolean;
  /** Placeholder text for unranked items */
  rankPlaceholderText?: string;
  /** Display configuration for dynamic field resolution */
  displayConfig?: CardDisplayConfig;
}

/**
 * Card component with 3D flip animation.
 *
 * Shows back face (logo + year) by default.
 * When flipped, reveals front face (image + title overlay).
 *
 * Features:
 * - 3D flip animation with Framer Motion
 * - Hover lift effect (scale 1.02)
 * - Tap press effect (scale 0.98)
 * - Keyboard support (Enter/Space)
 * - Respects reduced motion preference via MotionProvider
 *
 * Flip state is controlled externally via isFlipped prop.
 * CardGrid manages which cards are flipped.
 */
export function Card({
  card,
  cardNumber,
  isFlipped = false,
  onFlip,
  tabIndex = 0,
  cardBackDisplay = "year",
  showRankBadge = true,
  showDeviceBadge = true,
  rankPlaceholderText,
  displayConfig,
}: CardProps) {
  const { cardDimensions, settings } = useSettingsContext();
  const { config } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLElement>(null);

  // Resolve field values using display configuration
  // Cast card to ResolvedEntity for field path resolution
  const entity = card as unknown as ResolvedEntity;
  const frontConfig = displayConfig?.front;
  const backConfig = displayConfig?.back;

  // Resolve front face values with fallbacks to direct props
  const resolvedTitle = useMemo(() => {
    if (frontConfig?.title) {
      return resolveFieldPathAsString(entity, frontConfig.title, card.title);
    }
    return card.title;
  }, [entity, frontConfig?.title, card.title]);

  const resolvedSubtitle = useMemo(() => {
    if (frontConfig?.subtitle) {
      return resolveFieldPathAsString(entity, frontConfig.subtitle, card.year ?? "");
    }
    return card.year;
  }, [entity, frontConfig?.subtitle, card.year]);

  const resolvedRank = useMemo(() => {
    if (frontConfig?.badge) {
      return resolveFieldPathAsNumber(entity, frontConfig.badge);
    }
    return card.rank ?? null;
  }, [entity, frontConfig?.badge, card.rank]);

  const resolvedSecondaryBadge = useMemo(() => {
    if (frontConfig?.secondaryBadge) {
      return resolveFieldPathAsString(entity, frontConfig.secondaryBadge);
    }
    return undefined;
  }, [entity, frontConfig?.secondaryBadge]);

  // Resolve back face values
  const resolvedLogoUrl = useMemo(() => {
    if (backConfig?.logo) {
      return resolveFieldPathAsString(entity, backConfig.logo) || card.logoUrl;
    }
    return card.logoUrl;
  }, [entity, backConfig?.logo, card.logoUrl]);

  const resolvedBackTitle = useMemo(() => {
    if (backConfig?.title) {
      return resolveFieldPathAsString(entity, backConfig.title);
    }
    return undefined;
  }, [entity, backConfig?.title]);

  const resolvedBackText = useMemo(() => {
    if (backConfig?.text) {
      return resolveFieldPathAsString(entity, backConfig.text, card.year ?? "");
    }
    return card.year;
  }, [entity, backConfig?.text, card.year]);

  const cardStyle = {
    width: `${String(cardDimensions.width)}px`,
    height: `${String(cardDimensions.height)}px`,
  };

  const handleClick = () => {
    onFlip?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onFlip?.();
    }
  };

  const handleInfoClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    // Capture card position for animation origin
    if (cardRef.current) {
      setOriginRect(cardRef.current.getBoundingClientRect());
    }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Cast to DisplayCard for modal (includes optional fields)
  const displayCard = card as DisplayCard;

  return (
    <>
      <motion.article
        ref={cardRef}
        className={styles.card}
        style={cardStyle}
        title={cardNumber !== undefined ? `Card #${String(cardNumber)}` : undefined}
        data-card-id={card.id}
        data-flipped={isFlipped}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={tabIndex}
        aria-pressed={isFlipped}
        aria-label={`${card.title}${isFlipped ? " (showing front)" : " (showing back)"}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <CardInner
          isFlipped={isFlipped}
          flipDuration={config.animation.flipDuration}
          back={
            <CardBack
              logoUrl={resolvedLogoUrl ?? settings.card.logoUrl}
              year={resolvedBackText}
              title={resolvedBackTitle}
              display={cardBackDisplay}
            />
          }
          front={
            <CardFront
              imageUrl={card.imageUrl}
              title={resolvedTitle}
              subtitle={resolvedSubtitle}
              rank={resolvedRank}
              secondaryBadge={resolvedSecondaryBadge}
              device={card.device}
              showRankBadge={showRankBadge}
              showDeviceBadge={showDeviceBadge}
              rankPlaceholderText={rankPlaceholderText}
              onInfoClick={handleInfoClick}
            />
          }
        />
      </motion.article>
      <CardExpanded
        card={displayCard}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        originRect={originRect}
      />
    </>
  );
}

// Re-export compound components for flexible composition
Card.Back = CardBack;
Card.Front = CardFront;
Card.Inner = CardInner;
