/**
 * Snap Ranking mechanic.
 *
 * Rate cards instantly with quick tier decisions (S/A/B/C/D/F).
 * No going back - your first instinct is final!
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
      {/* Tier list bars */}
      <rect x="3" y="3" width="18" height="4" rx="1" />
      <rect x="3" y="9" width="14" height="4" rx="1" />
      <rect x="3" y="15" width="10" height="4" rx="1" />
      {/* Star for S-tier */}
      <path d="M19 12l1.5 3 3-1-1 3 2.5 2-3 0.5-0.5 3-2-2.5-2.5 1.5 0.5-3-2.5-2 3-0.5z" />
    </svg>
  );
}

/**
 * Snap Ranking mechanic implementation.
 */
export const snapRankingMechanic: Mechanic<SnapRankingSettings> = {
  manifest: {
    id: "snap-ranking",
    name: "Snap Ranking",
    description: "Rate cards instantly with quick tier decisions. Build a tier list by rating each card S/A/B/C/D/F as it appears.",
    icon: SnapRankingIcon,
    version: "1.0.0",
    minCards: 5,
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
    // Snap Ranking doesn't use card clicks - uses rating buttons instead
    onClick: undefined,
    canInteract: (cardId) => {
      const state = useSnapRankingStore.getState();
      return state.isActive && state.getCurrentCardId() === cardId;
    },
    isHighlighted: (cardId) => {
      const state = useSnapRankingStore.getState();
      // Show all cards face-up, highlight current
      return state.isActive || state.ratings.some((r) => r.cardId === cardId);
    },
  }),

  CardOverlay: SnapRankingCardOverlay,
  GridOverlay: SnapRankingGridOverlay,
  Settings: SnapRankingSettingsPanel,

  defaultSettings: DEFAULT_SETTINGS,

  getSettings: () => {
    const state = useSnapRankingStore.getState();
    return {
      confirmRating: state.confirmRating,
      autoAdvance: state.autoAdvance,
      showTimer: state.showTimer,
    };
  },

  setSettings: (settings) => {
    const store = useSnapRankingStore.getState();
    if (settings.confirmRating !== undefined) {
      store.setConfirmRating(settings.confirmRating);
    }
    if (settings.autoAdvance !== undefined) {
      store.setAutoAdvance(settings.autoAdvance);
    }
    if (settings.showTimer !== undefined) {
      store.setShowTimer(settings.showTimer);
    }
  },
};

export { useSnapRankingStore };
