/**
 * Settings panel for Quiz mechanic.
 */

import type { MechanicSettingsProps } from "../types";
import type { QuizSettings, QuestionType, QuizDifficulty, QuestionCountOption } from "./types";
import { QUESTION_COUNT_OPTIONS, DIFFICULTY_SETTINGS, getQuestionTypeLabel } from "./types";
import styles from "./Quiz.module.css";

/**
 * All available question types.
 */
const ALL_QUESTION_TYPES: QuestionType[] = ["imageToName", "nameToImage", "fillTheBlank", "relationshipToName"];

/**
 * Quiz settings panel.
 */
export function QuizSettingsPanel({
  settings,
  onChange,
  disabled,
}: MechanicSettingsProps<QuizSettings>) {
  const handleQuestionCountChange = (count: QuestionCountOption) => {
    onChange({ questionCount: count });
  };

  const handleTypeToggle = (type: QuestionType) => {
    const current = settings.enabledQuestionTypes;
    const isEnabled = current.includes(type);

    if (isEnabled) {
      // Don't allow disabling the last type
      if (current.length === 1) return;
      onChange({ enabledQuestionTypes: current.filter((t) => t !== type) });
    } else {
      onChange({ enabledQuestionTypes: [...current, type] });
    }
  };

  const handleTimerModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ timerMode: e.target.checked });
  };

  const handleDifficultyChange = (difficulty: QuizDifficulty) => {
    onChange({ difficulty });
  };

  const timerSeconds = DIFFICULTY_SETTINGS[settings.difficulty].timerSeconds;

  return (
    <div className={styles.settingsContainer}>
      {/* Question count */}
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Questions</span>
        <div className={styles.segmentedControl}>
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              className={[
                styles.segmentButton,
                settings.questionCount === count ? styles.segmentButtonActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => { handleQuestionCountChange(count); }}
              disabled={disabled}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Difficulty</span>
        <div className={styles.segmentedControl}>
          {(Object.entries(DIFFICULTY_SETTINGS) as [QuizDifficulty, typeof DIFFICULTY_SETTINGS[QuizDifficulty]][]).map(
            ([key, { label }]) => (
              <button
                key={key}
                type="button"
                className={[
                  styles.segmentButton,
                  settings.difficulty === key ? styles.segmentButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => { handleDifficultyChange(key); }}
                disabled={disabled}
                title={DIFFICULTY_SETTINGS[key].description}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Question types */}
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Question Types</span>
        <div className={styles.checkboxGroup}>
          {ALL_QUESTION_TYPES.map((type) => {
            const isEnabled = settings.enabledQuestionTypes.includes(type);
            const isLastEnabled = isEnabled && settings.enabledQuestionTypes.length === 1;

            return (
              <label key={type} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => { handleTypeToggle(type); }}
                  disabled={disabled || isLastEnabled}
                />
                <span>{getQuestionTypeLabel(type)}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Timer mode */}
      <div className={styles.settingRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={settings.timerMode}
            onChange={handleTimerModeChange}
            disabled={disabled}
          />
          <span>Timer Mode ({timerSeconds}s per question)</span>
        </label>
      </div>

      <p className={styles.settingHint}>
        Use keyboard shortcuts A, B, C, D to answer quickly. Build streaks for bonus points.
      </p>
    </div>
  );
}
