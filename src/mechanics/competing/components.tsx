/**
 * Competing (Top Trumps) mechanic components.
 *
 * Battle overlay UI for card-versus-card stat comparison.
 */

import { useEffect, useCallback, useState } from "react";
import { useCompetingStore } from "./store";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useMechanicContext } from "../context";
import { detectNumericFields, getCardValue } from "./utils";
import { humaniseFieldName } from "./utils/numericFields";
import type { GridOverlayProps } from "../types";
import type { NumericFieldInfo, GamePhase, Difficulty } from "./types";
import styles from "./Competing.module.css";

/**
 * Format time as MM:SS.
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes)}:${String(remainingSeconds).padStart(2, "0")}`;
}

/**
 * Get image URL from card data.
 */
function getCardImage(card: Record<string, unknown>): string {
  // Try common image field names
  const imageFields = ["imageUrl", "image", "img", "thumbnail", "picture", "photo"];
  for (const field of imageFields) {
    const value = card[field];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    // Handle array of images
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return value[0];
    }
  }
  // Return placeholder
  return "";
}

/**
 * Get title from card data.
 */
function getCardTitle(card: Record<string, unknown>): string {
  const titleFields = ["title", "name", "label", "heading"];
  for (const field of titleFields) {
    const value = card[field];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  // Fallback to ID
  const id = card.id;
  return typeof id === "string" ? id : "Unknown";
}

/**
 * Check if CPU card should show the back (hidden).
 * Returns true for Hard difficulty, false for Easy/Medium (which show the front).
 */
function shouldShowCpuCardBack(difficulty: Difficulty): boolean {
  return difficulty === "hard";
}

/**
 * App logo icon for card back.
 */
function CardBackLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      className={styles.cardBackLogo}
    >
      <g opacity="0.9">
        <rect x="18" y="12" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.4"/>
        <rect x="24" y="18" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.6"/>
        <rect x="30" y="24" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="3"/>
        <path d="M55 44 L65 59 L55 74 L45 59 Z" fill="currentColor" opacity="0.8"/>
      </g>
    </svg>
  );
}

/**
 * Battle card component.
 */
