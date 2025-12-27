/**
 * MechanicButton - Floating button to open the Mechanic Panel.
 */

import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./MechanicButton.module.css";

interface MechanicButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Game controller icon.
 */
function GameControllerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="13" r="1" />
      <circle cx="18" cy="10" r="1" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
    </svg>
  );
}

/**
 * MechanicButton component.
 */
export function MechanicButton({ onClick, disabled }: MechanicButtonProps) {
  const activeMechanicId = useSettingsStore((s) => s.activeMechanicId);
  const isActive = activeMechanicId !== null;

  const className = [
    styles.button,
    isActive ? styles.buttonActive : "",
    disabled ? styles.buttonDisabled : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={isActive ? "Manage active game mechanic" : "Open game mechanics"}
      title={isActive ? "Mechanic active - click to manage" : "Game Mechanics"}
    >
      <GameControllerIcon />
      {isActive && <span className={styles.indicator} />}
    </button>
  );
}

export default MechanicButton;
