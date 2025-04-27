import { Express } from "express";
import { db, pool } from "./db";
import { newsArticles } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

export function setupNewsRoutes(app: Express) {
  console.log("Setting up news routes...");

  // Simple test endpoint using drizzle
  app.get("/api/news/test", async (req, res) => {
    try {
      console.log("Fetching news articles with Drizzle ORM");
      
      // Use Drizzle ORM for query
      const articles = await db.select()
        .from(newsArticles)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(5);
      
      console.log(`Found ${articles.length} news articles`);
      
      res.json(articles);
    } catch (error: any) {
      console.error("Error fetching news articles:", error);
      res.status(500).json({ 
        message: "Failed to fetch news articles",
        error: error.message
      });
    }
  });

  // Fixed trending endpoint using direct SQL
  app.get("/api/news/trending-fixed", async (req, res) => {
    try {
      console.log("Fetching trending news with direct SQL");
      
      const limit = req.query.count ? parseInt(req.query.count as string) : 5;
      
      // Use direct SQL query with explicit safeguards
      const result = await pool.query(`
        SELECT 
          id, 
          title, 
          summary, 
          image_url AS "imageUrl", 
          published_at AS "publishedAt", 
          author, 
          source
        FROM news_articles 
        ORDER BY published_at DESC 
        LIMIT $1
      `, [limit]);
      
      console.log(`Found ${result.rows.length} trending articles`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching trending articles:", error);
      res.status(500).json({ 
        message: "Failed to fetch trending articles",
        error: error.message
      });
    }
  });
}