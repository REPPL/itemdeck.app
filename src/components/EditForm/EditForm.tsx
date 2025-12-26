/**
 * Edit form component.
 *
 * Modal form for editing entity fields locally.
 * Uses overlay pattern - edits are stored separately from source data.
 * Supports two tabs: Card (item) and Context (platform/category).
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { z } from "zod";
import { useEditsStore } from "@/stores/editsStore";
import { useEscapeShortcut } from "@/hooks/useGlobalKeyboard";
import type { DisplayCard } from "@/hooks/useCollection";
import styles from "./EditForm.module.css";

/** Active tab in the edit form */
type EditTab = "card" | "context";

/**
 * Card editable fields schema.
 * Only text fields are editable for safety.
 */
const cardFieldsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional().nullable(),
  myVerdict: z.string().optional().nullable(),
});

type CardFields = z.infer<typeof cardFieldsSchema>;

/**
 * Context (platform) editable fields schema.
 * Only text fields are editable for safety.
 */
const contextFieldsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional().nullable(),
});

type ContextFields = z.infer<typeof contextFieldsSchema>;

interface EditFormProps {
  /** The card being edited */
  card: DisplayCard;
  /** Called when form is closed */
  onClose: () => void;
}

/**
 * Get the context entity ID for edits store.
 * Prefixed with "context:" to distinguish from card IDs.
 */
function getContextEditId(contextId: string): string {
  return `context:${contextId}`;
}

/**
 * Edit form modal for modifying entity fields.
 */
