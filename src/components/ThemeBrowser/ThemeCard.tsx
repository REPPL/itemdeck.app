/**
 * ThemeCard component for displaying a single theme option.
 */

import styles from "./ThemeCard.module.css";

interface ThemeCardProps {
  /** Theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Theme description */
  description: string;
  /** Theme author (for external themes) */
  author?: string;
  /** Whether this theme is currently selected */
  isSelected: boolean;
  /** Called when theme is selected */
  onSelect: () => void;
  /** Whether this is an external (community) theme */
  isExternal?: boolean;
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Theme selection card.
 */
export function ThemeCard({
  id,
  name,
  description,
  author,
  isSelected,
  onSelect,
  isExternal = false,
}: ThemeCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card ?? ""} ${isSelected ? styles.selected ?? "" : ""}`}
      onClick={onSelect}
      aria-pressed={isSelected}
      data-theme-id={id}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>{name}</span>
          {isExternal && (
            <span className={styles.badge}>Community</span>
          )}
        </div>
        <p className={styles.description}>{description}</p>
        {author && (
          <span className={styles.author}>by {author}</span>
        )}
      </div>
      <div className={styles.indicator}>
        {isSelected ? (
          <span className={styles.checkmark}>
            <CheckIcon />
          </span>
        ) : (
          <span className={styles.radio} />
        )}
      </div>
    </button>
  );
}

export default ThemeCard;
