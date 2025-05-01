import { sql } from 'drizzle-orm';
import { db, pool } from './db';
import { logger } from './logger';

/**
 * Initialize database tables and indexes that might be missing
 */
export async function initializeDatabase() {
  logger.info('Database', 'Starting database initialization check');
  
  try {
    // News feature has been removed as part of application streamlining
    // Skip news-related database initialization
    
    /* 
    // Original news-related code commented out
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
          teams JSONB DEFAULT '[]',
          type news_type DEFAULT 'article',
          ai_generated BOOLEAN DEFAULT FALSE NOT NULL,
          ai_enhanced BOOLEAN DEFAULT FALSE NOT NULL,
          is_premium BOOLEAN DEFAULT FALSE NOT NULL,
          tags JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
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
          read_at TIMESTAMP,
          UNIQUE(user_id, article_id)
        );
      `);
    }
    
    // News feature removed - all table updates are now skipped
    /* 
    // Check and update existing tables if needed
    if (newsTableExists) {
      logger.info('Database', 'Checking news_articles table for missing columns');
      
      // Check for teams column
      await addColumnIfNotExists('news_articles', 'teams', 'JSONB DEFAULT \'[]\'');
      
      // Check for AI-related columns
      await addColumnIfNotExists('news_articles', 'ai_generated', 'BOOLEAN DEFAULT FALSE NOT NULL');
      await addColumnIfNotExists('news_articles', 'ai_enhanced', 'BOOLEAN DEFAULT FALSE NOT NULL');
      await addColumnIfNotExists('news_articles', 'is_premium', 'BOOLEAN DEFAULT FALSE NOT NULL');
      await addColumnIfNotExists('news_articles', 'updated_at', 'TIMESTAMP DEFAULT NOW() NOT NULL');
      
      // Create indexes
      logger.info('Database', 'Creating news indexes');
      await createIndexIfNotExists('news_articles_sport_id_idx', 'news_articles', 'sport_id');
      await createIndexIfNotExists('news_articles_league_id_idx', 'news_articles', 'league_id');
      await createIndexIfNotExists('news_articles_published_at_idx', 'news_articles', 'published_at');
    }
    
    if (preferencesTableExists) {
      await createIndexIfNotExists('user_news_preferences_user_id_idx', 'user_news_preferences', 'user_id');
    }
    
    if (savedNewsTableExists) {
      logger.info('Database', 'Checking user_saved_news table for missing columns');
      
      // Check for read_at column
      await addColumnIfNotExists('user_saved_news', 'read_at', 'TIMESTAMP');
      
      // Create indexes
      await createIndexIfNotExists('user_saved_news_user_id_idx', 'user_saved_news', 'user_id');
      await createIndexIfNotExists('user_saved_news_article_id_idx', 'user_saved_news', 'article_id');
    }
    */
    
    // News articles creation has been removed
    /*
    // Check if there are any news articles; if not, create initial ones
    const hasNews = await hasAnyNewsArticles();
    if (!hasNews) {
      logger.info('Database', 'No news articles found, creating initial news feed');
      await createInitialNewsArticles();
    }
    */
    
    logger.info('Database', 'Database initialization completed successfully');
  } catch (error) {
    logger.error('Database', 'Error during database initialization', error);
  }
}

/**
 * Check if there are any news articles in the database
 */
async function hasAnyNewsArticles(): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM news_articles LIMIT 1
    );
  `);
  
  return result.rows[0].exists;
}

/**
 * Create initial news articles for the news feed
 */
async function createInitialNewsArticles(): Promise<void> {
  // Recent sports news articles (April 2025)
  const initialArticles = [
    {
      title: "Premier League Title Race Heats Up with Five Games Left",
      content: `The Premier League title race is coming down to the wire with just five games remaining in the 2024-25 season. Manchester City, Arsenal, and Liverpool are separated by just four points at the top of the table, setting up a thrilling finish to one of the closest seasons in recent memory.

Manchester City currently leads with 77 points, followed by Arsenal with 75 and Liverpool with 73. Each team faces difficult fixtures in the run-in, with several head-to-head matches between the contenders still to come.

Arsenal manager Mikel Arteta commented, "Every match is like a final now. We've put ourselves in a strong position, but we know the quality of our competitors means we can't afford to drop points anywhere."

Liverpool's recent form has been exceptional, winning six consecutive matches to put themselves back into contention after a mid-season dip.

