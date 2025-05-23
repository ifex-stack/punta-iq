import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Use this to log global errors (especially useful in React Query)
const originalConsoleError = console.error;
console.error = function(...args) {
  // Suppress common harmless errors that cause unwanted error messages
  const suppressPatterns = [
    'ResizeObserver loop', 
    'WebSocket', 
    'aborted',
    'navigation',
    'cancelled',
    'NetworkError',
    'Network request failed',
    'Socket'
  ];
  
  // Check if this is an error we want to suppress from the UI
  const shouldSuppress = suppressPatterns.some(pattern => {
    return (
      args[0]?.includes?.(pattern) || 
      args[0]?.message?.includes?.(pattern) ||
      (args[0]?.toString && args[0].toString().includes(pattern))
    );
  });
  
  if (shouldSuppress) {
    // Still log to console in a less prominent way
    console.log('[Suppressed error]', ...args);
    return;
  }
  
  originalConsoleError.apply(console, args);
};

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  // Prevent the default browser handling of the error
  event.preventDefault();
  
  // Check if this is a navigation or WebSocket related error that we should ignore
  const errorText = event.reason?.toString() || '';
  if (
    errorText.includes('WebSocket') ||
    errorText.includes('aborted') ||
    errorText.includes('navigation') ||
    errorText.includes('cancelled') ||
    errorText.includes('NetworkError') ||
    errorText.includes('Network request failed') ||
    errorText.includes('Socket') ||
    // If error occurred during page transition
    document.hidden
  ) {
    console.log('[Suppressed unhandled rejection]', event.reason);
    return;
  }
  
  console.error('Unhandled Promise Rejection:', event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
