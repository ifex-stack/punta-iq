/**
 * Client for communicating with the AI Flask microservice
 * Includes circuit breaker pattern for fault tolerance
 */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { createContextLogger } from "./logger";

interface ServiceStatus {
  status: "ok" | "error" | "degraded";
  message: string;
  requests_remaining?: string | null;
}

interface StatusResponse {
  overall: "ok" | "error" | "degraded";
  services: {
    odds_api?: ServiceStatus;
    sportsdb_api?: ServiceStatus;
  };
  timestamp: string;
}

interface TierMetadata {
  description: string;
  isPremium: boolean;
}

interface TierSystemMetadata {
  [key: string]: TierMetadata;
}

interface ConfidenceLevelMetadata {
  range: string;
  description: string;
}

interface ConfidenceLevelsMetadata {
  [key: string]: ConfidenceLevelMetadata;
}

interface PredictionMetadata {
  sport: {
    name: string;
    competitions: string[];
  };
  confidence_levels: ConfidenceLevelsMetadata;
  tiers: {
    [key: string]: TierMetadata;
  };
}

interface ValueBet {
  outcome: string;
  odds: number;
  value: number;
  edge: number;
  tier: string;
  isRecommended: boolean;
}

interface Prediction {
  id: string;
  matchId: string;
  sport: string;
  createdAt: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  league: string;
  predictedOutcome: string;
  confidence: number;
  confidenceLevel: string;
  confidence_explanation?: string;
  tier: string;
  isPremium: boolean;
  valueBet?: ValueBet;
  predictions: Record<string, any>;
}

interface Match {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

// Circuit breaker states
enum CircuitState {
  CLOSED, // Normal operation, requests pass through
  OPEN,   // Circuit is open, requests fail fast
  HALF_OPEN // Testing if the system has recovered
}

/**
 * Client for interacting with the AI Flask microservice
 * Includes circuit breaker pattern to prevent cascading failures
 */
export class MicroserviceClient {
  private baseUrl: string;
  private logger = createContextLogger("MicroserviceClient");
  
  // Circuit breaker configuration
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private readonly failureThreshold: number = 3; // Lowered from 5 to 3 for faster response
  private readonly resetTimeout: number = 15000; // 15 seconds (reduced from 30s)
  private nextRetryTime: number = 0;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  
  // Cache configuration
  private cache: Map<string, {data: any, timestamp: number}> = new Map();
  private readonly cacheTimeout: number = 60000; // 1 minute
  
  // Connection settings
  private connectionTimeoutMs: number = 5000; // 5 seconds

  // Track discovered ports for dynamic service discovery
  private static discoveredPort: number | null = null;
  private static ports = [5001, 5002, 5003, 5004, 5005, 5000];
  
  constructor() {
    // If we've already discovered a working port, use it
    if (MicroserviceClient.discoveredPort) {
      this.baseUrl = `http://localhost:${MicroserviceClient.discoveredPort}`;
      this.logger.info(`Using previously discovered port: ${MicroserviceClient.discoveredPort}`);
      return;
    }
    
    // Otherwise use the configured URL or default
    this.baseUrl = process.env.AI_SERVICE_URL || "http://localhost:5001";
    this.logger.info(`Initialized with base URL: ${this.baseUrl}`);
  }
  
  /**
   * Dynamically discover the correct port for the microservice
   * This will update the baseUrl if a working port is found
   */
  private async discoverPort(): Promise<boolean> {
    // Skip discovery if we already found a port or URL is not localhost
    if (MicroserviceClient.discoveredPort || !this.baseUrl.includes('localhost')) {
      return true;
    }
    
    this.logger.info('Attempting to discover AI service port');
    
    // Try each potential port
    for (const port of MicroserviceClient.ports) {
      try {
        const testUrl = `http://localhost:${port}`;
        this.logger.debug(`Testing port ${port}`);
        
        const response = await axios({
          method: 'get',
          url: `${testUrl}/api/status`,
          timeout: 1000
        });
        
        if (response.status === 200) {
          this.logger.info(`Discovered AI service on port ${port}`);
          this.baseUrl = testUrl;
          MicroserviceClient.discoveredPort = port;
          return true;
        }
      } catch (error) {
        // Continue to next port
      }
    }
    
    this.logger.warn('Failed to discover AI service port');
    return false;
  }

