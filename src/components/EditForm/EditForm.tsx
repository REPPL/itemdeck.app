/**
 * Edit form component.
 *
 * Modal form for editing entity fields locally.
 * Uses overlay pattern - edits are stored separately from source data.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { CloseIcon } from "@/components/Icons/Icons";
import { useEditsStore } from "@/stores/editsStore";
import { useEscapeShortcut } from "@/hooks/useGlobalKeyboard";
import type { DisplayCard } from "@/hooks/useCollection";
import styles from "./EditForm.module.css";

/**
 * Editable fields schema.
 */
const editableFieldsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  year: z.number().min(1900).max(2100).optional().nullable(),
  summary: z.string().optional().nullable(),
  myVerdict: z.string().optional().nullable(),
  myRank: z.number().min(1).optional().nullable(),
});

type EditableFields = z.infer<typeof editableFieldsSchema>;

interface EditFormProps {
  /** The card being edited */
  card: DisplayCard;
  /** Called when form is closed */
  onClose: () => void;
}

/**
 * Edit form modal for modifying entity fields.
 */
export function EditForm({ card, onClose }: EditFormProps) {
  const setFields = useEditsStore((s) => s.setFields);
  const revertEntity = useEditsStore((s) => s.revertEntity);
  const hasEdits = useEditsStore((s) => s.hasEdits);
  const getEdit = useEditsStore((s) => s.getEdit);

  // Get existing edits for this card
  const existingEdit = getEdit(card.id);

  // Form state - merge existing edits with source data
  const [formData, setFormData] = useState<EditableFields>(() => {
    const editTitle = existingEdit?.fields.title as string | undefined;
    const editYear = existingEdit?.fields.year as number | string | undefined;
    const editSummary = existingEdit?.fields.summary as string | undefined;
    const editVerdict = existingEdit?.fields.myVerdict as string | undefined;
    const editRank = existingEdit?.fields.myRank as number | undefined;
    const cardSummary = card.summary;
    const cardVerdict = card.myVerdict as string | undefined;
    const cardRank = card.myRank;

    return {
      title: editTitle ?? card.title,
      year: parseYear(editYear ?? card.year),
      summary: editSummary ?? cardSummary ?? null,
      myVerdict: editVerdict ?? cardVerdict ?? null,
      myRank: editRank ?? cardRank ?? null,
    };
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EditableFields, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Escape key closes modal
  useEscapeShortcut(onClose, true);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        if (isDirty) {
          // Could add confirmation here, but for now just close
          onClose();
        } else {
          onClose();
        }
      }
    },
    [isDirty, onClose]
  );

  // Handle field change
  const handleChange = useCallback(
    (field: keyof EditableFields, value: string | number | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
      // Clear error when field changes
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  // Validate and save
  const handleSave = useCallback(() => {
    // Clean up null/undefined values for validation
    const cleanedData = {
      title: formData.title,
      year: formData.year ?? undefined,
      summary: formData.summary ?? undefined,
      myVerdict: formData.myVerdict ?? undefined,
      myRank: formData.myRank ?? undefined,
    };

    const result = editableFieldsSchema.safeParse(cleanedData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof EditableFields, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof EditableFields;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    // Save to edits store
    setFields(card.id, {
      title: result.data.title,
      year: result.data.year ?? null,
      summary: result.data.summary ?? null,
      myVerdict: result.data.myVerdict ?? null,
      myRank: result.data.myRank ?? null,
    });

    onClose();
  }, [formData, card.id, setFields, onClose]);

  // Handle revert
  const handleRevert = useCallback(() => {
    revertEntity(card.id);
    onClose();
  }, [card.id, revertEntity, onClose]);

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSave();
    },
    [handleSave]
  );

  const cardHasEdits = hasEdits(card.id);

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-form-title"
    >
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 id="edit-form-title" className={styles.title}>
            Edit Card
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Title */}
            <div className={styles.field}>
              <label htmlFor="edit-title" className={styles.label}>
                Title<span className={styles.required}>*</span>
              </label>
              <input
                ref={firstInputRef}
                id="edit-title"
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={(e) => { handleChange("title", e.target.value); }}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "edit-title-error" : undefined}
              />
              {errors.title && (
                <span id="edit-title-error" className={styles.error}>
                  {errors.title}
                </span>
              )}
            </div>

            {/* Year */}
            <div className={styles.field}>
              <label htmlFor="edit-year" className={styles.label}>
                Year
              </label>
              <input
                id="edit-year"
                type="number"
                className={styles.input}
                value={formData.year ?? ""}
                onChange={(e) => {
                  handleChange(
                    "year",
                    e.target.value ? parseInt(e.target.value, 10) : null
                  );
                }}
                min={1900}
                max={2100}
                placeholder="1900-2100"
                aria-invalid={!!errors.year}
                aria-describedby={errors.year ? "edit-year-error" : undefined}
              />
              {errors.year && (
                <span id="edit-year-error" className={styles.error}>
                  {errors.year}
                </span>
              )}
            </div>

            {/* Summary */}
            <div className={styles.field}>
              <label htmlFor="edit-summary" className={styles.label}>
                Summary
              </label>
              <textarea
                id="edit-summary"
                className={styles.textarea}
                value={formData.summary ?? ""}
                onChange={(e) => {
                  handleChange("summary", e.target.value || null);
                }}
                placeholder="Brief description..."
                rows={3}
              />
            </div>

            {/* My Verdict */}
            <div className={styles.field}>
              <label htmlFor="edit-verdict" className={styles.label}>
                My Verdict
              </label>
              <textarea
                id="edit-verdict"
                className={styles.textarea}
                value={formData.myVerdict ?? ""}
                onChange={(e) => {
                  handleChange("myVerdict", e.target.value || null);
                }}
                placeholder="Your personal opinion..."
                rows={3}
              />
            </div>

            {/* My Rank */}
            <div className={styles.field}>
              <label htmlFor="edit-rank" className={styles.label}>
                My Rank
              </label>
              <input
                id="edit-rank"
                type="number"
                className={styles.input}
                value={formData.myRank ?? ""}
                onChange={(e) => {
                  handleChange(
                    "myRank",
                    e.target.value ? parseInt(e.target.value, 10) : null
                  );
                }}
                min={1}
                placeholder="Position (1, 2, 3...)"
                aria-invalid={!!errors.myRank}
                aria-describedby={errors.myRank ? "edit-rank-error" : undefined}
              />
              {errors.myRank && (
                <span id="edit-rank-error" className={styles.error}>
                  {errors.myRank}
                </span>
              )}
              <span className={styles.hint}>
                Leave empty for unranked items
              </span>
            </div>
          </form>
        </div>

        <div className={styles.footer}>
          {cardHasEdits && (
            <button
              type="button"
              className={[styles.button, styles.revertButton].filter(Boolean).join(" ")}
              onClick={handleRevert}
            >
              Revert Changes
            </button>
          )}
          <button
            type="button"
            className={[styles.button, styles.buttonSecondary].filter(Boolean).join(" ")}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={[styles.button, styles.buttonPrimary].filter(Boolean).join(" ")}
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Parse year from various formats.
 */
function parseYear(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export default EditForm;
