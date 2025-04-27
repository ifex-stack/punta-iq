import { Express } from "express";
import { db, pool } from "./db";
import { newsArticles } from "@shared/schema";
import { desc, sql, asc, eq, isNull, and, or } from "drizzle-orm";
import { storage } from "./storage";

export function setupNewsRoutes(app: Express) {
  console.log("Setting up news routes...");
  
  // Get user's saved articles - fixed version
  app.get("/api/news/saved-fixed", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user?.id;
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user identification" });
      }
      
      console.log("Fetching saved articles for user:", userId);
      
      // Use direct SQL with proper join to avoid any Drizzle ORM issues
      const { rows } = await pool.query(`
        SELECT 
          usn.id,
          usn.user_id AS "userId",
          usn.article_id AS "articleId",
          usn.saved_at AS "savedAt",
          na.id AS "article.id",
          na.title AS "article.title",
          na.summary AS "article.summary",
          na.content AS "article.content",
          na.author AS "article.author",
          na.source AS "article.source",
          na.source_url AS "article.sourceUrl",
          na.published_at AS "article.publishedAt",
          na.image_url AS "article.imageUrl",
          na.sport_id AS "article.sportId",
          na.league_id AS "article.leagueId",
          na.teams AS "article.teams",
          na.type AS "article.type",
          na.ai_generated AS "article.aiGenerated",
          na.ai_enhanced AS "article.aiEnhanced",
          na.is_premium AS "article.isPremium",
          COALESCE(na.tags, '[]') AS "article.tags",
          COALESCE(na.views, 0) AS "article.views",
          COALESCE(na.likes, 0) AS "article.likes",
          na.created_at AS "article.createdAt",
          na.updated_at AS "article.updatedAt"
        FROM 
          user_saved_news AS usn
        INNER JOIN 
          news_articles AS na ON usn.article_id = na.id
        WHERE 
          usn.user_id = $1
        ORDER BY 
          usn.saved_at DESC
      `, [userId]);
      
      // Process the results to create the expected nested structure
      const results = rows.map(row => {
        // Create a nested structure by processing all fields that start with "article."
        const article: any = {};
        const savedArticle: any = {};
        
        // Extract base fields
        Object.keys(row).forEach(key => {
          if (key.startsWith("article.")) {
            // This is an article property
            const articleProp = key.replace("article.", "");
            article[articleProp] = row[key];
          } else {
            // This is a saved article property
            savedArticle[key] = row[key];
          }
        });
        
        // Add the article object to the result
        savedArticle.article = article;
        
        return savedArticle;
      });
      
      console.log(`Found ${results.length} saved articles for user ${userId}`);
      res.json(results);
    } catch (error: any) {
      console.error("Error fetching saved articles:", error);
      res.status(500).json({ 
        message: error.message || "Failed to fetch saved articles"
      });
    }
  });

  // News Feed - All articles with pagination 
  app.get("/api/news/all", async (req, res) => {
    try {
      console.log("Fetching all news articles with pagination");
      
      // Ensure numeric values with defaults
      let limit = 10;
      let offset = 0;
      
      try {
        if (req.query.limit) {
          const parsedLimit = parseInt(req.query.limit as string);
          if (!isNaN(parsedLimit) && parsedLimit > 0) {
            limit = parsedLimit;
          }
        }
        
        if (req.query.offset) {
          const parsedOffset = parseInt(req.query.offset as string);
          if (!isNaN(parsedOffset) && parsedOffset >= 0) {
            offset = parsedOffset;
          }
        }
      } catch (parseError) {
        console.warn("Invalid pagination parameters, using defaults", parseError);
      }
      
      console.log(`Using limit: ${limit}, offset: ${offset}`);
      
      // Using direct SQL to avoid Drizzle ORM type conflicts
      const { rows } = await pool.query(`
        SELECT 
          id, 
          title, 
          summary, 
          image_url AS "imageUrl", 
          published_at AS "publishedAt", 
          author, 
          source,
          sport_id AS "sportId",
          COALESCE(views, 0) AS views,
          COALESCE(likes, 0) AS likes
        FROM news_articles 
        ORDER BY published_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      console.log(`Found ${rows.length} news articles`);
      
      res.json(rows);
    } catch (error: any) {
      console.error("Error fetching news articles:", error);
      res.status(500).json({ 
        message: error.message || "Failed to fetch news articles"
      });
    }
  });

  // Fixed trending endpoint using direct SQL
  app.get("/api/news/trending-fixed", async (req, res) => {
    try {
      console.log("Fetching trending news with direct SQL");
      
      // Safely parse the limit value
      let limit = 5;
      try {
        if (req.query.count) {
          const parsedLimit = parseInt(req.query.count as string);
          if (!isNaN(parsedLimit) && parsedLimit > 0) {
            limit = parsedLimit;
          }
        }
      } catch (parseError) {
        console.warn("Invalid count parameter, using default limit of 5", parseError);
      }
      
      console.log(`Using limit: ${limit}`);
      
      // Use direct SQL query with COALESCE to handle null values
      const { rows } = await pool.query(`
        SELECT 
          id, 
          title, 
          summary, 
          image_url AS "imageUrl", 
          published_at AS "publishedAt", 
          author, 
          source,
          sport_id AS "sportId",
          COALESCE(views, 0) AS views,
          COALESCE(likes, 0) AS likes
        FROM news_articles 
        ORDER BY (COALESCE(views, 0) + COALESCE(likes, 0) * 2) DESC, published_at DESC 
        LIMIT $1
      `, [limit]);
      
      console.log(`Found ${rows.length} trending articles`);
      res.json(rows);
    } catch (error: any) {
      console.error("Error fetching trending articles:", error);
      res.status(500).json({ 
        message: error.message || "Failed to fetch trending articles"
      });
    }
  });
  
  // Get sports-specific news
  app.get("/api/news/sport/:sportId", async (req, res) => {
    try {
      const sportId = parseInt(req.params.sportId);
      
      if (isNaN(sportId)) {
        return res.status(400).json({ message: "Invalid sport ID" });
      }
      
      let limit = 10;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = parsedLimit;
        }
      }
      
      const { rows } = await pool.query(`
        SELECT 
          id, 
          title, 
          summary, 
          image_url AS "imageUrl", 
          published_at AS "publishedAt", 
          author, 
          source,
          sport_id AS "sportId",
          COALESCE(views, 0) AS views,
          COALESCE(likes, 0) AS likes
        FROM news_articles 
        WHERE sport_id = $1
        ORDER BY published_at DESC 
        LIMIT $2
      `, [sportId, limit]);
      
      console.log(`Found ${rows.length} articles for sport ID ${sportId}`);
      res.json(rows);
    } catch (error: any) {
      console.error(`Error fetching sport articles:`, error);
      res.status(500).json({ 
        message: error.message || "Failed to fetch sport articles"
      });
    }
  });

  // Get an article by ID - KEEP THIS LAST to avoid route conflicts
  app.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      // Using direct SQL to avoid Drizzle ORM issues
      const { rows } = await pool.query(`
        SELECT 
          id, 
          title, 
          content,
          summary, 
          image_url AS "imageUrl", 
          published_at AS "publishedAt", 
          author, 
          source,
          source_url AS "sourceUrl",
          sport_id AS "sportId",
          COALESCE(views, 0) AS views,
          COALESCE(likes, 0) AS likes,
          is_premium AS "isPremium",
          ai_generated AS "aiGenerated",
          ai_enhanced AS "aiEnhanced",
          tags
        FROM news_articles 
        WHERE id = $1
        LIMIT 1
      `, [id]);
      
      if (!rows.length) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Increment view count
      await pool.query(`
        UPDATE news_articles
        SET views = COALESCE(views, 0) + 1
        WHERE id = $1
      `, [id]);
      
      res.json(rows[0]);
    } catch (error: any) {
      console.error("Error fetching article:", error);
      res.status(500).json({ 
        message: error.message || "Failed to fetch article"
      });
    }
  });
}