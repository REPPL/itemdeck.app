/**
 * FilterChips component for displaying and managing active filters.
 *
 * Shows dismissible chips for each active filter and provides
 * dropdowns for adding new filters.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./FilterChips.module.css";

interface FilterChipsProps {
  /** Available filter options */
  filterOptions?: {
    platforms: string[];
    years: number[];
    genres: string[];
  };
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

/**
 * Individual filter chip.
 */
function FilterChip({
  field,
  values,
  onRemove,
}: {
  field: string;
  values: string[];
  onRemove: () => void;
}) {
  // Map field names to display labels
  const fieldLabels: Record<string, string> = {
    categoryTitle: "Platform",
    year: "Year",
    "genres[0]": "Genre",
  };

  const label = fieldLabels[field] ?? field;
  const valueText = values.length > 1 ? `${String(values.length)} selected` : values[0];

  return (
    <span className={styles.chip}>
      <span className={styles.chipLabel}>{label}:</span>
      <span className={styles.chipValue}>{valueText}</span>
      <button
        type="button"
        className={styles.chipRemove}
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
      >
        <CloseIcon />
      </button>
    </span>
  );
}

/**
 * Add filter dropdown.
 */
function AddFilterDropdown({
  filterOptions,
}: {
  filterOptions?: FilterChipsProps["filterOptions"];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const setFilter = useSettingsStore((state) => state.setFilter);
  const activeFilters = useSettingsStore((state) => state.activeFilters);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedField(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleFieldSelect = useCallback((field: string) => {
    setSelectedField(field);
  }, []);

  const handleValueSelect = useCallback(
    (field: string, value: string) => {
      const existingFilter = activeFilters.find((f) => f.field === field);
      const currentValues = existingFilter?.values ?? [];

      if (currentValues.includes(value)) {
        // Remove value
        setFilter(field, currentValues.filter((v) => v !== value));
      } else {
        // Add value
        setFilter(field, [...currentValues, value]);
      }
    },
    [activeFilters, setFilter]
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSelectedField(null);
  }, []);

  if (!filterOptions) return null;

  const filterFields = [
    { field: "categoryTitle", label: "Platform", options: filterOptions.platforms },
    { field: "year", label: "Year", options: filterOptions.years.map(String) },
    { field: "genres[0]", label: "Genre", options: filterOptions.genres },
  ].filter((f) => f.options.length > 0);

  if (filterFields.length === 0) return null;

  const selectedFieldData = filterFields.find((f) => f.field === selectedField);
  const activeFilterForField = selectedField
    ? activeFilters.find((f) => f.field === selectedField)
    : null;

  return (
    <div className={styles.addFilterContainer} ref={dropdownRef}>
      <button
        type="button"
        className={styles.addFilterButton}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Add filter"
      >
        <FilterIcon />
        <PlusIcon />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {selectedField === null ? (
            // Field selection
            <div className={styles.dropdownSection}>
              <div className={styles.dropdownHeader}>Filter by</div>
              {filterFields.map(({ field, label }) => (
                <button
                  key={field}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => { handleFieldSelect(field); }}
                >
                  {label}
                  <span className={styles.dropdownCount}>
                    {filterOptions[field === "categoryTitle" ? "platforms" : field === "year" ? "years" : "genres"].length}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            // Value selection
            <div className={styles.dropdownSection}>
              <button
                type="button"
                className={styles.dropdownBack}
                onClick={() => { setSelectedField(null); }}
              >
                ← {selectedFieldData?.label}
              </button>
              <div className={styles.dropdownOptions}>
                {selectedFieldData?.options.map((option) => {
                  const isSelected = activeFilterForField?.values.includes(option);
                  return (
                    <label key={option} className={styles.dropdownOption}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { handleValueSelect(selectedField, option); }}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Filter chips container with active filters and add button.
 */
export function FilterChips({ filterOptions }: FilterChipsProps) {
  const activeFilters = useSettingsStore((state) => state.activeFilters);
  const clearFilter = useSettingsStore((state) => state.clearFilter);
  const clearAllFilters = useSettingsStore((state) => state.clearAllFilters);

  return (
    <div className={styles.container}>
      {activeFilters.map((filter) => (
        <FilterChip
          key={filter.field}
          field={filter.field}
          values={filter.values}
          onRemove={() => { clearFilter(filter.field); }}
        />
      ))}

      {activeFilters.length > 1 && (
        <button
          type="button"
          className={styles.clearAllButton}
          onClick={clearAllFilters}
        >
          Clear all
        </button>
      )}

      <AddFilterDropdown filterOptions={filterOptions} />
    </div>
  );
}

export default FilterChips;
