/**
 * Collection export/import utilities.
 *
 * Provides functions to export and import collection data as JSON files.
 */

import type { Collection } from "@/schemas";

/**
 * Export collection data as a downloadable JSON file.
 *
 * @param collection - Collection to export
 * @param filename - Download filename (default: "itemdeck-collection.json")
 */
export function exportCollection(
  collection: Collection,
  filename = "itemdeck-collection.json"
): void {
  const json = JSON.stringify(collection, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import collection data from a JSON file.
 *
 * @param file - File to import
 * @returns Parsed collection data
 * @throws Error if file is invalid JSON or doesn't match schema
 */
export async function importCollection(file: File): Promise<Collection> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = reader.result as string;
        const data = JSON.parse(text) as Collection;

        // Basic validation - check structure matches expected shape
        if (!Array.isArray(data.items)) {
          throw new Error("Invalid collection: missing items array");
        }

        resolve(data);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to parse collection file")
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}
