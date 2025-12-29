/**
 * Question display component.
 *
 * Shows the current question based on type.
 */

import { useMemo } from "react";
import { useQuizStore } from "../store";
import { DIFFICULTY_SETTINGS } from "../types";
import styles from "../Quiz.module.css";

/**
 * Seeded random number generator for consistent zoom per question.
 * Uses a simple hash of the question ID.
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to 0-1 range
  return Math.abs(Math.sin(hash)) % 1;
}

/**
 * Displays the current question prompt and any associated media.
 */
export function QuestionDisplay() {
  const getCurrentQuestion = useQuizStore((s) => s.getCurrentQuestion);
  const difficulty = useQuizStore((s) => s.difficulty);

  const question = getCurrentQuestion();

  // Calculate blur and zoom based on difficulty
  const { blurAmount, zoomScale, zoomOrigin } = useMemo(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const blur = settings.imageBlur;

    // Determine if zoom should be applied based on chance
    // Use question ID as seed for consistent results per question
    const randomValue = question ? seededRandom(question.id) : 0;
    const shouldZoom = randomValue < settings.imageZoomChance;
    const scale = shouldZoom ? settings.imageZoom : 1;

    // Calculate random origin for zoomed image (20-80% range to avoid edges)
    let originX = 50;
    let originY = 50;
    if (scale > 1 && question) {
      // Use different seeds for X and Y
      originX = 20 + seededRandom(question.id + "x") * 60;
      originY = 20 + seededRandom(question.id + "y") * 60;
    }

    return {
      blurAmount: blur,
      zoomScale: scale,
      zoomOrigin: `${String(originX)}% ${String(originY)}%`,
    };
  }, [difficulty, question]);

  if (!question) return null;

  // Build image style with blur and zoom
  const imageStyle: React.CSSProperties = {};
  if (blurAmount > 0) {
    imageStyle.filter = `blur(${String(blurAmount)}px)`;
  }
  if (zoomScale > 1) {
    imageStyle.transform = `scale(${String(zoomScale)})`;
    imageStyle.transformOrigin = zoomOrigin;
  }

  const hasImageEffects = blurAmount > 0 || zoomScale > 1;

  return (
    <div className={styles.questionDisplay}>
      {/* Image for image-to-name questions */}
      {question.type === "imageToName" && question.metadata?.imageUrl && (
        <div className={zoomScale > 1 ? styles.questionImageContainer : undefined}>
          <img
            src={question.metadata.imageUrl}
            alt="Identify this card"
            className={styles.questionImage}
            style={hasImageEffects ? imageStyle : undefined}
            draggable="false"
          />
        </div>
      )}

      {/* Question prompt */}
      <p className={styles.questionPrompt}>{question.prompt}</p>
    </div>
  );
}
