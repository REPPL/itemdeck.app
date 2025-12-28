import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./styles/global.css";

/**
 * Early keyboard interception for Cmd-R / Ctrl-R.
 * This runs before React mounts to catch the browser's reload shortcut.
 * The actual dialog is shown via a custom event that React listens for.
 */
function setupEarlyKeyboardInterception(): void {
  window.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      // Intercept Cmd-R (Mac) or Ctrl-R (Windows/Linux)
      if (event.code === "KeyR" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        event.stopPropagation();
        // Dispatch custom event for React to handle
        window.dispatchEvent(new CustomEvent("app:reload-request"));
      }
    },
    true // Capture phase
  );
}

// Set up early interception immediately
setupEarlyKeyboardInterception();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find root element with id 'root'");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
