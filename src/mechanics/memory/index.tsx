/**
 * Memory game mechanic.
 *
 * Match pairs of cards by flipping them.
 */

import { useMemoryStore } from "./store";
import { MemoryCardOverlay, MemoryGridOverlay } from "./components";
import type { Mechanic, CardActions } from "../types";

/**
 * Memory game icon.
 */
function MemoryIcon({ className }: { className?: string }) {
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
      <rect x="2" y="3" width="8" height="10" rx="1" />
      <rect x="14" y="3" width="8" height="10" rx="1" />
      <rect x="2" y="15" width="8" height="6" rx="1" />
      <rect x="14" y="15" width="8" height="6" rx="1" />
      <path d="M6 7v2" />
      <path d="M18 7v2" />
    </svg>
  );
}

/**
 * Memory game mechanic implementation.
 */
export const memoryMechanic: Mechanic = {
  manifest: {
    id: "memory",
    name: "Memory Game",
    description: "Match pairs of cards by flipping them to reveal their faces",
    icon: MemoryIcon,
    version: "1.0.0",
    minCards: 4,
  },

  lifecycle: {
    onActivate: () => {
      useMemoryStore.getState().activate();
    },
    onDeactivate: () => {
      useMemoryStore.getState().deactivate();
    },
    onReset: () => {
      useMemoryStore.getState().resetGame();
    },
  },

  getState: () => useMemoryStore.getState(),

  subscribe: (listener) => {
    return useMemoryStore.subscribe((state) => {
      listener(state);
    });
  },

  getCardActions: (): CardActions => ({
    onClick: (cardId) => {
      useMemoryStore.getState().flipCard(cardId);
    },
    canInteract: (cardId) => {
      const state = useMemoryStore.getState();
      return state.isActive && !state.isCardMatched(cardId);
    },
    isHighlighted: (cardId) => {
      const state = useMemoryStore.getState();
      return state.isCardFlipped(cardId) || state.isCardMatched(cardId);
    },
  }),

  CardOverlay: MemoryCardOverlay,
  GridOverlay: MemoryGridOverlay,
};

export { useMemoryStore };
