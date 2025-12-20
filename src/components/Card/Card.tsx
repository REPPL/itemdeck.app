import { type CardData } from "@/types/card";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import placeholderLogo from "@/assets/placeholder-logo.svg";
import styles from "./Card.module.css";

interface CardProps {
  card: CardData;
}

/**
 * Card component displaying the card back with centred logo and text field.
 * Logo is always centred (both horizontally and vertically).
 * Optional year text is positioned below the logo (default) or above.
 * Card dimensions are controlled via settings context.
 *
 * TODO: Implement card flip to reveal front (image, title, metadata)
 */
export function Card({ card }: CardProps) {
  const { cardDimensions, settings } = useSettingsContext();
  const logoSrc = card.logoUrl ?? settings.card.logoUrl ?? placeholderLogo;
  const hasYear = Boolean(card.year);

  const cardStyle = {
    width: `${String(cardDimensions.width)}px`,
    height: `${String(cardDimensions.height)}px`,
  };

  return (
    <article
      className={styles.card}
      style={cardStyle}
      title={card.title}
      data-card-id={card.id}
    >
      <div className={styles.logoContainer}>
        <img
          className={styles.logo}
          src={logoSrc}
          alt=""
          aria-hidden="true"
        />
      </div>
      {hasYear && (
        <p className={styles.textField}>
          {card.year}
        </p>
      )}
    </article>
  );
}
