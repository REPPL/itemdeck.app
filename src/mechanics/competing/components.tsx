/**
 * Competing (Top Trumps) mechanic components.
 *
 * Battle overlay UI for card-versus-card stat comparison.
 * Uses shared components for error overlay and completion modal.
 */

import { useEffect, useCallback, useState } from "react";
import { useCompetingStore } from "./store";
import { useCollectionData } from "@/context/CollectionDataContext";
import { ErrorOverlay, GameCompletionModal } from "../shared";
import { useMechanicActions, formatTime } from "../shared";
import { detectNumericFields, getCardValue } from "./utils";
import { humaniseFieldName } from "./utils/numericFields";
import type { GridOverlayProps } from "../types";
import type { NumericFieldInfo, GamePhase, Difficulty } from "./types";
import styles from "./Competing.module.css";

/**
 * Get image URL from card data.
 */
function getCardImage(card: Record<string, unknown>): string {
  const imageFields = ["imageUrl", "image", "img", "thumbnail", "picture", "photo"];
  for (const field of imageFields) {
    const value = card[field];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return value[0];
    }
  }
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
  const id = card.id;
  return typeof id === "string" ? id : "Unknown";
}

/**
 * Check if CPU stats should be hidden.
 * Always true - CPU stats are always hidden until reveal.
 * Note: CPU image and title are always visible.
 */
