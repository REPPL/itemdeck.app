import placeholderLogo from "@/assets/placeholder-logo.svg";
import type { CardBackDisplay } from "@/stores/settingsStore";
import styles from "./Card.module.css";

interface CardBackProps {
  /** Logo URL to display on back */
  logoUrl?: string;
  /** Year to display below logo */
  year?: string;
  /** What to display on back (year, logo, both, none) */
  display?: CardBackDisplay;
}

/**
 * Card back face component.
 * Displays centred logo with optional year below.
 */
export function CardBack({ logoUrl, year, display = "year" }: CardBackProps) {
  const logoSrc = logoUrl ?? placeholderLogo;
  const showLogo = display === "logo" || display === "both";
  const showYear = (display === "year" || display === "both") && Boolean(year);

  return (
    <div className={[styles.cardFace, styles.cardBack].join(" ")}>
      {showLogo && (
        <div className={styles.logoContainer}>
          <img
            className={styles.logo}
            src={logoSrc}
            alt=""
            aria-hidden="true"
          />
        </div>
      )}
      {showYear && (
        <p className={styles.textField}>
          {year}
        </p>
      )}
    </div>
  );
}
