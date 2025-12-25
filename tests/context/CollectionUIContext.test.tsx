/**
 * Tests for CollectionUIContext - collection-specific UI labels.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CollectionUIProvider,
  useUILabels,
  DEFAULT_UI_LABELS,
  type UILabels,
} from "@/context/CollectionUIContext";

/**
 * Test component that displays all UI labels.
 */
function TestComponent() {
  const labels = useUILabels();
  return (
    <div>
      <span data-testid="moreButton">{labels.moreButton}</span>
      <span data-testid="platformLabel">{labels.platformLabel}</span>
      <span data-testid="acknowledgementButton">{labels.acknowledgementButton}</span>
      <span data-testid="imageSourceLabel">{labels.imageSourceLabel}</span>
      <span data-testid="sourceButtonDefault">{labels.sourceButtonDefault}</span>
      <span data-testid="rankPlaceholder">{labels.rankPlaceholder}</span>
      <span data-testid="wikipediaLabel">{labels.wikipediaLabel}</span>
      <span data-testid="closeLabel">{labels.closeLabel}</span>
    </div>
  );
}

describe("CollectionUIProvider", () => {
  it("provides default labels when no overrides given", () => {
    render(
      <CollectionUIProvider>
        <TestComponent />
      </CollectionUIProvider>
    );

    expect(screen.getByTestId("moreButton")).toHaveTextContent("Verdict");
    expect(screen.getByTestId("platformLabel")).toHaveTextContent("Platform");
    expect(screen.getByTestId("acknowledgementButton")).toHaveTextContent("Acknowledgement");
    expect(screen.getByTestId("imageSourceLabel")).toHaveTextContent("Image Source");
    expect(screen.getByTestId("sourceButtonDefault")).toHaveTextContent("Source");
    expect(screen.getByTestId("rankPlaceholder")).toHaveTextContent("The one that got away!");
    expect(screen.getByTestId("wikipediaLabel")).toHaveTextContent("Wikipedia");
    expect(screen.getByTestId("closeLabel")).toHaveTextContent("Close");
  });

  it("merges partial label overrides with defaults", () => {
    const customLabels: Partial<UILabels> = {
      moreButton: "Details",
      rankPlaceholder: "Not ranked yet",
    };

    render(
      <CollectionUIProvider labels={customLabels}>
        <TestComponent />
      </CollectionUIProvider>
    );

    // Custom labels
    expect(screen.getByTestId("moreButton")).toHaveTextContent("Details");
    expect(screen.getByTestId("rankPlaceholder")).toHaveTextContent("Not ranked yet");

    // Defaults still present
    expect(screen.getByTestId("platformLabel")).toHaveTextContent("Platform");
    expect(screen.getByTestId("imageSourceLabel")).toHaveTextContent("Image Source");
  });

  it("allows complete label override", () => {
    const customLabels: Partial<UILabels> = {
      moreButton: "More Info",
      platformLabel: "System",
      acknowledgementButton: "Credits",
      imageSourceLabel: "Photo Credit",
      sourceButtonDefault: "Learn More",
      rankPlaceholder: "Unranked",
      wikipediaLabel: "Wiki",
      closeLabel: "Dismiss",
    };

    render(
      <CollectionUIProvider labels={customLabels}>
        <TestComponent />
      </CollectionUIProvider>
    );

    expect(screen.getByTestId("moreButton")).toHaveTextContent("More Info");
    expect(screen.getByTestId("platformLabel")).toHaveTextContent("System");
    expect(screen.getByTestId("acknowledgementButton")).toHaveTextContent("Credits");
    expect(screen.getByTestId("imageSourceLabel")).toHaveTextContent("Photo Credit");
    expect(screen.getByTestId("sourceButtonDefault")).toHaveTextContent("Learn More");
    expect(screen.getByTestId("rankPlaceholder")).toHaveTextContent("Unranked");
    expect(screen.getByTestId("wikipediaLabel")).toHaveTextContent("Wiki");
    expect(screen.getByTestId("closeLabel")).toHaveTextContent("Dismiss");
  });

  it("handles undefined labels gracefully", () => {
    render(
      <CollectionUIProvider labels={undefined}>
        <TestComponent />
      </CollectionUIProvider>
    );

    // Should fall back to defaults
    expect(screen.getByTestId("moreButton")).toHaveTextContent("Verdict");
    expect(screen.getByTestId("rankPlaceholder")).toHaveTextContent("The one that got away!");
  });
});

describe("useUILabels", () => {
  it("returns default labels when used outside provider", () => {
    // Note: This works because we use defaultValue in createContext
    render(<TestComponent />);

    expect(screen.getByTestId("moreButton")).toHaveTextContent("Verdict");
    expect(screen.getByTestId("platformLabel")).toHaveTextContent("Platform");
  });
});

describe("DEFAULT_UI_LABELS", () => {
  it("has all required label keys", () => {
    const requiredKeys: (keyof UILabels)[] = [
      "moreButton",
      "platformLabel",
      "acknowledgementButton",
      "imageSourceLabel",
      "sourceButtonDefault",
      "rankPlaceholder",
      "wikipediaLabel",
      "closeLabel",
    ];

    requiredKeys.forEach((key) => {
      expect(DEFAULT_UI_LABELS).toHaveProperty(key);
      expect(typeof DEFAULT_UI_LABELS[key]).toBe("string");
    });
  });

  it("has non-empty default values", () => {
    Object.values(DEFAULT_UI_LABELS).forEach((value) => {
      expect(value.length).toBeGreaterThan(0);
    });
  });
});
