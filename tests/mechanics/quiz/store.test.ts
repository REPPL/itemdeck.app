/**
 * Quiz store answer placement and results scoring.
 *
 * The answer order shown to the player is derived from the question ID so it
 * stays stable across re-renders, and the results screen compares the player's
 * score against the best score that run could have produced.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useQuizStore } from "@/mechanics/quiz/store";
import type { Answer, Question } from "@/mechanics/quiz/types";
import { generateQuestionId } from "@/mechanics/quiz/generators/utils";

/** Build a question whose four options are identifiable by label. */
function questionWithId(id: string): Question {
  const answer = (label: string): Answer => ({ id: `a-${label}`, label });
  return {
    id,
    type: "imageToName",
    prompt: "Which card is this?",
    correctAnswer: answer("correct"),
    wrongAnswers: [answer("wrong1"), answer("wrong2"), answer("wrong3")],
    relatedCardId: "card-1",
  };
}

/**
 * Question IDs as the generator really produces them: a millisecond timestamp
 * plus seven base-36 characters.
 */
function realisticQuestionIds(count: number): string[] {
  const ids: string[] = [];
  const base = Date.UTC(2026, 0, 1);
  for (let i = 0; i < count; i++) {
    // Space the timestamps over a few hours, as separate quiz runs would be.
    vi.setSystemTime(base + i * 6151);
    ids.push(generateQuestionId());
  }
  return ids;
}

/** Place a single question in front of an active quiz. */
function showQuestion(question: Question): void {
  useQuizStore.setState({
    isActive: true,
    questions: [question],
    currentIndex: 0,
  });
}

describe("getShuffledAnswers", () => {
  beforeEach(() => {
    useQuizStore.getState().deactivate();
  });

  afterEach(() => {
    vi.useRealTimers();
    useQuizStore.getState().deactivate();
  });

  it("spreads the correct answer evenly across the four positions", () => {
    vi.useFakeTimers();
    const ids = realisticQuestionIds(2000);
    vi.useRealTimers();

    const positionCounts = [0, 0, 0, 0];
    for (const id of ids) {
      showQuestion(questionWithId(id));
      const shuffled = useQuizStore.getState().getShuffledAnswers();
      const position = shuffled.findIndex((a) => a.label === "correct");
      expect(position).toBeGreaterThanOrEqual(0);
      positionCounts[position] = (positionCounts[position] ?? 0) + 1;
    }

    for (const count of positionCounts) {
      const share = count / ids.length;
      expect(share).toBeGreaterThan(0.15);
      expect(share).toBeLessThan(0.35);
    }
  });

  it("reaches every ordering of the four options", () => {
    vi.useFakeTimers();
    const ids = realisticQuestionIds(2000);
    vi.useRealTimers();

    const orderings = new Set<string>();
    for (const id of ids) {
      showQuestion(questionWithId(id));
      orderings.add(
        useQuizStore
          .getState()
          .getShuffledAnswers()
          .map((a) => a.label)
          .join(",")
      );
    }

    expect(orderings.size).toBe(24);
  });

  it("keeps the same order for a question across re-renders", () => {
    const question = questionWithId("q-1767225600000-abc1234");
    showQuestion(question);

    const first = useQuizStore.getState().getShuffledAnswers();
    const second = useQuizStore.getState().getShuffledAnswers();

    expect(second.map((a) => a.id)).toEqual(first.map((a) => a.id));

    // A fresh store instance for the same question ID must agree too.
    useQuizStore.getState().deactivate();
    showQuestion(questionWithId(question.id));
    expect(
      useQuizStore
        .getState()
        .getShuffledAnswers()
        .map((a) => a.id)
    ).toEqual(first.map((a) => a.id));
  });

  it("returns every option exactly once", () => {
    showQuestion(questionWithId("q-1767225600000-zzz0000"));
    const labels = useQuizStore
      .getState()
      .getShuffledAnswers()
      .map((a) => a.label)
      .sort();

    expect(labels).toEqual(["correct", "wrong1", "wrong2", "wrong3"]);
  });

  it("returns nothing when no question is showing", () => {
    expect(useQuizStore.getState().getShuffledAnswers()).toEqual([]);
  });
});

describe("getResults", () => {
  beforeEach(() => {
    useQuizStore.getState().deactivate();
  });

  afterEach(() => {
    vi.useRealTimers();
    useQuizStore.getState().deactivate();
  });

  /** Answer every question correctly, as fast as the scoring allows. */
  function playFlawlessRun(questionCount: number, timerMode: boolean): void {
    const questions = Array.from({ length: questionCount }, (_, i) =>
      questionWithId(`q-1767225600000-run${String(i).padStart(4, "0")}`)
    );

    useQuizStore.setState({
      isActive: true,
      timerMode,
      questions,
      currentIndex: 0,
      answers: [],
      score: 0,
      streak: 0,
      maxStreak: 0,
      quizStartedAt: Date.now(),
      quizEndedAt: null,
      questionStartedAt: Date.now(),
      feedbackVisible: false,
    });

    for (let i = 0; i < questionCount; i++) {
      const question = useQuizStore.getState().getCurrentQuestion();
      expect(question).not.toBeNull();
      useQuizStore.getState().submitAnswer(question?.correctAnswer.id ?? "");
      useQuizStore.getState().nextQuestion();
    }
  }

  for (const timerMode of [false, true]) {
    for (const questionCount of [5, 10, 15, 20]) {
      it(`scores a flawless ${String(questionCount)}-question run at 100% (timer ${
        timerMode ? "on" : "off"
      })`, () => {
        vi.useFakeTimers();
        vi.setSystemTime(Date.UTC(2026, 0, 1));

        playFlawlessRun(questionCount, timerMode);

        const results = useQuizStore.getState().getResults();
        expect(results.correctCount).toBe(questionCount);
        expect(results.totalScore).toBe(results.maxScore);
        expect(results.percentage).toBe(100);
      });
    }
  }

  it("keeps an imperfect run below 100%", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 0, 1));

    playFlawlessRun(10, false);
    // Replace the last answer with a miss.
    const answers = [...useQuizStore.getState().answers];
    const last = answers[answers.length - 1];
    if (last) {
      answers[answers.length - 1] = {
        ...last,
        isCorrect: false,
        pointsEarned: 0,
      };
    }
    useQuizStore.setState({ answers });

    const results = useQuizStore.getState().getResults();
    expect(results.percentage).toBeLessThan(100);
    expect(results.percentage).toBeGreaterThan(0);
  });

  it("reports zero rather than dividing by an empty quiz", () => {
    const results = useQuizStore.getState().getResults();
    expect(results.maxScore).toBe(0);
    expect(results.percentage).toBe(0);
  });
});
