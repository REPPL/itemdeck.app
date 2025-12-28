/**
 * Snap Ranking mechanic components.
 */

import { useEffect, useCallback } from "react";
import { useSnapRankingStore } from "./store";
import { useCollectionData } from "@/context/CollectionDataContext";
import { resolveFieldPath } from "@/utils/fieldPathResolver";
import { TIER_ORDER, TIER_INFO, type TierRating } from "./types";
import type { CardOverlayProps, GridOverlayProps } from "../types";
import styles from "./SnapRanking.module.css";

/**
 * Format milliseconds as MM:SS.
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes)}:${String(remainingSeconds).padStart(2, "0")}`;
}

/**
 * Card overlay component - shows rating badge on rated cards.
 */
export function SnapRankingCardOverlay({ cardId }: CardOverlayProps) {
  const ratings = useSnapRankingStore((s) => s.ratings);
  const currentCardId = useSnapRankingStore((s) => s.getCurrentCardId());
  const isActive = useSnapRankingStore((s) => s.isActive);

  const rating = ratings.find((r) => r.cardId === cardId);
  const isCurrent = cardId === currentCardId;

  if (!isActive) return null;

  if (isCurrent) {
    return (
      <div className={styles.cardOverlay}>
        <div className={styles.currentCard} />
      </div>
    );
  }

  if (rating) {
    const tierInfo = TIER_INFO[rating.tier];
    return (
      <div className={styles.cardOverlay}>
        <span
          className={styles.ratedBadge}
          style={{ color: tierInfo.colour }}
        >
          {rating.tier}
        </span>
      </div>
    );
  }

  return null;
}

/**
 * Rating buttons component.
 */
function RatingButtons() {
  const rateCard = useSnapRankingStore((s) => s.rateCard);
  const isActive = useSnapRankingStore((s) => s.isActive);
  const isComplete = useSnapRankingStore((s) => s.isGameComplete());

  const handleRate = useCallback((tier: TierRating) => {
    rateCard(tier);
  }, [rateCard]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive || isComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (TIER_ORDER.includes(key as TierRating)) {
        e.preventDefault();
        handleRate(key as TierRating);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [isActive, isComplete, handleRate]);

  if (!isActive || isComplete) return null;

  return (
    <div className={styles.ratingOverlay}>
      <div className={styles.ratingButtons}>
        {TIER_ORDER.map((tier) => {
          const info = TIER_INFO[tier];
          return (
            <button
              key={tier}
              type="button"
              className={`${styles.tierButton} ${styles[`tier${tier}`]}`}
              onClick={() => { handleRate(tier); }}
              aria-label={`Rate ${info.label}`}
            >
              <span className={styles.tierLabel}>{tier}</span>
              <span className={styles.tierShortcut}>({info.shortcut})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Stats bar component.
 */
function StatsBar() {
  const progress = useSnapRankingStore((s) => s.getProgress());
  const showTimer = useSnapRankingStore((s) => s.showTimer);
  const getTotalTime = useSnapRankingStore((s) => s.getTotalTime);
  const isActive = useSnapRankingStore((s) => s.isActive);
  const isComplete = useSnapRankingStore((s) => s.isGameComplete());

  // Force re-render for timer
  useEffect(() => {
    if (!isActive || isComplete || !showTimer) return;
    const interval = setInterval(() => {
      // Force re-render
    }, 1000);
    return () => { clearInterval(interval); };
  }, [isActive, isComplete, showTimer]);

  if (!isActive) return null;

  const progressPercent = progress.total > 0
    ? (progress.current / progress.total) * 100
    : 0;

  return (
    <div className={styles.statsBar}>
      <div className={styles.statsItem}>
        <span className={styles.statsLabel}>Progress</span>
        <span className={styles.statsValue}>
          {progress.current} / {progress.total}
        </span>
      </div>

      <div className={styles.progressContainer}>
        <div
          className={styles.progressBar}
          style={{ width: `${String(progressPercent)}%` }}
        />
      </div>

      {showTimer && (
        <div className={styles.statsItem}>
          <span className={styles.statsLabel}>Time</span>
          <span className={`${styles.statsValue} ${styles.timer}`}>
            {formatTime(getTotalTime())}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Results modal component.
 */
function ResultsModal() {
  const isActive = useSnapRankingStore((s) => s.isActive);
  const isComplete = useSnapRankingStore((s) => s.isGameComplete());
  const getRatingsByTier = useSnapRankingStore((s) => s.getRatingsByTier);
  const getAverageRatingTime = useSnapRankingStore((s) => s.getAverageRatingTime);
  const getTotalTime = useSnapRankingStore((s) => s.getTotalTime);
  const resetGame = useSnapRankingStore((s) => s.resetGame);
  const ratings = useSnapRankingStore((s) => s.ratings);

  const { cards } = useCollectionData();

  if (!isActive || !isComplete) return null;

  const ratingsByTier = getRatingsByTier();
  const avgTime = getAverageRatingTime();
  const totalTime = getTotalTime();

  // Get card titles for display
  const getCardTitle = (cardId: string): string => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return cardId;
    const title = resolveFieldPath(card as unknown as Record<string, unknown>, "title");
    return typeof title === "string" ? title : cardId;
  };

  // Copy results to clipboard
  const copyResults = async () => {
    const lines: string[] = ["# Snap Ranking Results", ""];

    for (const tier of TIER_ORDER) {
      const tierCards = ratingsByTier[tier];
      if (tierCards.length > 0) {
        lines.push(`## ${tier} Tier`);
        for (const cardId of tierCards) {
          lines.push(`- ${getCardTitle(cardId)}`);
        }
        lines.push("");
      }
    }

    lines.push(`---`);
    lines.push(`Total: ${String(ratings.length)} cards`);
    lines.push(`Time: ${formatTime(totalTime)}`);
    lines.push(`Avg: ${formatTime(avgTime)}/card`);

    await navigator.clipboard.writeText(lines.join("\n"));
  };

  return (
    <div className={styles.resultsOverlay}>
      <div className={styles.resultsModal}>
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>Ranking Complete!</h2>
          <div className={styles.resultsStats}>
            <span>{ratings.length} cards rated</span>
            <span>{formatTime(totalTime)} total</span>
            <span>{formatTime(avgTime)}/card avg</span>
          </div>
        </div>

        <div className={styles.tierList}>
          {TIER_ORDER.map((tier) => {
            const tierCards = ratingsByTier[tier];
            const info = TIER_INFO[tier];
            return (
              <div key={tier} className={styles.tierRow}>
                <div
                  className={styles.tierRowLabel}
                  style={{
                    color: info.colour,
                    backgroundColor: info.bgColour,
                  }}
                >
                  {tier}
                </div>
                <div className={styles.tierRowCards}>
                  {tierCards.map((cardId) => (
                    <span key={cardId} className={styles.tierCard}>
                      {getCardTitle(cardId)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.resultsActions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={() => { void copyResults(); }}
          >
            Copy Results
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.secondaryButton}`}
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid overlay component.
 */
export function SnapRankingGridOverlay({ position }: GridOverlayProps) {
  if (position === "top") {
    return <StatsBar />;
  }

  return (
    <>
      <RatingButtons />
      <ResultsModal />
    </>
  );
}
