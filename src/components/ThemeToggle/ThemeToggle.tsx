/**
 * Theme toggle component.
 *
 * Provides a three-way toggle for light/dark/auto theme modes.
 */

import { useTheme } from "@/hooks/useTheme";
import type { ThemeMode } from "@/stores/themeStore";
import styles from "./ThemeToggle.module.css";

/**
 * Sun icon for light theme.
 */
function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Moon icon for dark theme.
 */
function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * Monitor icon for auto/system theme.
 */
function MonitorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const themeOptions: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { mode: "light", icon: <SunIcon />, label: "Light" },
  { mode: "auto", icon: <MonitorIcon />, label: "System" },
  { mode: "dark", icon: <MoonIcon />, label: "Dark" },
];

/**
 * Theme toggle component with three modes.
 *
 * Displays light/auto/dark options as a segmented control.
 */
export function ThemeToggle() {
  const { mode, setMode, resolvedTheme } = useTheme();

  return (
    <div
      className={styles.container}
      role="radiogroup"
      aria-label="Theme mode"
    >
      {themeOptions.map(({ mode: optionMode, icon, label }) => (
        <button
          key={optionMode}
          type="button"
          className={[styles.button, mode === optionMode ? styles.active : ""].filter(Boolean).join(" ")}
          onClick={() => {
            setMode(optionMode);
          }}
          role="radio"
          aria-checked={mode === optionMode}
          aria-label={`${label} theme${optionMode === "auto" ? ` (currently ${resolvedTheme})` : ""}`}
          title={label}
        >
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  );
}