function BattleCard({
  cardId,
  side,
  numericFields,
  selectedStat,
  phase,
  roundResult,
  difficulty,
  onSelectStat,
  onConfirmCpuSelection,
}: {
  cardId: string | null;
  side: "player" | "cpu";
  numericFields: NumericFieldInfo[];
  selectedStat: string | null;
  phase: GamePhase;
  roundResult: { winner: "player" | "cpu" | "tie"; stat: string } | null;
  difficulty: Difficulty;
  onSelectStat?: (fieldKey: string) => void;
  onConfirmCpuSelection?: () => void;
}) {
  const cardData = useCompetingStore((s) => (cardId ? s.cardData[cardId] : null));
  const showCpuThinking = useCompetingStore((s) => s.showCpuThinking);

  // Track if the CPU card has been flipped (revealed)
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card changes or round starts
  useEffect(() => {
    if (side === "cpu") {
      // Reset flip when phase changes to player_select or cpu_select (new round)
      if (phase === "player_select" || phase === "cpu_select") {
        setIsFlipped(false);
      }
      // Flip the card when revealing (after confirmation or for Easy/Medium)
      if (phase === "reveal" || phase === "collecting" || phase === "round_end" || phase === "game_over") {
        setIsFlipped(true);
      }
    }
  }, [side, phase]);

  if (!cardId || !cardData) {
    return (
      <div className={`${styles.battleCard ?? ""} ${styles[side] ?? ""}`}>
        <div className={styles.cardHeader}>{side === "player" ? "You" : "CPU"}</div>
        <div className={styles.cardImage} />
        <div className={styles.cardTitle}>No card</div>
      </div>
    );
  }

  const imageUrl = getCardImage(cardData);
  const title = getCardTitle(cardData);
  const isPlayer = side === "player";
  const canSelect = isPlayer && phase === "player_select";
  const isCpuThinking = side === "cpu" && phase === "cpu_select" && showCpuThinking;
  const isCpuReveal = phase === "cpu_reveal";

  // Determine if CPU card should show its back
  const isCpu = side === "cpu";
  const showBack = isCpu && shouldShowCpuCardBack(difficulty) && !isFlipped;

  // Show stats when:
  // - It's the player's card (always)
  // - It's CPU's card and difficulty is Easy/Medium (always show front)
  // - It's CPU's card and it's been revealed (flipped)
  const showStats = isPlayer || !shouldShowCpuCardBack(difficulty) || isFlipped;

  // Determine win/lose state
  let cardState = "";
  if (roundResult && (phase === "reveal" || phase === "collecting" || phase === "round_end")) {
    if (roundResult.winner === side) {
      cardState = styles.winner ?? "";
    } else if (roundResult.winner !== "tie") {
      cardState = styles.loser ?? "";
    }
  }

  // Build card classes
  const cardClasses = [
    styles.battleCard ?? "",
    styles[side] ?? "",
    cardState,
    showBack ? styles.showingBack ?? "" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cardClasses}>
      <div className={styles.cardHeader}>{isPlayer ? "You" : "CPU"}</div>

      {/* Card face - shows image or back pattern */}
      {showBack ? (
        <div className={styles.cardBack}>
          <CardBackLogo />
        </div>
      ) : imageUrl ? (
        <img className={styles.cardImage} src={imageUrl} alt={title} />
      ) : (
        <div className={styles.cardImage} />
      )}

      <div className={styles.cardTitle}>{showBack ? "Hidden" : title}</div>

      <div className={styles.statsList}>
        {isCpuThinking ? (
          <div className={styles.thinkingIndicator}>
            <span>Thinking</span>
            <div className={styles.thinkingDots}>
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
              <span className={styles.thinkingDot} />
            </div>
          </div>
        ) : (
          numericFields.map((field) => {
            const value = getCardValue(cardData, field.key);
            const isSelected = selectedStat === field.key;

            // Determine stat styling
            let statClass = "";
            if (roundResult && roundResult.stat === field.key) {
              // This is the field that was compared
              const winner = roundResult.winner;
              if (winner === side) {
                statClass = styles.winner ?? "";
              } else if (winner !== "tie") {
                statClass = styles.loser ?? "";
              }
            } else if (isSelected) {
              statClass = styles.selected ?? "";
            }

            // Indicator showing which direction wins
            const directionIndicator = field.higherIsBetter ? "↑" : "↓";

            // Player selecting stat
            if (isPlayer && canSelect && onSelectStat) {
              return (
                <button
                  key={field.key}
                  type="button"
                  className={`${styles.statButton ?? ""} ${statClass}`}
                  onClick={() => { onSelectStat(field.key); }}
                  disabled={!canSelect}
                >
                  <span className={styles.statLabel}>
                    {field.label}
                    <span className={styles.directionIndicator}>{directionIndicator}</span>
                  </span>
                  <span className={styles.statValue}>
                    {value !== null ? String(value) : "-"}
                  </span>
                </button>
              );
            }

            // CPU reveal phase - make the selected stat clickable to confirm
            // Only show the selected stat as clickable, hide other values
            if (isCpuReveal && isCpu && shouldShowCpuCardBack(difficulty)) {
              if (isSelected && onConfirmCpuSelection) {
                return (
                  <button
                    key={field.key}
                    type="button"
                    className={`${styles.statButton ?? ""} ${styles.cpuSelected ?? ""}`}
                    onClick={onConfirmCpuSelection}
                  >
                    <span className={styles.statLabel}>
                      {field.label}
                      <span className={styles.directionIndicator}>{directionIndicator}</span>
                    </span>
                    <span className={styles.statValue}>???</span>
                  </button>
                );
              }
              // Non-selected stats during CPU reveal - hide values
              return (
                <div key={field.key} className={styles.statHidden}>
                  <span className={styles.statLabel}>
                    {field.label}
                    <span className={styles.directionIndicator}>{directionIndicator}</span>
                  </span>
                  <span className={styles.statValue}>???</span>
                </div>
              );
            }

            // CPU reveal for Easy/Medium - show value for selected stat
            if (isCpuReveal && isCpu && !shouldShowCpuCardBack(difficulty)) {
              if (isSelected && onConfirmCpuSelection) {
                return (
                  <button
                    key={field.key}
                    type="button"
                    className={`${styles.statButton ?? ""} ${styles.cpuSelected ?? ""}`}
                    onClick={onConfirmCpuSelection}
                  >
                    <span className={styles.statLabel}>
                      {field.label}
                      <span className={styles.directionIndicator}>{directionIndicator}</span>
                    </span>
                    <span className={styles.statValue}>
                      {value !== null ? String(value) : "-"}
                    </span>
                  </button>
                );
              }
            }

            if (showStats) {
              return (
                <div
                  key={field.key}
                  className={`${styles.statHidden ?? ""} ${statClass}`}
                >
                  <span className={styles.statLabel}>
                    {field.label}
                    <span className={styles.directionIndicator}>{directionIndicator}</span>
                  </span>
                  <span className={styles.statValue}>
                    {value !== null ? String(value) : "-"}
                  </span>
                </div>
              );
            }

            return (
              <div key={field.key} className={styles.statHidden}>
                <span className={styles.statLabel}>
                  {field.label}
                  <span className={styles.directionIndicator}>{directionIndicator}</span>
                </span>
                <span className={styles.statValue}>???</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Round result overlay component.
 * Shows feedback as a temporary full-screen overlay that auto-dismisses.
 */
function RoundResultOverlay() {
  const roundResult = useCompetingStore((s) => s.roundResult);
  const phase = useCompetingStore((s) => s.phase);
  const numericFields = useCompetingStore((s) => s.numericFields);
  const nextRound = useCompetingStore((s) => s.nextRound);

  const handleDismiss = useCallback(() => {
    if (phase === "round_end") {
      nextRound();
    }
  }, [phase, nextRound]);

  // Auto-dismiss after delay when in round_end phase
  useEffect(() => {
    if (phase !== "round_end") return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, 2000);

    return () => { clearTimeout(timer); };
  }, [phase, handleDismiss]);

  // Keyboard dismiss (any key)
  useEffect(() => {
    if (phase !== "round_end") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      handleDismiss();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [phase, handleDismiss]);

  // Only show during round_end phase (after cards are collected)
  // Previously showed during reveal/collecting which caused perceived "duplicate" overlay
  if (!roundResult || phase !== "round_end") {
    return null;
  }

  const field = numericFields.find((f) => f.key === roundResult.stat);
  const statLabel = field?.label ?? humaniseFieldName(roundResult.stat);

  let resultClass = "";
  let resultText = "";
  let resultIcon = "";
  if (roundResult.winner === "player") {
    resultClass = styles.playerWin ?? "";
    resultText = "You Win!";
    resultIcon = "✓";
  } else if (roundResult.winner === "cpu") {
    resultClass = styles.cpuWin ?? "";
    resultText = "CPU Wins!";
    resultIcon = "✗";
  } else {
    resultClass = styles.tie ?? "";
    resultText = "It's a Tie!";
    resultIcon = "⚖";
  }

  return (
    <div
      className={styles.roundResultOverlay}
      onClick={handleDismiss}
    >
      <div className={`${styles.roundResultContent ?? ""} ${resultClass}`}>
        <div className={styles.resultIcon}>{resultIcon}</div>
        <div className={styles.resultText}>{resultText}</div>
        <div className={styles.resultComparison}>
          {statLabel}: {roundResult.playerValue} vs {roundResult.cpuValue}
        </div>
        {roundResult.cardsWon > 0 && (
          <div className={styles.cardsWonText}>
            {roundResult.winner === "player" ? "You" : "CPU"} won {roundResult.cardsWon} cards!
          </div>
        )}
        <div className={styles.resultHint}>Click or press any key to continue</div>
      </div>
    </div>
  );
}

/**
 * Tie pile indicator.
 */
function TiePileIndicator() {
  const tiePile = useCompetingStore((s) => s.tiePile);

  if (tiePile.length === 0) {
    return null;
  }

  return (
    <div className={styles.tiePile}>
      <span>Tie Pile:</span>
      <span>{tiePile.length} cards</span>
    </div>
  );
}

/**
 * Action prompt component.
 */
function ActionPrompt() {
  const phase = useCompetingStore((s) => s.phase);
  const currentTurn = useCompetingStore((s) => s.currentTurn);

  if (phase === "player_select" && currentTurn === "player") {
    return (
      <div className={styles.actionPrompt}>
        Select a stat to compare!
      </div>
    );
  }

  if (phase === "cpu_select" && currentTurn === "cpu") {
    return (
      <div className={styles.actionPrompt}>
        CPU is choosing a stat...
      </div>
    );
  }

  if (phase === "cpu_reveal") {
    return (
      <div className={styles.actionPrompt}>
        <span className={styles.cpuSelectedPrompt}>
          CPU chose a stat! Tap the highlighted stat to compare.
        </span>
      </div>
    );
  }

  return null;
}

/**
 * Game over modal.
 */
function GameOverModal() {
  const phase = useCompetingStore((s) => s.phase);
  const getWinner = useCompetingStore((s) => s.getWinner);
  const roundsWon = useCompetingStore((s) => s.roundsWon);
  const currentRound = useCompetingStore((s) => s.currentRound);
  const gameStartedAt = useCompetingStore((s) => s.gameStartedAt);
  const gameEndedAt = useCompetingStore((s) => s.gameEndedAt);
  const resetGame = useCompetingStore((s) => s.resetGame);

  const { deactivateMechanic } = useMechanicContext();

  const handlePlayAgain = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const handleExit = useCallback(() => {
    deactivateMechanic();
  }, [deactivateMechanic]);

  if (phase !== "game_over") {
    return null;
  }

  const winner = getWinner();
  const totalRounds = currentRound - 1; // -1 because currentRound increments before game over
  const totalTime = gameEndedAt && gameStartedAt ? gameEndedAt - gameStartedAt : 0;

  let titleClass = "";
  let titleText = "";
  if (winner === "player") {
    titleClass = styles.playerWin ?? "";
    titleText = "Victory!";
  } else if (winner === "cpu") {
    titleClass = styles.cpuWin ?? "";
    titleText = "Defeat";
  } else {
    titleClass = styles.draw ?? "";
    titleText = "Draw";
  }

  return (
    <div className={styles.gameOverOverlay}>
      <div className={styles.gameOverModal}>
        <h2 className={`${styles.gameOverTitle ?? ""} ${titleClass}`}>{titleText}</h2>

        <div className={styles.gameOverStats}>
          <div className={styles.statBlock}>
            <span className={styles.statBlockValue}>{roundsWon.player}</span>
            <span className={styles.statBlockLabel}>Your Wins</span>
          </div>
          <div className={styles.statBlock}>
            <span className={styles.statBlockValue}>{roundsWon.cpu}</span>
            <span className={styles.statBlockLabel}>CPU Wins</span>
          </div>
        </div>

        <div className={styles.gameOverDetails}>
          <span>Rounds played: {totalRounds}</span>
          <span>Time: {formatTime(totalTime)}</span>
        </div>

        <div className={styles.gameOverActions}>
          <button
            type="button"
            className={`${styles.gameOverButton ?? ""} ${styles.exitButton ?? ""}`}
            onClick={handleExit}
          >
            Exit
          </button>
          <button
            type="button"
            className={`${styles.gameOverButton ?? ""} ${styles.playAgainButton ?? ""}`}
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Error overlay component.
 */
function ErrorOverlay() {
  const errorMessage = useCompetingStore((s) => s.errorMessage);
  const isActive = useCompetingStore((s) => s.isActive);
  const { deactivateMechanic } = useMechanicContext();

  const handleExit = useCallback(() => {
    deactivateMechanic();
  }, [deactivateMechanic]);

  if (!errorMessage || !isActive) {
    return null;
  }

  return (
    <div className={styles.errorOverlay}>
      <div className={styles.errorModal}>
        <h2 className={styles.errorTitle}>Cannot Play</h2>
        <p className={styles.errorMessage}>{errorMessage}</p>
        <p className={styles.errorHint}>
          This game requires cards with numeric fields for stat comparison.
        </p>
        <button
          type="button"
          className={styles.errorExitButton}
          onClick={handleExit}
        >
          Exit
        </button>
      </div>
    </div>
  );
}

/**
 * Main battle overlay component.
 */
function BattleOverlayContent() {
  const isActive = useCompetingStore((s) => s.isActive);
  const phase = useCompetingStore((s) => s.phase);
  const currentRound = useCompetingStore((s) => s.currentRound);
  const playerCard = useCompetingStore((s) => s.playerCard);
  const cpuCard = useCompetingStore((s) => s.cpuCard);
  const playerDeck = useCompetingStore((s) => s.playerDeck);
  const cpuDeck = useCompetingStore((s) => s.cpuDeck);
  const numericFields = useCompetingStore((s) => s.numericFields);
  const selectedStat = useCompetingStore((s) => s.selectedStat);
  const roundResult = useCompetingStore((s) => s.roundResult);
  const selectStat = useCompetingStore((s) => s.selectStat);
  const confirmCpuSelection = useCompetingStore((s) => s.confirmCpuSelection);
  const errorMessage = useCompetingStore((s) => s.errorMessage);
  const difficulty = useCompetingStore((s) => s.difficulty);

  if (!isActive) {
    return null;
  }

  if (errorMessage) {
    return <ErrorOverlay />;
  }

  // Calculate card counts
  const playerCardCount = playerDeck.length + (playerCard ? 1 : 0);
  const cpuCardCount = cpuDeck.length + (cpuCard ? 1 : 0);

  return (
    <div className={styles.battleOverlay}>
      <div className={styles.battleHeader}>
        <div className={styles.roundInfo}>Round {currentRound}</div>
        <div className={styles.cardCounts}>
          <span className={styles.playerCount}>You: {playerCardCount}</span>
          <span className={styles.cpuCount}>CPU: {cpuCardCount}</span>
        </div>
      </div>

      <div className={styles.battleArena}>
        <div className={styles.cardsContainer}>
          <BattleCard
            cardId={playerCard}
            side="player"
            numericFields={numericFields}
            selectedStat={selectedStat}
            phase={phase}
            roundResult={roundResult}
            difficulty={difficulty}
            onSelectStat={selectStat}
            onConfirmCpuSelection={confirmCpuSelection}
          />

          <div className={styles.vsIndicator}>VS</div>

          <BattleCard
            cardId={cpuCard}
            side="cpu"
            numericFields={numericFields}
            selectedStat={selectedStat}
            phase={phase}
            roundResult={roundResult}
            difficulty={difficulty}
            onConfirmCpuSelection={confirmCpuSelection}
          />
        </div>

        <TiePileIndicator />
      </div>

      <ActionPrompt />
      <RoundResultOverlay />
      <GameOverModal />
    </div>
  );
}

/**
 * Grid overlay component - entry point for the mechanic.
 */
export function CompetingGridOverlay({ position }: GridOverlayProps) {
  const { cards } = useCollectionData();
  const isActive = useCompetingStore((s) => s.isActive);
  const phase = useCompetingStore((s) => s.phase);
  const initGame = useCompetingStore((s) => s.initGame);
  const cpuSelectStat = useCompetingStore((s) => s.cpuSelectStat);
  const currentTurn = useCompetingStore((s) => s.currentTurn);

  // Initialise game when activated
  useEffect(() => {
    if (!isActive || phase !== "setup") return;
    if (!cards || cards.length === 0) return;

    // Detect numeric fields
    const numericFields = detectNumericFields(
      cards as unknown as Record<string, unknown>[]
    );

    // Initialise game with detected fields
    initGame({
      cards: cards as unknown as Record<string, unknown>[],
      idField: "id",
      numericFields,
    });
  }, [isActive, phase, cards, initGame]);

  // Trigger CPU selection when it's CPU's turn
  useEffect(() => {
    if (isActive && phase === "cpu_select" && currentTurn === "cpu") {
      // Small delay to allow UI to update
      const timeout = setTimeout(() => {
        cpuSelectStat();
      }, 500);
      return () => { clearTimeout(timeout); };
    }
    return undefined;
  }, [isActive, phase, currentTurn, cpuSelectStat]);

  // Only render at bottom position
  if (position !== "bottom") {
    return null;
  }

  return <BattleOverlayContent />;
}
