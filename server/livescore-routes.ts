import { Express, Request, Response } from "express";
import { oddsAPIService } from "./odds-api-service";
import { logger } from "./logger";

/**
 * Set up endpoints related to the LiveScore feature
 * @param app Express application
 */
export function setupLiveScoreRoutes(app: Express) {
  /**
   * Get live scores for all sports or a specific sport
   * Returns matches that are currently in-play with real-time score information
   */
  app.get("/api/live-scores", async (req: Request, res: Response) => {
    try {
      const sportKey = req.query.sport as string || 'all';
      logger.info('LiveScoreRoutes', `Fetching live scores for sport: ${sportKey}`);
      
      const liveScores = await oddsAPIService.getLiveScores(sportKey);
      
      return res.json({
        success: true,
        data: liveScores,
        count: liveScores.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('LiveScoreRoutes', `Error fetching live scores: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch live scores",
        message: error.message
      });
    }
  });
  
  /**
   * Get all in-play events grouped by sport
   * Useful for showing a dashboard of all live sports activity
   */
  app.get("/api/live-scores/by-sport", async (req: Request, res: Response) => {
    try {
      // Fetch all live events
      const allLiveScores = await oddsAPIService.getLiveScores('all');
      
      // Group them by sport
      const scoresBySport: {[sport: string]: any[]} = {};
      
      allLiveScores.forEach(match => {
        if (!scoresBySport[match.sport]) {
          scoresBySport[match.sport] = [];
        }
        scoresBySport[match.sport].push(match);
      });
      
      // Count matches by sport
      const sportCounts = Object.keys(scoresBySport).map(sport => ({
        sport,
        count: scoresBySport[sport].length
      }));
      
      return res.json({
        success: true,
        data: scoresBySport,
        sportCounts,
        totalCount: allLiveScores.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('LiveScoreRoutes', `Error fetching live scores by sport: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch live scores by sport",
        message: error.message
      });
    }
  });
  
  /**
   * Get popular in-play events based on league popularity
   * Features matches from major leagues that are currently live
   */
  app.get("/api/live-scores/popular", async (req: Request, res: Response) => {
    try {
      // Fetch all live events
      const allLiveScores = await oddsAPIService.getLiveScores('all');
      
      // Define popular leagues
      const popularLeagues = [
        'Premier League',
        'La Liga',
        'Serie A',
        'Bundesliga',
        'Ligue 1',
        'Champions League',
        'Europa League',
        'NBA',
        'NFL',
        'MLB'
      ];
      
      // Filter for matches in popular leagues
      const popularMatches = allLiveScores.filter(match => 
        popularLeagues.some(league => 
          match.league.includes(league) || match.league === league
        )
      );
      
      return res.json({
        success: true,
        data: popularMatches,
        count: popularMatches.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('LiveScoreRoutes', `Error fetching popular live scores: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch popular live scores",
        message: error.message
      });
    }
  });
}