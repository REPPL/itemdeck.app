import { type ReactNode } from "react";
import { motion } from "framer-motion";
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
  return (
    <motion.div
      className={styles.cardInner}
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{
        duration: flipDuration,
        ease: "easeInOut",
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {back}
      {front}
    </motion.div>
  );
}
