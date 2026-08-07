/**
 * Decide whether a collection's data may be cached locally.
 *
 * Kept separate from the loading screen so the rule is testable on its own
 * and stays consistent between the "do we need to ask" and "may we cache"
 * questions, which are not the same: declining permanently answers the first
 * while still forbidding the second.
 */

/** Stored answer to the caching question. */
export type CacheConsentPreference = "always" | "ask" | "never";

/** Inputs to the caching decision for the active source. */
export interface CacheConsentInput {
  /** Whether a source is active at all */
  hasActiveSource: boolean;

  /** Built-in sources ship with the app and are exempt */
  isBuiltIn: boolean;

  /** The visitor's stored preference */
  preference: CacheConsentPreference;

  /** Whether this specific source was granted consent */
  hasSourceConsent: boolean;
}

/**
 * Whether images and collection data may be written to local storage.
 *
 * "never" must forbid caching, not merely suppress the dialog: suppressing
 * the prompt while still caching made "Never cache" weaker than declining
 * once, which is the opposite of what the setting promises.
 *
 * @param input - Active source and preference state
 * @returns True when caching is permitted
 */
export function mayCacheCollection(input: CacheConsentInput): boolean {
  if (!input.hasActiveSource) {
    return false;
  }
  if (input.isBuiltIn) {
    return true;
  }
  if (input.preference === "never") {
    return false;
  }
  if (input.preference === "always") {
    return true;
  }
  return input.hasSourceConsent;
}
