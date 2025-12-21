/**
 * Fisher-Yates shuffle algorithm.
 *
 * Provides O(n) unbiased randomisation of arrays.
 */

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 *
 * @param array - Array to shuffle
 * @returns The same array, shuffled
 */
export function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j] as T;
    array[j] = temp as T;
  }
  return array;
}

/**
 * Returns a new shuffled copy of an array.
 *
 * @param array - Array to shuffle
 * @returns A new shuffled array
 */
export function shuffle<T>(array: readonly T[]): T[] {
  return shuffleInPlace([...array]);
}

/**
 * Seeded random number generator for reproducible shuffles.
 *
 * @param seed - Seed for the random number generator
 * @returns A function that returns random numbers between 0 and 1
 */
export function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Shuffles an array with a seeded random number generator.
 *
 * Useful for reproducible shuffles based on a seed.
 *
 * @param array - Array to shuffle
 * @param seed - Seed for reproducibility
 * @returns A new shuffled array
 */
export function shuffleWithSeed<T>(array: readonly T[], seed: number): T[] {
  const random = seededRandom(seed);
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i];
    result[i] = result[j] as T;
    result[j] = temp as T;
  }

  return result;
}
