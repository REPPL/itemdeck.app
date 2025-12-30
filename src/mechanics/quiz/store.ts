/**
 * Zustand store for Quiz mechanic.
 *
 * A knowledge-testing game with auto-generated questions from collection data.
 */

import { create } from "zustand";
import { generateQuestions, canGenerateQuiz } from "./generators";
import type { GeneratorCardData } from "./generators";
import type {
  Answer,
  Question,
  AnswerRecord,
  QuizResults,
  QuizState,
  QuizSettings,
  QuestionType,
  QuestionCountOption,
  QuizDifficulty,
} from "./types";
import { calculateScore, DEFAULT_SETTINGS, SCORING, DIFFICULTY_SETTINGS } from "./types";

/**
 * Extended store state with actions.
 */
interface QuizStore extends QuizState, QuizSettings {
  // Lifecycle
  activate: () => void;
  deactivate: () => void;
  resetQuiz: () => void;
  startQuiz: (cards: GeneratorCardData[]) => void;

  // Game actions
  submitAnswer: (answerId: string) => void;
  skipQuestion: () => void;
  nextQuestion: () => void;
  dismissFeedback: () => void;

  // Settings
  setQuestionCount: (count: QuestionCountOption) => void;
  setEnabledQuestionTypes: (types: QuestionType[]) => void;
  toggleQuestionType: (type: QuestionType) => void;
  setTimerMode: (enabled: boolean) => void;
  setDifficulty: (difficulty: QuizDifficulty) => void;

  // Computed
  getCurrentQuestion: () => Question | null;
  getProgress: () => { current: number; total: number };
  isQuizComplete: () => boolean;
  getResults: () => QuizResults;
  getShuffledAnswers: () => Answer[];
}

/**
 * Initial state.
 */
const INITIAL_STATE: QuizState = {
  isActive: false,

  // Configuration
  questionCount: DEFAULT_SETTINGS.questionCount,
  enabledQuestionTypes: [...DEFAULT_SETTINGS.enabledQuestionTypes],
  timerMode: DEFAULT_SETTINGS.timerMode,
  difficulty: DEFAULT_SETTINGS.difficulty,

  // Game state
  questions: [],
  currentIndex: 0,
  answers: [],
  score: 0,
  streak: 0,
  maxStreak: 0,

  // Timing
  quizStartedAt: 0,
  quizEndedAt: null,
  questionStartedAt: 0,

  // Feedback
  feedbackVisible: false,
  lastAnswerCorrect: null,
  lastCorrectAnswer: null,

  // Error
  errorMessage: null,
};

/**
 * Quiz store.
 */
