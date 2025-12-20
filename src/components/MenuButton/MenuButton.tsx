import styles from "./MenuButton.module.css";

interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * Menu button for opening the command overlay.
 * Fixed position in the top-left corner.
 *
 * TODO: Connect to command overlay when implemented
 */
export function MenuButton({ isOpen, onClick }: MenuButtonProps) {
  return (
    <button
      className={[styles.menuButton, isOpen ? styles.open : ""].join(" ")}
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      type="button"
    >
      <div className={styles.icon}>
        <span className={styles.iconBar} />
        <span className={styles.iconBar} />
        <span className={styles.iconBar} />
      </div>
    </button>
  );
}
