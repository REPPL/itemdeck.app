/**
 * Hook for shuffling cards.
 *
 * Provides shuffled cards based on settings and
 * a manual re-shuffle function.
 */

import { useMemo, useState, useCallback } from "react";
import { shuffle } from "@/utils/shuffle";
import type { DisplayCard } from "./useCollection";

interface UseShuffledCardsOptions {
  /** Whether shuffle is enabled */
  enabled?: boolean;

  /** Whether to shuffle on initial load */
  shuffleOnLoad?: boolean;
}

interface UseShuffledCardsResult {
  /** Cards in their current order */
  cards: DisplayCard[];

  /** Whether cards are currently shuffled */
  isShuffled: boolean;

  /** Trigger a new shuffle */
  reshuffle: () => void;

  /** Toggle shuffle on/off */
  toggleShuffle: () => void;
}

/**
 * Hook for managing shuffled card order.
 *
 * @param sourceCards - Original cards from data source
 * @param options - Shuffle options
 * @returns Shuffled cards and control functions
 *
 * @example
 * ```tsx
 * const { cards, isShuffled, reshuffle } = useShuffledCards(data.cards, {
 *   enabled: true,
 *   shuffleOnLoad: true,
 * });
 * ```
 */
export function useShuffledCards(
  sourceCards: DisplayCard[],
  options: UseShuffledCardsOptions = {}
): UseShuffledCardsResult {
  const { enabled = true, shuffleOnLoad = true } = options;

  const [isShuffled, setIsShuffled] = useState(enabled && shuffleOnLoad);
  const [shuffleKey, setShuffleKey] = useState(0);

  // Shuffle cards when enabled or shuffle key changes
  const cards = useMemo(() => {
    if (!isShuffled) {
      return sourceCards;
    }
    // Include shuffleKey in dependency to trigger re-shuffle
    return shuffle(sourceCards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceCards, isShuffled, shuffleKey]);

  const reshuffle = useCallback(() => {
    if (isShuffled) {
      setShuffleKey((k) => k + 1);
    }
  }, [isShuffled]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev);
    if (!isShuffled) {
      // Trigger a new shuffle when enabling
      setShuffleKey((k) => k + 1);
    }
  }, [isShuffled]);

  return {
    cards,
    isShuffled,
    reshuffle,
    toggleShuffle,
  };
}
