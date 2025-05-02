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
  private readonly failureThreshold: number = 5;
  private readonly resetTimeout: number = 30000; // 30 seconds
  private nextRetryTime: number = 0;
  
  // Cache configuration
  private cache: Map<string, {data: any, timestamp: number}> = new Map();
  private readonly cacheTimeout: number = 60000; // 1 minute

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || "http://localhost:5000";
    this.logger.info(`Initialized with base URL: ${this.baseUrl}`);
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
   * Core request method with circuit breaker and caching
   */
  private async makeRequest<T>({
    method = 'get',
    url,
    data = undefined,
    timeout = 10000,
    cacheKey = '',
    cacheTTL = 0,
    bypassCircuitBreaker = false
  }: {
    method?: string;
    url: string;
    data?: any;
    timeout?: number;
    cacheKey?: string;
    cacheTTL?: number;
    bypassCircuitBreaker?: boolean;
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
      // Build full URL with base
      const fullUrl = `${this.baseUrl}${url}`;
      
      // Make the actual request
      const response = await axios({
        method,
        url: fullUrl,
        data,
        timeout
      });
      
      // If we're in HALF_OPEN and the request succeeded, close the circuit
      if (this.circuitState === CircuitState.HALF_OPEN) {
        this.logger.info(`Circuit test successful, closing circuit`);
        this.circuitState = CircuitState.CLOSED;
        this.failureCount = 0;
      }
      
      // Cache the result if caching is enabled
      if (cacheKey && cacheTTL > 0) {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }
      
      return response.data;
    } catch (error) {
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