Sports analysts suggest this could be the first three-team title race to go to the final day since the 2013-14 season.`,
      summary: "Manchester City, Arsenal, and Liverpool are separated by just four points with five games remaining in what could be the closest Premier League title race in years.",
      author: "James Thompson",
      source: "Sports Daily",
      sourceUrl: "https://sportsdaily.com/premier-league-title-race-heats-up",
      publishedAt: new Date("2025-04-25T15:30:00Z"),
      imageUrl: "https://images.unsplash.com/photo-1624526267942-adbb6abcbf3f?q=80&w=1000&auto=format&fit=crop",
      sportId: 1, // Football
      leagueId: 1, // Premier League
      teams: ["Manchester City", "Arsenal", "Liverpool"],
      type: "article",
      tags: ["Premier League", "Title Race", "Manchester City", "Arsenal", "Liverpool"]
    },
    {
      title: "New NBA Playoff Format Receives Mixed Reviews After First Round",
      content: `The NBA's new playoff format, introduced for the 2024-25 season, has received mixed reviews from fans, players, and coaches as the first round concludes. The expanded play-in tournament and adjusted seeding rules have created some unexpected matchups and controversial eliminations.

The most significant change saw the elimination of conference-based seeding in favor of a league-wide ranking system for the top 16 teams. This resulted in several cross-conference matchups in the first round, including the highly anticipated series between the Los Angeles Lakers and Boston Celtics that would traditionally have only been possible in the NBA Finals.

"I think it's brought fresh energy to the playoffs," said NBA Commissioner Adam Silver. "We're seeing matchups that fans have never had the chance to see in a playoff context before, and the intensity has been incredible."

However, some coaches have expressed concerns about the increased travel demands, particularly for East vs. West matchups. The Lakers-Celtics series required multiple cross-country flights in a short timeframe.

"The travel is definitely a challenge," said Celtics coach Joe Mazzulla. "It adds another strategic element in terms of rest and recovery, but it's tough on the players."

Fan reactions have been similarly divided, with many appreciating the novelty of new matchups while others miss the traditional conference-based format.`,
      summary: "The NBA's new playoff format featuring cross-conference matchups has divided opinion among players, coaches and fans after the conclusion of the first round.",
      author: "Marcus Williams",
      source: "Basketball Network",
      sourceUrl: "https://basketballnetwork.com/nba-playoff-format-mixed-reviews",
      publishedAt: new Date("2025-04-26T18:45:00Z"),
      imageUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1000&auto=format&fit=crop",
      sportId: 2, // Basketball
      leagueId: 3, // NBA
      teams: ["Los Angeles Lakers", "Boston Celtics"],
      type: "analysis",
      tags: ["NBA", "Playoffs", "Format Change", "Lakers", "Celtics"]
    },
    {
      title: "Nigeria Super Eagles Announce Squad for 2026 World Cup Qualifiers",
      content: `The Nigeria Football Federation has announced a 26-man squad for the upcoming 2026 FIFA World Cup qualifying matches against Ghana and Mali scheduled for early May. The squad includes several Premier League stars alongside promising domestic league talents.

Head coach Emmanuel Amunike has recalled Victor Osimhen following his recovery from injury, with the striker having scored 22 goals in Serie A this season. The squad also features Ademola Lookman, Samuel Chukwueze, and the in-form Alex Iwobi.

"We have selected a balanced team that combines experience with young talent," said Amunike. "The qualifiers are crucial for our World Cup ambitions, and we are focused on securing maximum points from these two matches."

A notable inclusion is 19-year-old Chidera Ejuke from Remo Stars, who earns his first call-up after an impressive season in the Nigeria Professional Football League where he has contributed 14 goals and 9 assists.

Nigeria currently sits second in their qualifying group with 7 points from 3 matches, behind Ghana who have a superior goal difference. The top team from each group will qualify automatically for the 2026 World Cup, while the best four runners-up will advance to a playoff round.`,
      summary: "Nigeria has named a strong 26-man squad featuring Victor Osimhen and other international stars for critical World Cup qualifying matches against Ghana and Mali in May.",
      author: "Oluwaseun Adebayo",
      source: "African Football News",
      sourceUrl: "https://africanfootballnews.com/nigeria-squad-world-cup-qualifiers",
      publishedAt: new Date("2025-04-27T09:15:00Z"),
      imageUrl: "https://images.unsplash.com/photo-1602674809970-89b9129a2bf8?q=80&w=1000&auto=format&fit=crop",
      sportId: 1, // Football
      leagueId: 6, // International
      teams: ["Nigeria", "Ghana", "Mali"],
      type: "preview",
      tags: ["Nigeria", "World Cup Qualifiers", "Super Eagles", "Africa"]
    },
    {
      title: "Formula 1 to Introduce Sustainable Fuel Regulations for 2026 Season",
      content: `Formula 1 has announced comprehensive new regulations for 2026 that will see the sport shift entirely to sustainable fuels as part of its commitment to become carbon neutral by 2030. The announcement comes after two years of research and development in partnership with fuel suppliers and teams.

The new regulations will require all F1 cars to run on 100% sustainable fuel made from advanced biofuels and innovative carbon capture technologies. The FIA claims this will reduce the sport's carbon emissions by over 60% compared to 2021 levels.

