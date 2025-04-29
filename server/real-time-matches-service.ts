import { logger } from './logger';
import axios from 'axios';
import { db } from './db';
import { matches } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { sportsApiService, StandardizedMatch } from './sports-api-service';
import { oddsAPIService } from './odds-api-service';

export interface RealTimeMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: Date;
  sport: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  venue?: string;
  weatherConditions?: string;
  country?: string;
}

/**
 * Service to fetch real-time match data from external APIs
 */
export class RealTimeMatchesService {
  private supportedSports = [
    'football',
    'basketball',
    'american_football',
    'baseball',
    'hockey',
    'rugby',
    'tennis',
    'cricket',
    'formula1',
    'afl',
    'handball',
    'mma',
    'volleyball',
    'nba'
  ];
  
  /**
   * Get today's football matches from the OddsAPI
   * Uses OddsAPI for real-time data
   */
  async getTodayFootballMatches(): Promise<RealTimeMatch[]> {
    try {
      logger.info('RealTimeMatches', 'Fetching today football matches from OddsAPI');
      
      // First, try to get matches from the OddsAPI
      const apiMatches = await oddsAPIService.getTodayEvents('soccer');
      
      if (apiMatches.length > 0) {
        logger.info('RealTimeMatches', 'Successfully fetched football matches from OddsAPI', { count: apiMatches.length });
        return this.convertToRealTimeMatches(apiMatches);
      }
      
      // If no matches from OddsAPI, try the database as fallback
      const dbMatches = await this.getMatchesFromDatabase('football');
      
      if (dbMatches.length > 0) {
        logger.info('RealTimeMatches', 'Found matches in database', { count: dbMatches.length });
        return dbMatches;
      }
      
      // If still no matches, return an empty array
      logger.warn('RealTimeMatches', 'No football matches found from API or database');
      return [];
    } catch (error) {
      logger.error('RealTimeMatches', 'Error fetching football matches', error);
      
      // Try from database as fallback
      const dbMatches = await this.getMatchesFromDatabase('football');
      
      if (dbMatches.length > 0) {
        logger.info('RealTimeMatches', 'Found matches in database after API error', { count: dbMatches.length });
        return dbMatches;
      }
      
      return [];
    }
  }
  
  /**
   * Get today's basketball matches from the OddsAPI
   */
  async getTodayBasketballMatches(): Promise<RealTimeMatch[]> {
    try {
      logger.info('RealTimeMatches', 'Fetching today basketball matches from OddsAPI');
      
      // First, try to get matches from the OddsAPI
      const apiMatches = await oddsAPIService.getTodayEvents('basketball');
      
      if (apiMatches.length > 0) {
        logger.info('RealTimeMatches', 'Successfully fetched basketball matches from OddsAPI', { count: apiMatches.length });
        return this.convertToRealTimeMatches(apiMatches);
      }
      
      // If no matches from OddsAPI, try the database as fallback
      const dbMatches = await this.getMatchesFromDatabase('basketball');
      
      if (dbMatches.length > 0) {
        logger.info('RealTimeMatches', 'Found matches in database', { count: dbMatches.length });
        return dbMatches;
      }
      
      // If still no matches, return an empty array
      logger.warn('RealTimeMatches', 'No basketball matches found from API or database');
      return [];
    } catch (error) {
      logger.error('RealTimeMatches', 'Error fetching basketball matches', error);
      
      // Try from database as fallback
      const dbMatches = await this.getMatchesFromDatabase('basketball');
      
      if (dbMatches.length > 0) {
        logger.info('RealTimeMatches', 'Found matches in database after API error', { count: dbMatches.length });
        return dbMatches;
      }
      
      return [];
    }
  }
  
