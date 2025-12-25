/**
 * Collection export/import utilities.
 *
 * Provides functions to export and import collection data as JSON, CSV, and Markdown files.
 */

import type { Collection, CardData } from "@/schemas";

/**
 * Export format options.
 */
export type ExportFormat = "json" | "csv" | "markdown";

/**
 * Export options.
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Fields to include (null = all) */
  fields?: string[] | null;
  /** Filename (without extension) */
  filename?: string;
}

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

/**
 * Escape a value for CSV format.
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str: string;
  if (typeof value === "object") {
    str = JSON.stringify(value);
  } else if (typeof value === "string") {
    str = value;
  } else if (typeof value === "number" || typeof value === "boolean") {
    str = String(value);
  } else {
    str = JSON.stringify(value);
  }

  // Escape quotes and wrap in quotes if contains special characters
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Get all unique field names from collection items.
 */
function getFieldNames(items: CardData[]): string[] {
  const fieldSet = new Set<string>();

  for (const item of items) {
    for (const key of Object.keys(item)) {
      fieldSet.add(key);
    }
  }

  return Array.from(fieldSet).sort();
}

/**
 * Export collection as CSV.
 *
 * @param collection - Collection to export
 * @param options - Export options
 * @returns CSV string
 */
export function exportToCSV(
  collection: Collection,
  options?: Partial<ExportOptions>
): string {
  const items = collection.items;

  if (items.length === 0) {
    return "";
  }

  // Determine fields to export
  const allFields = getFieldNames(items);
  const fields = options?.fields ?? allFields;

  // Build header row
  const header = fields.map(escapeCsvValue).join(",");

  // Build data rows
  const rows = items.map((item) => {
    return fields
      .map((field) => {
        const value = (item as Record<string, unknown>)[field];
        return escapeCsvValue(value);
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Export collection as Markdown table.
 *
 * @param collection - Collection to export
 * @param options - Export options
 * @returns Markdown string
 */
export function exportToMarkdown(
  collection: Collection,
  options?: Partial<ExportOptions>
): string {
  const items = collection.items;

  if (items.length === 0) {
    return "# Collection\n\nNo items.";
  }

  // Determine fields to export
  const allFields = getFieldNames(items);
  const fields = options?.fields ?? allFields;

  // Build title
  const title = collection.meta?.name ?? "Collection";
  const lines: string[] = [`# ${title}`, ""];

  // Add description if present
  if (collection.meta?.description) {
    lines.push(collection.meta.description, "");
  }

  // Add item count
  lines.push(`**Items:** ${String(items.length)}`, "");

  // Build table header
  const header = "| " + fields.join(" | ") + " |";
  const separator = "| " + fields.map(() => "---").join(" | ") + " |";

  lines.push(header, separator);

  // Build table rows
  for (const item of items) {
    const row =
      "| " +
      fields
        .map((field) => {
          const value = (item as Record<string, unknown>)[field];
          if (value === null || value === undefined) {
            return "";
          }
          if (typeof value === "object") {
            return JSON.stringify(value).replace(/\|/g, "\\|");
          }
          if (typeof value === "string") {
            return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
          }
          if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
          }
          return JSON.stringify(value).replace(/\|/g, "\\|");
        })
        .join(" | ") +
      " |";
    lines.push(row);
  }

  return lines.join("\n");
}

/**
 * Export collection in specified format with download.
 *
 * @param collection - Collection to export
 * @param options - Export options
 */
export function exportCollectionWithFormat(
  collection: Collection,
  options: ExportOptions
): void {
  const baseName = options.filename ?? "itemdeck-collection";

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (options.format) {
    case "csv":
      content = exportToCSV(collection, options);
      mimeType = "text/csv";
      extension = ".csv";
      break;
    case "markdown":
      content = exportToMarkdown(collection, options);
      mimeType = "text/markdown";
      extension = ".md";
      break;
    case "json":
    default:
      // Filter fields for JSON if specified
      if (options.fields) {
        const fieldsToInclude = options.fields;
        const filteredItems = collection.items.map((item) => {
          const filtered: Record<string, unknown> = {};
          const itemRecord = item as Record<string, unknown>;
          for (const field of fieldsToInclude) {
            if (field in item) {
              filtered[field] = itemRecord[field];
            }
          }
          return filtered;
        });
        content = JSON.stringify({ ...collection, items: filteredItems }, null, 2);
      } else {
        content = JSON.stringify(collection, null, 2);
      }
      mimeType = "application/json";
      extension = ".json";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = baseName + extension;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
