import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./Card.module.css";

interface CardInnerProps {
  /** Whether the card is flipped to show front */
  isFlipped: boolean;
  /** Flip animation duration in seconds */
  flipDuration: number;
  /** Card back face */
  back: ReactNode;
  /** Card front face */
  front: ReactNode;
}

/**
 * Inner container that handles 3D flip transform.
 * Contains both card faces and rotates on Y-axis when flipped.
 */
export function CardInner({ isFlipped, flipDuration, back, front }: CardInnerProps) {
  const visualTheme = useSettingsStore((state) => state.visualTheme);
  const themeCustomisations = useSettingsStore((state) => state.themeCustomisations);
  const flipAnimationEnabled = themeCustomisations[visualTheme].flipAnimation;

  // Use instant transition (0) when flip animation is disabled
  const actualDuration = flipAnimationEnabled ? flipDuration : 0;

  return (
    <motion.div
      className={styles.cardInner}
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{
        duration: actualDuration,
        ease: "easeInOut",
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {back}
      {front}
    </motion.div>
  );
}
