/**
 * Type definitions for Quiz mechanic.
 *
 * A knowledge-testing game with auto-generated questions from collection data.
 */

import type { MechanicState } from "../types";

/**
 * Question types supported by the quiz.
 */
export type QuestionType = "imageToName" | "nameToImage" | "fillTheBlank" | "relationshipToName";

/**
 * An answer option.
 */
export interface Answer {
  /** Unique answer ID */
  id: string;
  /** Display label for the answer */
  label: string;
  /** Image URL for name-to-image type */
  imageUrl?: string;
}

/**
 * A quiz question.
 */
export interface Question {
  /** Unique question ID */
  id: string;
  /** Question type */
  type: QuestionType;
  /** Question prompt text */
  prompt: string;
  /** The correct answer */
  correctAnswer: Answer;
  /** Wrong answer options (3) */
  wrongAnswers: Answer[];
  /** ID of the card this question is about */
  relatedCardId: string;
  /** Additional metadata based on question type */
  metadata?: {
    /** Field name for fill-the-blank */
    field?: string;
    /** Image URL for image-to-name */
    imageUrl?: string;
    /** Correct image URL for name-to-image */
    correctImageUrl?: string;
  };
}

/**
 * Record of a user's answer to a question.
 */
export interface AnswerRecord {
  /** Question ID */
  questionId: string;
  /** Selected answer ID (null if skipped) */
  selectedAnswerId: string | null;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Time taken to answer in milliseconds */
  timeToAnswer: number;
  /** Points earned for this answer */
  pointsEarned: number;
}

/**
 * Quiz results summary.
 */
export interface QuizResults {
  /** Total score */
  totalScore: number;
  /** Maximum possible score */
  maxScore: number;
  /** Percentage score */
  percentage: number;
  /** Number of correct answers */
  correctCount: number;
  /** Number of incorrect answers */
  incorrectCount: number;
  /** Number of skipped questions */
  skippedCount: number;
  /** Maximum streak achieved */
  maxStreak: number;
  /** Total time taken */
  totalTime: number;
  /** Average time per question */
  averageTime: number;
}

/**
 * Question count options.
 */
export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;
export type QuestionCountOption = (typeof QUESTION_COUNT_OPTIONS)[number];

/**
 * Difficulty levels.
 * Affects image blur, timer duration, and distractor selection.
 */
export type QuizDifficulty = "easy" | "medium" | "hard" | "expert" | "extreme";

/**
 * Difficulty settings with labels, blur values, zoom, and timer durations.
 */
export const DIFFICULTY_SETTINGS: Record<QuizDifficulty, {
  label: string;
  imageBlur: number;
  description: string;
  timerSeconds: number;
  /** Zoom scale factor (1 = no zoom, 2 = 2x zoom) */
  imageZoom: number;
  /** Chance of zoom being applied (0-1, 0 = never, 1 = always) */
  imageZoomChance: number;
  /** Whether to use similar cards as distractors (harder) */
  useSimilarDistractors: boolean;
}> = {
  easy: {
    label: "Easy",
    imageBlur: 0,
    description: "Clear images, random distractors",
    timerSeconds: 20,
    imageZoom: 1,
    imageZoomChance: 0,
    useSimilarDistractors: false,
  },
  medium: {
    label: "Medium",
    imageBlur: 4,
    description: "Slightly blurred images",
    timerSeconds: 15,
    imageZoom: 1,
    imageZoomChance: 0,
    useSimilarDistractors: false,
  },
  hard: {
    label: "Hard",
    imageBlur: 8,
    description: "Heavily blurred images",
    timerSeconds: 10,
    imageZoom: 1,
    imageZoomChance: 0,
    useSimilarDistractors: false,
  },
  expert: {
    label: "Expert",
    imageBlur: 12,
    description: "Blurred, zoomed, similar distractors",
    timerSeconds: 5,
    imageZoom: 2.5,
    imageZoomChance: 0.5,
    useSimilarDistractors: true,
  },
  extreme: {
    label: "Extreme",
    imageBlur: 16,
    description: "Maximum challenge",
    timerSeconds: 2,
    imageZoom: 3,
    imageZoomChance: 1,
    useSimilarDistractors: true,
  },
};

/**
 * Quiz state.
 */
export interface QuizState extends MechanicState {
  /** Whether the quiz is active */
  isActive: boolean;

