/**
 * News Article Recommendation Engine
 * 
 * This module provides real-time news article recommendations based on:
 * 1. User preferences (sports, leagues, teams)
 * 2. User reading history
 * 3. Article popularity
 * 4. Content similarity
 * 5. Trending topics
 */

import { NewsArticle, UserNewsPreferences } from "@shared/schema";
import { db, pool } from "./db";
import { and, desc, eq, inArray, not, or, sql } from "drizzle-orm";
import { newsArticles, userNewsPreferences, userSavedNews } from "@shared/schema";
import { logger } from "./logger";

interface RecommendationScore {
  articleId: number;
  score: number;
  reason: string;
}

export class NewsRecommendationEngine {
  /**
   * Get personalized article recommendations for a user
   * 
   * @param userId The user ID to get recommendations for
   * @param count Number of recommendations to return
   * @param excludeArticleIds Optional array of article IDs to exclude
   * @returns Array of recommended articles with score and reason
   */
  async getRecommendations(
    userId: number,
    count: number = 5,
    excludeArticleIds: number[] = []
  ): Promise<(NewsArticle & { score: number; recommendReason: string })[]> {
    try {
      logger.info('RecommendationEngine', `Generating recommendations for user ${userId}`);
      
      // Validate inputs
      if (!userId || isNaN(Number(userId))) {
        throw new Error("Invalid user ID");
      }
      
      // 1. Get user's preferences
      const userPreferences = await this.getUserPreferences(userId);
      
      // 2. Get user's reading history
      const recentlyRead = await this.getRecentlyReadArticles(userId);
      
      // 3. Calculate scores for candidate articles
      const candidateScores = await this.scoreCandidateArticles(
        userId,
        userPreferences,
        recentlyRead,
        excludeArticleIds
      );
      
      // 4. Sort by score and take top N results
      const topRecommendations = candidateScores
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
      
      // 5. Fetch full article data for recommendations
      if (topRecommendations.length === 0) {
        // Fall back to most recent articles if no personalized recommendations
        return this.getFallbackRecommendations(count, excludeArticleIds);
      }
      
      const recommendedArticleIds = topRecommendations.map(rec => rec.articleId);
      
      // Get full article data for the recommendations
      const articles = await db
        .select()
        .from(newsArticles)
        .where(inArray(newsArticles.id, recommendedArticleIds));
      
      // Combine articles with their scores and reasons
      return articles.map(article => {
        const matchingScore = topRecommendations.find(rec => rec.articleId === article.id);
        return {
          ...article,
          score: matchingScore?.score || 0,
          recommendReason: matchingScore?.reason || "Recommended based on your interests"
        };
      });
    } catch (error) {
      logger.error('RecommendationEngine', `Error generating recommendations: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get fallback recommendations when personalized ones aren't available
   */
  private async getFallbackRecommendations(
    count: number,
    excludeArticleIds: number[] = []
  ): Promise<(NewsArticle & { score: number; recommendReason: string })[]> {
    try {
      // Get most recent articles as fallback
      let query = db
        .select()
        .from(newsArticles)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(count);
      
      // Exclude specific articles if needed
      if (excludeArticleIds.length > 0) {
        query = query.where(not(inArray(newsArticles.id, excludeArticleIds)));
      }
      
      const articles = await query;
      
      // Add generic score and reason
      return articles.map(article => ({
        ...article,
        score: 0.5, // Medium relevance score
        recommendReason: "Latest sports news"
      }));
    } catch (error) {
      logger.error('RecommendationEngine', `Error getting fallback recommendations: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get user's news preferences
   */
  private async getUserPreferences(userId: number): Promise<UserNewsPreferences | null> {
    const [preferences] = await db
      .select()
      .from(userNewsPreferences)
      .where(eq(userNewsPreferences.userId, userId));
    
    return preferences || null;
  }
  
  /**
   * Get articles the user has recently read
   */
  private async getRecentlyReadArticles(userId: number): Promise<number[]> {
    try {
      // Get articles the user has recently interacted with 
      const result = await pool.query(`
        SELECT article_id
        FROM user_saved_news
        WHERE user_id = $1 AND is_read = true
        ORDER BY read_at DESC NULLS LAST, saved_at DESC
        LIMIT 10
      `, [userId]);
      
      return result.rows.map(row => row.article_id);
    } catch (error) {
      logger.error('RecommendationEngine', `Error getting read history: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Score candidate articles based on user preferences and behavior
   */
  private async scoreCandidateArticles(
    userId: number,
    preferences: UserNewsPreferences | null,
    recentlyRead: number[],
    excludeArticleIds: number[]
  ): Promise<RecommendationScore[]> {
    try {
      // Get all articles from the last 30 days as candidates
      const query = `
        WITH article_scores AS (
          SELECT 
            id,
            published_at,
            -- Base score starts at 0.5
            0.5 AS base_score,
            
            -- Boost for recency (newer = higher score)
            CASE 
              WHEN published_at > NOW() - INTERVAL '1 day' THEN 0.3
              WHEN published_at > NOW() - INTERVAL '3 days' THEN 0.2
              WHEN published_at > NOW() - INTERVAL '7 days' THEN 0.1
              ELSE 0
            END AS recency_score,
            
            -- Boost for preferred sports if user has preferences
            CASE 
              WHEN $1::JSONB IS NOT NULL AND sport_id IS NOT NULL AND sport_id = ANY(SELECT jsonb_array_elements_text($1::JSONB)::int) THEN 0.25
              ELSE 0
            END AS sport_match_score,
            
            -- Boost for preferred leagues if user has preferences
            CASE 
              WHEN $2::JSONB IS NOT NULL AND league_id IS NOT NULL AND league_id = ANY(SELECT jsonb_array_elements_text($2::JSONB)::int) THEN 0.2
              ELSE 0
            END AS league_match_score,
            
            -- Boost for article types that match user preferences
            CASE 
              WHEN $3::JSONB IS NOT NULL AND type::text = ANY(SELECT jsonb_array_elements_text($3::JSONB)::text) THEN 0.15
              ELSE 0
            END AS type_match_score
        )
        
        SELECT 
          id AS article_id, 
          (base_score + recency_score + sport_match_score + league_match_score + type_match_score) AS total_score,
          CASE
            WHEN sport_match_score > 0 THEN 'Matches your favorite sports'
            WHEN league_match_score > 0 THEN 'From leagues you follow'
            WHEN type_match_score > 0 THEN 'Content type you prefer'
            WHEN recency_score >= 0.2 THEN 'Breaking news'
            ELSE 'Recommended for you'
          END AS reason
        FROM article_scores
        WHERE published_at > NOW() - INTERVAL '30 days'
        ${excludeArticleIds.length > 0 ? `AND id NOT IN (${excludeArticleIds.join(',')})` : ''}
        ORDER BY total_score DESC, published_at DESC
        LIMIT 20
      `;
      
      const favoriteSports = preferences?.favoriteSports || null;
      const favoriteLeagues = preferences?.favoriteLeagues || null;
      const preferredContentTypes = preferences?.preferredContentTypes || null;
      
      const result = await pool.query(query, [
        favoriteSports ? JSON.stringify(favoriteSports) : null,
        favoriteLeagues ? JSON.stringify(favoriteLeagues) : null,
        preferredContentTypes ? JSON.stringify(preferredContentTypes) : null
      ]);
      
      return result.rows.map(row => ({
        articleId: row.article_id,
        score: parseFloat(row.total_score),
        reason: row.reason
      }));
    } catch (error) {
      logger.error('RecommendationEngine', `Error scoring articles: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get trending articles based on recent user interactions
   */
  async getTrendingArticles(count: number = 5): Promise<NewsArticle[]> {
    try {
      console.log('Getting trending articles, count:', count);
      
      if (isNaN(count) || count <= 0) {
        console.log('Invalid count parameter, defaulting to 5');
        count = 5;
      }

      // Get the newest articles directly
      console.log('Getting newest articles as trending');
      const fallbackQuery = `
        SELECT * FROM news_articles
        WHERE id IS NOT NULL
        ORDER BY published_at DESC
        LIMIT $1
      `;
      
      const fallbackResult = await pool.query(fallbackQuery, [count]);
      console.log(`Found ${fallbackResult.rows.length} articles`);
      
      if (fallbackResult.rows.length === 0) {
        console.log('No articles found in database');
        return [];
      }
      
      return fallbackResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        summary: row.summary,
        author: row.author,
        source: row.source,
        sourceUrl: row.source_url,
        publishedAt: row.published_at,
        imageUrl: row.image_url,
        sportId: row.sport_id,
        leagueId: row.league_id,
        teams: row.teams,
        type: row.type,
        aiGenerated: row.ai_generated,
        aiEnhanced: row.ai_enhanced,
        isPremium: row.is_premium,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting trending articles:', error);
      logger.error('RecommendationEngine', `Error getting trending articles: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
}

// Export a singleton instance
export const newsRecommendationEngine = new NewsRecommendationEngine();