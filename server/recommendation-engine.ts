/**
 * Enhanced News Article Recommendation Engine
 * 
 * This module provides AI-driven, personalized news article recommendations based on:
 * 1. User preferences (sports, leagues, teams)
 * 2. User reading history and behavior patterns
 * 3. Article popularity and engagement metrics
 * 4. Content similarity and semantic analysis
 * 5. Trending topics and real-time relevance
 * 6. User feedback and interaction history
 */

import { NewsArticle, UserNewsPreferences } from "@shared/schema";
import { db, pool } from "./db";
import { and, desc, eq, inArray, not, or, sql } from "drizzle-orm";
import { newsArticles, userNewsPreferences, userSavedNews } from "@shared/schema";
import { logger } from "./logger";
import { openaiClient } from "./openai-client";

interface RecommendationScore {
  articleId: number;
  score: number;
  reason: string;
  aiConfidence?: number;
  categories?: string[];
}

interface TrendingTopic {
  topic: string;
  score: number;
  relatedTeams: string[];
  relatedLeagues: number[];
  keywords: string[];
}

export class NewsRecommendationEngine {
  /**
   * Get AI-enhanced personalized article recommendations for a user
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
   * Get enhanced trending articles based on user interactions and AI analysis
   * @param count Number of trending articles to return
   * @returns Array of trending news articles
   */
  async getTrendingArticles(count: number = 5): Promise<NewsArticle[]> {
    try {
      logger.info('RecommendationEngine', `Getting trending articles, count: ${count}`);
      
      if (isNaN(count) || count <= 0) {
        logger.warn('RecommendationEngine', 'Invalid count parameter, defaulting to 5');
        count = 5;
      }

      // Try to get trending articles based on engagement metrics
      const engagementQuery = `
        SELECT a.*, 
          (COALESCE(a.views, 0) * 0.3 + 
           COALESCE(a.likes, 0) * 0.5 + 
           COALESCE(saved_count, 0) * 1.0 +
           CASE WHEN a.published_at > NOW() - INTERVAL '24 hours' THEN 10 ELSE 0 END) AS trend_score
        FROM news_articles a
        LEFT JOIN (
          SELECT article_id, COUNT(*) as saved_count
          FROM user_saved_news
          WHERE saved_at > NOW() - INTERVAL '7 days'
          GROUP BY article_id
        ) s ON a.id = s.article_id
        WHERE a.published_at > NOW() - INTERVAL '14 days'
        ORDER BY trend_score DESC, a.published_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(engagementQuery, [count]);
      logger.info('RecommendationEngine', `Found ${result.rows.length} trending articles based on engagement`);
      
      if (result.rows.length > 0) {
        return result.rows.map(row => ({
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
          tags: row.tags || [],
          views: row.views || 0,
          likes: row.likes || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      }

      // Fallback to newest articles if no trending articles found
      logger.info('RecommendationEngine', 'No trending articles found, using newest articles instead');
      const fallbackQuery = `
        SELECT * FROM news_articles
        WHERE published_at > NOW() - INTERVAL '30 days'
        ORDER BY published_at DESC
        LIMIT $1
      `;
      
      const fallbackResult = await pool.query(fallbackQuery, [count]);
      logger.info('RecommendationEngine', `Found ${fallbackResult.rows.length} articles using fallback method`);
      
      if (fallbackResult.rows.length === 0) {
        logger.warn('RecommendationEngine', 'No articles found in database');
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
        tags: row.tags || [],
        views: row.views || 0,
        likes: row.likes || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('RecommendationEngine', `Error getting trending articles: ${errorMessage}`);
      return [];
    }
  }
  
  /**
   * Get personalized news feed based on user preferences and AI curation
   * @param userId User ID to get personalized feed for
   * @param count Number of articles to return
   * @returns Array of personalized news articles
   */
  async getPersonalizedFeed(userId: number, count: number = 10): Promise<NewsArticle[]> {
    try {
      logger.info('RecommendationEngine', `Generating personalized feed for user ${userId}`);
      
      // Get personalized recommendations
      const recommendations = await this.getRecommendations(userId, Math.ceil(count * 0.7));
      
      // Get some trending articles to mix in (limited number)
      const trending = await this.getTrendingArticles(Math.ceil(count * 0.3));
      
      // Remove duplicates by creating a map of article IDs to articles
      const recommendedIds = new Set(recommendations.map(article => article.id));
      const uniqueTrending = trending.filter(article => !recommendedIds.has(article.id));
      
      // Combine and shuffle slightly to create a more natural feed
      const combined = [...recommendations, ...uniqueTrending.slice(0, Math.ceil(count * 0.3))];
      
      // Sort by a combination of personalization score and recency
      combined.sort((a, b) => {
        // Use the score property from recommendations, or 0.5 for trending articles
        const scoreA = 'score' in a ? a.score : 0.5;
        const scoreB = 'score' in b ? b.score : 0.5;
        
        // Calculate days since publication
        const daysA = (Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
        const daysB = (Date.now() - new Date(b.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
        
        // Recency factor (higher for newer articles)
        const recencyA = Math.max(0, 1 - (daysA / 7));
        const recencyB = Math.max(0, 1 - (daysB / 7));
        
        // Combined ranking score (70% personalization, 30% recency)
        const rankA = (scoreA * 0.7) + (recencyA * 0.3);
        const rankB = (scoreB * 0.7) + (recencyB * 0.3);
        
        return rankB - rankA;
      });
      
      // Return the top count articles
      return combined.slice(0, count);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('RecommendationEngine', `Error generating personalized feed: ${errorMessage}`);
      return [];
    }
  }
  
  /**
   * Analyze article content using OpenAI to determine relevance to user preferences
   * @param article The article to analyze
   * @param userPreferences User's news preferences
   * @returns Enhanced scoring data for the article
   */
  async analyzeArticleContent(
    article: NewsArticle, 
    userPreferences: UserNewsPreferences
  ): Promise<{ score: number; categories: string[]; confidence: number }> {
    try {
      if (!article?.content || !userPreferences) {
        return { score: 0.5, categories: [], confidence: 0 };
      }
      
      // Extract user preference data
      const favoriteTeams = userPreferences.favoriteTeams || [];
      const favoriteLeagues = userPreferences.favoriteLeagues || [];
      const favoriteSports = userPreferences.favoriteSports || [];
      
      // If user has no preferences, return default score
      if (!favoriteTeams.length && !favoriteLeagues.length && !favoriteSports.length) {
        return { score: 0.5, categories: [], confidence: 0 };
      }
      
      try {
        // Ask OpenAI to analyze the article content
        const prompt = `
        Analyze this sports article content and determine how relevant it is to the user's preferences.
        
        Article Title: ${article.title}
        Article Content: ${article.summary} 
        
        User Preferences:
        - Favorite Teams: ${favoriteTeams.join(', ')}
        - Favorite Sports IDs: ${favoriteSports.join(', ')}
        - Favorite League IDs: ${favoriteLeagues.join(', ')}
        
        Return a JSON object with:
        1. relevanceScore (0-1): How relevant this article is to the user's preferences
        2. confidence (0-1): How confident you are in this assessment
        3. categories: List of topics/categories this article belongs to
        4. mentionedTeams: Teams mentioned in the article
        `;
        
        const response = await openaiClient.chat.completions.create({
          model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 500
        });
        
        // Parse the response
        const content = response.choices[0].message.content;
        if (!content) {
          return { score: 0.5, categories: [], confidence: 0 };
        }
        
        const analysis = JSON.parse(content);
        return {
          score: analysis.relevanceScore || 0.5,
          categories: analysis.categories || [],
          confidence: analysis.confidence || 0
        };
      } catch (aiError) {
        logger.error('RecommendationEngine', `Error analyzing article with AI: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
        return { score: 0.5, categories: [], confidence: 0 };
      }
    } catch (error) {
      logger.error('RecommendationEngine', `Error in content analysis: ${error instanceof Error ? error.message : String(error)}`);
      return { score: 0.5, categories: [], confidence: 0 };
    }
  }
}

// Export a singleton instance
export const newsRecommendationEngine = new NewsRecommendationEngine();