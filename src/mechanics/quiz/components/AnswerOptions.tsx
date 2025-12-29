/**
 * Answer options component.
 *
 * Displays answer buttons (text or image-based).
 */

import { useCallback, useEffect, useMemo } from "react";
import { useQuizStore } from "../store";
import { getAnswerLabel } from "../generators/utils";
import { DIFFICULTY_SETTINGS } from "../types";
import type { Answer } from "../types";
import styles from "../Quiz.module.css";

/**
 * Get CSS classes for an answer button based on state.
 */
function getAnswerClasses(
  answer: Answer,
  feedbackVisible: boolean,
  lastAnswerCorrect: boolean | null,
  lastCorrectAnswer: Answer | null,
  selectedAnswerId: string | null
): string {
  const classes = [styles.answerButton];

  if (feedbackVisible) {
    classes.push(styles.disabled);

    if (answer.id === lastCorrectAnswer?.id) {
      // This is the correct answer
      if (lastAnswerCorrect) {
        classes.push(styles.correct);
      } else {
        classes.push(styles.showCorrect);
      }
    } else if (answer.id === selectedAnswerId && !lastAnswerCorrect) {
      // This was the wrong selection
      classes.push(styles.incorrect);
    }
  }

  return classes.join(" ");
}

/**
 * Get CSS classes for an image answer button based on state.
 */
function getImageAnswerClasses(
  answer: Answer,
  feedbackVisible: boolean,
  lastAnswerCorrect: boolean | null,
  lastCorrectAnswer: Answer | null,
  selectedAnswerId: string | null
): string {
  const classes = [styles.imageAnswerButton];

  if (feedbackVisible) {
    classes.push(styles.disabled);

    if (answer.id === lastCorrectAnswer?.id) {
      if (lastAnswerCorrect) {
        classes.push(styles.correct);
      } else {
        classes.push(styles.showCorrect);
      }
    } else if (answer.id === selectedAnswerId && !lastAnswerCorrect) {
      classes.push(styles.incorrect);
    }
  }

  return classes.join(" ");
}

/**
 * Text-based answer options.
 */
function TextAnswerOptions() {
  const getCurrentQuestion = useQuizStore((s) => s.getCurrentQuestion);
  const getShuffledAnswers = useQuizStore((s) => s.getShuffledAnswers);
  const submitAnswer = useQuizStore((s) => s.submitAnswer);
  const feedbackVisible = useQuizStore((s) => s.feedbackVisible);
  const lastAnswerCorrect = useQuizStore((s) => s.lastAnswerCorrect);
  const lastCorrectAnswer = useQuizStore((s) => s.lastCorrectAnswer);
  const answers = useQuizStore((s) => s.answers);
  const currentIndex = useQuizStore((s) => s.currentIndex);

  const question = getCurrentQuestion();
  const shuffledAnswers = getShuffledAnswers();

  // Get the last answer's selected ID for highlighting
  const lastAnswer = answers[currentIndex];
  const selectedAnswerId = lastAnswer?.selectedAnswerId ?? null;

  const handleAnswer = useCallback(
    (answerId: string) => {
      if (feedbackVisible) return;
      submitAnswer(answerId);
    },
    [feedbackVisible, submitAnswer]
  );

  // Keyboard shortcuts (A, B, C, D)
  useEffect(() => {
    if (!question || feedbackVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key >= "A" && key <= "D") {
        const index = key.charCodeAt(0) - 65; // A=0, B=1, etc.
        const answer = shuffledAnswers[index];
        if (answer) {
          e.preventDefault();
          handleAnswer(answer.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [question, feedbackVisible, shuffledAnswers, handleAnswer]);

  if (!question) return null;

  return (
    <div className={styles.answerOptions}>
      {shuffledAnswers.map((answer, index) => (
        <button
          key={answer.id}
          type="button"
          className={getAnswerClasses(
            answer,
            feedbackVisible,
            lastAnswerCorrect,
            lastCorrectAnswer,
            selectedAnswerId
          )}
          onClick={() => {
            handleAnswer(answer.id);
          }}
          disabled={feedbackVisible}
          aria-label={`Answer ${getAnswerLabel(index)}: ${answer.label}`}
        >
          <span className={styles.answerLabel}>{getAnswerLabel(index)}</span>
          <span className={styles.answerText}>{answer.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Image-based answer options for name-to-image questions.
 */
function ImageAnswerOptions() {
  const getCurrentQuestion = useQuizStore((s) => s.getCurrentQuestion);
  const getShuffledAnswers = useQuizStore((s) => s.getShuffledAnswers);
  const submitAnswer = useQuizStore((s) => s.submitAnswer);
  const feedbackVisible = useQuizStore((s) => s.feedbackVisible);
  const lastAnswerCorrect = useQuizStore((s) => s.lastAnswerCorrect);
  const lastCorrectAnswer = useQuizStore((s) => s.lastCorrectAnswer);
  const answers = useQuizStore((s) => s.answers);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const difficulty = useQuizStore((s) => s.difficulty);

  const question = getCurrentQuestion();
  const shuffledAnswers = getShuffledAnswers();

  const lastAnswer = answers[currentIndex];
  const selectedAnswerId = lastAnswer?.selectedAnswerId ?? null;

  // Calculate blur amount based on difficulty
  const blurAmount = useMemo(() => {
    return DIFFICULTY_SETTINGS[difficulty].imageBlur;
  }, [difficulty]);

  const handleAnswer = useCallback(
    (answerId: string) => {
      if (feedbackVisible) return;
      submitAnswer(answerId);
    },
    [feedbackVisible, submitAnswer]
  );

  // Keyboard shortcuts (A, B, C, D)
  useEffect(() => {
    if (!question || feedbackVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key >= "A" && key <= "D") {
        const index = key.charCodeAt(0) - 65;
        const answer = shuffledAnswers[index];
        if (answer) {
          e.preventDefault();
          handleAnswer(answer.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [question, feedbackVisible, shuffledAnswers, handleAnswer]);

  if (!question) return null;

  return (
    <div className={styles.imageAnswerOptions}>
      {shuffledAnswers.map((answer, index) => (
        <button
          key={answer.id}
          type="button"
          className={getImageAnswerClasses(
            answer,
            feedbackVisible,
            lastAnswerCorrect,
            lastCorrectAnswer,
            selectedAnswerId
          )}
          onClick={() => {
            handleAnswer(answer.id);
          }}
          disabled={feedbackVisible}
          aria-label={`Answer ${getAnswerLabel(index)}`}
        >
          {answer.imageUrl && (
            <img
              src={answer.imageUrl}
              alt=""
              className={styles.answerImage}
              style={blurAmount > 0 ? { filter: `blur(${String(blurAmount)}px)` } : undefined}
              draggable="false"
            />
          )}
          <span className={styles.imageLabel}>{getAnswerLabel(index)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Answer options component that renders appropriate type.
 */
export function AnswerOptions() {
  const getCurrentQuestion = useQuizStore((s) => s.getCurrentQuestion);
  const question = getCurrentQuestion();

  if (!question) return null;

  // Use image options for name-to-image
  if (question.type === "nameToImage") {
    return <ImageAnswerOptions />;
  }

  // Use text options for other types
  return <TextAnswerOptions />;
}
