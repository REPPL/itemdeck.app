# F-013: Settings Panel

## Problem Statement

Users need a centralised interface to configure all application preferences. Currently:

1. No unified settings UI
2. Theme and layout controls are scattered
3. No way to reset to defaults
4. Accessibility options not exposed

## Design Approach

Implement a **comprehensive settings panel** with grouped sections:

### Settings Panel Component

```tsx
// src/components/SettingsPanel/SettingsPanel.tsx
import { useSettingsStore } from '../../stores/settingsStore';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { LayoutSwitcher } from '../LayoutSwitcher/LayoutSwitcher';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    cardWidth,
    cardHeight,
    gap,
    setCardDimensions,
    setGap,
    resetToDefaults,
  } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <header className={styles.header}>
          <h2 id="settings-title">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className={styles.closeButton}
          >
            ×
          </button>
        </header>

        <div className={styles.content}>
          <SettingsSection title="Appearance">
            <SettingsRow label="Theme">
              <ThemeToggle />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection title="Layout">
            <SettingsRow label="Display Mode">
              <LayoutSwitcher />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection title="Card Size">
            <SettingsRow label={`Width: ${cardWidth}px`}>
              <input
                type="range"
                min={150}
                max={500}
                value={cardWidth}
                onChange={(e) => setCardDimensions(Number(e.target.value), cardHeight)}
                aria-label="Card width"
              />
            </SettingsRow>
            <SettingsRow label={`Height: ${cardHeight}px`}>
              <input
                type="range"
                min={200}
                max={700}
                value={cardHeight}
                onChange={(e) => setCardDimensions(cardWidth, Number(e.target.value))}
                aria-label="Card height"
              />
            </SettingsRow>
            <SettingsRow label={`Gap: ${gap}px`}>
              <input
                type="range"
                min={0}
                max={50}
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                aria-label="Card gap"
              />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection title="Accessibility">
            <AccessibilitySettings />
          </SettingsSection>

          <SettingsSection title="Data">
            <DataManagementSettings />
          </SettingsSection>
        </div>

        <footer className={styles.footer}>
          <button onClick={resetToDefaults} className={styles.resetButton}>
            Reset to Defaults
          </button>
        </footer>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.control}>{children}</div>
    </div>
  );
}
```

### Accessibility Settings

```tsx
// src/components/SettingsPanel/AccessibilitySettings.tsx
import { useSettingsStore } from '../../stores/settingsStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function AccessibilitySettings() {
  const systemReducedMotion = useReducedMotion();
  const { reduceMotion, highContrast, setReduceMotion, setHighContrast } = useSettingsStore();

  return (
    <>
      <SettingsRow label="Reduce motion">
        <select
          value={reduceMotion}
          onChange={(e) => setReduceMotion(e.target.value as 'system' | 'on' | 'off')}
          aria-describedby="reduce-motion-desc"
        >
          <option value="system">
            System ({systemReducedMotion ? 'On' : 'Off'})
          </option>
          <option value="on">On</option>
          <option value="off">Off</option>
        </select>
        <span id="reduce-motion-desc" className="sr-only">
          Reduces or disables animations throughout the application
        </span>
      </SettingsRow>

      <SettingsRow label="High contrast">
        <Toggle
          checked={highContrast}
          onChange={setHighContrast}
          aria-label="Enable high contrast mode"
        />
      </SettingsRow>
    </>
  );
}
```

### Data Management Settings

```tsx
// src/components/SettingsPanel/DataManagementSettings.tsx
import { useState } from 'react';
import { exportData, importData, getStorageEstimate } from '../../utils/storage';

export function DataManagementSettings() {
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    getStorageEstimate().then(setStorageInfo);
  }, []);

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itemdeck-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    await importData(text);
    window.location.reload(); // Reload to apply imported settings
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {storageInfo && (
        <SettingsRow label="Storage used">
          <span>
            {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
          </span>
        </SettingsRow>
      )}

      <SettingsRow label="Backup data">
        <button onClick={handleExport} className={styles.actionButton}>
          Export
        </button>
      </SettingsRow>

      <SettingsRow label="Restore data">
        <label className={styles.fileInput}>
          <span>Import</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            aria-label="Import backup file"
          />
        </label>
      </SettingsRow>

      <SettingsRow label="Clear all data">
        <ClearDataButton />
      </SettingsRow>
    </>
  );
}

function ClearDataButton() {
  const [confirming, setConfirming] = useState(false);

  const handleClear = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    localStorage.clear();
    const { clear } = await import('idb-keyval');
    await clear();
    window.location.reload();
  };

  return (
    <button
      onClick={handleClear}
      className={`${styles.actionButton} ${confirming ? styles.danger : ''}`}
      onBlur={() => setConfirming(false)}
    >
      {confirming ? 'Confirm Clear' : 'Clear'}
    </button>
  );
}
```

### Settings Panel Styles

```css
/* src/components/SettingsPanel/SettingsPanel.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.panel {
  background: var(--colour-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--colour-border);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.section {
  margin-bottom: var(--spacing-lg);
}

.sectionTitle {
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--colour-text-muted);
  margin-bottom: var(--spacing-sm);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.label {
  color: var(--colour-text-primary);
}

.control {
  flex-shrink: 0;
}

.footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--colour-border);
}

.resetButton {
  width: 100%;
  padding: var(--spacing-sm);
  background: transparent;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.danger {
  background: var(--colour-error);
  color: white;
  border-color: var(--colour-error);
}
```

### Settings Trigger Button

```tsx
// src/components/SettingsButton/SettingsButton.tsx
import { useState } from 'react';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import styles from './SettingsButton.module.css';

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={styles.button}
        aria-label="Open settings"
        aria-haspopup="dialog"
      >
        <SettingsIcon />
      </button>
      <SettingsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
```

## Implementation Tasks

- [ ] Create `SettingsPanel` component with modal overlay
- [ ] Create `SettingsSection` and `SettingsRow` components
- [ ] Integrate `ThemeToggle` in appearance section
- [ ] Integrate `LayoutSwitcher` in layout section
- [ ] Create card size sliders with live preview
- [ ] Create `AccessibilitySettings` component
- [ ] Create `DataManagementSettings` component
- [ ] Implement export/import functionality
- [ ] Implement clear data with confirmation
- [ ] Create `SettingsButton` with gear icon
- [ ] Add keyboard navigation (Tab, Escape to close)
- [ ] Add focus trap when panel is open
- [ ] Ensure all controls are accessible
- [ ] Write unit tests for settings panel
- [ ] Write integration tests for data operations

## Success Criteria

- [ ] Settings panel opens as modal dialog
- [ ] All settings grouped by category
- [ ] Theme, layout, and card size controls work
- [ ] Accessibility options functional
- [ ] Export creates downloadable JSON file
- [ ] Import restores from JSON file
- [ ] Clear data requires confirmation
- [ ] Reset to defaults works
- [ ] Keyboard fully navigable (Tab, Escape)
- [ ] Focus trapped in modal when open
- [ ] Screen readers announce dialog
- [ ] Tests pass

## Dependencies

- **Requires**: F-010 Theme System, F-011 Layout Presets, F-012 State Persistence
- **Blocks**: None

## Complexity

**Medium** - Integration of multiple subsystems with comprehensive UI.

---

## Related Documentation

- [Customisation Options Research](../../../../research/customisation-options.md)
- [State Persistence Research](../../../../research/state-persistence.md)
- [Accessibility Research](../../../../research/accessibility.md)
- [v0.3.0 Milestone](../../milestones/v0.3.md)
