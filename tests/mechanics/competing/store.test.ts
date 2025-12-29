/**
 * Tests for Competing store.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCompetingStore } from "@/mechanics/competing/store";
import type { CompetingGameConfig, NumericFieldInfo } from "@/mechanics/competing/types";

// Mock setTimeout for testing auto-advance
vi.useFakeTimers();

describe("useCompetingStore", () => {
  const sampleFields: NumericFieldInfo[] = [
    { key: "attack", label: "Attack", min: 50, max: 100, higherIsBetter: true },
    { key: "defence", label: "Defence", min: 30, max: 90, higherIsBetter: true },
  ];

  const sampleCards = [
    { id: "card1", title: "Hero A", attack: 80, defence: 60 },
    { id: "card2", title: "Hero B", attack: 70, defence: 75 },
    { id: "card3", title: "Hero C", attack: 90, defence: 50 },
    { id: "card4", title: "Hero D", attack: 65, defence: 85 },
  ];

  const sampleConfig: CompetingGameConfig = {
    cards: sampleCards,
    idField: "id",
    numericFields: sampleFields,
  };

  beforeEach(() => {
    vi.clearAllTimers();
    // Reset store to initial state
    useCompetingStore.setState({
      isActive: false,
      phase: "setup",
      difficulty: "medium",
      roundLimit: 0,
      showCpuThinking: true,
      autoAdvance: true,
      playerDeck: [],
      cpuDeck: [],
      tiePile: [],
      currentRound: 0,
      currentTurn: "player",
      playerCard: null,
      cpuCard: null,
      selectedStat: null,
      roundResult: null,
      roundsWon: { player: 0, cpu: 0 },
      cardsWon: { player: 0, cpu: 0 },
      gameStartedAt: 0,
      gameEndedAt: null,
      numericFields: [],
      cardData: {},
      playerSelectionHistory: [],
      errorMessage: null,
    });
  });

  describe("lifecycle", () => {
    it("should activate", () => {
      const store = useCompetingStore.getState();
      store.activate();

      const state = useCompetingStore.getState();
      expect(state.isActive).toBe(true);
    });

    it("should deactivate", () => {
      const store = useCompetingStore.getState();
      store.activate();
      store.deactivate();

      const state = useCompetingStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.phase).toBe("setup");
    });
  });

  describe("initGame", () => {
    it("should initialise game with valid config", () => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame(sampleConfig);

      const state = useCompetingStore.getState();
      expect(state.phase).toBe("player_select");
      expect(state.currentRound).toBe(1);
      expect(state.playerCard).not.toBeNull();
      expect(state.cpuCard).not.toBeNull();
      expect(state.numericFields).toHaveLength(2);
    });

    it("should deal cards evenly between players", () => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame(sampleConfig);

      const state = useCompetingStore.getState();
      // 4 cards: 2 each deck, 1 each current card = 2 per side
      const playerTotal = state.playerDeck.length + (state.playerCard ? 1 : 0);
      const cpuTotal = state.cpuDeck.length + (state.cpuCard ? 1 : 0);

      expect(playerTotal).toBe(2);
      expect(cpuTotal).toBe(2);
    });

    it("should put odd card in tie pile", () => {
      const oddCards = [...sampleCards, { id: "card5", title: "Hero E", attack: 75, defence: 70 }];
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame({
        cards: oddCards,
        idField: "id",
        numericFields: sampleFields,
      });

      const state = useCompetingStore.getState();
      const totalCards = state.playerDeck.length + state.cpuDeck.length +
        (state.playerCard ? 1 : 0) + (state.cpuCard ? 1 : 0) + state.tiePile.length;

      expect(totalCards).toBe(5);
      expect(state.tiePile.length).toBe(1);
    });

    it("should set error when fewer than 4 cards", () => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame({
        cards: sampleCards.slice(0, 2),
        idField: "id",
        numericFields: sampleFields,
      });

      const state = useCompetingStore.getState();
      expect(state.errorMessage).toContain("4 cards");
    });

    it("should set error when no numeric fields", () => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame({
        cards: sampleCards,
        idField: "id",
        numericFields: [],
      });

      const state = useCompetingStore.getState();
      expect(state.errorMessage).toContain("numeric fields");
    });
  });

  describe("selectStat", () => {
    beforeEach(() => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame(sampleConfig);
    });

    it("should set selected stat and record history", () => {
      const store = useCompetingStore.getState();
      store.selectStat("attack");

      const state = useCompetingStore.getState();
      expect(state.selectedStat).toBe("attack");
      expect(state.playerSelectionHistory).toContain("attack");
    });

    it("should transition to reveal phase", () => {
      const store = useCompetingStore.getState();
      store.selectStat("attack");

      const state = useCompetingStore.getState();
      expect(state.phase).toBe("reveal");
    });

    it("should not select if not in player_select phase", () => {
      const store = useCompetingStore.getState();
      useCompetingStore.setState({ phase: "cpu_select" });

      store.selectStat("attack");

      const state = useCompetingStore.getState();
      expect(state.selectedStat).toBeNull();
    });
  });

  describe("revealAndCompare", () => {
    beforeEach(() => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame(sampleConfig);
    });

    it("should determine winner based on comparison", () => {
      const store = useCompetingStore.getState();

      // Manually set up a comparison scenario
      const state = useCompetingStore.getState();
      const playerCardData = state.cardData[state.playerCard!];
      const cpuCardData = state.cardData[state.cpuCard!];

      // Select stat and reveal
      useCompetingStore.setState({
        phase: "reveal",
        selectedStat: "attack",
      });

      store.revealAndCompare();

      const afterState = useCompetingStore.getState();
      expect(afterState.roundResult).not.toBeNull();
      expect(["player", "cpu", "tie"]).toContain(afterState.roundResult?.winner);
      expect(afterState.phase).toBe("collecting");
    });
  });

  describe("collectCards", () => {
    beforeEach(() => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame(sampleConfig);
    });

    it("should add cards to winner deck after player win", () => {
      const state = useCompetingStore.getState();
      const playerCard = state.playerCard!;
      const cpuCard = state.cpuCard!;

      useCompetingStore.setState({
        phase: "collecting",
        roundResult: {
          winner: "player",
          playerValue: 90,
          cpuValue: 60,
          stat: "attack",
          cardsWon: 2,
        },
      });

      const store = useCompetingStore.getState();
      store.collectCards();

      const afterState = useCompetingStore.getState();
      expect(afterState.roundsWon.player).toBe(1);
      expect(afterState.cardsWon.player).toBe(2);
      expect(afterState.phase).toBe("round_end");
    });

    it("should add cards to tie pile on tie", () => {
      const state = useCompetingStore.getState();

      useCompetingStore.setState({
        phase: "collecting",
        tiePile: [],
        roundResult: {
          winner: "tie",
          playerValue: 70,
          cpuValue: 70,
          stat: "attack",
          cardsWon: 0,
        },
      });

      const store = useCompetingStore.getState();
      store.collectCards();

      const afterState = useCompetingStore.getState();
      expect(afterState.tiePile.length).toBe(2);
      expect(afterState.roundsWon.player).toBe(0);
      expect(afterState.roundsWon.cpu).toBe(0);
    });
  });

  describe("nextRound", () => {
    beforeEach(() => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame(sampleConfig);
    });

    it("should draw new cards and advance round", () => {
      // Set up end of round
      useCompetingStore.setState({
        phase: "round_end",
        roundResult: {
          winner: "player",
          playerValue: 90,
          cpuValue: 60,
          stat: "attack",
          cardsWon: 2,
        },
        playerDeck: ["card3"],
        cpuDeck: ["card4"],
      });

      const store = useCompetingStore.getState();
      store.nextRound();

      const state = useCompetingStore.getState();
      expect(state.currentRound).toBe(2);
      expect(state.playerCard).not.toBeNull();
      expect(state.cpuCard).not.toBeNull();
      expect(state.selectedStat).toBeNull();
      expect(state.roundResult).toBeNull();
    });

    it("should end game when one player runs out of cards", () => {
      useCompetingStore.setState({
        phase: "round_end",
        roundResult: {
          winner: "player",
          playerValue: 90,
          cpuValue: 60,
          stat: "attack",
          cardsWon: 2,
        },
        playerDeck: [],
        cpuDeck: [],
      });

      const store = useCompetingStore.getState();
      store.nextRound();

      const state = useCompetingStore.getState();
      expect(state.phase).toBe("game_over");
      expect(state.gameEndedAt).not.toBeNull();
    });

    it("should end game when round limit reached", () => {
      useCompetingStore.setState({
        phase: "round_end",
        roundLimit: 10,
        currentRound: 10,
        roundResult: {
          winner: "player",
          playerValue: 90,
          cpuValue: 60,
          stat: "attack",
          cardsWon: 2,
        },
        playerDeck: ["card3"],
        cpuDeck: ["card4"],
      });

      const store = useCompetingStore.getState();
      store.nextRound();

      const state = useCompetingStore.getState();
      expect(state.phase).toBe("game_over");
    });

    it("should give turn to round winner", () => {
      useCompetingStore.setState({
        phase: "round_end",
        currentTurn: "player",
        roundResult: {
          winner: "cpu",
          playerValue: 60,
          cpuValue: 90,
          stat: "attack",
          cardsWon: 2,
        },
        playerDeck: ["card3"],
        cpuDeck: ["card4"],
      });

      const store = useCompetingStore.getState();
      store.nextRound();

      const state = useCompetingStore.getState();
      expect(state.currentTurn).toBe("cpu");
      expect(state.phase).toBe("cpu_select");
    });
  });

  describe("settings", () => {
    it("should update difficulty", () => {
      const store = useCompetingStore.getState();
      store.setDifficulty("hard");

      expect(useCompetingStore.getState().difficulty).toBe("hard");
    });

    it("should update round limit", () => {
      const store = useCompetingStore.getState();
      store.setRoundLimit(20);

      expect(useCompetingStore.getState().roundLimit).toBe(20);
    });

    it("should update showCpuThinking", () => {
      const store = useCompetingStore.getState();
      store.setShowCpuThinking(false);

      expect(useCompetingStore.getState().showCpuThinking).toBe(false);
    });

    it("should update autoAdvance", () => {
      const store = useCompetingStore.getState();
      store.setAutoAdvance(false);

      expect(useCompetingStore.getState().autoAdvance).toBe(false);
    });
  });

  describe("queries", () => {
    beforeEach(() => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame(sampleConfig);
    });

    it("should return null winner when game not over", () => {
      const winner = useCompetingStore.getState().getWinner();
      expect(winner).toBeNull();
    });

    it("should determine winner by card count", () => {
      useCompetingStore.setState({
        phase: "game_over",
        playerDeck: ["card1", "card2", "card3"],
        cpuDeck: ["card4"],
        playerCard: null,
        cpuCard: null,
      });

      const winner = useCompetingStore.getState().getWinner();
      expect(winner).toBe("player");
    });

    it("should determine winner by rounds won on tie", () => {
      useCompetingStore.setState({
        phase: "game_over",
        playerDeck: ["card1"],
        cpuDeck: ["card2"],
        playerCard: null,
        cpuCard: null,
        roundsWon: { player: 5, cpu: 3 },
      });

      const winner = useCompetingStore.getState().getWinner();
      expect(winner).toBe("player");
    });

    it("should return draw for equal cards and rounds", () => {
      useCompetingStore.setState({
        phase: "game_over",
        playerDeck: ["card1"],
        cpuDeck: ["card2"],
        playerCard: null,
        cpuCard: null,
        roundsWon: { player: 3, cpu: 3 },
      });

      const winner = useCompetingStore.getState().getWinner();
      expect(winner).toBe("draw");
    });

    it("should report game over correctly", () => {
      expect(useCompetingStore.getState().isGameOver()).toBe(false);

      useCompetingStore.setState({ phase: "game_over" });

      expect(useCompetingStore.getState().isGameOver()).toBe(true);
    });

    it("should get progress correctly", () => {
      const progress = useCompetingStore.getState().getProgress();

      expect(progress.round).toBe(1);
      expect(progress.playerCards).toBeGreaterThan(0);
      expect(progress.cpuCards).toBeGreaterThan(0);
    });
  });

  describe("resetGame", () => {
    it("should reset and shuffle for new game", () => {
      const store = useCompetingStore.getState();
      store.activate();
      store.initGame(sampleConfig);

      // Play a round
      store.selectStat("attack");
      vi.advanceTimersByTime(500);
      store.revealAndCompare();
      vi.advanceTimersByTime(1500);
      store.collectCards();
      vi.advanceTimersByTime(1000);

      // Reset
      store.resetGame();

      const state = useCompetingStore.getState();
      expect(state.currentRound).toBe(1);
      expect(state.phase).toBe("player_select");
      expect(state.roundsWon).toEqual({ player: 0, cpu: 0 });
      expect(state.cardsWon).toEqual({ player: 0, cpu: 0 });
      expect(state.playerSelectionHistory).toEqual([]);
    });
  });
});
