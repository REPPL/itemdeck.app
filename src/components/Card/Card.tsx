import { useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import { useConfig } from "@/hooks/useConfig";
import { useSettingsStore } from "@/stores/settingsStore";
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
  /** Whether to show the footer badge (device/platform) */
  showFooterBadge?: boolean;
  /** Placeholder text for unranked items */
  rankPlaceholderText?: string;
  /** Display configuration for dynamic field resolution */
  displayConfig?: CardDisplayConfig;
  /** Card size preset for responsive adjustments */
  cardSize?: "small" | "medium" | "large";
  /** Whether front face drag handle is enabled */
  showFrontDragHandle?: boolean;
  /** Whether back face drag handle is enabled */
  showBackDragHandle?: boolean;
  /** Drag handle props for front face (listeners and attributes from dnd-kit) */
  frontDragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Drag handle props for back face (listeners and attributes from dnd-kit) */
  backDragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
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
  cardBackDisplay = "logo",
  showRankBadge = true,
  showFooterBadge = true,
  rankPlaceholderText,
  displayConfig,
  cardSize = "medium",
  showFrontDragHandle = false,
  showBackDragHandle = false,
  frontDragHandleProps,
  backDragHandleProps,
}: CardProps) {
  const { cardDimensions, settings } = useSettingsContext();
  const { config } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  // Get card background colour for contrast calculation
  const visualTheme = useSettingsStore((state) => state.visualTheme);
  const themeCustomisations = useSettingsStore((state) => state.themeCustomisations);
  const cardBackgroundColour = themeCustomisations[visualTheme].cardBackgroundColour;

  // Get card back background setting to determine logo behaviour
  const cardBackBackground = useSettingsStore((state) => state.cardBackBackground);

  // Check if card has local edits (via _editedAt field added during merge)
  const cardEditedAt = (card as unknown as Record<string, unknown>)._editedAt as number | undefined;
  const cardHasEdits = cardEditedAt !== undefined;

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


  // Resolve back face values
  // When cardBackBackground is "app-logo" → always use app logo (undefined forces fallback)
  // When displayConfig is provided:
  //   - backConfig.logo = "logoUrl" → Platform Logo (default)
  //   - backConfig.logo = "images[type=logo][0].url" → Card Logo
  //   - backConfig.logo = undefined → None (use app logo)
  // When displayConfig is NOT provided, fall back to card.logoUrl (Platform Logo)
  const resolvedLogoUrl = useMemo(() => {
    // If "app-logo" is selected in settings, always use app logo
    if (cardBackBackground === "app-logo") {
      return undefined;
    }
    // If displayConfig exists but logo is undefined → "None" was selected → use app logo
    if (displayConfig && backConfig?.logo === undefined) {
      return undefined;
    }
    // If logo path is configured, resolve it
    if (backConfig?.logo) {
      return resolveFieldPathAsString(entity, backConfig.logo) || card.logoUrl;
    }
    // No displayConfig at all → use platform logo (default)
    return card.logoUrl;
  }, [cardBackBackground, displayConfig, entity, backConfig?.logo, card.logoUrl]);

  // Resolve footer badge (device) - use field path if configured
  const resolvedDevice = useMemo(() => {
    if (frontConfig?.footerBadge) {
      return resolveFieldPathAsString(entity, frontConfig.footerBadge, card.device ?? "");
    }
    return card.device;
  }, [entity, frontConfig?.footerBadge, card.device]);

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
        data-card-size={cardSize}
        data-flipped={isFlipped}
        data-flipping={isFlipping}
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
          onFlipStart={() => { setIsFlipping(true); }}
          onFlipComplete={() => { setIsFlipping(false); }}
          back={
            <CardBack
              logoUrl={cardBackBackground === "app-logo" ? undefined : (resolvedLogoUrl ?? settings.card.logoUrl)}
              display={cardBackDisplay}
              showDragHandle={showBackDragHandle}
              dragHandleProps={backDragHandleProps}
              isFlipping={isFlipping}
              backgroundColour={cardBackgroundColour}
            />
          }
          front={
            <CardFront
              imageUrl={card.imageUrl}
              title={resolvedTitle}
              subtitle={resolvedSubtitle}
              rank={resolvedRank}
              device={resolvedDevice}
              showRankBadge={showRankBadge}
              showFooterBadge={showFooterBadge}
              rankPlaceholderText={rankPlaceholderText}
              cardSize={cardSize}
              onInfoClick={handleInfoClick}
              showDragHandle={showFrontDragHandle}
              dragHandleProps={frontDragHandleProps}
              isFlipping={isFlipping}
              hasEdits={cardHasEdits}
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
