import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

// Sport interface for the API endpoints configuration
interface SportApiConfig {
  baseUrl: string;
  version: string;
  endpoints: {
    fixtures: string;
    leagues: string;
    teams: string;
    odds?: string;
  };
}

// Interface for the match from API-SPORTS
export interface ApiSportsMatch {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    timezone: string;
    venue: {
      id?: number;
      name?: string;
      city?: string;
    };
    status: {
      long: string;
      short: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo?: string;
    season: number;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo?: string;
    };
    away: {
      id: number;
      name: string;
      logo?: string;
    };
  };
  goals?: {
    home: number | null;
    away: number | null;
  };
  score?: any;
  odds?: {
    bookmakers?: any[];
  };
}

// Interface for our standardized match data format
// Note: When making changes to this interface, also update related interfaces in prediction-types-service.ts
export interface StandardizedMatch {
  id: string;
  sport: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string | Date;
  venue: string | null;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  status?: string;
  prediction?: string;
  confidence?: number;
  explanation?: string;
  score: {
    home: number | null;
    away: number | null;
  };
}

/**
 * A service to interact with the API-SPORTS endpoints for multiple sports
 */
class SportsApiService {
  private apiKey: string;
  private clients: Map<string, AxiosInstance> = new Map();
  private sportConfigs: {[key: string]: SportApiConfig} = {
    // Updated with correct API endpoints for testing
    football: {
      baseUrl: 'https://v3.football.api-sports.io',
      version: 'v3',
      endpoints: {
        fixtures: '/fixtures',
        leagues: '/leagues',
        teams: '/teams',
        odds: '/odds'
      }
    },
    basketball: {
      baseUrl: 'https://v1.basketball.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams',
        odds: '/odds'
      }
    },
    baseball: {
      baseUrl: 'https://v1.baseball.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams',
        odds: '/odds'
      }
    },
    nba: {
      baseUrl: 'https://v2.nba.api-sports.io',
      version: 'v2',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams',
        odds: '/odds'
      }
    },
    american_football: {
      baseUrl: 'https://v1.american-football.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams'
      }
    },
    rugby: {
      baseUrl: 'https://v1.rugby.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams'
      }
    },
    hockey: {
      baseUrl: 'https://v1.hockey.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams',
        odds: '/odds'
      }
    },
    tennis: {
      baseUrl: 'https://v1.tennis.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/fixtures',
        leagues: '/leagues',
        teams: '/players'
      }
    },
    cricket: {
      baseUrl: 'https://v1.cricket.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/fixtures',
        leagues: '/leagues',
        teams: '/teams'
      }
    },
    formula1: {
      baseUrl: 'https://v1.formula-1.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/races',
        leagues: '/seasons',
        teams: '/teams'
      }
    },
    // Additional sports endpoints
    afl: {
      baseUrl: 'https://v1.afl.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams'
      }
    },
    handball: {
      baseUrl: 'https://v1.handball.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams'
      }
    },
    mma: {
      baseUrl: 'https://v1.mma.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/fights',
        leagues: '/leagues',
        teams: '/fighters'
      }
    },
    volleyball: {
      baseUrl: 'https://v1.volleyball.api-sports.io',
      version: 'v1',
      endpoints: {
        fixtures: '/games',
        leagues: '/leagues',
        teams: '/teams'
      }
    }
  };
  
  constructor() {
    this.apiKey = process.env.API_SPORTS_KEY || '';
    if (!this.apiKey) {
      logger.warn('SportsApiService', 'API_SPORTS_KEY is not set. API calls will fail.');
    }
    
    // Initialize clients for each sport
    Object.keys(this.sportConfigs).forEach(sport => {
      const config = this.sportConfigs[sport];
      this.clients.set(sport, axios.create({
        baseURL: config.baseUrl,
        headers: {
          'x-apisports-key': this.apiKey
        }
      }));
      logger.info('SportsApiService', `Initialized client for ${sport}`);
    });
  }
  
  /**
   * Fetch fixtures/games for a specific sport
   * @param sport The sport to fetch fixtures for
   * @param options Query parameters to include in the request
   * @returns Array of standardized match objects
   */
  async getFixtures(sport: string, options: {
    date?: string; // Format: YYYY-MM-DD
    league?: number;
    season?: number;
    team?: number;
    live?: boolean;
    next?: number; // Get next N fixtures
  }): Promise<StandardizedMatch[]> {
    try {
      // Validate the sport is supported
      if (!this.sportConfigs[sport]) {
        logger.error('SportsApiService', `Unsupported sport: ${sport}`);
        return [];
      }
      
      const client = this.clients.get(sport);
      const endpoint = this.sportConfigs[sport].endpoints.fixtures;
      
      if (!client || !endpoint) {
        logger.error('SportsApiService', `Client or endpoint not configured for sport: ${sport}`);
        return [];
      }
      
      // Prepare query parameters
      const queryParams: any = {};
      
      if (options.date) {
        queryParams.date = options.date;
      }
      
      if (options.league) {
        queryParams.league = options.league;
      }
      
      if (options.season) {
        queryParams.season = options.season;
      }
      
      if (options.team) {
        queryParams.team = options.team;
      }
      
      if (options.live) {
        queryParams.live = 'all';
      }
      
      if (options.next) {
        queryParams.next = options.next;
      }
      
      // Each sport API might have slightly different parameter names and response structures
      // So we need special handling for some sports
      
      // API-Football requires a season parameter
      if (sport === 'football' && !options.season) {
        // Use 2023 - the free plan can only access seasons 2021-2023
        queryParams.season = 2023;
      }
      
      if (['basketball', 'baseball', 'american_football', 'rugby', 'hockey', 'afl', 'handball', 'volleyball'].includes(sport)) {
        if (options.date) {
          queryParams.date = options.date;
        } else {
          // If no date is provided, get today's fixtures by default
          const today = new Date().toISOString().split('T')[0];
          queryParams.date = today;
        }
      }
      
      // Tennis API uses 'date' parameter in a specific format
      if (sport === 'tennis' && options.date) {
        queryParams.date = options.date;
      }
      
      logger.info('SportsApiService', `Fetching ${sport} fixtures with params:`, queryParams);
      logger.info('SportsApiService', `Using API key: ${this.apiKey ? this.apiKey.substring(0, 5) + '...' : 'Not set'}`);
      
      let responseData;
      
      try {
        // Log the full request details for debugging
        const requestUrl = `${client.defaults.baseURL}${endpoint}`;
        logger.info('SportsApiService', `Making request to: ${requestUrl}`, {
          headers: client.defaults.headers,
          params: queryParams
        });
        
        const response = await client.get(endpoint, { params: queryParams });
        responseData = response.data;
        
        // Log more details about the response
        logger.info('SportsApiService', `${sport} API response status: ${response.status}`);
        logger.info('SportsApiService', `${sport} API response size: ${
          responseData && responseData.response ? responseData.response.length : 'No data'}`);
        
        // Log response headers for debugging authentication issues
        logger.info('SportsApiService', 'Response headers:', response.headers);
        
        if (responseData.errors && Object.keys(responseData.errors).length > 0) {
          logger.error('SportsApiService', 'API returned errors:', responseData.errors);
          return [];
        }
      } catch (error: any) {
        logger.error('SportsApiService', `Error in API request: ${error.message}`);
        if (error.response) {
          logger.error('SportsApiService', `Status: ${error.response.status}`);
          logger.error('SportsApiService', `Data: ${JSON.stringify(error.response.data)}`);
          logger.error('SportsApiService', `Headers: ${JSON.stringify(error.response.headers)}`);
        }
        throw error; // Re-throw to be caught by the outer try/catch
      }
      
      // Each sport API might have a different response structure
      // So we need to handle the response differently for each sport
      if (sport === 'football' || sport === 'cricket' || sport === 'tennis') {
        return this.processFootballFixtures(responseData.response, sport);
      } else if (['basketball', 'baseball', 'nba', 'american_football', 'rugby', 'hockey', 'afl', 'handball', 'volleyball'].includes(sport)) {
        return this.processTeamSportFixtures(responseData.response, sport);
      } else if (sport === 'formula1') {
        return this.processFormula1Races(responseData.response, sport);
      } else if (sport === 'mma') {
        // Special handler for MMA since it has a different structure
        return this.processMmaFights(responseData.response, sport);
      }
      
      // Default case if no special handling is defined for the sport
      logger.warn('SportsApiService', `No specific processor for sport: ${sport}, using default`);
      return this.processFootballFixtures(responseData.response, sport);
      
    } catch (error: any) {
      logger.error('SportsApiService', `Error fetching ${sport} fixtures: ${error.message}`);
      if (error.response) {
        logger.error('SportsApiService', 'API response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      return [];
    }
  }
  
  /**
   * Process football fixtures from the API response
   * @param fixtures Football fixtures from the API
   * @param sport The sport type
   * @returns Array of standardized match objects
   */
  private processFootballFixtures(fixtures: any[], sport: string): StandardizedMatch[] {
    if (!fixtures || !Array.isArray(fixtures)) {
      logger.warn('SportsApiService', `No fixtures found or invalid response for ${sport}`);
      return [];
    }
    
    return fixtures.map(fixture => {
      let homeOdds, drawOdds, awayOdds;
      
      // Extract odds if available
      if (fixture.odds && fixture.odds.bookmakers && fixture.odds.bookmakers.length > 0 &&
          fixture.odds.bookmakers[0].bets && fixture.odds.bookmakers[0].bets.length > 0) {
        const matchOdds = fixture.odds.bookmakers[0].bets.find((bet: any) => bet.name === 'Match Winner');
        if (matchOdds && matchOdds.values) {
          const homeOddsObj = matchOdds.values.find((v: any) => v.value === 'Home');
          const drawOddsObj = matchOdds.values.find((v: any) => v.value === 'Draw');
          const awayOddsObj = matchOdds.values.find((v: any) => v.value === 'Away');
          
          homeOdds = homeOddsObj ? parseFloat(homeOddsObj.odd) : undefined;
          drawOdds = drawOddsObj ? parseFloat(drawOddsObj.odd) : undefined;
          awayOdds = awayOddsObj ? parseFloat(awayOddsObj.odd) : undefined;
        }
      }
      
      return {
        id: `${sport}-${fixture.fixture.id}`,
        sport: sport,
        league: fixture.league.name,
        country: fixture.league.country,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        startTime: new Date(fixture.fixture.date),
        venue: fixture.fixture.venue?.name || null,
        status: fixture.fixture.status?.short || null,
        homeOdds,
        drawOdds,
        awayOdds,
        score: {
          home: fixture.goals?.home,
          away: fixture.goals?.away
        }
      };
    });
  }
  
  /**
   * Process team sport fixtures (basketball, baseball, etc.) from the API response
   * @param fixtures Team sport fixtures from the API
   * @param sport The sport type
   * @returns Array of standardized match objects
   */
  private processTeamSportFixtures(fixtures: any[], sport: string): StandardizedMatch[] {
    if (!fixtures || !Array.isArray(fixtures)) {
      logger.warn('SportsApiService', `No fixtures found or invalid response for ${sport}`);
      return [];
    }
    
    return fixtures.map(fixture => {
      let homeOdds, awayOdds;
      
      return {
        id: `${sport}-${fixture.id}`,
        sport: sport,
        league: fixture.league?.name || 'Unknown League',
        country: fixture.country?.name || fixture.league?.country || 'Unknown',
        homeTeam: fixture.teams?.home?.name || 'Home Team',
        awayTeam: fixture.teams?.away?.name || 'Away Team',
        startTime: new Date(fixture.date || fixture.time || Date.now()),
        venue: fixture.arena?.name || null,
        status: fixture.status?.short || null,
        homeOdds,
        awayOdds,
        score: {
          home: fixture.scores?.home?.total || null,
          away: fixture.scores?.away?.total || null
        }
      };
    });
  }
  
  /**
   * Get fixtures/games for today for a specific sport
   * @param sport The sport to fetch fixtures for
   * @returns Array of standardized match objects
   */
  async getTodayFixtures(sport: string): Promise<StandardizedMatch[]> {
    const today = new Date().toISOString().split('T')[0];
    // For football, we need to specify season 2023 for the free tier
    const options = sport === 'football' ? { date: today, season: 2023 } : { date: today };
    return this.getFixtures(sport, options);
  }
  
  /**
   * Get upcoming fixtures/games for a specific sport
   * @param sport The sport to fetch fixtures for
   * @param days Number of days to look ahead
   * @returns Array of standardized match objects
   */
  async getUpcomingFixtures(sport: string, days: number = 7): Promise<StandardizedMatch[]> {
    // For APIs that support "next" parameter
    if (['football'].includes(sport)) {
      return this.getFixtures(sport, { next: 20, season: 2023 });
    }
    
    // For other APIs, we fetch by date range
    const fixtures: StandardizedMatch[] = [];
    const today = new Date();
    
    // Fetch fixtures for each day in the range
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyFixtures = await this.getFixtures(sport, { date: dateStr });
      fixtures.push(...dailyFixtures);
      
      // Respect API rate limits by adding a small delay between requests
      if (i < days - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return fixtures;
  }
  
  /**
   * Process Formula 1 races from the API response
   * @param races Formula 1 races from the API
   * @param sport The sport type (should be 'formula1')
   * @returns Array of standardized match objects
   */
  /**
   * Get upcoming fixtures/games for a specific team
   * @param teamId The ID of the team to fetch fixtures for
   * @param count Number of upcoming fixtures to fetch
   * @returns Array of standardized match objects
   */
  async getTeamUpcomingFixtures(teamId: number, count: number = 3): Promise<StandardizedMatch[]> {
    try {
      logger.info('SportsApiService', `Fetching upcoming fixtures for team: ${teamId}`);
      
      // Football API supports direct team filtering
      return this.getFixtures('football', { 
        team: teamId, 
        next: count,
        season: 2023  // Required for football API
      });
    } catch (error: any) {
      logger.error('SportsApiService', `Error fetching team upcoming fixtures: ${error.message}`);
      return [];
    }
  }
  
  private processFormula1Races(races: any[], sport: string): StandardizedMatch[] {
    if (!races || !Array.isArray(races)) {
      logger.warn('SportsApiService', `No races found or invalid response for ${sport}`);
      return [];
    }
    
    return races.map(race => {
      return {
        id: `${sport}-${race.id}`,
        sport: sport,
        league: race.competition?.name || 'Formula 1',
        country: race.circuit?.location?.country || race.competition?.location?.country || 'Unknown',
        homeTeam: race.circuit?.name || 'Race',
        awayTeam: 'Formula 1 Teams',
        startTime: new Date(race.date || race.datetime || Date.now()),
        venue: race.circuit?.name || null,
        status: race.status || 'NS',
        homeOdds: undefined,
        drawOdds: undefined,
        awayOdds: undefined,
        score: {
          home: null,
          away: null
        }
      };
    });
  }
  
  /**
   * Process MMA fights from the API response
   * @param fights MMA fights from the API
   * @param sport The sport type (should be 'mma')
   * @returns Array of standardized match objects
   */
  private processMmaFights(fights: any[], sport: string): StandardizedMatch[] {
    if (!fights || !Array.isArray(fights)) {
      logger.warn('SportsApiService', `No fights found or invalid response for ${sport}`);
      return [];
    }
    
    return fights.map(fight => {
      return {
        id: `${sport}-${fight.id}`,
        sport: sport,
        league: fight.event?.name || fight.promotion?.name || 'MMA',
        country: fight.location?.country || fight.venue?.country || 'Unknown',
        homeTeam: fight.fighters?.fighter1?.name || 'Fighter 1',
        awayTeam: fight.fighters?.fighter2?.name || 'Fighter 2',
        startTime: new Date(fight.date || fight.datetime || Date.now()),
        venue: fight.venue?.name || fight.location?.venue || null,
        status: fight.status || 'NS',
        homeOdds: fight.odds?.fighter1 ? parseFloat(fight.odds.fighter1) : undefined,
        awayOdds: fight.odds?.fighter2 ? parseFloat(fight.odds.fighter2) : undefined,
        score: {
          home: null,
          away: null
        }
      };
    });
  }
  
  /**
   * Get fixtures/games for multiple sports for today
   * @param sports Array of sports to fetch fixtures for
   * @returns Object with sports as keys and arrays of standardized match objects as values
   */
  async getMultiSportFixtures(sports: string[]): Promise<{[sport: string]: StandardizedMatch[]}> {
    const result: {[sport: string]: StandardizedMatch[]} = {};
    
    // Process each sport in sequence to avoid rate limiting issues
    for (const sport of sports) {
      if (this.sportConfigs[sport]) {
        result[sport] = await this.getTodayFixtures(sport);
        
        // Add a small delay between requests to different sport APIs
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        logger.warn('SportsApiService', `Unsupported sport: ${sport}`);
        result[sport] = [];
      }
    }
    
    return result;
  }
}

// Export a singleton instance
export const sportsApiService = new SportsApiService();