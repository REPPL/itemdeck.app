/**
 * Accessibility Checklist component for development-only manual verification.
 *
 * Provides a collapsible checklist for manual accessibility testing during development.
 * Only renders in development mode (import.meta.env.DEV).
 *
 * @see F-019: Accessibility Audit
 * @see ADR-011: Accessibility Standard
 */

import { useState } from "react";
import styles from "./AccessibilityChecklist.module.css";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

/**
 * Default checklist sections for manual accessibility testing.
 */
const DEFAULT_SECTIONS: ChecklistSection[] = [
  {
    title: "Keyboard Navigation",
    items: [
      { id: "kb-1", label: "All interactive elements are reachable via Tab", checked: false },
      { id: "kb-2", label: "Tab order follows visual reading order", checked: false },
      { id: "kb-3", label: "Focus indicator is visible on all focused elements", checked: false },
      { id: "kb-4", label: "Arrow keys navigate within card grid", checked: false },
      { id: "kb-5", label: "Enter/Space activates buttons and flips cards", checked: false },
      { id: "kb-6", label: "Escape closes modals and panels", checked: false },
      { id: "kb-7", label: "Focus is trapped within open modals", checked: false },
      { id: "kb-8", label: "Focus returns to trigger element when modal closes", checked: false },
      { id: "kb-9", label: "Skip to content link works correctly", checked: false },
    ],
  },
  {
    title: "Screen Reader",
    items: [
      { id: "sr-1", label: "Page has logical heading structure (h1 > h2 > h3)", checked: false },
      { id: "sr-2", label: "Images have meaningful alt text or are marked decorative", checked: false },
      { id: "sr-3", label: "Form inputs have associated labels", checked: false },
      { id: "sr-4", label: "Buttons have accessible names", checked: false },
      { id: "sr-5", label: "Cards announce flip state change (aria-pressed)", checked: false },
      { id: "sr-6", label: "Loading states are announced (aria-live)", checked: false },
      { id: "sr-7", label: "Error messages are announced (role=alert)", checked: false },
      { id: "sr-8", label: "Modals have correct ARIA attributes (role=dialog, aria-modal)", checked: false },
      { id: "sr-9", label: "VoiceOver/NVDA reads content in logical order", checked: false },
    ],
  },
  {
    title: "Visual",
    items: [
      { id: "vis-1", label: "Text meets WCAG AA contrast ratio (4.5:1 normal, 3:1 large)", checked: false },
      { id: "vis-2", label: "UI is usable at 200% zoom", checked: false },
      { id: "vis-3", label: "Content reflows properly at narrow widths", checked: false },
      { id: "vis-4", label: "Focus indicators meet 3:1 contrast ratio", checked: false },
      { id: "vis-5", label: "Information is not conveyed by colour alone", checked: false },
      { id: "vis-6", label: "Animations can be disabled (prefers-reduced-motion)", checked: false },
      { id: "vis-7", label: "High contrast mode improves readability", checked: false },
      { id: "vis-8", label: "Light and dark themes both meet contrast requirements", checked: false },
    ],
  },
  {
    title: "Touch & Mobile",
    items: [
      { id: "touch-1", label: "Touch targets are at least 44x44 pixels", checked: false },
      { id: "touch-2", label: "Swipe gestures have alternative controls", checked: false },
      { id: "touch-3", label: "Pinch-to-zoom is not disabled", checked: false },
      { id: "touch-4", label: "Orientation changes are handled gracefully", checked: false },
    ],
  },
];

/**
 * Collapsible section component.
 */
function Section({
  section,
  onToggle,
}: {
  section: ChecklistSection;
  onToggle: (itemId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedCount = section.items.filter((item) => item.checked).length;
  const totalCount = section.items.length;
  const isComplete = completedCount === totalCount;

  return (
    <div className={styles.section}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => { setIsExpanded(!isExpanded); }}
        aria-expanded={isExpanded}
      >
        <span className={styles.sectionTitle}>
          {isComplete && <span className={styles.checkMark}>&#10003;</span>}
          {section.title}
        </span>
        <span className={styles.sectionProgress}>
          {String(completedCount)}/{String(totalCount)}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          {isExpanded ? "▼" : "▶"}
        </span>
      </button>
      {isExpanded && (
        <ul className={styles.itemList}>
          {section.items.map((item) => (
            <li key={item.id} className={styles.item}>
              <label className={styles.itemLabel}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => { onToggle(item.id); }}
                  className={styles.checkbox}
                />
                <span className={item.checked ? styles.checkedText : undefined}>
                  {item.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Accessibility Checklist for manual testing in development mode.
 *
 * Provides a floating, collapsible panel with categorised checklists
 * for keyboard navigation, screen reader, and visual accessibility testing.
 */
export function AccessibilityChecklist() {
  const [isOpen, setIsOpen] = useState(false);
  const [sections, setSections] = useState<ChecklistSection[]>(DEFAULT_SECTIONS);

  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleToggle = (itemId: string) => {
    setSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      }))
    );
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
  };

  const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = sections.reduce(
    (acc, section) => acc + section.items.filter((item) => item.checked).length,
    0
  );
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  return (
    <div className={styles.container}>
      {/* Toggle button */}
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => { setIsOpen(!isOpen); }}
        aria-label={isOpen ? "Close accessibility checklist" : "Open accessibility checklist"}
        aria-expanded={isOpen}
        title="Accessibility Checklist (Dev Only)"
      >
        <span aria-hidden="true">&#9855;</span>
        {completedItems > 0 && (
          <span className={styles.badge}>{progressPercent}%</span>
        )}
      </button>

      {/* Checklist panel */}
      {isOpen && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label="Accessibility Checklist"
        >
          <div className={styles.header}>
            <h2 className={styles.title}>Accessibility Checklist</h2>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleReset}
                aria-label="Reset checklist"
              >
                Reset
              </button>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => { setIsOpen(false); }}
                aria-label="Close checklist"
              >
                &#10005;
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${String(progressPercent)}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${String(completedItems)} of ${String(totalItems)} items completed`}
            />
            <span className={styles.progressText}>
              {String(completedItems)}/{String(totalItems)} ({String(progressPercent)}%)
            </span>
          </div>

          {/* Sections */}
          <div className={styles.content}>
            {sections.map((section, index) => (
              <Section key={index} section={section} onToggle={handleToggle} />
            ))}
          </div>

          {/* Dev note */}
          <p className={styles.devNote}>
            This panel is only visible in development mode.
          </p>
        </div>
      )}
    </div>
  );
}

export default AccessibilityChecklist;