  /**
   * Check if the microservice is running
   */
  async isRunning(): Promise<boolean> {
    try {
      await this.makeRequest<any>({
        method: 'get',
        url: '/api/status',
        timeout: 5000,
        bypassCircuitBreaker: true // Always attempt health checks
      });
      
      // If we got here, the service is running
      if (this.circuitState === CircuitState.OPEN) {
        this.logger.info("Service is back online, setting circuit breaker to HALF_OPEN");
        this.circuitState = CircuitState.HALF_OPEN;
      }
      
      return true;
    } catch (error) {
      // Don't affect circuit breaker state for health checks
      this.logger.error(`Error checking microservice status: ${error}`);
      return false;
    }
  }

  /**
   * Get the status of the external APIs
   */
  async getStatus(): Promise<StatusResponse> {
    return this.makeRequest<StatusResponse>({
      method: 'get',
      url: '/api/status',
      timeout: 5000
    });
  }

  /**
   * Get list of supported sports
   */
  async getSports(): Promise<any> {
    return this.makeRequest<any>({
      method: 'get',
      url: '/api/sports',
      cacheKey: 'sports', // Cache the sports list
      cacheTTL: 3600000 // 1 hour cache
    });
  }

  /**
   * Get odds for a specific sport
   */
  async getOdds(sport: string): Promise<Match[]> {
    return this.makeRequest<Match[]>({
      method: 'get',
      url: `/api/odds/${sport}`,
      cacheKey: `odds_${sport}`,
      cacheTTL: 300000 // 5 minutes cache
    });
  }

  /**
   * Get live scores for current matches
   */
  async getLiveScores(): Promise<any> {
    return this.makeRequest<any>({
      method: 'get',
      url: '/api/livescore',
      cacheKey: 'livescore',
      cacheTTL: 60000 // 1 minute cache for live data
    });
  }

  /**
   * Get fixtures for a specific league
   */
  async getLeagueFixtures(leagueId: string): Promise<any> {
    return this.makeRequest<any>({
      method: 'get',
      url: `/api/fixtures/league/${leagueId}`,
      cacheKey: `fixtures_${leagueId}`,
      cacheTTL: 3600000 // 1 hour cache
    });
  }

  /**
   * Get teams in a specific league
   */
  async getTeams(leagueId: string): Promise<any> {
    return this.makeRequest<any>({
      method: 'get',
      url: `/api/teams/league/${leagueId}`,
      cacheKey: `teams_${leagueId}`,
      cacheTTL: 86400000 // 24 hour cache for static data
    });
  }

  /**
   * Get all leagues
   */
  async getLeagues(): Promise<any> {
    return this.makeRequest<any>({
      method: 'get',
      url: '/api/leagues',
      cacheKey: 'leagues',
      cacheTTL: 86400000 // 24 hour cache for static data
    });
  }
  
