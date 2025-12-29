/**
 * Snap Ranking mechanic components.
 *
 * A field value guessing game where players guess the value of a hidden
 * field for each card. Uses shared components for timer, error, and results.
 */

import { useEffect, useCallback } from "react";
import { useSnapRankingStore } from "./store";
import { useCollectionData } from "@/context/CollectionDataContext";
import { FloatingTimer, ErrorOverlay, GameCompletionModal } from "../shared";
import { useMechanicActions, useGameTimer, formatTime } from "../shared";
import { resolveFieldPath } from "@/utils/fieldPathResolver";
import { getGuessFeedback } from "./types";
import type { GuessValue } from "./types";
import type { CardOverlayProps, GridOverlayProps } from "../types";
import styles from "./SnapRanking.module.css";

/**
 * Card overlay component - shows current card indicator and guess results.
 */
export function SnapRankingCardOverlay({ cardId }: CardOverlayProps) {
  const guesses = useSnapRankingStore((s) => s.guesses);
  const cardIds = useSnapRankingStore((s) => s.cardIds);
  const currentIndex = useSnapRankingStore((s) => s.currentIndex);
  const isActive = useSnapRankingStore((s) => s.isActive);
  const isCurrentCardFlipped = useSnapRankingStore((s) => s.isCurrentCardFlipped);
  const flipCurrentCard = useSnapRankingStore((s) => s.flipCurrentCard);
  const valueType = useSnapRankingStore((s) => s.valueType);
  const uniqueValues = useSnapRankingStore((s) => s.uniqueValues);

  // Find if this card has been guessed
  const guess = guesses.find((g) => g.cardId === cardId);

  // Check if this is the current card
  const currentCardId = isActive && currentIndex < cardIds.length
    ? cardIds[currentIndex]
    : null;
  const isCurrent = cardId === currentCardId;

  // Handle click to flip
  const handleClick = useCallback(() => {
    if (isCurrent && !isCurrentCardFlipped) {
      flipCurrentCard();
    }
  }, [isCurrent, isCurrentCardFlipped, flipCurrentCard]);

  if (!isActive) return null;

  // Show guess result for already-guessed cards
  if (guess) {
    const feedback = getGuessFeedback(
      guess.guess,
      guess.actualValue,
      valueType,
      uniqueValues
    );
    return (
      <div className={styles.cardOverlay}>
        <span
          className={[styles.guessBadge, styles[feedback.type]].filter(Boolean).join(" ")}
        >
          {String(guess.actualValue)}
        </span>
      </div>
    );
  }

  // Show "click to reveal" for current unflipped card
  if (isCurrent && !isCurrentCardFlipped) {
    return (
      <div
        className={[styles.cardOverlay, styles.clickable].filter(Boolean).join(" ")}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className={styles.revealPrompt}>
          <span className={styles.revealIcon}>?</span>
          <span className={styles.revealText}>Click to guess</span>
        </div>
      </div>
    );
  }

  // Show current card indicator when flipped
  if (isCurrent && isCurrentCardFlipped) {
    return (
      <div className={styles.cardOverlay}>
        <div className={styles.currentCard} />
      </div>
    );
  }

  return null;
}

/**
 * Guess buttons component - dynamically generated from unique values.
 */
