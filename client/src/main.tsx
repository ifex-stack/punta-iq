import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Use this to log global errors (especially useful in React Query)
const originalConsoleError = console.error;
console.error = function(...args) {
  // Suppress "ResizeObserver loop" error which is a harmless error
  if (args[0]?.includes?.('ResizeObserver loop') || args[0]?.message?.includes?.('ResizeObserver loop')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
