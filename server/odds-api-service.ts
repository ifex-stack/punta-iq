import axios from 'axios';
import { logger } from './logger';
import { StandardizedMatch } from './sports-api-service';

interface OddsAPIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface OddsAPISport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface OddsAPIBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsAPIMarket[];
}

export interface OddsAPIMarket {
  key: string;
  last_update: string;
  outcomes: OddsAPIOutcome[];
}

export interface OddsAPIOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsAPIEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsAPIBookmaker[];
}

/**
 * Service to interact with the-odds-api.com
 */
export class OddsAPIService {
  private config: OddsAPIConfig;
  private supportedSports: Map<string, OddsAPISport> = new Map();
  
  constructor() {
    this.config = {
      baseUrl: 'https://api.the-odds-api.com/v4',
      apiKey: process.env.API_SPORTS_KEY || '0f4365e761a8019b22bf5c8b524c6d71'
    };
    
    logger.info('OddsAPIService', 'Service initialized');
  }
  
  /**
   * Fetch all available sports from the API
   */
  async fetchSports(): Promise<OddsAPISport[]> {
    try {
      const url = `${this.config.baseUrl}/sports`;
      logger.info('OddsAPIService', `Fetching sports from ${url}`);
      
      const response = await axios.get(url, {
        params: { apiKey: this.config.apiKey }
      });
      
      const sports = response.data as OddsAPISport[];
      
      // Cache sports for faster lookup
      this.supportedSports.clear();
      sports.forEach(sport => {
        this.supportedSports.set(sport.key, sport);
      });
      
      logger.info('OddsAPIService', `Fetched ${sports.length} sports`);
      return sports;
    } catch (error: any) {
      logger.error('OddsAPIService', `Error fetching sports: ${error.message}`);
      if (error.response) {
        logger.error('OddsAPIService', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      return [];
    }
  }
  
  /**
   * Get supported sports
   */
  async getSupportedSports(): Promise<OddsAPISport[]> {
    // If we haven't fetched sports yet, fetch them now
    if (this.supportedSports.size === 0) {
      await this.fetchSports();
    }
    
    return Array.from(this.supportedSports.values());
  }
  
  /**
   * Convert from Odds API sport key to standardized sport name
   * @param sportKey The Odds API sport key
   */
  private mapSportKey(sportKey: string): string {
    const sportKeyMapping: {[key: string]: string} = {
      'soccer': 'football',
      'americanfootball': 'american_football',
      'basketball': 'basketball',
      'baseball': 'baseball',
      'icehockey': 'hockey',
      'mma': 'mma',
      'tennis': 'tennis',
      'cricket': 'cricket'
      // Add more mappings as needed
    };
    
    return sportKeyMapping[sportKey] || sportKey;
  }
  
  /**
   * Fetch upcoming events for a specific sport
   * @param sportKey The sport key
   * @param regions Regions to get odds for (default: us)
   * @param markets Markets to get odds for (default: h2h)
   */
  async fetchEvents(sportKey: string, regions: string = 'us', markets: string = 'h2h'): Promise<OddsAPIEvent[]> {
    try {
      const url = `${this.config.baseUrl}/sports/${sportKey}/odds`;
      logger.info('OddsAPIService', `Fetching events for ${sportKey} from ${url}`);
      
      const response = await axios.get(url, {
        params: {
          apiKey: this.config.apiKey,
          regions: regions,
          markets: markets,
          oddsFormat: 'decimal'
        }
      });
      
      const events = response.data as OddsAPIEvent[];
      logger.info('OddsAPIService', `Fetched ${events.length} events for ${sportKey}`);
      
      return events;
    } catch (error: any) {
      logger.error('OddsAPIService', `Error fetching events for ${sportKey}: ${error.message}`);
      if (error.response) {
        logger.error('OddsAPIService', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      return [];
    }
  }
  
  /**
   * Convert OddsAPI events to StandardizedMatch format
   * @param events OddsAPI events
   * @param sportKey The sport key
   */
  private convertToStandardizedMatches(events: OddsAPIEvent[], sportKey: string): StandardizedMatch[] {
    const standardizedSport = this.mapSportKey(sportKey);
    
    return events.map(event => {
      // Extract odds from the first bookmaker that has the market we want
      let homeOdds, drawOdds, awayOdds;
      
      if (event.bookmakers && event.bookmakers.length > 0) {
        const bookmaker = event.bookmakers[0];
        const h2hMarket = bookmaker.markets.find(market => market.key === 'h2h');
        
        if (h2hMarket) {
          const homeOutcome = h2hMarket.outcomes.find(outcome => outcome.name === event.home_team);
          const awayOutcome = h2hMarket.outcomes.find(outcome => outcome.name === event.away_team);
          const drawOutcome = h2hMarket.outcomes.find(outcome => outcome.name === 'Draw');
          
          homeOdds = homeOutcome ? homeOutcome.price : undefined;
          awayOdds = awayOutcome ? awayOutcome.price : undefined;
          drawOdds = drawOutcome ? drawOutcome.price : undefined;
        }
      }
      
      return {
        id: `${standardizedSport}-${event.id}`,
        sport: standardizedSport,
        league: event.sport_title,
        country: 'International', // OddsAPI doesn't provide country info
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        startTime: new Date(event.commence_time),
        venue: null, // OddsAPI doesn't provide venue info
        homeOdds,
        drawOdds,
        awayOdds,
        score: {
          home: null,
          away: null
        }
      };
    });
  }
  
  /**
   * Get today's events for a specific sport
   * @param sportKey The sport key 
   */
  async getTodayEvents(sportKey: string): Promise<StandardizedMatch[]> {
    try {
      // Get all upcoming events
      const events = await this.fetchEvents(sportKey);
      
      // Filter for events happening today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.commence_time);
        return eventDate >= today && eventDate < tomorrow;
      });
      
      logger.info('OddsAPIService', `Found ${todayEvents.length} events for ${sportKey} today`);
      
      // Convert to standardized format
      return this.convertToStandardizedMatches(todayEvents, sportKey);
    } catch (error: any) {
      logger.error('OddsAPIService', `Error getting today's events for ${sportKey}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get upcoming events for a specific sport
   * @param sportKey The sport key
   * @param days Number of days to look ahead
   */
  async getUpcomingEvents(sportKey: string, days: number = 7): Promise<StandardizedMatch[]> {
    try {
      // Get all upcoming events
      const events = await this.fetchEvents(sportKey);
      
      // Filter for events within the specified days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + days);
      
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.commence_time);
        return eventDate >= today && eventDate < futureDate;
      });
      
      logger.info('OddsAPIService', `Found ${upcomingEvents.length} upcoming events for ${sportKey} within ${days} days`);
      
      // Convert to standardized format
      return this.convertToStandardizedMatches(upcomingEvents, sportKey);
    } catch (error: any) {
      logger.error('OddsAPIService', `Error getting upcoming events for ${sportKey}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Search for events matching a specific team
   * @param teamName The team name to search for
   */
  async searchEventsByTeam(teamName: string): Promise<StandardizedMatch[]> {
    try {
      // First get all supported sports
      const sports = await this.getSupportedSports();
      
      // For each sport, get events and filter by team name
      const allMatches: StandardizedMatch[] = [];
      
      for (const sport of sports) {
        // Only search in active sports
        if (sport.active) {
          const events = await this.fetchEvents(sport.key);
          
          const teamEvents = events.filter(event => 
            event.home_team.toLowerCase().includes(teamName.toLowerCase()) || 
            event.away_team.toLowerCase().includes(teamName.toLowerCase())
          );
          
          if (teamEvents.length > 0) {
            const matches = this.convertToStandardizedMatches(teamEvents, sport.key);
            allMatches.push(...matches);
          }
        }
      }
      
      logger.info('OddsAPIService', `Found ${allMatches.length} events matching team "${teamName}"`);
      return allMatches;
    } catch (error: any) {
      logger.error('OddsAPIService', `Error searching events for team "${teamName}": ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get all events for today across multiple sports
   * @param sportKeys Array of sport keys
   */
  async getAllTodayEvents(sportKeys: string[]): Promise<{[sport: string]: StandardizedMatch[]}> {
    const result: {[sport: string]: StandardizedMatch[]} = {};
    
    for (const sportKey of sportKeys) {
      const standardizedSport = this.mapSportKey(sportKey);
      result[standardizedSport] = await this.getTodayEvents(sportKey);
      
      // Add a small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return result;
  }
}

// Export a singleton instance
export const oddsAPIService = new OddsAPIService();