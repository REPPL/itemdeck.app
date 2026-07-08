/**
 * Tests for SourcesOverlay, focused on link URL safety
 * (collection-supplied URLs must not become javascript: hrefs).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourcesOverlay } from "@/components/SourcesOverlay/SourcesOverlay";

describe("SourcesOverlay link safety", () => {
  it("renders safe links with their original href", () => {
    render(
      <SourcesOverlay
        detailUrls={[{ url: "https://en.wikipedia.org/wiki/Example", source: "Wikipedia" }]}
        isOpen={true}
        onClose={vi.fn()}
        animationEnabled={false}
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://en.wikipedia.org/wiki/Example"
    );
  });

  it("renders no clickable link for javascript: URLs", () => {
    render(
      <SourcesOverlay
        detailUrls={[
          { url: "javascript:alert(1)", source: "Evil" },
          { url: "https://en.wikipedia.org/wiki/Example", source: "Wikipedia" },
        ]}
        isOpen={true}
        onClose={vi.fn()}
        animationEnabled={false}
      />
    );

    // The safe link survives; the javascript: one must not render as a link
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute(
      "href",
      "https://en.wikipedia.org/wiki/Example"
    );
    expect(
      document.querySelector('a[href^="javascript:"]')
    ).not.toBeInTheDocument();
  });
});
