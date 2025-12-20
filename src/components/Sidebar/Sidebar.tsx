import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar that grows from the menu button position.
 * White semi-transparent with backdrop blur.
 * Full height of the screen.
 */
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const backdropClass = [styles.backdrop, isOpen ? styles.open : ""]
    .filter(Boolean)
    .join(" ");
  const sidebarClass = [styles.sidebar, isOpen ? styles.open : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* Backdrop to close sidebar when clicking outside */}
      <div
        className={backdropClass}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={sidebarClass}
        aria-hidden={!isOpen}
      >
        <nav className={styles.nav}>
          <p className={styles.placeholder}>Commands will go here</p>
        </nav>
      </aside>
    </>
  );
}
