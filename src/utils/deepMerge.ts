/**
 * Deep merge utility for configuration objects.
 *
 * Merges source into target, with source values taking precedence.
 * Only merges plain objects - arrays and other types are replaced.
 */

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * Deep merge two objects.
 * Source values override target values.
 * Nested objects are merged recursively.
 */
export function deepMerge<T extends PlainObject>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      // Recursively merge nested objects
      result[key] = deepMerge(
        targetValue as PlainObject,
        sourceValue as PlainObject
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      // Replace with source value
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}
