import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { logger } from './logger';
import * as schema from '@shared/schema';
import ws from 'ws';

// Safer error handling approach without modifying Pool directly
process.on('uncaughtException', (error) => {
  // Only catch TypeError related to ErrorEvent message property
  if (error instanceof TypeError && 
      error.message.includes('Cannot set property message of') && 
      error.message.includes('which has only a getter')) {
    logger.warn('Database', 'Caught and handled database connection error related to ErrorEvent message property');
    return;
  }
  
  // For other errors, log them but allow normal handling
  logger.error('UncaughtException', error.message);
  process.exit(1);
});

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
    // Initialize the connection pool with error handling
    try {
      pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,  // 5 second timeout
        max: 20  // Maximum pool size
      });
      
      // Test the connection
      pool.query('SELECT NOW()').then(() => {
        logger.info('Database', 'Successfully connected to PostgreSQL database');
        useMemoryFallback = false;
        
        // Initialize Drizzle ORM after successful connection
        db = drizzle(pool, { schema });
        logger.info('Database', 'Database connection initialized');
      }).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Database', `Failed to connect to PostgreSQL database: ${errorMessage}`);
        useMemoryFallback = true;
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Database', `Error initializing database connection: ${errorMessage}`);
      useMemoryFallback = true;
    }
  }
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Database', `Error initializing database connection: ${errorMessage}`);
  useMemoryFallback = true;
}

// Create default instances of pool and db to prevent null references
if (useMemoryFallback || !pool || !db) {
  logger.warn('Database', 'Using in-memory storage fallback - database operations will not persist');
  
  // Create a minimal Pool implementation with no-op methods
  const noopPool = {
    query: async () => ({ rows: [] }),
    end: async () => {},
    connect: async () => ({ 
      release: () => {},
      query: async () => ({ rows: [] })
    }),
    on: () => noopPool,
    release: () => {}
  };
  
  // Create a minimal Drizzle ORM implementation
  const noopDb = {
    select: () => ({ from: () => ({ where: () => [] }) }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [] }) })
  };
  
  // Assign the mock implementations
  pool = noopPool as any;
  db = noopDb as any;
}