export function EditForm({ card, onClose }: EditFormProps) {
  const setFields = useEditsStore((s) => s.setFields);
  const revertEntity = useEditsStore((s) => s.revertEntity);
  const hasEdits = useEditsStore((s) => s.hasEdits);
  const getEdit = useEditsStore((s) => s.getEdit);

  // Determine if context tab should be available
  const hasContext = Boolean(card.categoryInfo?.id);
  const contextId = card.categoryInfo?.id;
  const contextEditId = contextId ? getContextEditId(contextId) : null;

  // Tab state
  const [activeTab, setActiveTab] = useState<EditTab>("card");

  // Get existing edits for this card
  const existingCardEdit = getEdit(card.id);
  const existingContextEdit = contextEditId ? getEdit(contextEditId) : undefined;

  // Card form state - merge existing edits with source data
  const [cardFormData, setCardFormData] = useState<CardFields>(() => {
    const editTitle = existingCardEdit?.fields.title as string | undefined;
    const editSummary = existingCardEdit?.fields.summary as string | undefined;
    const editVerdict = existingCardEdit?.fields.myVerdict as string | undefined;
    const cardSummary = card.summary;
    const cardVerdict = card.myVerdict as string | undefined;

    return {
      title: editTitle ?? card.title,
      summary: editSummary ?? cardSummary ?? null,
      myVerdict: editVerdict ?? cardVerdict ?? null,
    };
  });

  // Context form state - merge existing edits with source data
  const [contextFormData, setContextFormData] = useState<ContextFields>(() => {
    const editTitle = existingContextEdit?.fields.title as string | undefined;
    const editSummary = existingContextEdit?.fields.summary as string | undefined;
    const contextTitle = card.categoryInfo?.title ?? "";
    const contextSummary = card.categoryInfo?.summary;

    return {
      title: editTitle ?? contextTitle,
      summary: editSummary ?? contextSummary ?? null,
    };
  });

  const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardFields, string>>>({});
  const [contextErrors, setContextErrors] = useState<Partial<Record<keyof ContextFields, string>>>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input on mount and tab change
  useEffect(() => {
    firstInputRef.current?.focus();
  }, [activeTab]);

  // Escape key closes modal
  useEscapeShortcut(onClose, true);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle card field change
  const handleCardChange = useCallback(
    (field: keyof CardFields, value: string | null) => {
      setCardFormData((prev) => ({ ...prev, [field]: value }));
      setCardErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  // Handle context field change
  const handleContextChange = useCallback(
    (field: keyof ContextFields, value: string | null) => {
      setContextFormData((prev) => ({ ...prev, [field]: value }));
      setContextErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  // Validate and save card
  const handleSaveCard = useCallback(() => {
    const cleanedData = {
      title: cardFormData.title,
      summary: cardFormData.summary ?? undefined,
      myVerdict: cardFormData.myVerdict ?? undefined,
    };

    const result = cardFieldsSchema.safeParse(cleanedData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CardFields, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CardFields;
        fieldErrors[field] = issue.message;
      }
      setCardErrors(fieldErrors);
      return false;
    }

    setFields(card.id, {
      title: result.data.title,
      summary: result.data.summary ?? null,
      myVerdict: result.data.myVerdict ?? null,
    });

    return true;
  }, [cardFormData, card.id, setFields]);

  // Validate and save context
  const handleSaveContext = useCallback(() => {
    if (!contextEditId) return true;

    const cleanedData = {
      title: contextFormData.title,
      summary: contextFormData.summary ?? undefined,
    };

    const result = contextFieldsSchema.safeParse(cleanedData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContextFields, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ContextFields;
        fieldErrors[field] = issue.message;
      }
      setContextErrors(fieldErrors);
      return false;
    }

    setFields(contextEditId, {
      title: result.data.title,
      summary: result.data.summary ?? null,
    });

    return true;
  }, [contextFormData, contextEditId, setFields]);

  // Save current tab
  const handleSave = useCallback(() => {
    if (activeTab === "card") {
      if (handleSaveCard()) {
        onClose();
      }
    } else {
      if (handleSaveContext()) {
        onClose();
      }
    }
  }, [activeTab, handleSaveCard, handleSaveContext, onClose]);

  // Handle revert for current tab
  const handleRevert = useCallback(() => {
    if (activeTab === "card") {
      revertEntity(card.id);
    } else if (contextEditId) {
      revertEntity(contextEditId);
    }
    onClose();
  }, [activeTab, card.id, contextEditId, revertEntity, onClose]);

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSave();
    },
    [handleSave]
  );

  const cardHasEdits = hasEdits(card.id);
  const contextHasEdits = contextEditId ? hasEdits(contextEditId) : false;
  const currentTabHasEdits = activeTab === "card" ? cardHasEdits : contextHasEdits;

  // Prevent keyboard events from bubbling to parent components
  // This ensures spacebar works in textareas when the edit form is open
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Let escape bubble up (handled by useEscapeShortcut)
    if (e.key === "Escape") return;
    // Stop all other keys from bubbling
    e.stopPropagation();
  }, []);

  return createPortal(
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-form-title"
    >
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 id="edit-form-title" className={styles.title}>
            Edit
          </h2>
        </div>

        {/* Tabs */}
        {hasContext && (
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "card"}
              className={[styles.tab, activeTab === "card" ? styles.tabActive : ""].filter(Boolean).join(" ")}
              onClick={() => { setActiveTab("card"); }}
            >
              Card
              {cardHasEdits && <span className={styles.editIndicator} title="Has edits" />}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "context"}
              className={[styles.tab, activeTab === "context" ? styles.tabActive : ""].filter(Boolean).join(" ")}
              onClick={() => { setActiveTab("context"); }}
            >
              Context
              {contextHasEdits && <span className={styles.editIndicator} title="Has edits" />}
            </button>
          </div>
        )}

        <div className={styles.body}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {activeTab === "card" ? (
              <>
                {/* Card Title */}
                <div className={styles.field}>
                  <label htmlFor="edit-card-title" className={styles.label}>
                    Title<span className={styles.required}>*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    id="edit-card-title"
                    type="text"
                    className={styles.input}
                    value={cardFormData.title}
                    onChange={(e) => { handleCardChange("title", e.target.value); }}
                    aria-invalid={!!cardErrors.title}
                    aria-describedby={cardErrors.title ? "edit-card-title-error" : undefined}
                  />
                  {cardErrors.title && (
                    <span id="edit-card-title-error" className={styles.error}>
                      {cardErrors.title}
                    </span>
                  )}
                </div>

                {/* Card Summary */}
                <div className={styles.field}>
                  <label htmlFor="edit-card-summary" className={styles.label}>
                    Summary
                  </label>
                  <textarea
                    id="edit-card-summary"
                    className={styles.textarea}
                    value={cardFormData.summary ?? ""}
                    onChange={(e) => {
                      handleCardChange("summary", e.target.value || null);
                    }}
                    placeholder="Brief description..."
                    rows={3}
                  />
                </div>

                {/* My Verdict */}
                <div className={styles.field}>
                  <label htmlFor="edit-card-verdict" className={styles.label}>
                    My Verdict
                  </label>
                  <textarea
                    id="edit-card-verdict"
                    className={styles.textarea}
                    value={cardFormData.myVerdict ?? ""}
                    onChange={(e) => {
                      handleCardChange("myVerdict", e.target.value || null);
                    }}
                    placeholder="Your personal opinion..."
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Context Title */}
                <div className={styles.field}>
                  <label htmlFor="edit-context-title" className={styles.label}>
                    Title<span className={styles.required}>*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    id="edit-context-title"
                    type="text"
                    className={styles.input}
                    value={contextFormData.title}
                    onChange={(e) => { handleContextChange("title", e.target.value); }}
                    aria-invalid={!!contextErrors.title}
                    aria-describedby={contextErrors.title ? "edit-context-title-error" : undefined}
                  />
                  {contextErrors.title && (
                    <span id="edit-context-title-error" className={styles.error}>
                      {contextErrors.title}
                    </span>
                  )}
                </div>

                {/* Context Summary */}
                <div className={styles.field}>
                  <label htmlFor="edit-context-summary" className={styles.label}>
                    Summary
                  </label>
                  <textarea
                    id="edit-context-summary"
                    className={styles.textarea}
                    value={contextFormData.summary ?? ""}
                    onChange={(e) => {
                      handleContextChange("summary", e.target.value || null);
                    }}
                    placeholder="Brief description..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </form>
        </div>

        <div className={styles.footer}>
          {currentTabHasEdits && (
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
    </div>,
    document.body
  );
}

export default EditForm;
