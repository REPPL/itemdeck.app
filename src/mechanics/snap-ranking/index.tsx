/**
 * Snap Ranking mechanic.
 *
 * A field value guessing game where players guess the value of a hidden
 * field for each card.
 */

import { useSnapRankingStore } from "./store";
import { SnapRankingCardOverlay, SnapRankingGridOverlay } from "./components";
import { SnapRankingSettingsPanel } from "./Settings";
import { DEFAULT_SETTINGS } from "./types";
import type { Mechanic, CardActions } from "../types";
import type { SnapRankingSettings } from "./types";

/**
 * Snap Ranking icon.
 */
function SnapRankingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Question mark in circle for guessing game */}
      <circle cx="12" cy="12" r="10" />
      <path d="M9 9a3 3 0 1 1 3 3v2" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Snap Ranking mechanic implementation.
 */
export const snapRankingMechanic: Mechanic<SnapRankingSettings> = {
  manifest: {
    id: "snap-ranking",
    name: "Guess the Value",
    description: "Test your knowledge! Cards appear face-down - flip and guess the value of the badge field.",
    icon: SnapRankingIcon,
    version: "2.0.0",
    minCards: 2,
    displayPreferences: {
      cardSizePreset: "small",
      layout: "grid",
      uiMode: "inline",
    },
  },

  lifecycle: {
    onActivate: () => {
      useSnapRankingStore.getState().activate();
    },
    onDeactivate: () => {
      useSnapRankingStore.getState().deactivate();
    },
    onReset: () => {
      useSnapRankingStore.getState().resetGame();
    },
  },

  getState: () => useSnapRankingStore.getState(),

  subscribe: (listener) => {
    return useSnapRankingStore.subscribe((state) => {
      listener(state);
    });
  },

  getCardActions: (): CardActions => ({
    // Guessing game uses overlay for card interaction
    onClick: (cardId) => {
      const state = useSnapRankingStore.getState();
      // Only flip current card if it's not already flipped
      if (state.isActive && state.getCurrentCardId() === cardId && !state.isCurrentCardFlipped) {
        state.flipCurrentCard();
      }
    },
    canInteract: (cardId) => {
      const state = useSnapRankingStore.getState();
      return state.isActive && state.getCurrentCardId() === cardId;
    },
    isHighlighted: (cardId) => {
      const state = useSnapRankingStore.getState();
      // Highlight guessed cards and current card
      return state.isActive && (
        state.guesses.some((g) => g.cardId === cardId) ||
        state.getCurrentCardId() === cardId
      );
    },
  }),

  CardOverlay: SnapRankingCardOverlay,
  GridOverlay: SnapRankingGridOverlay,
  Settings: SnapRankingSettingsPanel,

  defaultSettings: DEFAULT_SETTINGS,

  getSettings: () => {
    const state = useSnapRankingStore.getState();
    return {
      showTimer: state.showTimer,
      cardCount: state.cardCount,
    };
  },

  setSettings: (settings) => {
    const store = useSnapRankingStore.getState();
    if (settings.showTimer !== undefined) {
      store.setShowTimer(settings.showTimer);
    }
    if (settings.cardCount !== undefined) {
      store.setCardCount(settings.cardCount);
    }
  },
};

export { useSnapRankingStore };
