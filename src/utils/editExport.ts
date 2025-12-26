/**
 * Edit export/import utilities.
 *
 * Handles exporting and importing local edits to/from JSON files.
 */

import { z } from "zod";
import type { EntityEdit, ExportedEdits } from "@/stores/editsStore";

/**
 * Schema for validating imported edits.
 */
const entityEditSchema = z.object({
  fields: z.record(z.string(), z.unknown()),
  editedAt: z.number(),
});

const exportedEditsSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  collectionId: z.string(),
  editCount: z.number(),
  edits: z.record(z.string(), entityEditSchema),
});

/**
 * Export edits to a downloadable JSON file.
 *
 * @param edits - The edits to export
 * @param collectionId - ID of the collection the edits belong to
 */
export function exportEditsToFile(
  edits: Record<string, EntityEdit>,
  collectionId: string
): void {
  const data: ExportedEdits = {
    version: 1,
    exportedAt: new Date().toISOString(),
    collectionId,
    editCount: Object.keys(edits).length,
    edits,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  // Format date for filename
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0] ?? "unknown-date"; // YYYY-MM-DD
  const filename = `${collectionId}-edits-${dateStr}.json`;

  // Trigger download
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate edits from file content.
 *
 * @param file - The file to import
 * @returns Validated exported edits
 * @throws Error if file is invalid
 */
export async function importEditsFromFile(file: File): Promise<ExportedEdits> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const result = exportedEditsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Invalid edits file format");
  }

  // Note: Schema validates version === 1. This block exists
  // for future-proofing when we add version 2+ support.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (result.data.version !== 1) {
    throw new Error("Unsupported edits file version");
  }

  return result.data;
}

/**
 * Schema export for testing.
 */
export { exportedEditsSchema };
