import { createRoot } from "react-dom/client";
import React from "react";
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

// Temporarily use a simple component to test rendering
const TestComponent = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      padding: '20px'
    }}>
      <h1>PuntaIQ App Test</h1>
      <p>If you can see this message, React is rendering correctly.</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => alert('Button clicked!')}>Test Button</button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/auth" style={{ color: 'blue', textDecoration: 'underline' }}>Go to Auth Page</a>
      </div>
    </div>
  );
};

// Use the test component for debugging
createRoot(document.getElementById("root")!).render(<TestComponent />);

// Comment out the App component for now
// createRoot(document.getElementById("root")!).render(<App />);
