/**
 * Hook providing standard action handlers for game mechanics.
 *
 * Reduces duplication of exit/play again/choose different handlers
 * across all mechanics.
 */

import { useCallback } from "react";
import { useMechanicContext } from "../../context";

/**
 * Result type for useMechanicActions hook.
 */
export interface UseMechanicActionsResult {
  /** Deactivate current mechanic and return to grid view */
  handleExit: () => void;
  /** Deactivate current mechanic and open mechanic panel to play again */
  handlePlayAgain: () => void;
  /** Deactivate current mechanic and open mechanic panel to choose different game */
  handleChooseDifferent: () => void;
}

/**
 * Hook providing standard action handlers for game mechanics.
 *
 * @returns Object with handleExit, handlePlayAgain, and handleChooseDifferent functions
 *
 * @example
 * const { handleExit, handlePlayAgain } = useMechanicActions();
 *
 * <button onClick={handleExit}>Exit</button>
 * <button onClick={handlePlayAgain}>Play Again</button>
 */
export function useMechanicActions(): UseMechanicActionsResult {
  const { deactivateMechanic, openMechanicPanel } = useMechanicContext();

  const handleExit = useCallback(() => {
    deactivateMechanic();
  }, [deactivateMechanic]);

  const handlePlayAgain = useCallback(() => {
    // Go to config screen to let user adjust settings before playing again
    deactivateMechanic();
    openMechanicPanel();
  }, [deactivateMechanic, openMechanicPanel]);

  const handleChooseDifferent = useCallback(() => {
    deactivateMechanic();
    openMechanicPanel();
  }, [deactivateMechanic, openMechanicPanel]);

  return { handleExit, handlePlayAgain, handleChooseDifferent };
}
