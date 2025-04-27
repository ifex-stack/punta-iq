import { logger } from './logger';
import { db } from './db';
import { eq, and, lt, gt, desc, sql, SQL } from 'drizzle-orm';
import { matches, predictions } from '@shared/schema';

/**
 * Client for fetching historical match data and statistics
 */
export class HistoricalDataClient {
  /**
   * Get head-to-head matches between two teams
   * 
   * @param homeTeam Home team name
   * @param awayTeam Away team name
   * @param limit Maximum number of matches to return (default: 10)
   * @returns Array of previous matches between the teams
   */
  async getHeadToHeadMatches(homeTeam: string, awayTeam: string, limit = 10): Promise<any[]> {
    try {
      logger.info('HistoricalDataClient', 'Fetching head-to-head matches', { homeTeam, awayTeam, limit });
      
      // Query the database for previous matches between these teams
      const headToHead = await db
        .select()
        .from(matches)
        .where(
          and(
            sql`(${matches.homeTeam} = ${homeTeam} AND ${matches.awayTeam} = ${awayTeam}) OR
                (${matches.homeTeam} = ${awayTeam} AND ${matches.awayTeam} = ${homeTeam})`,
            eq(matches.isCompleted, true)
          )
        )
        .orderBy(desc(matches.startTime))
        .limit(limit);
      
      return headToHead.map(match => ({
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        startTime: match.startTime,
        result: match.result,
        homeScore: this.extractScore(match.result || '', 'home'),
        awayScore: this.extractScore(match.result || '', 'away'),
        league: match.leagueId,
      }));
    } catch (error) {
      logger.error('HistoricalDataClient', 'Error fetching head-to-head matches', error);
      return [];
    }
  }
  
  /**
   * Get recent form for a team
   * 
   * @param team Team name
   * @param limit Maximum number of matches to return (default: 5)
   * @returns Array of recent matches for the team
   */
  async getTeamForm(team: string, limit = 5): Promise<any[]> {
    try {
      logger.info('HistoricalDataClient', 'Fetching team form', { team, limit });
      
      // Query the database for recent matches involving this team
      const recentMatches = await db
        .select()
        .from(matches)
        .where(
          and(
            sql`(${matches.homeTeam} = ${team} OR ${matches.awayTeam} = ${team})`,
            eq(matches.isCompleted, true)
          )
        )
        .orderBy(desc(matches.startTime))
        .limit(limit);
      
      return recentMatches.map(match => {
        const isHome = match.homeTeam === team;
        const homeScore = this.extractScore(match.result || '', 'home');
        const awayScore = this.extractScore(match.result || '', 'away');
        
        // Determine result from team perspective (W/L/D)
        let result = 'D';
        if (isHome && homeScore > awayScore) result = 'W';
        else if (isHome && homeScore < awayScore) result = 'L';
        else if (!isHome && awayScore > homeScore) result = 'W';
        else if (!isHome && awayScore < homeScore) result = 'L';
        
        return {
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          opponent: isHome ? match.awayTeam : match.homeTeam,
          wasHome: isHome,
          result,
          startTime: match.startTime,
          goalsScored: isHome ? homeScore : awayScore,
          goalsConceded: isHome ? awayScore : homeScore,
          league: match.leagueId,
        };
      });
    } catch (error) {
      logger.error('HistoricalDataClient', 'Error fetching team form', error);
      return [];
    }
  }
  