export const useQuizStore = create<QuizStore>((set, get) => ({
  // Initial state
  ...INITIAL_STATE,

  // Lifecycle
  activate: () => {
    set({
      isActive: true,
    });
  },

  deactivate: () => {
    set({
      ...INITIAL_STATE,
      // Preserve settings
      questionCount: get().questionCount,
      enabledQuestionTypes: get().enabledQuestionTypes,
      timerMode: get().timerMode,
      difficulty: get().difficulty,
    });
  },

  resetQuiz: () => {
    set({
      questions: [],
      currentIndex: 0,
      answers: [],
      score: 0,
      streak: 0,
      maxStreak: 0,
      quizStartedAt: 0,
      quizEndedAt: null,
      questionStartedAt: 0,
      feedbackVisible: false,
      lastAnswerCorrect: null,
      lastCorrectAnswer: null,
      errorMessage: null,
    });
  },

  startQuiz: (cards: GeneratorCardData[]) => {
    const state = get();

    // Guard: Don't restart if quiz is already running
    if (state.questions.length > 0 && state.currentIndex < state.questions.length) {
      return;
    }

    // Check if quiz can be generated
    const check = canGenerateQuiz(cards, state.enabledQuestionTypes);
    if (!check.canGenerate) {
      set({
        errorMessage: check.reason ?? "Cannot generate quiz.",
        questions: [],
      });
      return;
    }

    // Get difficulty settings
    const difficultySettings = DIFFICULTY_SETTINGS[state.difficulty];

    // Generate questions with difficulty-based options
    const questions = generateQuestions(
      cards,
      state.questionCount,
      state.enabledQuestionTypes,
      {
        useSimilarDistractors: difficultySettings.useSimilarDistractors,
      }
    );

    if (questions.length === 0) {
      set({
        errorMessage: "Could not generate any questions from this collection.",
        questions: [],
      });
      return;
    }

    const now = Date.now();

    set({
      questions,
      currentIndex: 0,
      answers: [],
      score: 0,
      streak: 0,
      maxStreak: 0,
      quizStartedAt: now,
      quizEndedAt: null,
      questionStartedAt: now,
      feedbackVisible: false,
      lastAnswerCorrect: null,
      lastCorrectAnswer: null,
      errorMessage: null,
    });
  },

  // Game actions
  submitAnswer: (answerId: string) => {
    const state = get();
    if (!state.isActive || state.feedbackVisible) return;
    if (state.currentIndex >= state.questions.length) return;

    const question = state.questions[state.currentIndex];
    if (!question) return;

    const now = Date.now();
    const timeToAnswer = now - state.questionStartedAt;

    // Check if answer is correct (including alternative correct answers)
    const isCorrect = question.correctAnswer.id === answerId ||
      (question.alternativeCorrectIds?.includes(answerId) ?? false);

    // Calculate score
    const { score: pointsEarned, newStreak } = calculateScore(
      isCorrect,
      state.streak,
      timeToAnswer,
      state.timerMode
    );

    // Create answer record
    const answerRecord: AnswerRecord = {
      questionId: question.id,
      selectedAnswerId: answerId,
      isCorrect,
      timeToAnswer,
      pointsEarned,
    };

    // Update max streak
    const newMaxStreak = Math.max(state.maxStreak, newStreak);

    set({
      answers: [...state.answers, answerRecord],
      score: state.score + pointsEarned,
      streak: newStreak,
      maxStreak: newMaxStreak,
      feedbackVisible: true,
      lastAnswerCorrect: isCorrect,
      lastCorrectAnswer: question.correctAnswer,
    });
  },

  skipQuestion: () => {
    const state = get();
    if (!state.isActive || state.feedbackVisible) return;
    if (state.currentIndex >= state.questions.length) return;

    const question = state.questions[state.currentIndex];
    if (!question) return;

    const now = Date.now();
    const timeToAnswer = now - state.questionStartedAt;

    // Create answer record for skip
    const answerRecord: AnswerRecord = {
      questionId: question.id,
      selectedAnswerId: null,
      isCorrect: false,
      timeToAnswer,
      pointsEarned: 0,
    };

    set({
      answers: [...state.answers, answerRecord],
      streak: 0, // Reset streak on skip
      feedbackVisible: true,
      lastAnswerCorrect: false,
      lastCorrectAnswer: question.correctAnswer,
    });
  },

  nextQuestion: () => {
    const state = get();
    if (!state.isActive) return;

    const newIndex = state.currentIndex + 1;
    const isComplete = newIndex >= state.questions.length;

    set({
      currentIndex: newIndex,
      questionStartedAt: Date.now(),
      feedbackVisible: false,
      lastAnswerCorrect: null,
      lastCorrectAnswer: null,
      quizEndedAt: isComplete ? Date.now() : null,
    });
  },

  dismissFeedback: () => {
    // Auto-advance to next question
    get().nextQuestion();
  },

  // Settings
  setQuestionCount: (count: QuestionCountOption) => {
    set({ questionCount: count });
  },

  setEnabledQuestionTypes: (types: QuestionType[]) => {
    // Ensure at least one type is enabled
    if (types.length === 0) {
      return;
    }
    set({ enabledQuestionTypes: types });
  },

  toggleQuestionType: (type: QuestionType) => {
    const current = get().enabledQuestionTypes;
    const isEnabled = current.includes(type);

    if (isEnabled) {
      // Don't disable if it's the only one
      if (current.length === 1) {
        return;
      }
      set({ enabledQuestionTypes: current.filter((t) => t !== type) });
    } else {
      set({ enabledQuestionTypes: [...current, type] });
    }
  },

  setTimerMode: (enabled: boolean) => {
    set({ timerMode: enabled });
  },

  setDifficulty: (difficulty: QuizDifficulty) => {
    set({ difficulty });
  },

  // Computed
  getCurrentQuestion: () => {
    const { questions, currentIndex, isActive } = get();
    if (!isActive || currentIndex >= questions.length) return null;
    return questions[currentIndex] ?? null;
  },

  getProgress: () => {
    const { currentIndex, questions } = get();
    return {
      current: Math.min(currentIndex + 1, questions.length),
      total: questions.length,
    };
  },

  isQuizComplete: () => {
    const { currentIndex, questions } = get();
    return currentIndex >= questions.length && questions.length > 0;
  },

  getResults: () => {
    const { answers, maxStreak, quizStartedAt, quizEndedAt, questions, timerMode } = get();

    const totalScore = answers.reduce((sum, a) => sum + a.pointsEarned, 0);
    // Max score includes timer bonus if timer mode is enabled
    const maxTimerBonus = timerMode ? SCORING.timerBonus.fast.points : 0;
    const maxScore = questions.length * (SCORING.basePoints + SCORING.maxStreakBonus + maxTimerBonus);
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const incorrectCount = answers.filter((a) => !a.isCorrect && a.selectedAnswerId !== null).length;
    const skippedCount = answers.filter((a) => a.selectedAnswerId === null).length;
    const totalTime = (quizEndedAt ?? Date.now()) - quizStartedAt;
    const averageTime = answers.length > 0
      ? answers.reduce((sum, a) => sum + a.timeToAnswer, 0) / answers.length
      : 0;

    return {
      totalScore,
      maxScore,
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      correctCount,
      incorrectCount,
      skippedCount,
      maxStreak,
      totalTime,
      averageTime,
    };
  },

  getShuffledAnswers: () => {
    const question = get().getCurrentQuestion();
    if (!question) return [];

    // Combine and shuffle answers
    const allAnswers = [question.correctAnswer, ...question.wrongAnswers];

    // Use a seeded shuffle based on question ID for consistency
    // during re-renders (answers stay in same position)
    const seed = question.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const shuffled = [...allAnswers];

    // Simple seeded shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(((seed * (i + 1)) % 1000) / 1000 * (i + 1));
      const temp = shuffled[i];
      const swapItem = shuffled[j];
      if (temp !== undefined && swapItem !== undefined) {
        shuffled[i] = swapItem;
        shuffled[j] = temp;
      }
    }

    return shuffled;
  },
}));