  /**
   * Get today's matches for a specific sport from the OddsAPI
   */
  async getSportMatches(sport: string): Promise<RealTimeMatch[]> {
    // Validate sport is supported
    if (!this.supportedSports.includes(sport)) {
      logger.warn('RealTimeMatches', `Unsupported sport requested: ${sport}`);
      return [];
    }
    
    // Map the internal sport name to OddsAPI sport key
    const sportKey = this.mapSportToOddsApiKey(sport);
    
    try {
      logger.info('RealTimeMatches', `Fetching today ${sport} matches from OddsAPI using key: ${sportKey}`);
      
      // First, try to get matches from the OddsAPI
      const apiMatches = await oddsAPIService.getTodayEvents(sportKey);
      
      if (apiMatches.length > 0) {
        logger.info('RealTimeMatches', `Successfully fetched ${sport} matches from OddsAPI`, { count: apiMatches.length });
        return this.convertToRealTimeMatches(apiMatches);
      }
      
      // If no matches from OddsAPI, try the database as fallback
      const dbMatches = await this.getMatchesFromDatabase(sport);
      
      if (dbMatches.length > 0) {
        logger.info('RealTimeMatches', `Found ${sport} matches in database`, { count: dbMatches.length });
        return dbMatches;
      }
      
      // If still no matches, return an empty array
      logger.warn('RealTimeMatches', `No ${sport} matches found from API or database`);
      return [];
    } catch (error) {
      logger.error('RealTimeMatches', `Error fetching ${sport} matches`, error);
      
      // Try from database as fallback
      const dbMatches = await this.getMatchesFromDatabase(sport);
      
      if (dbMatches.length > 0) {
        logger.info('RealTimeMatches', `Found ${sport} matches in database after API error`, { count: dbMatches.length });
        return dbMatches;
      }
      
      return [];
    }
  }
  
  /**
   * Map our internal sport names to OddsAPI sport keys
   */
  private mapSportToOddsApiKey(sport: string): string {
    const sportMapping: Record<string, string> = {
      'football': 'soccer',
      'basketball': 'basketball',
      'american_football': 'americanfootball',
      'baseball': 'baseball',
      'hockey': 'icehockey',
      'rugby': 'rugbyunion',
      'tennis': 'tennis',
      'cricket': 'cricket',
      'formula1': 'f1',
      'mma': 'mma',
      'volleyball': 'volleyball',
      'nba': 'basketball_nba'
    };
    
    return sportMapping[sport] || sport;
  }
  
  /**
   * Convert standardized matches from API service to RealTimeMatch format
   */
  private convertToRealTimeMatches(matches: StandardizedMatch[]): RealTimeMatch[] {
    return matches.map(match => ({
      id: match.id,
      sport: match.sport,
      league: match.league,
      country: match.country,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startTime: match.startTime,
      venue: match.venue || undefined,
      status: match.status,
      homeOdds: match.homeOdds,
      drawOdds: match.drawOdds,
      awayOdds: match.awayOdds,
      homeScore: match.score?.home ?? undefined,
      awayScore: match.score?.away ?? undefined
    }));
  }
  
