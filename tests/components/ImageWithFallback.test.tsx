/**
 * Tests for ImageWithFallback component and utilities.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  ImageWithFallback,
  SVGPlaceholder,
  ImageSkeleton,
} from "@/components/ImageWithFallback";
import {
  getInitials,
  generateColour,
} from "@/components/ImageWithFallback/placeholderUtils";

describe("getInitials", () => {
  it("returns first letters of first two words", () => {
    expect(getInitials("Super Mario Bros")).toBe("SM");
    expect(getInitials("The Legend of Zelda")).toBe("TL");
  });

  it("returns first two letters of single word", () => {
    expect(getInitials("Metroid")).toBe("ME");
    expect(getInitials("Tetris")).toBe("TE");
  });

  it("handles single character", () => {
    expect(getInitials("X")).toBe("X");
  });

  it("handles empty string", () => {
    expect(getInitials("")).toBe("?");
  });

  it("handles whitespace", () => {
    expect(getInitials("  ")).toBe("?");
  });

  it("uppercases initials", () => {
    expect(getInitials("super mario")).toBe("SM");
  });
});

describe("generateColour", () => {
  it("returns consistent colour for same input", () => {
    const colour1 = generateColour("Test");
    const colour2 = generateColour("Test");
    expect(colour1).toBe(colour2);
  });

  it("returns different colours for different inputs", () => {
    const colour1 = generateColour("Test");
    const colour2 = generateColour("Another");
    expect(colour1).not.toBe(colour2);
  });

  it("returns HSL colour format", () => {
    const colour = generateColour("Test");
    expect(colour).toMatch(/^hsl\(\d+, 45%, 35%\)$/);
  });
});

describe("SVGPlaceholder", () => {
  it("renders SVG with initials", () => {
    render(<SVGPlaceholder title="Super Mario" />);

    const svg = screen.getByRole("img", { name: /Placeholder for Super Mario/ });
    expect(svg).toBeInTheDocument();
    expect(screen.getByText("SM")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<SVGPlaceholder title="Test" className="custom-class" />);

    const svg = screen.getByRole("img");
    expect(svg).toHaveClass("custom-class");
  });
});

describe("ImageSkeleton", () => {
  it("renders loading skeleton", () => {
    render(<ImageSkeleton />);

    const skeleton = screen.getByRole("status", { name: /Loading image/ });
    expect(skeleton).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ImageSkeleton className="custom-class" />);

    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("custom-class");
  });
});

describe("ImageWithFallback", () => {
  it("shows title placeholder as base layer", () => {
    render(
      <ImageWithFallback
        src="https://example.com/image.jpg"
        alt="Test image"
        title="Test"
      />
    );

    // The placeholder with title is always visible as the base layer
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("shows image after successful load", async () => {
    render(
      <ImageWithFallback
        src="https://example.com/image.jpg"
        alt="Test image"
        title="Test"
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });
    fireEvent.load(img);

    // Image should remain visible after loading
    await waitFor(() => {
      expect(img).toBeInTheDocument();
    });
  });

  it("shows placeholder when image fails to load", async () => {
    render(
      <ImageWithFallback
        src="https://example.com/broken.jpg"
        alt="Test image"
        title="Test Title"
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });
    fireEvent.error(img);

    // When image fails, the img element is removed and title placeholder shows through
    await waitFor(() => {
      expect(screen.queryByRole("img", { name: "Test image" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("tries fallback image before placeholder", async () => {
    render(
      <ImageWithFallback
        src="https://example.com/broken.jpg"
        alt="Test image"
        title="Test Title"
        fallbackSrc="https://example.com/fallback.jpg"
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });

    // Trigger error on primary image
    fireEvent.error(img);

    await waitFor(() => {
      expect(img).toHaveAttribute("src", "https://example.com/fallback.jpg");
    });
  });

  it("shows placeholder when fallback also fails", async () => {
    render(
      <ImageWithFallback
        src="https://example.com/broken.jpg"
        alt="Test image"
        title="Test Title"
        fallbackSrc="https://example.com/fallback.jpg"
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });

    // Trigger error on primary image
    fireEvent.error(img);

    await waitFor(() => {
      expect(img).toHaveAttribute("src", "https://example.com/fallback.jpg");
    });

    // Trigger error on fallback image
    fireEvent.error(img);

    // When fallback fails, img element is removed and title placeholder shows through
    await waitFor(() => {
      expect(screen.queryByRole("img", { name: "Test image" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <ImageWithFallback
        src="https://example.com/image.jpg"
        alt="Test image"
        title="Test"
        className="custom-image-class"
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });
    expect(img).toHaveClass("custom-image-class");
  });

  it("supports lazy loading", () => {
    render(
      <ImageWithFallback
        src="https://example.com/image.jpg"
        alt="Test image"
        title="Test"
        loading="lazy"
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("supports eager loading", () => {
    render(
      <ImageWithFallback
        src="https://example.com/image.jpg"
        alt="Test image"
        title="Test"
        loading="eager"
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });
    expect(img).toHaveAttribute("loading", "eager");
  });
});
