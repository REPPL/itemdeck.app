/**
 * CardGroup component for displaying grouped cards with collapsible headers.
 */

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./CardGroup.module.css";

interface CardGroupProps {
  /** Group key (e.g., "Game Boy", "1990s") */
  groupKey: string;
  /** Number of cards in this group */
  cardCount: number;
  /** Whether the group is collapsed */
  isCollapsed: boolean;
  /** Children (cards) to render when expanded */
  children: React.ReactNode;
}

function ChevronIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Collapsible group header with card count.
 */
export function CardGroup({
  groupKey,
  cardCount,
  isCollapsed,
  children,
}: CardGroupProps) {
  const toggleGroupCollapse = useSettingsStore((state) => state.toggleGroupCollapse);

  const handleToggle = useCallback(() => {
    toggleGroupCollapse(groupKey);
  }, [groupKey, toggleGroupCollapse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleGroupCollapse(groupKey);
      }
    },
    [groupKey, toggleGroupCollapse]
  );

  return (
    <section className={styles.group} aria-labelledby={`group-${groupKey}`}>
      <header
        className={styles.header}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-controls={`group-content-${groupKey}`}
      >
        <span className={styles.chevron}>
          <ChevronIcon isCollapsed={isCollapsed} />
        </span>
        <h3 id={`group-${groupKey}`} className={styles.title}>
          {groupKey}
        </h3>
        <span className={styles.count}>
          {cardCount} {cardCount === 1 ? "card" : "cards"}
        </span>
      </header>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            id={`group-content-${groupKey}`}
            className={styles.content}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default CardGroup;
