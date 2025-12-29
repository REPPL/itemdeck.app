/**
 * Stories for LoadingScreen component.
 *
 * Loading screen with progress indication. Displays a themed loading screen
 * during collection loading and optional image preloading phases.
 *
 * Note: LoadingScreen depends on several contexts (CollectionDataContext,
 * SourceStore) for full functionality. These stories demonstrate the
 * visual states in isolation.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { withProviders } from "../../../.storybook/decorators";

const meta: Meta = {
  title: "Components/LoadingScreen",
  decorators: [withProviders],
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj;

// Visual mockup component for stories
function LoadingScreenMock({
  phase,
  progress = 0,
  error,
  isOffline = false,
  githubUsername,
  collectionName,
}: {
  phase: "collection" | "images" | "complete" | "error" | "offline";
  progress?: number;
  error?: string;
  isOffline?: boolean;
  githubUsername?: string;
  collectionName?: string;
}) {
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    padding: "2rem",
  };

  const logoStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
  };

  const progressBarStyle: React.CSSProperties = {
    width: "200px",
    height: "4px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "2px",
    marginTop: "1.5rem",
    overflow: "hidden",
  };

  const progressFillStyle: React.CSSProperties = {
    width: `${String(progress)}%`,
    height: "100%",
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    transition: "width 0.3s ease",
  };

  if (isOffline) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            ...logoStyle,
            background: "#444",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          </svg>
        </div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          You appear to be offline
        </h2>
        <p style={{ color: "#888", textAlign: "center", maxWidth: "300px" }}>
          Cannot reach the collection source. Check your internet connection and
          try again.
        </p>
        <button
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            background: "#667eea",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            ...logoStyle,
            background: "#f44336",
          }}
        >
          !
        </div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          Failed to load collection
        </h2>
        <p style={{ color: "#f44336", marginBottom: "1rem" }}>{error}</p>
        <button
          style={{
            padding: "0.75rem 1.5rem",
            background: "#667eea",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const statusText =
    phase === "collection"
      ? githubUsername
        ? `Loading from ${githubUsername}'s collection...`
        : "Loading collection..."
      : phase === "images"
        ? `Caching ${collectionName ?? "images"}... ${String(Math.round(progress))}%`
        : "Ready!";

  return (
    <div style={containerStyle}>
      {githubUsername ? (
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img
            src={`https://github.com/${githubUsername}.png?size=128`}
            alt={`${githubUsername}'s avatar`}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              marginBottom: "0.5rem",
            }}
          />
          <p style={{ fontSize: "0.9rem", color: "#888" }}>{githubUsername}</p>
          {collectionName && (
            <p style={{ fontSize: "0.8rem", color: "#666" }}>{collectionName}</p>
          )}
        </div>
      ) : (
        <div style={logoStyle}>
          <span role="img" aria-label="cards">
            🃏
          </span>
        </div>
      )}
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>itemdeck</h1>
      <div style={progressBarStyle}>
        <div style={progressFillStyle} />
      </div>
      <p
        style={{
          marginTop: "1rem",
          color: "#888",
          fontSize: "0.9rem",
        }}
      >
        {statusText}
      </p>
      {phase === "images" && (
        <p
          style={{
            marginTop: "0.5rem",
            color: "#666",
            fontSize: "0.8rem",
          }}
        >
          First load may take a moment while images are cached.
        </p>
      )}
    </div>
  );
}

/**
 * Loading collection phase.
 */
export const Loading: Story = {
  render: () => <LoadingScreenMock phase="collection" progress={10} />,
};

/**
 * Loading with GitHub context (MyPlausibleMe source).
 */
export const WithGitHub: Story = {
  render: () => (
    <LoadingScreenMock
      phase="collection"
      progress={10}
      githubUsername="example-user"
      collectionName="My Games"
    />
  ),
};

/**
 * Image preloading phase.
 */
export const PreloadingImages: Story = {
  render: () => (
    <LoadingScreenMock
      phase="images"
      progress={45}
      collectionName="My Games"
    />
  ),
};

/**
 * Error state when collection fails to load.
 */
export const Error: Story = {
  render: () => (
    <LoadingScreenMock
      phase="error"
      error="Network request failed: Unable to fetch collection data"
    />
  ),
};

/**
 * Offline state when network is unavailable.
 */
export const Offline: Story = {
  render: () => <LoadingScreenMock phase="offline" isOffline={true} />,
};

/**
 * Complete - ready to show content.
 */
export const Complete: Story = {
  render: () => <LoadingScreenMock phase="complete" progress={100} />,
};
