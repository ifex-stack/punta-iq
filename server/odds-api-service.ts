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
  scores?: {
    home: number;
    away: number;
  };
  status?: string;  // For live status (e.g., "in_play", "not_started", "ended")
  time?: {
    minutes?: number;
    seconds?: number;
    extraMinutes?: number;
    period?: number; // For basketball quarters, football halves, etc.
  };
}

/**
 * Service to interact with the-odds-api.com
 */
export class OddsAPIService {
  private config: OddsAPIConfig;
  private supportedSports: Map<string, OddsAPISport> = new Map();
  private regionMappings: {[region: string]: string} = {
    'UK': 'uk',
    'United Kingdom': 'uk',
    'US': 'us',
    'United States': 'us',
    'EU': 'eu',
    'Europe': 'eu',
    'Africa': 'uk', // Most African markets use UK odds
    'Nigeria': 'uk',
    'Australia': 'au',
    'World': 'eu,uk,us', // For global events, check multiple markets
    'International': 'eu,uk,us'
  };
  
  constructor() {
    this.config = {
      baseUrl: 'https://api.the-odds-api.com/v4',
      apiKey: process.env.ODDS_API_KEY || process.env.API_SPORTS_KEY || '0f4365e761a8019b22bf5c8b524c6d71'
    };
    
    logger.info('OddsAPIService', 'Service initialized with API key: ' + this.config.apiKey.substring(0, 5) + '...');
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
   * Extract country/region information from sports title
   * @param sportTitle The sport title from the API
   */
  private extractCountryFromTitle(sportTitle: string): string {
    // Extract country or region from title if possible
    const parts = sportTitle.split(' - ');
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    
    // Check if it contains a known country or region name
    const knownCountries = [
      'England', 'Spain', 'Italy', 'Germany', 'France', 'Netherlands', 
      'Portugal', 'Brazil', 'Argentina', 'Mexico', 'USA', 'Nigeria',
      'South Africa', 'Egypt', 'China', 'Japan', 'Australia'
    ];
    
    for (const country of knownCountries) {
      if (sportTitle.includes(country)) {
        return country;
      }
    }
    
    // Special cases for tournaments
    if (sportTitle.includes('Champions League') || sportTitle.includes('Europa')) {
      return 'Europe';
    }
    
    if (sportTitle.includes('World Cup') || sportTitle.includes('International')) {
      return 'International';
    }
    
    if (sportTitle.includes('AFCON') || sportTitle.includes('African Cup')) {
      return 'Africa';
    }
    
    return 'International';
  }

  /**
   * Extract league information from sports title
   * @param sportTitle The sport title from the API
   */
  private extractLeagueFromTitle(sportTitle: string): string {
    // Some APIs include both the league and country in format "League - Country"
    const parts = sportTitle.split(' - ');
    if (parts.length >= 2) {
      return parts[0].trim();
    }
    
    // Try to extract league information from common patterns
    if (sportTitle.includes('Premier League')) {
      return 'Premier League';
    }
    
    if (sportTitle.includes('La Liga')) {
      return 'La Liga';
    }
    
    if (sportTitle.includes('Serie A')) {
      return 'Serie A';
    }
    
    if (sportTitle.includes('Bundesliga')) {
      return 'Bundesliga';
    }
    
    if (sportTitle.includes('Ligue 1')) {
      return 'Ligue 1';
    }
    
    if (sportTitle.includes('MLS')) {
      return 'MLS';
    }
    
    if (sportTitle.includes('Champions League')) {
      return 'Champions League';
    }
    
    if (sportTitle.includes('Europa League')) {
      return 'Europa League';
    }
    
    if (sportTitle.includes('World Cup')) {
      return 'World Cup';
    }
    
    // If we can't extract a specific league, return the full title
    return sportTitle;
  }

  /**
   * Convert OddsAPI events to StandardizedMatch format
   * @param events OddsAPI events
   * @param sportKey The sport key
   */
  private convertToStandardizedMatches(events: OddsAPIEvent[], sportKey: string): StandardizedMatch[] {
    const standardizedSport = this.mapSportKey(sportKey);
    
    return events.map(event => {
      // Extract odds from all available bookmakers and average them for more accurate pricing
      let homeOddsTotal = 0;
      let drawOddsTotal = 0;
      let awayOddsTotal = 0;
      let homeOddsCount = 0;
      let drawOddsCount = 0;
      let awayOddsCount = 0;
      
      if (event.bookmakers && event.bookmakers.length > 0) {
        event.bookmakers.forEach(bookmaker => {
          const h2hMarket = bookmaker.markets.find(market => market.key === 'h2h');
          
          if (h2hMarket) {
            const homeOutcome = h2hMarket.outcomes.find(outcome => outcome.name === event.home_team);
            const awayOutcome = h2hMarket.outcomes.find(outcome => outcome.name === event.away_team);
            const drawOutcome = h2hMarket.outcomes.find(outcome => outcome.name === 'Draw');
            
            if (homeOutcome) {
              homeOddsTotal += homeOutcome.price;
              homeOddsCount++;
            }
            
            if (awayOutcome) {
              awayOddsTotal += awayOutcome.price;
              awayOddsCount++;
            }
            
            if (drawOutcome) {
              drawOddsTotal += drawOutcome.price;
              drawOddsCount++;
            }
          }
        });
      }
      
      // Calculate average odds
      const homeOdds = homeOddsCount > 0 ? homeOddsTotal / homeOddsCount : undefined;
      const awayOdds = awayOddsCount > 0 ? awayOddsTotal / awayOddsCount : undefined;
      const drawOdds = drawOddsCount > 0 ? drawOddsTotal / drawOddsCount : undefined;
      
      // Extract country and league information
      const country = this.extractCountryFromTitle(event.sport_title);
      const league = this.extractLeagueFromTitle(event.sport_title);
      
      return {
        id: `${standardizedSport}-${event.id}`,
        sport: standardizedSport,
        league: league,
        country: country,
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
   * Get all supported soccer leagues
   * This includes both major and minor leagues across the world
   */
  async getAllSoccerLeagues(): Promise<string[]> {
    // Soccer has multiple specific leagues available in the API
    return [
      'soccer_epl',                  // English Premier League
      'soccer_spain_la_liga',        // Spanish La Liga
      'soccer_germany_bundesliga',   // German Bundesliga
      'soccer_italy_serie_a',        // Italian Serie A
      'soccer_france_ligue_one',     // French Ligue 1
      'soccer_netherlands_eredivisie', // Dutch Eredivisie
      'soccer_portugal_primeira_liga', // Portuguese Primeira Liga
      'soccer_uefa_champions_league',  // UEFA Champions League
      'soccer_uefa_europa_league',     // UEFA Europa League
      'soccer_england_league1',        // English League One
      'soccer_england_league2',        // English League Two
      'soccer_england_efl_champ',      // English Championship
      'soccer_mexico_ligamx',          // Liga MX
      'soccer_africa_cup_of_nations',  // Africa Cup of Nations
      'soccer_brazil_campeonato',      // Brazilian Serie A
      'soccer_argentina_primera_division', // Argentinian Primera División
      'soccer_belgium_first_div',      // Belgian First Division
      'soccer_fifa_world_cup',         // FIFA World Cup
      'soccer_denmark_superliga',      // Danish Superliga
      'soccer_turkey_super_league',    // Turkish Super Lig
      'soccer_norway_eliteserien',     // Norwegian Eliteserien
      'soccer_saudi_proleague',        // Saudi Pro League
      'soccer_usa_mls',                // Major League Soccer (USA)
      'soccer_china_superleague',      // Chinese Super League
      'soccer_japan_j_league',         // Japanese J League
    ];
  }

  /**
   * Get upcoming events for a specific sport with more flexibility
   * @param sportKey The sport key
   * @param days Number of days to look ahead
   * @param startDate Optional specific start date
   * @param regions Optional regions to fetch odds for
   */
  async getUpcomingEvents(
    sportKey: string, 
    days: number = 7, 
    startDate?: Date,
    regions?: string
  ): Promise<StandardizedMatch[]> {
    try {
      // If sportKey is 'soccer_all', fetch data from all soccer leagues
      if (sportKey === 'soccer_all') {
        const soccerLeagues = await this.getAllSoccerLeagues();
        let allMatches: StandardizedMatch[] = [];
        
        // For each soccer league, get matches and combine results
        for (const league of soccerLeagues) {
          try {
            const leagueMatches = await this.getUpcomingEventsSingle(
              league, days, startDate, regions || 'eu,uk,us'
            );
            
            if (leagueMatches.length > 0) {
              allMatches = [...allMatches, ...leagueMatches];
              
              // Respect API rate limits with delay between requests
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (error: any) {
            logger.warn('OddsAPIService', `Error fetching ${league}, continuing with other leagues: ${error.message}`);
          }
        }
        
        logger.info('OddsAPIService', `Found ${allMatches.length} total soccer events across all leagues`);
        return allMatches;
      }
      
      // Regular single league/sport fetch
      return this.getUpcomingEventsSingle(sportKey, days, startDate, regions);
    } catch (error: any) {
      logger.error('OddsAPIService', `Error getting upcoming events for ${sportKey}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Internal method to get upcoming events for a single sport/league
   */
  private async getUpcomingEventsSingle(
    sportKey: string, 
    days: number = 7, 
    startDate?: Date,
    regions?: string
  ): Promise<StandardizedMatch[]> {
    try {
      // Get all upcoming events with specified regions
      const events = await this.fetchEvents(sportKey, regions || 'us');
      
      // Calculate date range
      const start = startDate || new Date();
      if (!startDate) {
        start.setHours(0, 0, 0, 0);
      }
      
      const end = new Date(start);
      end.setDate(end.getDate() + days);
      
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.commence_time);
        return eventDate >= start && eventDate < end;
      });
      
      logger.info('OddsAPIService', `Found ${upcomingEvents.length} upcoming events for ${sportKey} within specified date range`);
      
      // Convert to standardized format
      return this.convertToStandardizedMatches(upcomingEvents, sportKey);
    } catch (error: any) {
      logger.error('OddsAPIService', `Error getting upcoming events for ${sportKey}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Fetch live in-play events (matches currently in progress)
   * @param sportKey The sport key to fetch live events for, or 'all' for all sports
   * @param region The region for odds, defaults to 'uk'
   */
  async fetchLiveEvents(sportKey: string = 'all', region: string = 'uk'): Promise<OddsAPIEvent[]> {
    try {
      // Map region to API parameters
      const regions = this.mapRegionToApiParameter(region);
      
      // Get all sports if 'all' is specified
      let sportsToFetch: string[] = [];
      
      if (sportKey === 'all') {
        // Fetch all available sports first
        const allSports = await this.getSupportedSports();
        sportsToFetch = allSports.filter(sport => sport.active).map(sport => sport.key);
      } else {
        sportsToFetch = [sportKey];
      }
      
      // For each sport, fetch the live events
      let allLiveEvents: OddsAPIEvent[] = [];
      
      for (const sport of sportsToFetch) {
        try {
          // Construct the API URL - with the 'in_play=true' parameter
          const url = `${this.config.baseUrl}/sports/${sport}/scores`;
          logger.info('OddsAPIService', `Fetching live scores from ${url} for ${sport}`);
          
          const response = await axios.get(url, {
            params: {
              apiKey: this.config.apiKey,
              daysFrom: 0,
              dateFormat: 'iso'
            }
          });
          
          const events = response.data as OddsAPIEvent[];
          // Filter to only include events that are in progress
          const liveEvents = events.filter(event => event.status === 'in_play');
          logger.info('OddsAPIService', `Fetched ${liveEvents.length} live events for ${sport}`);
          
          allLiveEvents = [...allLiveEvents, ...liveEvents];
        } catch (error: any) {
          logger.error('OddsAPIService', `Error fetching live events for ${sport}: ${error.message}`);
          // Continue with other sports even if one fails
        }
      }
      
      return allLiveEvents;
    } catch (error: any) {
      logger.error('OddsAPIService', `Error fetching live events: ${error.message}`);
      if (error.response) {
        logger.error('OddsAPIService', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      return [];
    }
  }
  
  /**
   * Get live match scores for all in-progress events
   * @param sportKey The sport key to fetch live scores for, or 'all' for all sports
   */
  async getLiveScores(sportKey: string = 'all'): Promise<StandardizedMatch[]> {
    try {
      // Fetch live events
      const liveEvents = await this.fetchLiveEvents(sportKey);
      
      // Convert live events to StandardizedMatch format
      const standardizedMatches = liveEvents.map(event => {
        const sport = this.mapSportKey(event.sport_key);
        const country = this.extractCountryFromTitle(event.sport_title);
        const league = this.extractLeagueFromTitle(event.sport_title);
        
        return {
          id: `${sport}-${event.id}`,
          sport,
          league,
          country,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          startTime: new Date(event.commence_time),
          venue: null,
          homeOdds: undefined,
          drawOdds: undefined,
          awayOdds: undefined,
          score: {
            home: event.scores?.home ?? null,
            away: event.scores?.away ?? null
          },
          status: event.status || 'in_play',
          time: event.time ? {
            minutes: event.time.minutes,
            seconds: event.time.seconds,
            period: event.time.period
          } : undefined
        };
      });
      
      logger.info('OddsAPIService', `Converted ${standardizedMatches.length} live events to standardized format`);
      return standardizedMatches;
    } catch (error: any) {
      logger.error('OddsAPIService', `Error getting live scores: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Map region string to API parameter format
   * @param region Region name (can be user-friendly format like 'UK' or 'United States')
   */
  private mapRegionToApiParameter(region: string): string {
    // Check if it's already in the right format (lowercase)
    if (['uk', 'us', 'eu', 'au'].includes(region.toLowerCase())) {
      return region.toLowerCase();
    }
    
    // Check if we have a mapping for this region
    if (this.regionMappings[region]) {
      return this.regionMappings[region];
    }
    
    // Default to UK odds format
    return 'uk';
  }
  
  /**
   * Get the standardized sport key format required by the API
   */
  private getStandardizedSportKey(sportKey: string): string {
    // Convert standardized sport name to API sport key if needed
    const reverseMapping: {[key: string]: string} = {
      'football': 'soccer',
      'american_football': 'americanfootball',
      'hockey': 'icehockey'
    };
    
    return reverseMapping[sportKey] || sportKey;
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