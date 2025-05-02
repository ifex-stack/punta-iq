// We're completely skipping the database connection to avoid critical errors
// and only using in-memory storage

// This flag will always be true to use in-memory storage instead
export const useMemoryFallback = true;

console.log("[Database] Using in-memory storage only - bypassing database connection");

// Define empty objects to prevent null references in imports
export const pool = {} as any;
export const db = {} as any;