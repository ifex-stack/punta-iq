/**
 * Client for communicating with the AI Flask microservice
 */
import axios from "axios";
import { Logger } from "winston";
import { logger } from "./logger";

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

/**
 * Client for interacting with the AI Flask microservice
 */
export class MicroserviceClient {
  private baseUrl: string;
  private logger: Logger;

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || "http://localhost:5000";
    this.logger = logger;
    this.logger.info("[MicroserviceClient] Initialized with base URL: " + this.baseUrl);
  }

  /**
   * Check if the microservice is running
   */
  async isRunning(): Promise<boolean> {
    try {
      this.logger.info("[MicroserviceClient] Checking microservice status from " + this.baseUrl + "/api/status");
      await axios.get(`${this.baseUrl}/api/status`, { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.error("[MicroserviceClient] Error checking microservice status: " + error);
      this.logger.info("[MicroserviceClient] Microservice is already running");
      return false;
    }
  }

  /**
   * Get the status of the external APIs
   */
  async getStatus(): Promise<StatusResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/status`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      this.logger.error("[MicroserviceClient] Error getting service status: " + error);
      throw error;
    }
  }

  /**
   * Get list of supported sports
   */
  async getSports(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/sports`);
      return response.data;
    } catch (error) {
      this.logger.error("[MicroserviceClient] Error getting sports: " + error);
      throw error;
    }
  }

  /**
   * Get odds for a specific sport
   */
  async getOdds(sport: string): Promise<Match[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/odds/${sport}`);
      return response.data;
    } catch (error) {
      this.logger.error(`[MicroserviceClient] Error getting odds for ${sport}: ${error}`);
      throw error;
    }
  }

  /**
   * Get live scores for current matches
   */
  async getLiveScores(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/livescore`);
      return response.data;
    } catch (error) {
      this.logger.error("[MicroserviceClient] Error getting live scores: " + error);
      throw error;
    }
  }

  /**
   * Get fixtures for a specific league
   */
  async getLeagueFixtures(leagueId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/fixtures/league/${leagueId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`[MicroserviceClient] Error getting fixtures for league ${leagueId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get teams in a specific league
   */
  async getTeams(leagueId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/teams/league/${leagueId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`[MicroserviceClient] Error getting teams for league ${leagueId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get all leagues
   */
  async getLeagues(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/leagues`);
      return response.data;
    } catch (error) {
      this.logger.error("[MicroserviceClient] Error getting leagues: " + error);
      throw error;
    }
  }
}