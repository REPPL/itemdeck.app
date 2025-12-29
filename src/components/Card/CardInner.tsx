import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "@/stores/settingsStore";
import { springPresets } from "@/config/animationPresets";
import styles from "./Card.module.css";

interface CardInnerProps {
  /** Whether the card is flipped to show front */
  isFlipped: boolean;
  /** Flip animation duration in seconds (used as fallback when spring disabled) */
  flipDuration: number;
  /** Card back face */
  back: ReactNode;
  /** Card front face */
  front: ReactNode;
  /** Callback when flip animation starts */
  onFlipStart?: () => void;
  /** Callback when flip animation completes */
  onFlipComplete?: () => void;
}

/**
 * Inner container that handles 3D flip transform.
 * Contains both card faces and rotates on Y-axis when flipped.
 *
 * Uses spring physics for natural, bouncy flip animation.
 * Respects user's reduced motion preference via MotionConfig.
 *
 * @see F-041: Card Animation Polish
 */
export function CardInner({
  isFlipped,
  // flipDuration kept for API compatibility but spring physics are used instead
  flipDuration: _flipDuration,
  back,
  front,
  onFlipStart,
  onFlipComplete,
}: CardInnerProps) {
  const visualTheme = useSettingsStore((state) => state.visualTheme);
  const themeCustomisations = useSettingsStore((state) => state.themeCustomisations);
  const flipAnimationEnabled = themeCustomisations[visualTheme].flipAnimation;

  // Use spring physics when animation is enabled, instant otherwise
  const flipTransition = flipAnimationEnabled
    ? {
        type: "spring" as const,
        ...springPresets.cardFlip,
      }
    : {
        duration: 0,
      };

  return (
    <motion.div
      className={styles.cardInner}
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={flipTransition}
      style={{ transformStyle: "preserve-3d" }}
      onAnimationStart={() => {
        // Only trigger if animation is enabled
        if (flipAnimationEnabled) {
          onFlipStart?.();
        }
      }}
      onAnimationComplete={() => {
        // Always trigger complete to ensure state is correct
        onFlipComplete?.();
      }}
    >
      {back}
      {front}
    </motion.div>
  );
}
