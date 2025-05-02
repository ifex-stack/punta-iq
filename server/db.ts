import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// This flag will be set to true if there's a database connection issue
// and we'll use in-memory storage instead
export let useMemoryFallback = false;

// Configure WebSocket for Neon
try {
  neonConfig.webSocketConstructor = ws;
  // Set secure WebSocket to false to avoid SSL issues
  neonConfig.useSecureWebSocket = false;
} catch (error) {
  console.error("Error configuring Neon:", error);
  useMemoryFallback = true;
}

let pool: Pool;
let db: any;

// Try to set up the database connection, but don't fail if it doesn't work
try {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set, using memory storage");
    useMemoryFallback = true;
  } else {
    // Configure connection pool with retry-safe settings
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 3, // Reduce pool size for stability
      idleTimeoutMillis: 30000, // Reduce idle timeout to 30s
      connectionTimeoutMillis: 10000, // Connection timeout of 10s
    });

    // Add graceful error handling
    pool.on('error', (err) => {
      console.error('[Database] Pool error:', err);
      useMemoryFallback = true; // Switch to memory fallback on any pool error
    });

    db = drizzle(pool, { schema });
    console.log("Database connection pool established");
  }
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  useMemoryFallback = true;
}

// Export the connection objects, or undefined if we're using memory fallback
export { pool, db };