  // Quiz configuration
  /** Number of questions */
  questionCount: QuestionCountOption;
  /** Enabled question types */
  enabledQuestionTypes: QuestionType[];
  /** Whether timer mode is enabled */
  timerMode: boolean;
  /** Difficulty level */
  difficulty: QuizDifficulty;

  // Game state
  /** Generated questions */
  questions: Question[];
  /** Current question index */
  currentIndex: number;
  /** Answer records */
  answers: AnswerRecord[];
  /** Current score */
  score: number;
  /** Current streak */
  streak: number;
  /** Maximum streak achieved */
  maxStreak: number;

  // Timing
  /** When the quiz started */
  quizStartedAt: number;
  /** When the quiz ended (null if not finished) */
  quizEndedAt: number | null;
  /** When the current question was shown */
  questionStartedAt: number;

  // Feedback state
  /** Whether feedback is visible */
  feedbackVisible: boolean;
  /** Whether the last answer was correct (null if no answer yet) */
  lastAnswerCorrect: boolean | null;
  /** The correct answer for feedback display */
  lastCorrectAnswer: Answer | null;

  // Error state
  /** Error message if quiz cannot be played */
  errorMessage: string | null;
}

/**
 * Quiz settings.
 */
export interface QuizSettings {
  /** Number of questions */
  questionCount: QuestionCountOption;
  /** Enabled question types */
  enabledQuestionTypes: QuestionType[];
  /** Whether timer mode is enabled */
  timerMode: boolean;
  /** Difficulty level */
  difficulty: QuizDifficulty;
}

/**
 * Default quiz settings.
 */
export const DEFAULT_SETTINGS: QuizSettings = {
  questionCount: 10,
  enabledQuestionTypes: ["imageToName", "nameToImage", "fillTheBlank", "relationshipToName"],
  timerMode: false,
  difficulty: "easy",
};

/**
 * Scoring constants.
 */
export const SCORING = {
  /** Base points for correct answer */
  basePoints: 10,
  /** Bonus points per streak level */
  streakBonus: 2,
  /** Maximum streak bonus */
  maxStreakBonus: 10,
  /** Timer bonus thresholds (ms) and points */
  timerBonus: {
    fast: { threshold: 3000, points: 5 },
    medium: { threshold: 6000, points: 3 },
    slow: { threshold: 10000, points: 1 },
  },
} as const;

/**
 * Timer constants.
 */
export const TIMER = {
  /** Feedback display duration (ms) */
  feedbackDuration: 1500,
} as const;

/**
 * Get timer duration in milliseconds for a difficulty level.
 */
export function getTimerDuration(difficulty: QuizDifficulty): number {
  return DIFFICULTY_SETTINGS[difficulty].timerSeconds * 1000;
}

/**
 * Calculate score for an answer.
 *
 * @param isCorrect - Whether the answer was correct
 * @param currentStreak - Current streak count
 * @param timeToAnswer - Time taken to answer in ms
 * @param timerMode - Whether timer mode is enabled
 * @returns Score and new streak
 */
export function calculateScore(
  isCorrect: boolean,
  currentStreak: number,
  timeToAnswer: number,
  timerMode: boolean
): { score: number; newStreak: number } {
  if (!isCorrect) {
    return { score: 0, newStreak: 0 };
  }

  // Base score
  let score = SCORING.basePoints;

  // Streak bonus (capped)
  const streakBonus = Math.min(currentStreak * SCORING.streakBonus, SCORING.maxStreakBonus);
  score += streakBonus;

  // Timer bonus if in timer mode
  if (timerMode) {
    if (timeToAnswer < SCORING.timerBonus.fast.threshold) {
      score += SCORING.timerBonus.fast.points;
    } else if (timeToAnswer < SCORING.timerBonus.medium.threshold) {
      score += SCORING.timerBonus.medium.points;
    } else if (timeToAnswer < SCORING.timerBonus.slow.threshold) {
      score += SCORING.timerBonus.slow.points;
    }
  }

  return {
    score,
    newStreak: currentStreak + 1,
  };
}

/**
 * Get label for question count option.
 */
export function getQuestionCountLabel(count: QuestionCountOption): string {
  return String(count);
}

/**
 * Get label for question type.
 */
export function getQuestionTypeLabel(type: QuestionType): string {
  switch (type) {
    case "imageToName":
      return "Image to Name";
    case "nameToImage":
      return "Name to Image";
    case "fillTheBlank":
      return "Fill the Blank";
    case "relationshipToName":
      return "Relationships";
  }
}