function GuessButtons() {
  const uniqueValues = useSnapRankingStore((s) => s.uniqueValues);
  const submitGuess = useSnapRankingStore((s) => s.submitGuess);
  const isActive = useSnapRankingStore((s) => s.isActive);
  const isCurrentCardFlipped = useSnapRankingStore((s) => s.isCurrentCardFlipped);
  const cardIds = useSnapRankingStore((s) => s.cardIds);
  const currentIndex = useSnapRankingStore((s) => s.currentIndex);
  const guessField = useSnapRankingStore((s) => s.guessField);

  // Check if game is complete
  const isComplete = currentIndex >= cardIds.length && cardIds.length > 0;

  const handleGuess = useCallback((value: GuessValue) => {
    submitGuess(value);
  }, [submitGuess]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive || !isCurrentCardFlipped || isComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9 for first 9 values
      if (e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key, 10) - 1;
        const value = uniqueValues[index];
        if (value !== undefined) {
          e.preventDefault();
          handleGuess(value);
        }
        return;
      }

      // 0 key for 10th value
      if (e.key === "0" && uniqueValues.length >= 10) {
        const value = uniqueValues[9];
        if (value !== undefined) {
          e.preventDefault();
          handleGuess(value);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [isActive, isCurrentCardFlipped, isComplete, uniqueValues, handleGuess]);

  if (!isActive || !isCurrentCardFlipped || isComplete) return null;

  // Determine button layout based on count
  const buttonCount = uniqueValues.length;
  const layoutClass = buttonCount <= 4
    ? styles.layoutRow
    : buttonCount <= 8
      ? styles.layoutTwoRows
      : buttonCount <= 12
        ? styles.layoutGrid
        : styles.layoutScrollable;

  return (
    <div className={styles.guessOverlay}>
      <div className={styles.guessHeader}>
        <span className={styles.guessPrompt}>Guess the {guessField}:</span>
      </div>
      <div className={[styles.guessButtons, layoutClass].filter(Boolean).join(" ")}>
        {uniqueValues.map((value, i) => {
          const shortcut = i < 9 ? String(i + 1) : i === 9 ? "0" : null;
          return (
            <button
              key={String(value)}
              type="button"
              className={styles.guessButton}
              onClick={() => { handleGuess(value); }}
              aria-label={`Guess ${String(value)}`}
            >
              <span className={styles.guessValue}>{String(value)}</span>
              {shortcut && (
                <span className={styles.guessShortcut}>({shortcut})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Snap Ranking floating timer using shared component.
 */
function SnapRankingFloatingTimer() {
  const showTimer = useSnapRankingStore((s) => s.showTimer);
  const isActive = useSnapRankingStore((s) => s.isActive);
  const cardIds = useSnapRankingStore((s) => s.cardIds);
  const currentIndex = useSnapRankingStore((s) => s.currentIndex);
  const gameStartedAt = useSnapRankingStore((s) => s.gameStartedAt);
  const getTotalTime = useSnapRankingStore((s) => s.getTotalTime);

  const isComplete = currentIndex >= cardIds.length && cardIds.length > 0;
  const isActivePlay = isActive && gameStartedAt > 0 && !isComplete;

  // Use shared timer hook for consistent updates
  const { elapsedMs } = useGameTimer({
    isRunning: isActivePlay && showTimer,
    startTime: gameStartedAt > 0 ? gameStartedAt : null,
    endTime: isComplete ? getTotalTime() + gameStartedAt : null,
  });

  if (!isActivePlay || !showTimer) return null;

  return (
    <FloatingTimer
      timeMs={elapsedMs}
      progressLabel={`${String(currentIndex)}/${String(cardIds.length)}`}
      visible={true}
    />
  );
}

/**
 * Results modal component using shared GameCompletionModal.
 */
function ResultsModal() {
  const isActive = useSnapRankingStore((s) => s.isActive);
  const cardIds = useSnapRankingStore((s) => s.cardIds);
  const currentIndex = useSnapRankingStore((s) => s.currentIndex);
  const getTotalScore = useSnapRankingStore((s) => s.getTotalScore);
  const getMaxPossibleScore = useSnapRankingStore((s) => s.getMaxPossibleScore);
  const getScoreBreakdown = useSnapRankingStore((s) => s.getScoreBreakdown);
  const getAverageGuessTime = useSnapRankingStore((s) => s.getAverageGuessTime);
  const getTotalTime = useSnapRankingStore((s) => s.getTotalTime);
  const guesses = useSnapRankingStore((s) => s.guesses);
  const valueType = useSnapRankingStore((s) => s.valueType);
  const uniqueValues = useSnapRankingStore((s) => s.uniqueValues);

  const { cards } = useCollectionData();
  const { handleExit, handlePlayAgain } = useMechanicActions();

  const isComplete = currentIndex >= cardIds.length && cardIds.length > 0;

  if (!isActive || !isComplete) return null;

  const totalScore = getTotalScore();
  const maxScore = getMaxPossibleScore();
  const breakdown = getScoreBreakdown();
  const avgTime = getAverageGuessTime();
  const totalTime = getTotalTime();
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Get card titles for display
  const getCardTitle = (cardId: string): string => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return cardId;
    const title = resolveFieldPath(card as unknown as Record<string, unknown>, "title");
    return typeof title === "string" ? title : cardId;
  };

  return (
    <GameCompletionModal
      isOpen={isComplete}
      title="Game Complete!"
      subtitle={`${String(totalScore)}/${String(maxScore)} (${String(percentage)}%)`}
      stats={[
        { label: "Cards", value: guesses.length },
        { label: "Total Time", value: formatTime(totalTime) },
        { label: "Avg/Card", value: formatTime(avgTime) },
      ]}
      primaryAction={{ label: "Play Again", onClick: handlePlayAgain }}
      onExit={handleExit}
    >
      {/* Breakdown section */}
      <div className={styles.breakdownSection}>
        <h3 className={styles.breakdownTitle}>Breakdown</h3>
        <div className={styles.breakdownGrid}>
          <div className={[styles.breakdownItem, styles.correct].filter(Boolean).join(" ")}>
            <span className={styles.breakdownCount}>{breakdown.exact}</span>
            <span className={styles.breakdownLabel}>Exact</span>
          </div>
          {valueType === "numeric" && (
            <div className={[styles.breakdownItem, styles.close].filter(Boolean).join(" ")}>
              <span className={styles.breakdownCount}>{breakdown.close}</span>
              <span className={styles.breakdownLabel}>Close</span>
            </div>
          )}
          <div className={[styles.breakdownItem, styles.wrong].filter(Boolean).join(" ")}>
            <span className={styles.breakdownCount}>{breakdown.wrong}</span>
            <span className={styles.breakdownLabel}>Wrong</span>
          </div>
        </div>
      </div>

      {/* Guess list */}
      <div className={styles.guessList}>
        {guesses.map((guess) => {
          const title = getCardTitle(guess.cardId);
          const feedback = getGuessFeedback(
            guess.guess,
            guess.actualValue,
            valueType,
            uniqueValues
          );
          return (
            <div
              key={guess.cardId}
              className={[styles.guessItem, styles[feedback.type]].filter(Boolean).join(" ")}
            >
              <span className={styles.guessItemTitle}>{title}</span>
              <span className={styles.guessItemResult}>
                {String(guess.guess)} → {String(guess.actualValue)}
              </span>
              <span className={styles.guessItemScore}>+{guess.score}</span>
            </div>
          );
        })}
      </div>
    </GameCompletionModal>
  );
}

/**
 * Snap Ranking error overlay using shared component.
 */
function SnapRankingErrorOverlay() {
  const errorMessage = useSnapRankingStore((s) => s.errorMessage);
  const isActive = useSnapRankingStore((s) => s.isActive);
  const { handleExit } = useMechanicActions();

  return (
    <ErrorOverlay
      title="Cannot Play"
      message={errorMessage ?? ""}
      hint="Configure a Top Badge field in Settings to play this game."
      onExit={handleExit}
      visible={!!errorMessage && isActive}
    />
  );
}

/**
 * Grid overlay component.
 */
export function SnapRankingGridOverlay({ position }: GridOverlayProps) {
  const errorMessage = useSnapRankingStore((s) => s.errorMessage);

  if (position === "top") {
    return <SnapRankingFloatingTimer />;
  }

  // Show error overlay if there's an error
  if (errorMessage) {
    return <SnapRankingErrorOverlay />;
  }

  return (
    <>
      <GuessButtons />
      <ResultsModal />
    </>
  );
}
