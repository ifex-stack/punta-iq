import { sql } from 'drizzle-orm';
import { db, pool } from './db';
import { logger } from './logger';

/**
 * Initialize database tables and indexes that might be missing
 */
export async function initializeDatabase() {
  logger.info('Database', 'Starting database initialization check');
  
  try {
    // Check if news_type enum exists
    const enumExists = await checkIfEnumExists('news_type');
    if (!enumExists) {
      logger.info('Database', 'Creating news_type enum');
      await pool.query(`
        CREATE TYPE news_type AS ENUM ('article', 'analysis', 'preview', 'recap', 'interview', 'opinion')
      `);
    }
    
    // Check if news_articles table exists
    const newsTableExists = await checkIfTableExists('news_articles');
    if (!newsTableExists) {
      logger.info('Database', 'Creating news_articles table');
      await pool.query(`
        CREATE TABLE news_articles (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          summary TEXT NOT NULL,
          author TEXT,
          source TEXT,
          source_url TEXT,
          published_at TIMESTAMP NOT NULL,
          image_url TEXT,
          sport_id INTEGER REFERENCES sports(id),
          league_id INTEGER REFERENCES leagues(id),
          team TEXT,
          type news_type DEFAULT 'article',
          tags JSONB,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
    }
    
    // Check if user_news_preferences table exists
    const preferencesTableExists = await checkIfTableExists('user_news_preferences');
    if (!preferencesTableExists) {
      logger.info('Database', 'Creating user_news_preferences table');
      await pool.query(`
        CREATE TABLE user_news_preferences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          favorite_teams JSONB DEFAULT '[]',
          favorite_sports JSONB DEFAULT '[]',
          favorite_leagues JSONB DEFAULT '[]',
          preferred_content_types JSONB DEFAULT '[]',
          excluded_tags JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
    }
    
    // Check if user_saved_news table exists
    const savedNewsTableExists = await checkIfTableExists('user_saved_news');
    if (!savedNewsTableExists) {
      logger.info('Database', 'Creating user_saved_news table');
      await pool.query(`
        CREATE TABLE user_saved_news (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
          saved_at TIMESTAMP DEFAULT NOW() NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          UNIQUE(user_id, article_id)
        );
      `);
    }
    
    // Create indexes if they don't exist
    if (newsTableExists) {
      logger.info('Database', 'Creating news indexes');
      await createIndexIfNotExists('news_articles_sport_id_idx', 'news_articles', 'sport_id');
      await createIndexIfNotExists('news_articles_league_id_idx', 'news_articles', 'league_id');
      await createIndexIfNotExists('news_articles_published_at_idx', 'news_articles', 'published_at');
    }
    
    if (preferencesTableExists) {
      await createIndexIfNotExists('user_news_preferences_user_id_idx', 'user_news_preferences', 'user_id');
    }
    
    if (savedNewsTableExists) {
      await createIndexIfNotExists('user_saved_news_user_id_idx', 'user_saved_news', 'user_id');
      await createIndexIfNotExists('user_saved_news_article_id_idx', 'user_saved_news', 'article_id');
    }
    
    logger.info('Database', 'Database initialization completed successfully');
  } catch (error) {
    logger.error('Database', 'Error during database initialization', error);
  }
}

/**
 * Check if a table exists in the database
 */
async function checkIfTableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `, [tableName]);
  
  return result.rows[0].exists;
}

/**
 * Check if an enum type exists in the database
 */
async function checkIfEnumExists(enumName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type 
      WHERE typname = $1
    );
  `, [enumName]);
  
  return result.rows[0].exists;
}

/**
 * Create an index if it doesn't exist
 */
async function createIndexIfNotExists(indexName: string, tableName: string, columnName: string): Promise<void> {
  try {
    // Check if index exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = $1
      );
    `, [indexName]);
    
    if (!result.rows[0].exists) {
      logger.info('Database', `Creating index ${indexName}`);
      await pool.query(`
        CREATE INDEX ${indexName} ON ${tableName}(${columnName});
      `);
    }
  } catch (error) {
    logger.error('Database', `Error creating index ${indexName}`, error);
  }
}