  /**
   * Get historical prediction accuracy for a specific match type
   * 
   * @param market Market type (e.g., '1X2', 'BTTS', 'Over_Under')
   * @param minConfidence Minimum confidence threshold (0-100)
   * @returns Statistics about prediction accuracy
   */
  async getPredictionAccuracy(market: string, minConfidence = 70): Promise<any> {
    try {
      logger.info('HistoricalDataClient', 'Fetching prediction accuracy', { market, minConfidence });
      
      // Get predictions with results
      const historicalPredictions = await db
        .select({
          id: predictions.id,
          predictedOutcome: predictions.predictedOutcome,
          confidence: predictions.confidence,
          isCorrect: predictions.isCorrect,
          matchId: predictions.matchId,
          additionalPredictions: predictions.additionalPredictions,
          createdAt: predictions.createdAt,
        })
        .from(predictions)
        .where(
          and(
            sql`${predictions.additionalPredictions}->>'market' = ${market}`,
            this.gte(predictions.confidence, minConfidence),
            this.isNotNull(predictions.isCorrect)
          )
        )
        .limit(1000);
      
      // Calculate accuracy
      const total = historicalPredictions.length;
      const correct = historicalPredictions.filter(p => p.isCorrect).length;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      
      // Calculate accuracy by confidence bands
      const confidenceBands = [
        { min: 90, max: 100, predictions: [] },
        { min: 80, max: 89, predictions: [] },
        { min: 70, max: 79, predictions: [] },
        { min: 60, max: 69, predictions: [] },
        { min: 50, max: 59, predictions: [] },
      ];
      
      historicalPredictions.forEach(pred => {
        for (const band of confidenceBands) {
          if (pred.confidence >= band.min && pred.confidence <= band.max) {
            band.predictions.push(pred);
            break;
          }
        }
      });
      
      const bandAccuracy = confidenceBands.map(band => {
        const bandTotal = band.predictions.length;
        const bandCorrect = band.predictions.filter(p => p.isCorrect).length;
        return {
          range: `${band.min}-${band.max}%`,
          accuracy: bandTotal > 0 ? (bandCorrect / bandTotal) * 100 : 0,
          total: bandTotal,
          correct: bandCorrect,
        };
      });
      
      return {
        market,
        overallAccuracy: accuracy.toFixed(1),
        totalPredictions: total,
        correctPredictions: correct,
        byConfidenceBand: bandAccuracy,
      };
    } catch (error) {
      logger.error('HistoricalDataClient', 'Error calculating prediction accuracy', error);
      return {
        market,
        overallAccuracy: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        byConfidenceBand: [],
      };
    }
  }
  
