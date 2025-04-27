import { Express } from "express";
import { db, pool } from "./db";
import { newsArticles } from "@shared/schema";
import { desc, sql, asc, eq, isNull, and, or } from "drizzle-orm";
import { storage } from "./storage";

export function setupNewsRoutes(app: Express) {
  console.log("Setting up news routes...");

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

  // Get an article by ID 
  app.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const article = await db.select()
        .from(newsArticles)
        .where(eq(newsArticles.id, id))
        .limit(1);
      
      if (!article.length) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Increment view count
      await db.update(newsArticles)
        .set({ 
          views: sql`${newsArticles.views} + 1` 
        })
        .where(eq(newsArticles.id, id));
      
      res.json(article[0]);
    } catch (error: any) {
      console.error("Error fetching article:", error);
      res.status(500).json({ 
        message: "Failed to fetch article",
        error: error.message
      });
    }
  });

  // Fixed trending endpoint using direct SQL
  app.get("/api/news/trending-fixed", async (req, res) => {
    try {
      console.log("Fetching trending news with direct SQL");
      
      const limit = req.query.count ? parseInt(req.query.count as string) : 5;
      
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
        message: "Failed to fetch trending articles",
        error: error.message
      });
    }
  });
}