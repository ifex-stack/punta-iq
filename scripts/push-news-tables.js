#!/usr/bin/env node

// This script pushes the schema to the database, creating missing tables related to the news feature
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';

// Required for Neon database in serverless environments
neonConfig.webSocketConstructor = ws;

// Define the news tables SQL creation statements
const createNewsTypeEnum = `
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'news_type') THEN
        CREATE TYPE news_type AS ENUM ('article', 'analysis', 'preview', 'recap', 'interview', 'opinion');
    END IF;
END$$;
`;

const createNewsArticlesTable = `
CREATE TABLE IF NOT EXISTS news_articles (
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
`;

const createUserNewsPreferencesTable = `
CREATE TABLE IF NOT EXISTS user_news_preferences (
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
`;

const createUserSavedNewsTable = `
CREATE TABLE IF NOT EXISTS user_saved_news (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT NOW() NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, article_id)
);
`;

// Create indexes
const createNewsIndexes = `
CREATE INDEX IF NOT EXISTS news_articles_sport_id_idx ON news_articles(sport_id);
CREATE INDEX IF NOT EXISTS news_articles_league_id_idx ON news_articles(league_id);
CREATE INDEX IF NOT EXISTS news_articles_published_at_idx ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS user_news_preferences_user_id_idx ON user_news_preferences(user_id);
CREATE INDEX IF NOT EXISTS user_saved_news_user_id_idx ON user_saved_news(user_id);
CREATE INDEX IF NOT EXISTS user_saved_news_article_id_idx ON user_saved_news(article_id);
`;

async function run() {
  console.log('Creating database connection...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    console.log('Creating news type enum...');
    await pool.query(createNewsTypeEnum);
    
    console.log('Creating news_articles table...');
    await pool.query(createNewsArticlesTable);
    
    console.log('Creating user_news_preferences table...');
    await pool.query(createUserNewsPreferencesTable);
    
    console.log('Creating user_saved_news table...');
    await pool.query(createUserSavedNewsTable);
    
    console.log('Creating indexes...');
    await pool.query(createNewsIndexes);
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();