"This is a landmark moment for Formula 1," said FIA President Mohammed Ben Sulayem. "These new regulations will not only drive significant environmental improvements but will also accelerate the development of sustainable fuel technologies that can be transferred to road cars."

The 2026 regulations will coincide with the introduction of new power units that will increase the electrical power component while maintaining high performance. Current engine suppliers Ferrari, Mercedes, Renault, and Honda have all confirmed their commitment to the new regulations, while Audi will join the grid as a new manufacturer.

"We're determined to be at the forefront of sustainable motorsport," said F1 CEO Stefano Domenicali. "These regulations ensure F1 remains the ultimate proving ground for technology while addressing our environmental responsibilities."`,
      summary: "Formula 1 has unveiled new regulations for 2026 requiring 100% sustainable fuels and enhanced hybrid systems as part of its carbon neutrality goals.",
      author: "Elena Rodriguez",
      source: "Motorsport Global",
      sourceUrl: "https://motorsportglobal.com/f1-sustainable-fuel-regulations-2026",
      publishedAt: new Date("2025-04-24T14:20:00Z"),
      imageUrl: "https://images.unsplash.com/photo-1505739679850-7c0925d18ec4?q=80&w=1000&auto=format&fit=crop",
      sportId: 4, // Motorsport
      leagueId: 5, // Formula 1
      teams: ["Ferrari", "Mercedes", "Renault", "Honda", "Audi"],
      type: "article",
      tags: ["Formula 1", "Sustainability", "Regulations", "2026"]
    },
    {
      title: "Tennis Grand Slam Calendar Expansion Proposed for 2027",
      content: `The International Tennis Federation (ITF) is considering a proposal to expand the Grand Slam calendar from four to six tournaments starting in 2027. The proposal would elevate two existing ATP/WTA 1000 tournaments to Grand Slam status in response to the sport's growing global audience.

According to sources close to the ITF, the Indian Wells Masters in California and the China Open in Beijing are the leading candidates for promotion to Grand Slam status. The move would bring Grand Slam tennis to Asia for the first time and add a third major tournament in the United States.

"Tennis has evolved into a truly global sport, and our most prestigious events should reflect that global footprint," said an ITF spokesperson. "We're examining how to grow the sport while respecting its traditions and ensuring the highest competitive standards."

The proposal has received mixed reactions from players. World number one Carlos Alcaraz expressed support for the expansion, stating: "More Grand Slams means more opportunities for players and fans to experience the highest level of tennis." However, several veteran players have voiced concerns about the physical demands of adding two more two-week tournaments to an already congested calendar.

Any changes would require approval from the ITF, the ATP, the WTA, and the four existing Grand Slam tournaments. A final decision is expected by the end of this year.`,
      summary: "The International Tennis Federation is considering expanding the Grand Slam calendar from four to six tournaments by 2027, potentially adding events in California and Beijing.",
      author: "Sophia Chen",
      source: "Tennis Today",
      sourceUrl: "https://tennistoday.com/grand-slam-calendar-expansion-proposal",
      publishedAt: new Date("2025-04-21T11:50:00Z"),
      imageUrl: "https://images.unsplash.com/photo-1622279457486-28dc18b2e1c3?q=80&w=1000&auto=format&fit=crop",
      sportId: 3, // Tennis
      leagueId: 4, // Grand Slams
      teams: [],
      type: "analysis",
      tags: ["Tennis", "Grand Slams", "ITF", "Calendar", "Expansion"]
    }
  ];
  
  // Insert articles one by one
  try {
    for (const article of initialArticles) {
      await pool.query(`
        INSERT INTO news_articles (
          title, content, summary, author, source, source_url, published_at, image_url, 
          sport_id, league_id, teams, type, tags, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        )
      `, [
        article.title,
        article.content,
        article.summary,
        article.author,
        article.source,
        article.sourceUrl,
        article.publishedAt,
        article.imageUrl,
        article.sportId,
        article.leagueId,
        JSON.stringify(article.teams),
        article.type,
        JSON.stringify(article.tags)
      ]);
    }
    
    logger.info('Database', `Successfully created ${initialArticles.length} initial news articles`);
  } catch (error) {
    logger.error('Database', 'Error creating initial news articles', error);
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

/**
 * Add a column to a table if it doesn't exist
 */
async function addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string): Promise<void> {
  try {
    // Check if column exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 
        AND column_name = $2
      );
    `, [tableName, columnName]);
    
    if (!result.rows[0].exists) {
      logger.info('Database', `Adding column ${columnName} to ${tableName}`);
      await pool.query(`
        ALTER TABLE ${tableName} 
        ADD COLUMN ${columnName} ${columnDefinition};
      `);
    }
  } catch (error) {
    logger.error('Database', `Error adding column ${columnName} to ${tableName}`, error);
  }
}