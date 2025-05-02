import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
// Fix for "Control plane request failed: endpoint is disabled"
neonConfig.useSecureWebSocket = false;
neonConfig.forceDisableSsl = true; 
neonConfig.connectionTimeoutMillis = 60000; // Increase timeout to 60s
neonConfig.pipeliningEnabled = false; // Disable pipelining for stability

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Set max pool size
  idleTimeoutMillis: 30000, // Reduce idle timeout to 30s
  connectionTimeoutMillis: 10000, // Connection timeout of 10s
  maxUses: 100, // Max uses per connection to avoid stale connections
  maxLifetimeSeconds: 3600, // Max lifetime of connection to avoid memory issues
});

// Add graceful error handling
pool.on('error', (err) => {
  console.error('[Database] Pool error:', err);
});

export const db = drizzle(pool, { schema });