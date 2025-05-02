import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { logger } from './logger';
import * as schema from '@shared/schema';
import ws from 'ws';

// Set up WebSocket for Neon Serverless
neonConfig.webSocketConstructor = ws;

// This flag will be used to determine if we should use in-memory storage fallback
export let useMemoryFallback = false;

// Database connection with integrated fallback
export let pool: Pool;
export let db: ReturnType<typeof drizzle>;

try {
  if (!process.env.DATABASE_URL) {
    logger.warn('Database', 'DATABASE_URL environment variable not set. Using in-memory storage.');
    useMemoryFallback = true;
  } else {
    // Initialize the connection pool
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,  // 5 second timeout
      max: 20  // Maximum pool size
    });
    
    // Test the connection
    pool.query('SELECT NOW()').then(() => {
      logger.info('Database', 'Successfully connected to PostgreSQL database');
      useMemoryFallback = false;
    }).catch(error => {
      logger.error('Database', `Failed to connect to PostgreSQL database: ${error.message}`);
      useMemoryFallback = true;
    });

    // Initialize Drizzle ORM
    db = drizzle(pool, { schema });
    
    logger.info('Database', 'Database connection initialized');
  }
} catch (error) {
  logger.error('Database', `Error initializing database connection: ${error.message}`);
  useMemoryFallback = true;
}

// If using memory fallback, create empty objects to prevent null references
if (useMemoryFallback) {
  logger.warn('Database', 'Using in-memory storage fallback - database operations will not persist');
  pool = {} as any;
  db = {} as any;
}