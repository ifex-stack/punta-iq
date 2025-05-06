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
    // Check if required API key is available - reduced logging for deployment
    if (!process.env.ODDS_API_KEY) {
      // Just log once at startup instead of repeatedly
      logger.warn('OddsAPIService', 'ODDS_API_KEY environment variable is not set. Using fallback data.');
    }
    
    this.config = {
      baseUrl: 'https://api.the-odds-api.com/v4',
      apiKey: process.env.ODDS_API_KEY || process.env.API_SPORTS_KEY || ''
    };
    
    // Log initialization but don't expose API key in logs
    if (this.config.apiKey) {
      const keyPrefix = this.config.apiKey.substring(0, 3);
      logger.info('OddsAPIService', `Service initialized with API key: ${keyPrefix}***`);
    } else {
      logger.info('OddsAPIService', 'Service initialized using fallback data mode');
    }
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
      // Use a single log entry with less detail to reduce log spam
      const status = error.response?.status || 'unknown';
      logger.warn('OddsAPIService', `Could not fetch sports list (status: ${status}) - using default sports`);
      
      // Return a default list of sports
      return [
        { key: 'soccer_epl', group: 'soccer', title: 'Premier League - England', description: 'English Premier League Soccer', active: true, has_outrights: false },
        { key: 'soccer_spain_la_liga', group: 'soccer', title: 'La Liga - Spain', description: 'Spanish La Liga Soccer', active: true, has_outrights: false },
        { key: 'basketball_nba', group: 'basketball', title: 'NBA - USA', description: 'US NBA Basketball', active: true, has_outrights: false },
        { key: 'tennis_atp', group: 'tennis', title: 'ATP - International', description: 'Men\'s Tennis', active: true, has_outrights: false }
      ];
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
    // Check if API key is available before attempting to fetch from API
    if (!this.config.apiKey) {
      // Use info level instead of warn to reduce log noise
      logger.info('OddsAPIService', `Using fallback data for ${sportKey} (no API key)`);
      return this.getFallbackEvents(sportKey);
    }
    
    try {
      const url = `${this.config.baseUrl}/sports/${sportKey}/odds`;
      logger.info('OddsAPIService', `Fetching events for ${sportKey}`);
      
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
      
      // If we get no events from the API, use fallback data
      if (events.length === 0) {
        logger.info('OddsAPIService', `No events found for ${sportKey} - using fallback data`);
        return this.getFallbackEvents(sportKey);
      }
      
      return events;
    } catch (error: any) {
      // Only log the error message, not the full error details
      const isRateLimitError = error.response?.status === 429;
      const status = error.response?.status || 'unknown';
      
      if (isRateLimitError) {
        logger.info('OddsAPIService', `Rate limit reached for API - using fallback data for ${sportKey}`);
      } else {
        logger.info('OddsAPIService', `API error (${status}) - using fallback data for ${sportKey}`);
      }
      
      // Return fallback events on API error
      return this.getFallbackEvents(sportKey);
    }
  }
  
  /**
   * Get fallback events when API is unavailable
   * Note: This data is structured to match the API response format
   */
  private getFallbackEvents(sportKey: string): OddsAPIEvent[] {
    // Current timestamp for calculating relative commence times
    const now = new Date();
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    // Default match structure
    const fallbackMatch = (id: string, homeTeam: string, awayTeam: string, startTime: Date, sportTitle: string): OddsAPIEvent => {
      return {
        id: id,
        sport_key: sportKey,
        sport_title: sportTitle,
        commence_time: startTime.toISOString(),
        home_team: homeTeam,
        away_team: awayTeam,
        bookmakers: [
          {
            key: 'fallback-bookie',
            title: 'PuntaIQ Odds',
            last_update: now.toISOString(),
            markets: [
              {
                key: 'h2h',
                last_update: now.toISOString(),
                outcomes: [
                  { name: homeTeam, price: 2.1 },
                  { name: 'Draw', price: 3.4 },
                  { name: awayTeam, price: 3.2 }
                ]
              }
            ]
          }
        ]
      };
    };
    
    // Sport-specific fallback data
    if (sportKey.includes('soccer') || sportKey === 'football') {
      return [
        fallbackMatch('fb1', 'Arsenal', 'Chelsea', tomorrow, 'Premier League - England'),
        fallbackMatch('fb2', 'Liverpool', 'Manchester United', tomorrow, 'Premier League - England'),
        fallbackMatch('fb3', 'Barcelona', 'Real Madrid', dayAfter, 'La Liga - Spain'),
        fallbackMatch('fb4', 'Bayern Munich', 'Borussia Dortmund', dayAfter, 'Bundesliga - Germany'),
        fallbackMatch('fb5', 'PSG', 'Lyon', tomorrow, 'Ligue 1 - France'),
        fallbackMatch('fb6', 'Juventus', 'AC Milan', dayAfter, 'Serie A - Italy')
      ];
    } else if (sportKey.includes('basketball')) {
      return [
        fallbackMatch('bb1', 'Los Angeles Lakers', 'Boston Celtics', tomorrow, 'NBA - USA'),
        fallbackMatch('bb2', 'Golden State Warriors', 'Brooklyn Nets', tomorrow, 'NBA - USA'),
        fallbackMatch('bb3', 'Miami Heat', 'Chicago Bulls', dayAfter, 'NBA - USA')
      ];
    } else if (sportKey.includes('tennis')) {
      return [
        fallbackMatch('tn1', 'Novak Djokovic', 'Rafael Nadal', tomorrow, 'ATP Masters 1000 - International'),
        fallbackMatch('tn2', 'Roger Federer', 'Andy Murray', dayAfter, 'ATP Masters 1000 - International')
      ];
    } else {
      // Generic fallback for other sports
      return [
        fallbackMatch('gen1', 'Team A', 'Team B', tomorrow, `${sportKey} - International`),
        fallbackMatch('gen2', 'Team C', 'Team D', dayAfter, `${sportKey} - International`)
      ];
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
      // Avoid filling logs with error messages
      logger.info('OddsAPIService', `Could not get today's events for ${sportKey} - using empty list`);
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
      logger.warn('OddsAPIService', `Unable to get upcoming events for ${sportKey} - using fallback data`);
      // Convert the fallback events to standardized matches to fix type error
      return this.convertToStandardizedMatches(this.getFallbackEvents(sportKey), sportKey);
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
      // Avoid error spam in logs
      logger.info('OddsAPIService', `Using empty list for upcoming events (${sportKey})`);
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
          logger.warn('OddsAPIService', `Skipping live events for ${sport} - continuing with other sports`);
          // Continue with other sports even if one fails
        }
      }
      
      return allLiveEvents;
    } catch (error: any) {
      const status = error.response?.status || 'unknown';
      logger.warn('OddsAPIService', `Could not fetch live events (status: ${status}) - using empty list`);
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
      
      // Check if we got any events back or if there's a potential API quota issue
      if (liveEvents.length === 0) {
        // If we didn't get any live events, check if it's because of the API quota
        logger.warn('OddsAPIService', 'No live events found. This might be due to API quota limitations or no matches currently in play.');
        
        // Return sample data with clear indication that it's due to API limitations
        if (this.shouldProvideFallbackData()) {
          return this.getFallbackLiveScores(sportKey);
        }
      }
      
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
      const status = error.response?.status || 'unknown';
      // Use a less verbose log message to reduce noise
      logger.warn('OddsAPIService', `Could not retrieve live scores (status: ${status}) - using fallback data`);
      
      // Provide fallback data for any error to ensure UI has something to display
      if (this.shouldProvideFallbackData()) {
        return this.getFallbackLiveScores(sportKey);
      }
      
      return [];
    }
  }
  
  /**
   * Determines if we should provide fallback data
   * Based on configuration and environment
   */
  private shouldProvideFallbackData(): boolean {
    // In production, we would want to configure this based on environment variables
    // For now, we'll return true to ensure the UI has data to display during development
    return true;
  }
  
  /**
   * Get fallback live scores data when API quota is reached
   * This provides a clear indication to users that data is limited due to API constraints
   */
  private getFallbackLiveScores(sportKey: string = 'all'): StandardizedMatch[] {
    logger.info('OddsAPIService', 'Providing fallback live scores due to API limitations');
    
    // Create a standardized message about API quota for all scores
    const apiLimitationMessage = "API quota reached";
    
    // Different sports to include in fallback data
    const sports = sportKey === 'all' 
      ? ['football', 'basketball', 'baseball'] 
      : [this.mapSportKey(sportKey)];
    
    const fallbackMatches: StandardizedMatch[] = [];
    
    // Generate fallback data for requested sports
    for (const sport of sports) {
      // Add a few matches per sport with appropriate status indicators
      if (sport === 'football' || sportKey === 'all') {
        fallbackMatches.push({
          id: `football-fallback-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          sport: 'football',
          league: 'API Quota Exceeded',
          country: 'Worldwide',
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          startTime: new Date(),
          venue: null,
          status: 'quota_limited',
          score: {
            home: null,
            away: null
          },
          isPopular: true
        });
      }
      
      if (sport === 'basketball' || sportKey === 'all') {
        fallbackMatches.push({
          id: `basketball-fallback-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          sport: 'basketball',
          league: 'API Quota Exceeded',
          country: 'Worldwide',
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          startTime: new Date(),
          venue: null,
          status: 'quota_limited',
          score: {
            home: null,
            away: null
          },
          isPopular: true
        });
      }
    }
    
    return fallbackMatches;
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
      logger.warn('OddsAPIService', `Team search for "${teamName}" unsuccessful - returning empty results`);
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