import placeholderLogo from "@/assets/placeholder-logo.svg";
import type { CardBackDisplay } from "@/stores/settingsStore";
import styles from "./Card.module.css";

interface CardBackProps {
  /** Logo URL to display on back */
  logoUrl?: string;
  /** Year to display below logo */
  year?: string;
  /** Title/verdict text to display on back */
  title?: string;
  /** What to display on back (year, logo, both, none) */
  display?: CardBackDisplay;
}

/**
 * Card back face component.
 * Displays centred logo with optional verdict/title and year below.
 */
export function CardBack({ logoUrl, year, title, display = "year" }: CardBackProps) {
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
      {title && (
        <p className={styles.backTitle}>
          {title}
        </p>
      )}
      {showYear && (
        <p className={styles.textField}>
          {year}
        </p>
      )}
    </div>
  );
}