  /**
   * Get matches from the database
   */
  private async getMatchesFromDatabase(sport: string): Promise<RealTimeMatch[]> {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Query the database for today's matches
      const dbMatches = await db
        .select()
        .from(matches)
        .where(
          sql`${matches.sport} = ${sport} AND 
              ${matches.startTime} >= ${today} AND 
              ${matches.startTime} < ${tomorrow}`
        )
        .limit(20);
      
      // Map to the expected format
      return dbMatches.map(match => ({
        id: match.id.toString(),
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league || 'Unknown League',
        startTime: match.startTime,
        sport: match.sport || sport,
        homeOdds: match.homeOdds,
        drawOdds: match.drawOdds || null,
        awayOdds: match.awayOdds,
        venue: match.venue || undefined,
      }));
    } catch (error) {
      logger.error('RealTimeMatches', 'Error getting matches from database', error);
      return [];
    }
  }
  
  /**
   * Get matches for a specific date (with offset from today)
   * @param dateOffset 0 for today, -1 for yesterday, 1 for tomorrow, etc.
   */
  async getMatchesForDate(sport: string, dateOffset: number = 0): Promise<RealTimeMatch[]> {
    try {
      // Calculate the target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dateOffset);
      const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Map the internal sport name to OddsAPI sport key
      const sportKey = this.mapSportToOddsApiKey(sport);
      
      logger.info('RealTimeMatches', `Fetching ${sport} matches for date ${dateStr} from OddsAPI using key: ${sportKey}`);
      
      // For today's matches, we can use the getTodayEvents method
      if (dateOffset === 0) {
        const apiMatches = await oddsAPIService.getTodayEvents(sportKey);
        
        if (apiMatches.length > 0) {
          logger.info('RealTimeMatches', `Successfully fetched ${sport} matches for today from OddsAPI`, { count: apiMatches.length });
          return this.convertToRealTimeMatches(apiMatches);
        }
      } else {
        // For other dates, we need to get upcoming events and filter by date
        // OddsAPI doesn't directly support date filtering in the API, but we can do it client-side
        const apiMatches = await oddsAPIService.getUpcomingEvents(sportKey, 7); // Get upcoming matches for next 7 days
        
        // Filter matches by the target date
        const targetMatches = apiMatches.filter(match => {
          const matchDate = new Date(match.startTime);
          return matchDate.toISOString().split('T')[0] === dateStr;
        });
        
        if (targetMatches.length > 0) {
          logger.info('RealTimeMatches', `Successfully fetched ${sport} matches for date ${dateStr} from OddsAPI`, { count: targetMatches.length });
          return this.convertToRealTimeMatches(targetMatches);
        }
      }
      
      // If no API data, try from database
      // Get date range for the target date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Query the database for matches on the target date
      const dbMatches = await db
        .select()
        .from(matches)
        .where(
          sql`${matches.sport} = ${sport} AND 
              ${matches.startTime} >= ${startOfDay} AND 
              ${matches.startTime} <= ${endOfDay}`
        )
        .limit(20);
      
      if (dbMatches.length > 0) {
        logger.info('RealTimeMatches', `Found ${sport} matches in database for date ${dateStr}`, { count: dbMatches.length });
        return dbMatches.map(match => ({
          id: match.id.toString(),
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          league: match.league || 'Unknown League',
          startTime: match.startTime,
          sport: match.sport || sport,
          homeOdds: match.homeOdds,
          drawOdds: match.drawOdds || null,
          awayOdds: match.awayOdds,
          venue: match.venue || undefined,
        }));
      }
      
      logger.warn('RealTimeMatches', `No ${sport} matches found for date ${dateStr}`);
      return [];
    } catch (error) {
      logger.error('RealTimeMatches', `Error fetching ${sport} matches for date offset ${dateOffset}`, error);
      return [];
    }
  }
  
  /**
   * Get all sports matches for a specific date
   * @param dateOffset 0 for today, -1 for yesterday, 1 for tomorrow, etc.
   */
  async getAllSportsMatches(dateOffset: number = 0): Promise<RealTimeMatch[]> {
    try {
      // Get all supported sports matches for the date
      const promises = this.supportedSports.map(sport => 
        this.getMatchesForDate(sport, dateOffset)
      );
      
      const allSportsMatches = await Promise.all(promises);
      
      // Flatten the array of arrays
      const matches = allSportsMatches.flat();
      
      logger.info('RealTimeMatches', `Fetched ${matches.length} matches across all sports for date offset ${dateOffset}`);
      
      return matches;
    } catch (error) {
      logger.error('RealTimeMatches', `Error fetching all sports matches for offset ${dateOffset}`, error);
      return [];
    }
  }
  
  /**
   * Get all sports matches for today (backward compatibility)
   */
  async getAllTodaySportsMatches(): Promise<RealTimeMatch[]> {
    return this.getAllSportsMatches(0);
  }
  
  /**
   * Get upcoming matches for a specific sport for the next N days
   */
  async getUpcomingMatches(sport: string, days: number = 7): Promise<RealTimeMatch[]> {
    try {
      // Map the internal sport name to OddsAPI sport key
      const sportKey = this.mapSportToOddsApiKey(sport);
      
      logger.info('RealTimeMatches', `Fetching upcoming ${sport} matches for next ${days} days from OddsAPI using key: ${sportKey}`);
      
      // Use the OddsAPI service to get upcoming events
      const apiMatches = await oddsAPIService.getUpcomingEvents(sportKey, days);
      
      if (apiMatches.length > 0) {
        logger.info('RealTimeMatches', `Successfully fetched upcoming ${sport} matches from OddsAPI`, { count: apiMatches.length });
        return this.convertToRealTimeMatches(apiMatches);
      }
      
      logger.warn('RealTimeMatches', `No upcoming ${sport} matches found from OddsAPI`);
      return [];
    } catch (error) {
      logger.error('RealTimeMatches', `Error fetching upcoming ${sport} matches`, error);
      return [];
    }
  }
}

// Export a singleton instance
export const realTimeMatchesService = new RealTimeMatchesService();