  /**
   * Get predictions for a specific sport
   * @param sport - The sport to get predictions for (e.g., 'football', 'basketball')
   * @param options - Options for filtering predictions
   */
  async getSportPredictions(
    sport: string, 
    options: {
      minConfidence?: number;
      tier?: string;
      includePremium?: boolean;
    } = {}
  ): Promise<{ predictions: Prediction[]; metadata: PredictionMetadata }> {
    const { minConfidence, tier, includePremium = true } = options;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (minConfidence !== undefined) {
      params.append('min_confidence', minConfidence.toString());
    }
    if (tier !== undefined) {
      params.append('tier', tier);
    }
    if (includePremium !== undefined) {
      params.append('include_premium', includePremium.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return this.makeRequest<any>({
      method: 'get',
      url: `/api/predictions/sports/${sport}${queryString}`,
      cacheKey: `predictions_${sport}_${queryString}`,
      cacheTTL: 900000 // 15 minutes cache
    });
  }
  
  /**
   * Get accumulator predictions with tier support
   * @param options - Options for filtering accumulators
   */
  async getAccumulators(
    options: {
      tier?: string;
      tierCategory?: string;
      size?: number;
    } = {}
  ): Promise<any> {
    const { tier, tierCategory, size } = options;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (tier !== undefined) {
      params.append('tier', tier);
    }
    if (tierCategory !== undefined) {
      params.append('tier_category', tierCategory);
    }
    if (size !== undefined) {
      params.append('size', size.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return this.makeRequest<any>({
      method: 'get',
      url: `/api/predictions/accumulators${queryString}`,
      cacheKey: `accumulators_${queryString}`,
      cacheTTL: 900000 // 15 minutes cache
    });
  }
  
  /**
   * Get predictions organized by tier
   * Returns combined results from all supported sports, organized by tier
   */
  async getTieredPredictions(): Promise<{
    tier1: Prediction[];
    tier2: Prediction[];
    tier5: Prediction[];
    tier10: Prediction[];
    metadata: {
      tiers: TierSystemMetadata;
      timestamp: string;
    }
  }> {
    // Organize predictions by their tier
    const result = {
      tier1: [] as Prediction[],
      tier2: [] as Prediction[],
      tier5: [] as Prediction[],
      tier10: [] as Prediction[],
      metadata: {
        tiers: {
          tier1: {
            description: "Premium predictions with highest confidence and value",
            isPremium: true
          },
          tier2: {
            description: "High confidence selections with strong value",
            isPremium: true
          },
          tier5: {
            description: "Solid selections with reasonable value",
            isPremium: false
          },
          tier10: {
            description: "Standard selections with varied confidence",
            isPremium: false
          }
        },
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      // Get predictions for each sport
      const football = await this.getSportPredictions('football');
      const basketball = await this.getSportPredictions('basketball');
      
      // Get all predictions
      const allPredictions = [
        ...(football?.predictions || []),
        ...(basketball?.predictions || [])
      ];
      
      // Categorize by tier
      for (const pred of allPredictions) {
        if (pred.tier === 'Tier 1') {
          result.tier1.push(pred);
        } else if (pred.tier === 'Tier 2') {
          result.tier2.push(pred);
        } else if (pred.tier === 'Tier 5') {
          result.tier5.push(pred);
        } else {
          result.tier10.push(pred);
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error getting tiered predictions: ${error}`);
      throw error;
    }
  }
  
  /**
   * Core request method with circuit breaker, retry logic, and caching
   */
  private async makeRequest<T>({
    method = 'get',
    url,
    data = undefined,
    timeout = 10000,
    cacheKey = '',
    cacheTTL = 0,
    bypassCircuitBreaker = false,
    retryAttempts = 0,
    shouldTryPortDiscovery = true
  }: {
    method?: string;
    url: string;
    data?: any;
    timeout?: number;
    cacheKey?: string;
    cacheTTL?: number;
    bypassCircuitBreaker?: boolean;
    retryAttempts?: number;
    shouldTryPortDiscovery?: boolean;
  }): Promise<T> {
    // Check circuit breaker unless bypassed
    if (!bypassCircuitBreaker) {
      if (this.circuitState === CircuitState.OPEN) {
        // Check if it's time to try again
        if (Date.now() < this.nextRetryTime) {
          this.logger.warn(`Circuit is OPEN, failing fast for ${url}`);
          return this.getFromCacheOrFail<T>(cacheKey, `Service temporarily unavailable`);
        } else {
          this.logger.info(`Circuit breaker retry time reached, setting to HALF_OPEN`);
          this.circuitState = CircuitState.HALF_OPEN;
        }
      }
    }
    
    // Check cache first if caching is enabled
    if (cacheKey && cacheTTL > 0) {
      const cachedItem = this.cache.get(cacheKey);
      if (cachedItem && (Date.now() - cachedItem.timestamp) < cacheTTL) {
        this.logger.debug(`Cache hit for ${url} with key ${cacheKey}`);
        return cachedItem.data as T;
      }
    }
    
    try {
      // Try port discovery if we're using localhost and at the first attempt
      if (shouldTryPortDiscovery && 
          this.baseUrl.includes('localhost') && 
          retryAttempts === 0 && 
          !MicroserviceClient.discoveredPort) {
        await this.discoverPort();
      }
      
      // Build full URL with base
      const fullUrl = `${this.baseUrl}${url}`;
      
      // Make the actual request with optimized timeout
      const response = await axios({
        method,
        url: fullUrl,
        data,
        timeout: timeout || this.connectionTimeoutMs,
        headers: {
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=5, max=1000',
          'Cache-Control': 'no-cache'
        },
        maxRedirects: 3,
        validateStatus: (status) => status < 500 // Only treat 5xx as errors
      });
      
      // Handle non-200 responses but not 5xx
      if (response.status !== 200) {
        this.logger.warn(`Non-200 response (${response.status}) for ${url}: ${JSON.stringify(response.data)}`);
        if (response.status === 429) {
          // Rate limit - cache and return stale data if available
          return this.getFromCacheOrFail<T>(cacheKey, `API rate limit exceeded. Please try again later.`);
        }
      }
      
      // If we're in HALF_OPEN and the request succeeded, close the circuit
      if (this.circuitState === CircuitState.HALF_OPEN) {
        this.logger.info(`Circuit test successful, closing circuit`);
        this.circuitState = CircuitState.CLOSED;
        this.failureCount = 0;
        this.retryCount = 0;
      }
      
      // Cache the result if caching is enabled - even cache HTTP 400s when appropriate
      if (cacheKey && cacheTTL > 0 && response.data) {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }
      
      return response.data;
    } catch (error) {
      // Check if we should retry
      if (retryAttempts < this.maxRetries) {
        const delay = Math.pow(2, retryAttempts) * 500; // Exponential backoff
        this.logger.info(`Retry attempt ${retryAttempts + 1}/${this.maxRetries} for ${url} after ${delay}ms delay`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Recursive retry with incremented attempt count
        return this.makeRequest<T>({
          method,
          url,
          data,
          timeout: timeout * 1.5, // Increase timeout for retries
          cacheKey,
          cacheTTL,
          bypassCircuitBreaker,
          retryAttempts: retryAttempts + 1,
          shouldTryPortDiscovery: retryAttempts === 0 // Only try discovery on first retry
        });
      }
      
      // If we've exhausted retries, proceed with error handling
      this.handleRequestError(error as Error, url);
      
      // Try to return from cache if available, otherwise throw
      return this.getFromCacheOrFail<T>(cacheKey, this.formatErrorMessage(error as Error));
    }
  }
  
  /**
   * Handle request errors and update circuit breaker state
   */
  private handleRequestError(error: Error, url: string): void {
    // Log the error
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      this.logger.error(`API error for ${url}: ${axiosError.message} ${axiosError.response?.status || ''}`);
    } else {
      this.logger.error(`Error for ${url}: ${error.message}`);
    }
    
    // Update circuit breaker state
    this.failureCount++;
    
    if (this.circuitState === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
      this.circuitState = CircuitState.OPEN;
      this.nextRetryTime = Date.now() + this.resetTimeout;
      this.logger.warn(`Circuit breaker threshold reached, opening circuit until ${new Date(this.nextRetryTime).toISOString()}`);
    }
    
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.OPEN;
      this.nextRetryTime = Date.now() + this.resetTimeout;
      this.logger.warn(`Request failed in HALF_OPEN state, reopening circuit until ${new Date(this.nextRetryTime).toISOString()}`);
    }
  }
  
  /**
   * Try to get data from cache or fail with an error
   */
  private getFromCacheOrFail<T>(cacheKey: string, errorMessage: string): T {
    if (cacheKey) {
      const cachedItem = this.cache.get(cacheKey);
      if (cachedItem) {
        this.logger.info(`Returning stale cached data for ${cacheKey} due to service unavailability`);
        return cachedItem.data as T;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  /**
   * Format error messages for better readability
   */
  private formatErrorMessage(error: Error): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED') {
        return 'Service unavailable. Please try again later.';
      }
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        return 'API authentication failed. Please check your API keys.';
      }
      if (axiosError.response?.status === 429) {
        return 'API rate limit exceeded. Please try again later.';
      }
      return `Service error: ${axiosError.response?.status || axiosError.message}`;
    }
    return `Error: ${error.message}`;
  }
}