  /**
   * Get historical team performance statistics
   * 
   * @param team Team name
   * @param timeframe Timeframe in days (default: 180)
   * @returns Team performance statistics
   */
  async getTeamStats(team: string, timeframe = 180): Promise<any> {
    try {
      logger.info('HistoricalDataClient', 'Fetching team stats', { team, timeframe });
      
      // Calculate date threshold
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - timeframe);
      
      // Get completed matches for this team in the timeframe
      const teamMatches = await db
        .select()
        .from(matches)
        .where(
          and(
            sql`(${matches.homeTeam} = ${team} OR ${matches.awayTeam} = ${team})`,
            eq(matches.isCompleted, true),
            gt(matches.startTime, threshold)
          )
        )
        .orderBy(desc(matches.startTime));
      
      if (teamMatches.length === 0) {
        return {
          team,
          matches: 0,
          homeMatches: 0,
          awayMatches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsScored: 0,
          goalsConceded: 0,
          cleanSheets: 0,
          btts: 0,
          over2_5: 0,
          under2_5: 0,
          winPercentage: 0,
          bttsPercentage: 0,
          over2_5Percentage: 0,
          averageGoalsScored: 0,
          averageGoalsConceded: 0,
        };
      }
      
      // Calculate stats
      let homeMatches = 0;
      let awayMatches = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsScored = 0;
      let goalsConceded = 0;
      let cleanSheets = 0;
      let btts = 0;
      let over2_5 = 0;
      
      teamMatches.forEach(match => {
        const isHome = match.homeTeam === team;
        const homeScore = this.extractScore(match.result || '', 'home');
        const awayScore = this.extractScore(match.result || '', 'away');
        const totalGoals = homeScore + awayScore;
        
        // Count home/away matches
        if (isHome) {
          homeMatches++;
        } else {
          awayMatches++;
        }
        
        // Calculate result from team perspective
        if (isHome) {
          if (homeScore > awayScore) wins++;
          else if (homeScore === awayScore) draws++;
          else losses++;
          
          goalsScored += homeScore;
          goalsConceded += awayScore;
          if (awayScore === 0) cleanSheets++;
        } else {
          if (awayScore > homeScore) wins++;
          else if (homeScore === awayScore) draws++;
          else losses++;
          
          goalsScored += awayScore;
          goalsConceded += homeScore;
          if (homeScore === 0) cleanSheets++;
        }
        
        // BTTS
        if (homeScore > 0 && awayScore > 0) {
          btts++;
        }
        
        // Over/Under 2.5
        if (totalGoals > 2.5) {
          over2_5++;
        }
      });
      
      const totalMatches = teamMatches.length;
      
      return {
        team,
        matches: totalMatches,
        homeMatches,
        awayMatches,
        wins,
        draws,
        losses,
        goalsScored,
        goalsConceded,
        cleanSheets,
        btts,
        over2_5,
        under2_5: totalMatches - over2_5,
        winPercentage: ((wins / totalMatches) * 100).toFixed(1),
        bttsPercentage: ((btts / totalMatches) * 100).toFixed(1),
        over2_5Percentage: ((over2_5 / totalMatches) * 100).toFixed(1),
        averageGoalsScored: (goalsScored / totalMatches).toFixed(2),
        averageGoalsConceded: (goalsConceded / totalMatches).toFixed(2),
      };
    } catch (error) {
      logger.error('HistoricalDataClient', 'Error fetching team stats', error);
      return {
        team,
        matches: 0,
        error: 'Failed to fetch team statistics'
      };
    }
  }
  
  /**
   * Get complete match data for prediction evaluation
   * 
   * @param matchId Match ID
   * @returns Complete match data with predictions and results
   */
  async getMatchData(matchId: number): Promise<any> {
    try {
      logger.info('HistoricalDataClient', 'Fetching match data', { matchId });
      
      // Get match
      const [match] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, matchId));
      
      if (!match) {
        return null;
      }
      
      // Get prediction for this match
      const [prediction] = await db
        .select()
        .from(predictions)
        .where(eq(predictions.matchId, matchId));
      
      // Get head-to-head matches
      const headToHead = await this.getHeadToHeadMatches(match.homeTeam, match.awayTeam, 5);
      
      // Get team form
      const homeForm = await this.getTeamForm(match.homeTeam, 5);
      const awayForm = await this.getTeamForm(match.awayTeam, 5);
      
      // Get team stats
      const homeStats = await this.getTeamStats(match.homeTeam);
      const awayStats = await this.getTeamStats(match.awayTeam);
      
      return {
        match,
        prediction,
        headToHead,
        homeForm,
        awayForm,
        homeStats,
        awayStats,
      };
    } catch (error) {
      logger.error('HistoricalDataClient', 'Error fetching match data', error);
      return null;
    }
  }
  
  /**
   * Extract score component from a result string (e.g., "2-1")
   */
  private extractScore(result: string, team: 'home' | 'away'): number {
    try {
      if (!result || !result.includes('-')) return 0;
      
      const parts = result.split('-');
      if (parts.length !== 2) return 0;
      
      return team === 'home' ? parseInt(parts[0].trim(), 10) : parseInt(parts[1].trim(), 10);
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * SQL helper for IS NOT NULL condition
   */
  private isNotNull(column: any): SQL {
    return sql`${column} IS NOT NULL`;
  }
  
  /**
   * SQL helper for greater than or equal condition
   */
  private gte(column: any, value: any): SQL {
    return sql`${column} >= ${value}`;
  }
}

// Export a singleton instance
export const historicalDataClient = new HistoricalDataClient();