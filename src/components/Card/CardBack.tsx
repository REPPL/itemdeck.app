import placeholderLogo from "@/assets/placeholder-logo.svg";
import styles from "./Card.module.css";

interface CardBackProps {
  /** Logo URL to display on back */
  logoUrl?: string;
  /** Year to display below logo */
  year?: string;
}

/**
 * Card back face component.
 * Displays centred logo with optional year below.
 */
export function CardBack({ logoUrl, year }: CardBackProps) {
  const logoSrc = logoUrl ?? placeholderLogo;
  const hasYear = Boolean(year);

  return (
    <div className={[styles.cardFace, styles.cardBack].join(" ")}>
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
          {year}
        </p>
      )}
    </div>
  );
}
