/**
 * Tests for Competing mechanic components.
 *
 * Covers the round result overlay's advance behaviour: the "Auto-Advance
 * Rounds" setting must gate the 2 second timer, while manual dismissal
 * (click or key press) must keep working regardless of the setting.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import { CompetingGridOverlay } from "@/mechanics/competing/components";
import { useCompetingStore } from "@/mechanics/competing/store";
import type { NumericFieldInfo } from "@/mechanics/competing/types";

// Mechanic components read collection data from context; the round result
// overlay does not use it, so a minimal stub keeps the test focused.
vi.mock("@/context/CollectionDataContext", () => ({
  useCollectionData: () => ({
    cards: [],
    isLoading: false,
    error: null,
  }),
}));

// Exit/play-again handlers require a MechanicProvider; stub the context hook.
vi.mock("@/mechanics/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/mechanics/context")>();
  return {
    ...actual,
    useMechanicContext: () => ({
      deactivateMechanic: () => undefined,
      openMechanicPanel: () => undefined,
    }),
  };
});

const sampleFields: NumericFieldInfo[] = [
  { key: "attack", label: "Attack", min: 50, max: 100, higherIsBetter: true },
  { key: "defence", label: "Defence", min: 30, max: 90, higherIsBetter: true },
];

const sampleCardData = {
  card1: { id: "card1", title: "Hero A", attack: 80, defence: 60 },
  card2: { id: "card2", title: "Hero B", attack: 70, defence: 75 },
  card3: { id: "card3", title: "Hero C", attack: 90, defence: 50 },
  card4: { id: "card4", title: "Hero D", attack: 65, defence: 85 },
};

/**
 * Seed the store at the end of a round the player has won, ready for the
 * round result overlay to advance.
 */
function seedRoundEnd(autoAdvance: boolean): void {
  useCompetingStore.setState({
    isActive: true,
    phase: "round_end",
    difficulty: "medium",
    roundLimit: 0,
    showCpuThinking: true,
    autoAdvance,
    playerDeck: ["card3"],
    cpuDeck: ["card4"],
    tiePile: [],
    currentRound: 1,
    currentTurn: "player",
    playerCard: "card1",
    cpuCard: "card2",
    selectedStat: "attack",
    roundResult: {
      winner: "player",
      playerValue: 80,
      cpuValue: 70,
      stat: "attack",
      cardsWon: 2,
    },
    roundsWon: { player: 1, cpu: 0 },
    cardsWon: { player: 2, cpu: 0 },
    gameStartedAt: 0,
    gameEndedAt: null,
    numericFields: sampleFields,
    cardData: sampleCardData,
    playerSelectionHistory: ["attack"],
    errorMessage: null,
  });
}

describe("RoundResultOverlay auto-advance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should not advance the round on the timer when auto-advance is disabled", () => {
    seedRoundEnd(false);

    render(<CompetingGridOverlay position="bottom" />);
    expect(screen.getByText("You Win!")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const state = useCompetingStore.getState();
    expect(state.phase).toBe("round_end");
    expect(state.currentRound).toBe(1);
  });

  it("should advance the round on the timer when auto-advance is enabled", () => {
    seedRoundEnd(true);

    render(<CompetingGridOverlay position="bottom" />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const state = useCompetingStore.getState();
    expect(state.phase).toBe("player_select");
    expect(state.currentRound).toBe(2);
  });

  it("should still advance on click when auto-advance is disabled", () => {
    seedRoundEnd(false);

    render(<CompetingGridOverlay position="bottom" />);

    act(() => {
      fireEvent.click(screen.getByText("You Win!"));
    });

    const state = useCompetingStore.getState();
    expect(state.phase).toBe("player_select");
    expect(state.currentRound).toBe(2);
  });

  it("should still advance on key press when auto-advance is disabled", () => {
    seedRoundEnd(false);

    render(<CompetingGridOverlay position="bottom" />);

    act(() => {
      fireEvent.keyDown(window, { key: "a" });
    });

    const state = useCompetingStore.getState();
    expect(state.phase).toBe("player_select");
    expect(state.currentRound).toBe(2);
  });
});
