/**
 * Competing (Top Trumps) mechanic.
 *
 * A card-versus-card stat comparison game where players compete
 * against a CPU opponent by selecting stats to compare.
 */

import { useCompetingStore } from "./store";
import { CompetingGridOverlay } from "./components";
import { CompetingSettingsPanel } from "./Settings";
import { DEFAULT_SETTINGS } from "./types";
import type { Mechanic, CardActions } from "../types";
import type { CompetingSettings } from "./types";

/**
 * Competing (Top Trumps) icon - crossed swords.
 */
function CompetingIcon({ className }: { className?: string }) {
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
      {/* Two crossed swords representing battle */}
      <path d="M4 20L20 4" />
      <path d="M4 4L20 20" />
      <path d="M6 2L2 6" />
      <path d="M18 2L22 6" />
      <path d="M6 22L2 18" />
      <path d="M18 22L22 18" />
      {/* Center VS circle */}
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Competing mechanic implementation.
 */
export const competingMechanic: Mechanic<CompetingSettings> = {
  manifest: {
    id: "competing",
    name: "Top Trumps",
    description:
      "Battle card vs card! Compare stats against a CPU opponent to win all the cards.",
    icon: CompetingIcon,
    version: "1.0.0",
    minCards: 4,
  },

  lifecycle: {
    onActivate: () => {
      useCompetingStore.getState().activate();
    },
    onDeactivate: () => {
      useCompetingStore.getState().deactivate();
    },
    onReset: () => {
      useCompetingStore.getState().resetGame();
    },
  },

  getState: () => useCompetingStore.getState(),

  subscribe: (listener) => {
    return useCompetingStore.subscribe((state) => {
      listener(state);
    });
  },

  getCardActions: (): CardActions => ({
    // Cards are displayed via the battle overlay, no direct grid interaction
    canInteract: () => false,
  }),

  // No card overlay needed - battle uses full grid overlay
  CardOverlay: undefined,
  GridOverlay: CompetingGridOverlay,
  Settings: CompetingSettingsPanel,

  defaultSettings: DEFAULT_SETTINGS,

  getSettings: (): CompetingSettings => {
    const state = useCompetingStore.getState();
    return {
      difficulty: state.difficulty,
      roundLimit: state.roundLimit,
      showCpuThinking: state.showCpuThinking,
      autoAdvance: state.autoAdvance,
    };
  },

  setSettings: (settings) => {
    const store = useCompetingStore.getState();
    if (settings.difficulty !== undefined) {
      store.setDifficulty(settings.difficulty);
    }
    if (settings.roundLimit !== undefined) {
      store.setRoundLimit(settings.roundLimit);
    }
    if (settings.showCpuThinking !== undefined) {
      store.setShowCpuThinking(settings.showCpuThinking);
    }
    if (settings.autoAdvance !== undefined) {
      store.setAutoAdvance(settings.autoAdvance);
    }
  },
};

export { useCompetingStore };
