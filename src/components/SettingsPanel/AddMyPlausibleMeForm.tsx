/**
 * Add MyPlausibleMe collection form.
 *
 * Simplified UI for adding collections from MyPlausibleMe repositories.
 * Auto-discovers available collections from the repository manifest.
 */

import { useState, useCallback } from "react";
import { useSourceStore, useSources } from "@/stores/sourceStore";
import { useMyPlausibleMeDiscovery } from "@/hooks/useMyPlausibleMeDiscovery";
import { buildMyPlausibleMeUrl } from "@/config/dataSource";
import { PlusIcon } from "@/components/Icons";
import styles from "./SettingsPanel.module.css";

/**
 * Form for adding MyPlausibleMe collections.
 *
 * Provides a username input that auto-discovers available collections,
 * and a dropdown to select which collection to add.
 */
export function AddMyPlausibleMeForm() {
  const [username, setUsername] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [customName, setCustomName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMyPlausibleMeSource = useSourceStore((state) => state.addMyPlausibleMeSource);
  const sources = useSources();

  // Auto-discover collections when username is entered
  const {
    collections,
    isLoading: isDiscovering,
    error: discoveryError,
  } = useMyPlausibleMeDiscovery(username, { enabled: username.length >= 2 });

  // Check if the selected collection already exists
  const selectedUrl = username && selectedFolder
    ? buildMyPlausibleMeUrl({ username, folder: selectedFolder })
    : "";
  const alreadyExists = sources.some((s) => s.url === selectedUrl);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedFolder = selectedFolder.trim();

    if (!trimmedUsername) {
      setError("Username is required");
      return;
    }

    if (!trimmedFolder) {
      setError("Please select a collection");
      return;
    }

    if (alreadyExists) {
      setError("This collection is already configured");
      return;
    }

    setIsValidating(true);

    try {
      // Validate that the collection exists by fetching collection.json
      const url = buildMyPlausibleMeUrl({ username: trimmedUsername, folder: trimmedFolder });
      const testUrl = `${url}/collection.json`;

      const response = await fetch(testUrl, {
        method: "HEAD",
        cache: "no-store",
      });

      if (!response.ok) {
        setError(`Collection not accessible (HTTP ${String(response.status)})`);
        setIsValidating(false);
        return;
      }

      // Add the source
      addMyPlausibleMeSource(
        trimmedUsername,
        trimmedFolder,
        customName.trim() || undefined
      );

      // Reset form
      setUsername("");
      setSelectedFolder("");
      setCustomName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate collection");
    } finally {
      setIsValidating(false);
    }
  }, [username, selectedFolder, customName, alreadyExists, addMyPlausibleMeSource]);

  const previewUrl = username && selectedFolder
    ? `github.com/${username}/MyPlausibleMe/data/collections/${selectedFolder}`
    : null;

  return (
    <form className={styles.addSourceForm} onSubmit={(e) => { void handleSubmit(e); }}>
      <div className={styles.formGroup}>
        <label htmlFor="mpm-username" className={styles.label}>
          GitHub Username
        </label>
        <input
          id="mpm-username"
          type="text"
          className={styles.input}
          placeholder="e.g. REPPL"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setSelectedFolder("");
            setError(null);
          }}
          disabled={isValidating}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {isDiscovering && (
          <span className={styles.formHint}>Discovering collections...</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="mpm-collection" className={styles.label}>
          Collection
        </label>
        <select
          id="mpm-collection"
          className={styles.select}
          value={selectedFolder}
          onChange={(e) => {
            setSelectedFolder(e.target.value);
            setError(null);
          }}
          disabled={isValidating || collections.length === 0}
        >
          <option value="">
            {collections.length === 0
              ? username.length >= 2
                ? discoveryError ?? "No collections found"
                : "Enter username first"
              : "Select a collection..."}
          </option>
          {collections.map((c) => (
            <option key={c.folder} value={c.folder}>
              {c.name}
              {c.itemCount !== undefined ? ` (${String(c.itemCount)} items)` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="mpm-name" className={styles.label}>
          Display Name (optional)
        </label>
        <input
          id="mpm-name"
          type="text"
          className={styles.input}
          placeholder={selectedFolder ? `${username}/${selectedFolder}` : "Custom name"}
          value={customName}
          onChange={(e) => { setCustomName(e.target.value); }}
          disabled={isValidating}
        />
      </div>

      {previewUrl && (
        <div className={styles.previewUrl}>
          <span className={styles.previewLabel}>Source:</span>
          <code className={styles.previewCode}>{previewUrl}</code>
        </div>
      )}

      {(error ?? discoveryError) && (
        <p className={styles.formError}>{error ?? discoveryError}</p>
      )}

      {alreadyExists && !error && (
        <p className={styles.formWarning}>This collection is already configured.</p>
      )}

      <button
        type="submit"
        className={styles.primaryButton}
        disabled={isValidating || !username.trim() || !selectedFolder || alreadyExists}
      >
        {isValidating ? (
          "Validating..."
        ) : (
          <>
            <PlusIcon />
            <span>Add Collection</span>
          </>
        )}
      </button>
    </form>
  );
}
