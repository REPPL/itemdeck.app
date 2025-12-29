/**
 * Quiz mechanic.
 *
 * A knowledge-testing game with auto-generated questions from collection data.
 */

import { useQuizStore } from "./store";
import { QuizOverlay } from "./components";
import { QuizSettingsPanel } from "./Settings";
import { DEFAULT_SETTINGS } from "./types";
import type { Mechanic, GridOverlayProps } from "../types";
import type { QuizSettings } from "./types";

/**
 * Quiz icon.
 */
function QuizIcon({ className }: { className?: string }) {
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
      {/* Brain/lightbulb quiz icon */}
      <circle cx="12" cy="8" r="6" />
      <path d="M12 14v4" />
      <path d="M10 18h4" />
      <path d="M9 6l1.5 2" />
      <path d="M15 6l-1.5 2" />
      <path d="M12 6v2" />
    </svg>
  );
}

/**
 * Quiz grid overlay - renders the quiz UI.
 */
function QuizGridOverlay({ position }: GridOverlayProps) {
  // Only render on bottom position
  if (position === "top") return null;

  return <QuizOverlay />;
}

/**
 * Quiz mechanic implementation.
 */
export const quizMechanic: Mechanic<QuizSettings> = {
  manifest: {
    id: "quiz",
    name: "Knowledge Quiz",
    description: "Test your knowledge! Answer questions about cards in the collection with multiple choice answers.",
    icon: QuizIcon,
    version: "1.0.0",
    minCards: 4,
    displayPreferences: {
      cardSizePreset: "medium",
      uiMode: "overlay",
    },
  },

  lifecycle: {
    onActivate: () => {
      useQuizStore.getState().activate();
    },
    onDeactivate: () => {
      useQuizStore.getState().deactivate();
    },
    onReset: () => {
      useQuizStore.getState().resetQuiz();
    },
  },

  getState: () => useQuizStore.getState(),

  subscribe: (listener) => {
    return useQuizStore.subscribe((state) => {
      listener(state);
    });
  },

  getCardActions: () => ({
    // Quiz doesn't use card interactions - it uses its own overlay
    onClick: undefined,
    canInteract: () => false,
    isHighlighted: () => false,
  }),

  // No card overlay needed - quiz uses full-screen overlay
  CardOverlay: undefined,
  GridOverlay: QuizGridOverlay,
  Settings: QuizSettingsPanel,

  defaultSettings: DEFAULT_SETTINGS,

  getSettings: () => {
    const state = useQuizStore.getState();
    return {
      questionCount: state.questionCount,
      enabledQuestionTypes: state.enabledQuestionTypes,
      timerMode: state.timerMode,
      difficulty: state.difficulty,
    };
  },

  setSettings: (settings) => {
    const store = useQuizStore.getState();
    if (settings.questionCount !== undefined) {
      store.setQuestionCount(settings.questionCount);
    }
    if (settings.enabledQuestionTypes !== undefined) {
      store.setEnabledQuestionTypes(settings.enabledQuestionTypes);
    }
    if (settings.timerMode !== undefined) {
      store.setTimerMode(settings.timerMode);
    }
    if (settings.difficulty !== undefined) {
      store.setDifficulty(settings.difficulty);
    }
  },
};

export { useQuizStore };