function shouldHideCpuStats(_difficulty: Difficulty): boolean {
  return true;
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

  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (side === "cpu") {
      if (phase === "player_select" || phase === "cpu_select") {
        setIsFlipped(false);
      }
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
  const isCpu = side === "cpu";
  // CPU stats are hidden until reveal, but image and title are always shown
  const hideCpuStats = isCpu && shouldHideCpuStats(difficulty) && !isFlipped;
  // Player always sees their stats; CPU stats only visible after reveal
  const showStats = isPlayer || !hideCpuStats;
  // During CPU reveal phase, player clicks on THEIR card to confirm
  const canConfirmCpuSelection = isPlayer && isCpuReveal;

  let cardState = "";
  if (roundResult && (phase === "reveal" || phase === "collecting" || phase === "round_end")) {
    if (roundResult.winner === side) {
      cardState = styles.winner ?? "";
    } else if (roundResult.winner !== "tie") {
      cardState = styles.loser ?? "";
    }
  }

  const cardClasses = [
    styles.battleCard ?? "",
    styles[side] ?? "",
    cardState,
  ].filter(Boolean).join(" ");

  return (
    <div className={cardClasses}>
      <div className={styles.cardHeader}>{isPlayer ? "You" : "CPU"}</div>

      {/* Always show image and title for both player and CPU */}
      {imageUrl ? (
        <img className={styles.cardImage} src={imageUrl} alt={title} />
      ) : (
        <div className={styles.cardImage} />
      )}

      <div className={styles.cardTitle}>{title}</div>

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
            let statClass = "";
            if (roundResult && roundResult.stat === field.key) {
              const winner = roundResult.winner;
              if (winner === side) {
                statClass = styles.winner ?? "";
              } else if (winner !== "tie") {
                statClass = styles.loser ?? "";
              }
            } else if (isSelected) {
              statClass = styles.selected ?? "";
            }
            const directionIndicator = field.higherIsBetter ? "↑" : "↓";

            // Player's turn: player can select stats on their card
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

            // CPU's turn: player clicks the highlighted stat on THEIR card to confirm
            if (canConfirmCpuSelection && onConfirmCpuSelection) {
              const isCpuSelectedStat = isSelected;
              if (isCpuSelectedStat) {
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
              // Non-selected stats during CPU reveal - not clickable
              return (
                <div
                  key={field.key}
                  className={styles.statHidden ?? ""}
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

            // CPU card during CPU reveal: show hidden stats (???)
            if (isCpu && isCpuReveal) {
              return (
                <div key={field.key} className={`${styles.statHidden ?? ""} ${isSelected ? styles.cpuSelected ?? "" : ""}`}>
                  <span className={styles.statLabel}>
                    {field.label}
                    <span className={styles.directionIndicator}>{directionIndicator}</span>
                  </span>
                  <span className={styles.statValue}>???</span>
                </div>
              );
            }

            // Default: show stats if allowed
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

            // CPU card hidden stats
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

  useEffect(() => {
    if (phase !== "round_end") return;
    const timer = setTimeout(() => { handleDismiss(); }, 2000);
    return () => { clearTimeout(timer); };
  }, [phase, handleDismiss]);

  useEffect(() => {
    if (phase !== "round_end") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      handleDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [phase, handleDismiss]);

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
    <div className={styles.roundResultOverlay} onClick={handleDismiss}>
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
  if (tiePile.length === 0) return null;
  return (
    <div className={styles.tiePile}>
      <span>Tie Pile:</span>
      <span>{tiePile.length} cards</span>
    </div>
  );
}

/**
 * Action prompt component.
 * Always renders with fixed height to prevent layout shift.
 */
function ActionPrompt() {
  const phase = useCompetingStore((s) => s.phase);
  const currentTurn = useCompetingStore((s) => s.currentTurn);

  let content: React.ReactNode = "\u00A0"; // Non-breaking space for empty state

  if (phase === "player_select" && currentTurn === "player") {
    content = "Select a stat to compare!";
  } else if (phase === "cpu_select" && currentTurn === "cpu") {
    content = "CPU is choosing a stat...";
  } else if (phase === "cpu_reveal") {
    content = (
      <span className={styles.cpuSelectedPrompt}>
        CPU chose a stat! Tap the highlighted stat on YOUR card to compare.
      </span>
    );
  }

  return <div className={styles.actionPrompt}>{content}</div>;
}

/**
 * Game over modal using shared GameCompletionModal.
 */
function GameOverModal() {
  const phase = useCompetingStore((s) => s.phase);
  const getWinner = useCompetingStore((s) => s.getWinner);
  const roundsWon = useCompetingStore((s) => s.roundsWon);
  const currentRound = useCompetingStore((s) => s.currentRound);
  const gameStartedAt = useCompetingStore((s) => s.gameStartedAt);
  const gameEndedAt = useCompetingStore((s) => s.gameEndedAt);
  const resetGame = useCompetingStore((s) => s.resetGame);

  const { handleExit } = useMechanicActions();

  const handlePlayAgain = useCallback(() => {
    resetGame();
  }, [resetGame]);

  if (phase !== "game_over") return null;

  const winner = getWinner();
  const totalRounds = currentRound - 1;
  const totalTime = gameEndedAt && gameStartedAt ? gameEndedAt - gameStartedAt : 0;

  let title = "";
  if (winner === "player") {
    title = "Victory!";
  } else if (winner === "cpu") {
    title = "Defeat";
  } else {
    title = "Draw";
  }

  return (
    <GameCompletionModal
      isOpen={true}
      title={title}
      stats={[
        { label: "Your Wins", value: roundsWon.player },
        { label: "CPU Wins", value: roundsWon.cpu },
        { label: "Rounds", value: totalRounds },
        { label: "Time", value: formatTime(totalTime) },
      ]}
      primaryAction={{ label: "Play Again", onClick: handlePlayAgain }}
      onExit={handleExit}
    />
  );
}

/**
 * Competing error overlay using shared component.
 */
function CompetingErrorOverlay() {
  const errorMessage = useCompetingStore((s) => s.errorMessage);
  const isActive = useCompetingStore((s) => s.isActive);
  const { handleExit } = useMechanicActions();

  return (
    <ErrorOverlay
      title="Cannot Play"
      message={errorMessage ?? ""}
      hint="This game requires cards with numeric fields for stat comparison."
      onExit={handleExit}
      visible={!!errorMessage && isActive}
    />
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

  if (!isActive) return null;
  if (errorMessage) return <CompetingErrorOverlay />;

  // Calculate total card counts (deck + current card in play)
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

  useEffect(() => {
    if (!isActive || phase !== "setup") return;
    // Check for empty cards array
    if (cards.length === 0) return;

    const numericFields = detectNumericFields(
      cards as unknown as Record<string, unknown>[]
    );

    initGame({
      cards: cards as unknown as Record<string, unknown>[],
      idField: "id",
      numericFields,
    });
  }, [isActive, phase, cards, initGame]);

  useEffect(() => {
    if (isActive && phase === "cpu_select" && currentTurn === "cpu") {
      const timeout = setTimeout(() => { cpuSelectStat(); }, 500);
      return () => { clearTimeout(timeout); };
    }
    return undefined;
  }, [isActive, phase, currentTurn, cpuSelectStat]);

  if (position !== "bottom") return null;

  return <BattleOverlayContent />;
}
